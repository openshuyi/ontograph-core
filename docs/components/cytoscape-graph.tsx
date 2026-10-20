"use client";

import type { Instance as PopperInstance } from "@popperjs/core";
import { createPopper } from "@popperjs/core";
/**
 * CytoscapeGraph — docs 站点自包含的 cytoscape 渲染组件
 *
 * 与 packages/visual 的 CytoscapeGraph 同源设计（docs 保持零 workspace 依赖，
 * 代码可直接复制到任何使用 @ontograph/core 的项目中）:
 * - direct-ref 封装，回调经 ref 转发，回调变化不重建实例
 * - 增量更新: nodes/edges 变化走 add()/remove()/data() diff，保留视口与节点位置
 * - fcose 布局（官方推荐的 cose 继任者，速度与质量均更优）
 * - 展示配置: 布局算法 / 节点与连线标签 / 节点大小 / 连线粗细
 * - 命令式 API（ref）: fit() 适应视图 / reheat() 重新布局 / exportPng() 导出图片
 */
import type {
  AvsdfLayoutOptions,
  CiseLayoutOptions,
  ColaLayoutOptions,
  Core,
  ElementDefinition,
  EulerLayoutOptions,
  EventObject,
  FcoseLayoutOptions,
  KlayLayoutOptions,
  LayoutOptions,
  StylesheetJsonBlock,
} from "cytoscape";
import cytoscape from "cytoscape";
import avsdf from "cytoscape-avsdf";
import cise from "cytoscape-cise";
import cola from "cytoscape-cola";
import type { DagreLayoutOptions } from "cytoscape-dagre";
import dagre from "cytoscape-dagre";
import euler from "cytoscape-euler";
import fcose from "cytoscape-fcose";
import klay from "cytoscape-klay";
import cytoscapePopper from "cytoscape-popper";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

export interface GraphNode {
  id: string;
  label: string;
  group: string;
  color: string;
  properties?: Record<string, unknown>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  /** 关系类型 @id（如 scm:composedOf），用于边 Tooltip */
  relationId?: string;
  inverse?: string;
  description?: string;
  sourceLabel?: string;
  targetLabel?: string;
}

export type GraphLayoutName =
  | "fcose"
  | "cola"
  | "cose"
  | "euler"
  | "dagre"
  | "klay"
  | "breadthfirst"
  | "cise"
  | "circle"
  | "concentric"
  | "avsdf"
  | "grid"
  | "random";

/** 图展示配置（全部为可选，默认值见 DEFAULT_DISPLAY） */
export interface GraphDisplayOptions {
  layout: GraphLayoutName;
  showNodeLabels: boolean;
  showEdgeLabels: boolean;
  nodeSize: number;
  edgeWidth: number;
  /** 力导向参数：理想边长 / 节点斥力 / 中心引力（仅对支持的布局生效） */
  edgeLength: number;
  nodeRepulsion: number;
  gravity: number;
}

export const DEFAULT_DISPLAY: GraphDisplayOptions = {
  layout: "fcose",
  showNodeLabels: true,
  showEdgeLabels: false,
  nodeSize: 50,
  edgeWidth: 2,
  edgeLength: 50,
  nodeRepulsion: 4500,
  gravity: 0.25,
};

export interface CytoscapeGraphHandle {
  fit: () => void;
  reheat: () => void;
  exportPng: () => void;
}

interface CytoscapeGraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  onNodeClick?: (nodeId: string) => void;
  /** 双击节点（用于折叠/展开子树等） */
  onNodeDoubleClick?: (nodeId: string) => void;
  /** 非空时高亮匹配节点及其一阶邻居，其余淡化 */
  highlightQuery?: string;
  display?: Partial<GraphDisplayOptions>;
}

let extensionsRegistered = false;
/** cytoscape-lasso 动态加载的完成信号；注册前不可调用 cy.lassoSelectionEnabled() */
let lassoReady: Promise<void> | null = null;

function registerExtensions() {
  if (extensionsRegistered) return;
  extensionsRegistered = true;
  cytoscape.use(fcose);
  cytoscape.use(cola);
  cytoscape.use(euler);
  cytoscape.use(dagre);
  cytoscape.use(klay);
  cytoscape.use(cise);
  cytoscape.use(avsdf);
  // cytoscape-lasso 在 import 时即访问 window，SSR prerender 会崩 → 浏览器内动态加载。
  // 扩展注册在 cytoscape 原型上，解析完成后对既有实例同样生效（见挂载 effect）。
  lassoReady = import("cytoscape-lasso").then((m) => {
    cytoscape.use(m.default);
  });
  cytoscape.use(
    cytoscapePopper((ref, content, options) =>
      createPopper(ref, content, options ?? {}),
    ),
  );
}

/** 按 group（本体 kind）把节点分簇，供 cise 圆形弹簧嵌套布局使用 */
function clustersFor(nodes: GraphNode[]): string[][] {
  const byGroup = new Map<string, string[]>();
  for (const node of nodes) {
    const list = byGroup.get(node.group);
    if (list) {
      list.push(node.id);
    } else {
      byGroup.set(node.group, [node.id]);
    }
  }
  return [...byGroup.values()];
}

/** 内置布局 + 第三方扩展布局的参数类型并集（LayoutOptions 是封闭 union，不含扩展） */
type AnyLayoutOptions =
  | LayoutOptions
  | FcoseLayoutOptions
  | ColaLayoutOptions
  | EulerLayoutOptions
  | DagreLayoutOptions
  | KlayLayoutOptions
  | CiseLayoutOptions
  | AvsdfLayoutOptions;

function layoutFor(
  name: GraphLayoutName,
  nodes: GraphNode[],
  display: GraphDisplayOptions,
): AnyLayoutOptions {
  const { edgeLength, nodeRepulsion, gravity } = display;
  switch (name) {
    case "fcose":
      return {
        ...FCOSE_LAYOUT,
        idealEdgeLength: edgeLength,
        nodeRepulsion,
        gravity,
      };
    case "cola":
      // 高动态力导向：物理模拟驱动，动画过渡平滑，适合交互式探索
      return {
        name: "cola",
        animate: true,
        padding: 40,
        randomize: true,
        avoidOverlap: true,
        handleDisconnected: true,
        infinite: false,
        edgeLength,
      };
    case "euler":
      // 轻量极速力导向：大规模非复合图处理非常快
      return {
        name: "euler",
        animate: true,
        padding: 40,
        springLength: edgeLength,
        gravity,
      };
    case "dagre":
      // 有向层次布局：自动计算节点层级，适合 is-a / 流程层次
      return {
        name: "dagre",
        animate: true,
        padding: 40,
        rankDir: "TB",
        ranker: "network-simplex",
      };
    case "klay":
      // 企业级层级布局：线缆交错少、对齐严谨
      return { name: "klay", animate: true, padding: 40 };
    case "cise": {
      // 圆形弹簧嵌套：簇内圆形、簇间弹簧；簇按 kind 自动划分
      const clusters = clustersFor(nodes);
      if (clusters.length === 0) return FCOSE_LAYOUT;
      return {
        name: "cise",
        clusters,
        animate: true,
        padding: 30,
        nodeSeparation: 20,
      };
    }
    case "avsdf":
      // 低交叉圆形布局：环形排列时连线交叉最少
      return { name: "avsdf", animate: true, padding: 40, nodeSeparation: 60 };
    // ---- cytoscape 内置布局 ----
    case "grid":
      // 网格：行列整齐排列，适合对比节点或展示总数
      return { name: "grid", animate: true, padding: 40, avoidOverlap: true };
    case "circle":
      // 圆形：节点均匀排在大圆环边缘，适合小规模循环过程
      return { name: "circle", animate: true, padding: 40 };
    case "concentric":
      // 同心圆：按度数从内到外排布（中心 = 连接最多的枢纽类型）
      return {
        name: "concentric",
        animate: true,
        padding: 40,
        minNodeSpacing: 10,
        concentric: (node) => node.degree(),
        levelWidth: () => 2,
      };
    case "breadthfirst":
      // 广度优先：由源节点向下层级铺开，适合层级分明的网络
      return {
        name: "breadthfirst",
        animate: true,
        padding: 40,
        directed: true,
        spacingFactor: 1.2,
      };
    case "cose":
      // 官方复合弹簧力导向：支持复合节点，社区聚拢自然
      return {
        name: "cose",
        animate: true,
        padding: 40,
        nodeOverlap: 20,
        idealEdgeLength: edgeLength,
        nodeRepulsion,
        gravity,
      };
    case "random":
      // 随机：节点随机散布，用于测试
      return { name: "random", animate: true, padding: 40 };
  }
}

const FCOSE_LAYOUT = {
  name: "fcose",
  quality: "default",
  animate: true,
  animationDuration: 500,
  padding: 40,
} as const;

function isDarkMode(): boolean {
  if (typeof document === "undefined") return false;
  return document.documentElement.classList.contains("dark");
}

/** 五行五色数据节点 + 墨色阶连线；深浅成对处理，随 docs 主题切换 */
function buildStylesheet(
  dark: boolean,
  display: GraphDisplayOptions,
): StylesheetJsonBlock[] {
  const ink = dark ? "#9a9a93" : "#4a4e52"; // 墨 · 连线
  const inkSoft = dark ? "#9a9a93" : "#6e7377"; // 苍 · 文字
  const ring = dark ? "#edeae3" : "#1c1e24"; // 暖白 / 墨 · 描边
  return [
    {
      selector: "node",
      style: {
        "background-color": "data(color)",
        label: display.showNodeLabels ? "data(label)" : "",
        "text-valign": "center",
        "text-halign": "center",
        "text-wrap": "wrap",
        "text-max-width": "80px",
        "font-size": "11px",
        "font-weight": "bold",
        color: "#fffbf0", // 象牙白 · 在五行五色上均可读
        width: display.nodeSize,
        height: display.nodeSize,
        "border-width": 2,
        "border-color": ring,
        "border-opacity": 0.4,
        "min-zoomed-font-size": 6,
      },
    },
    {
      selector: "edge",
      style: {
        width: display.edgeWidth,
        "line-color": ink,
        "target-arrow-color": ink,
        "target-arrow-shape": "triangle",
        "curve-style": "bezier",
        label: display.showEdgeLabels ? "data(label)" : "",
        "font-size": "9px",
        color: inkSoft,
        "text-rotation": "autorotate",
        "text-margin-y": -8,
        "min-zoomed-font-size": 6,
      },
    },
    {
      selector: ":selected",
      style: {
        "border-width": 3,
        "border-color": ring,
        "border-opacity": 0.8,
      },
    },
    {
      selector: "node.search-hit",
      style: {
        "border-width": 4,
        "border-color": "#E0B84D", // 缃金 · 黄 — 搜索命中
        "border-opacity": 1,
      },
    },
    {
      selector: "node.search-dim",
      style: {
        opacity: 0.12,
        "text-opacity": 0,
      },
    },
    {
      selector: "edge.search-dim",
      style: {
        "line-opacity": 0.06,
        "text-opacity": 0,
      },
    },
  ];
}

function nodeToElement(node: GraphNode): ElementDefinition {
  return {
    group: "nodes",
    data: {
      id: node.id,
      label: node.label,
      group: node.group,
      color: node.color,
    },
  };
}

function edgeToElement(edge: GraphEdge): ElementDefinition {
  return {
    group: "edges",
    data: {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: edge.label ?? "",
      relationId: edge.relationId ?? "",
      inverse: edge.inverse ?? "",
      description: edge.description ?? "",
      sourceLabel: edge.sourceLabel ?? edge.source,
      targetLabel: edge.targetLabel ?? edge.target,
    },
  };
}

export const CytoscapeGraph = forwardRef<
  CytoscapeGraphHandle,
  CytoscapeGraphProps
>(function CytoscapeGraph(
  { nodes, edges, onNodeClick, onNodeDoubleClick, highlightQuery, display },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);
  const [mounted, setMounted] = useState(false);
  const [dark, setDark] = useState(() => isDarkMode());
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    label: string;
    group: string;
    color: string;
    properties?: Record<string, unknown>;
  } | null>(null);
  const [edgeTooltip, setEdgeTooltip] = useState<{
    label: string;
    relationId: string;
    sourceLabel: string;
    targetLabel: string;
    inverse?: string;
    description?: string;
  } | null>(null);
  const [selectedCount, setSelectedCount] = useState(0);
  const edgeTooltipDivRef = useRef<HTMLDivElement>(null);
  const edgePopperRef = useRef<PopperInstance | null>(null);
  const currentEdgeRef = useRef<{
    popperRef(): { getBoundingClientRect(): DOMRect };
  } | null>(null);

  const displayOptions: GraphDisplayOptions = {
    ...DEFAULT_DISPLAY,
    ...display,
  };
  const displayRef = useRef(displayOptions);
  useEffect(() => {
    displayRef.current = displayOptions;
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // 跟随 docs 主题（fumadocs 在 <html> 上切换 dark class）
  useEffect(() => {
    const update = () => setDark(isDarkMode());
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  // 回调与数据经 ref 转发：挂载 effect 只跑一次
  const callbacksRef = useRef({ onNodeClick, onNodeDoubleClick });
  useEffect(() => {
    callbacksRef.current = { onNodeClick, onNodeDoubleClick };
  });
  const dataRef = useRef({ nodes, edges });
  useEffect(() => {
    dataRef.current = { nodes, edges };
  });
  const propertiesRef = useRef(new Map<string, Record<string, unknown>>());
  useEffect(() => {
    propertiesRef.current = new Map(
      nodes
        .filter((n) => n.properties)
        .map((n) => [n.id, n.properties as Record<string, unknown>]),
    );
  }, [nodes]);

  // ---- 挂载：创建实例（仅一次） ----
  useEffect(() => {
    const container = containerRef.current;
    if (!mounted || !container) return;

    registerExtensions();

    const { nodes: initialNodes, edges: initialEdges } = dataRef.current;
    const cy = cytoscape({
      container,
      elements: [
        ...initialNodes.map(nodeToElement),
        ...initialEdges.map(edgeToElement),
      ],
      style: buildStylesheet(isDarkMode(), displayRef.current),
      layout: layoutFor(
        displayRef.current.layout,
        initialNodes,
        displayRef.current,
      ),
      minZoom: 0.05,
      maxZoom: 3,
    });
    cyRef.current = cy;

    cy.on("tap", "node", (evt: EventObject) => {
      callbacksRef.current.onNodeClick?.(evt.target.id());
    });

    cy.on("mouseover", "node", (evt: EventObject) => {
      const renderPosition = evt.target.renderedPosition();
      const nodeId = evt.target.id();
      setTooltip({
        x: renderPosition.x,
        y: renderPosition.y,
        label: String(evt.target.data("label") ?? nodeId),
        group: String(evt.target.data("group") ?? ""),
        color: String(evt.target.data("color") ?? "#4A4E52"), // 墨 · 兜底色
        properties: propertiesRef.current.get(nodeId),
      });
    });

    cy.on("mouseout", "node", () => {
      setTooltip(null);
    });

    // 双击节点：折叠/展开子树（由上层决定语义）
    cy.on("dblclick", "node", (evt: EventObject) => {
      callbacksRef.current.onNodeDoubleClick?.(evt.target.id());
    });

    // 边悬停：popper.js Tooltip 展示关系语义
    cy.on("mouseover", "edge", (evt: EventObject) => {
      const edge = evt.target as unknown as {
        data(key: string): unknown;
        popperRef(): { getBoundingClientRect(): DOMRect };
      };
      currentEdgeRef.current = edge;
      const data = (key: string) => String(edge.data(key) ?? "");
      setEdgeTooltip({
        label: data("label") || data("relationId"),
        relationId: data("relationId"),
        sourceLabel: data("sourceLabel") || data("source"),
        targetLabel: data("targetLabel") || data("target"),
        inverse: data("inverse") || undefined,
        description: data("description") || undefined,
      });
    });

    cy.on("mouseout", "edge", () => {
      currentEdgeRef.current = null;
      setEdgeTooltip(null);
    });

    // 平移/缩放时同步 popper 位置
    cy.on("pan zoom resize", () => {
      edgePopperRef.current?.update();
    });

    // 套索（Shift/Ctrl/Cmd + 拖拽）与框选共用的选中计数
    cy.on("select unselect", () => {
      setSelectedCount(cy.$("node:selected").length);
    });

    // 套索选择：按住修饰键拖拽画圈，普通拖拽仍为平移
    // （lasso 扩展异步注册完成后再启用，见 registerExtensions）
    void lassoReady?.then(() => cy.lassoSelectionEnabled(true));

    const resizeObserver = new ResizeObserver(() => {
      cy.resize();
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      cy.destroy();
      cyRef.current = null;
    };
  }, [mounted]);

  // ---- 命令式 API ----
  const handleReheat = useCallback(() => {
    cyRef.current
      ?.layout(
        layoutFor(
          displayRef.current.layout,
          dataRef.current.nodes,
          displayRef.current,
        ),
      )
      .run();
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      fit: () => {
        cyRef.current?.fit(undefined, 40);
      },
      reheat: handleReheat,
      exportPng: () => {
        const cy = cyRef.current;
        if (!cy || cy.elements().length === 0) return;
        const uri = cy.png({
          full: true,
          scale: 2,
          bg: isDarkMode() ? "#16181d" : "#ffffff",
        });
        const a = document.createElement("a");
        a.href = uri;
        a.download = "ontology-graph.png";
        a.click();
      },
    }),
    [handleReheat],
  );

  // ---- 主题切换 / 展示配置变化：仅重刷样式，不重建实例（保留视口与节点位置） ----
  const { showNodeLabels, showEdgeLabels, nodeSize, edgeWidth } =
    displayOptions;
  useEffect(() => {
    cyRef.current?.style(
      buildStylesheet(dark, {
        ...displayRef.current,
        showNodeLabels,
        showEdgeLabels,
        nodeSize,
        edgeWidth,
      }),
    );
  }, [dark, showNodeLabels, showEdgeLabels, nodeSize, edgeWidth]);

  // ---- 搜索高亮：命中节点 + 一阶邻居，其余淡化 ----
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    const q = highlightQuery?.trim().toLowerCase() ?? "";
    cy.batch(() => {
      cy.elements().removeClass("search-hit");
      cy.elements().removeClass("search-dim");
      if (!q) return;
      const hits = cy.nodes().filter((n) => {
        const label = String(n.data("label") ?? "");
        return (
          label.toLowerCase().includes(q) || n.id().toLowerCase().includes(q)
        );
      });
      if (hits.length === 0) {
        cy.elements().addClass("search-dim");
        return;
      }
      const neighborhood = hits.closedNeighborhood();
      hits.addClass("search-hit");
      cy.elements().difference(neighborhood).addClass("search-dim");
    });
  }, [highlightQuery, nodes, edges]);

  // ---- 边 popper Tooltip：渲染后创建 popper 实例 ----
  useEffect(() => {
    const edge = currentEdgeRef.current;
    const div = edgeTooltipDivRef.current;
    if (!edgeTooltip || !edge || !div) return;
    edgePopperRef.current = createPopper(edge.popperRef(), div, {
      placement: "top",
      modifiers: [{ name: "offset", options: { offset: [0, -6] } }],
    });
    return () => {
      edgePopperRef.current?.destroy();
      edgePopperRef.current = null;
    };
  }, [edgeTooltip]);

  // ---- 选中批量操作 ----
  const handleExportSelection = useCallback(() => {
    const cy = cyRef.current;
    if (!cy) return;
    const selected = cy.$("node:selected");
    if (selected.length === 0) return;
    const keep = selected.union(selected.edgesWith(selected));
    const hide = cy.elements().difference(keep);
    cy.batch(() => {
      hide.style("display", "none");
    });
    const uri = cy.png({
      full: true,
      scale: 2,
      bg: isDarkMode() ? "#16181d" : "#ffffff",
    });
    cy.batch(() => {
      hide.removeStyle("display");
    });
    const a = document.createElement("a");
    a.href = uri;
    a.download = "ontology-selection.png";
    a.click();
  }, []);

  const handleClearSelection = useCallback(() => {
    cyRef.current?.$(":selected").unselect();
  }, []);

  // ---- 布局 / 力参数变化：重跑布局（挂载时已初始化，跳过首次） ----
  const prevPhysicsKeyRef = useRef<string | null>(null);
  const physicsKey = `${displayOptions.layout}|${displayOptions.edgeLength}|${displayOptions.nodeRepulsion}|${displayOptions.gravity}`;
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy || prevPhysicsKeyRef.current === null) {
      prevPhysicsKeyRef.current = physicsKey;
      return;
    }
    if (prevPhysicsKeyRef.current === physicsKey) return;
    prevPhysicsKeyRef.current = physicsKey;
    cy.layout(
      layoutFor(
        displayOptions.layout,
        dataRef.current.nodes,
        displayRef.current,
      ),
    ).run();
  }, [physicsKey]);

  // ---- 数据增量更新（diff，绝不 destroy） ----
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;

    const incoming: ElementDefinition[] = [
      ...nodes.map(nodeToElement),
      ...edges.map(edgeToElement),
    ];
    const incomingIds = new Set(incoming.map((el) => String(el.data.id)));

    let hasAdditions = false;
    cy.batch(() => {
      cy.elements()
        .filter((el) => !incomingIds.has(el.id()))
        .remove();
      for (const element of incoming) {
        const id = String(element.data.id);
        const existing = cy.getElementById(id);
        if (existing.empty()) {
          cy.add(element);
          hasAdditions = true;
        } else {
          existing.data(element.data);
        }
      }
    });

    if (hasAdditions) {
      cy.layout(
        layoutFor(displayRef.current.layout, nodes, displayRef.current),
      ).run();
    }
  }, [nodes, edges]);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-full bg-[var(--color-fd-background)] rounded-sm">
        <p className="text-fd-muted-foreground">Loading graph...</p>
      </div>
    );
  }

  const uniqueGroups = [...new Set(nodes.map((n) => n.group))];

  return (
    <div className="relative w-full h-full bg-[var(--color-fd-background)] rounded-sm overflow-hidden">
      <div
        ref={containerRef}
        className="w-full h-full"
        style={{ minHeight: 500 }}
      />
      {edgeTooltip && (
        <div
          ref={edgeTooltipDivRef}
          className="absolute z-50 pointer-events-none bg-fd-popover border border-fd-border rounded-sm px-3 py-2 text-xs"
          style={{ maxWidth: 260 }}
        >
          <div className="font-semibold text-fd-foreground mb-0.5">
            {edgeTooltip.label}
          </div>
          {edgeTooltip.relationId && (
            <div className="text-fd-muted-foreground font-mono text-[10px] mb-1">
              {edgeTooltip.relationId}
            </div>
          )}
          <div className="text-fd-foreground">
            {edgeTooltip.sourceLabel}
            <span className="text-fd-muted-foreground mx-1">→</span>
            {edgeTooltip.targetLabel}
          </div>
          {edgeTooltip.inverse && (
            <div className="text-fd-muted-foreground mt-0.5">
              inverse: {edgeTooltip.inverse}
            </div>
          )}
          {edgeTooltip.description && (
            <div className="text-fd-muted-foreground mt-0.5">
              {edgeTooltip.description}
            </div>
          )}
        </div>
      )}
      {selectedCount > 0 && (
        <div className="absolute bottom-3 right-3 z-10 flex items-center gap-2 bg-fd-popover/95 border border-fd-border rounded-sm px-3 py-2">
          <span className="text-xs text-fd-foreground">
            已选 {selectedCount} 个节点
          </span>
          <button
            type="button"
            onClick={handleExportSelection}
            className="px-2 py-1 text-[10px] font-medium rounded-sm bg-fd-primary text-fd-primary-foreground hover:bg-fd-primary/90 transition-colors"
          >
            导出 PNG
          </button>
          <button
            type="button"
            onClick={handleClearSelection}
            className="px-2 py-1 text-[10px] font-medium rounded-sm bg-fd-muted text-fd-foreground hover:bg-fd-accent transition-colors border border-fd-border"
          >
            清除
          </button>
        </div>
      )}
      {tooltip && (
        <div
          className="absolute z-50 pointer-events-none bg-fd-popover border border-fd-border rounded-sm px-4 py-3 text-sm"
          style={{
            left: tooltip.x + 20,
            top: tooltip.y - 10,
            maxWidth: 240,
          }}
        >
          {" "}
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: tooltip.color }}
            />
            <span className="font-semibold text-fd-foreground">
              {tooltip.label}
            </span>
          </div>
          <div className="text-fd-muted-foreground text-xs mb-1">
            Group: {tooltip.group}
          </div>
          {tooltip.properties &&
            Object.entries(tooltip.properties)
              .slice(0, 4)
              .map(([key, value]) => (
                <div key={key} className="text-fd-muted-foreground text-xs">
                  <span className="text-fd-muted-foreground">{key}:</span>{" "}
                  {String(value)}
                </div>
              ))}
        </div>
      )}
      <div className="absolute top-3 right-3 flex gap-2">
        <button
          type="button"
          onClick={handleReheat}
          className="px-3 py-1.5 text-xs font-medium rounded-sm bg-fd-muted text-fd-foreground hover:bg-fd-accent transition-colors border border-fd-border"
        >
          <span className="flex items-center gap-1.5">
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-label="Reheat"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Reheat
          </span>
        </button>
      </div>
      {uniqueGroups.length > 0 && (
        <div className="absolute bottom-3 left-3 bg-fd-popover/90 rounded-sm px-3 py-2 border border-fd-border">
          <div className="text-xs text-fd-muted-foreground mb-1.5 font-medium">
            Legend
          </div>
          <div className="flex flex-wrap gap-3">
            {uniqueGroups.map((group) => {
              const node = nodes.find((n) => n.group === group);
              return (
                <div key={group} className="flex items-center gap-1.5">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: node?.color }}
                  />
                  <span className="text-xs text-fd-foreground">{group}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
});
