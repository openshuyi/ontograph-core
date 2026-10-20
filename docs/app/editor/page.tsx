"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type {
  CytoscapeGraphHandle,
  GraphLayoutName,
  GraphNode,
} from "@/components/cytoscape-graph";
import { CytoscapeGraph } from "@/components/cytoscape-graph";
import { EditorProvider, useEditor } from "@/lib/editor-context";
import type {
  EditorConstraint,
  EditorEntity,
  EditorRelation,
  OntologyEditorState,
} from "@/lib/editor-types";
import {
  generateMermaid,
  generateOWL,
  generateSHACL,
  generateTypeScript,
} from "@/lib/export-formats";

/* ─── Graph helpers（折叠子树用） ─── */

/**
 * 视为"组合/包含"的 RelationType @id 白名单（父 → 子方向）。
 * 双击节点折叠/展开沿这些关系可达的子树，防止大图杂乱。
 */
const CONTAINMENT_RELATIONS = new Set([
  "scm:composedOf", // BOM → Product
  "scm:consistsOf", // Route → RouteSegment
  "scm:containsItem", // Order → Product
  "scm:hasLineItem", // PurchaseOrder → Product
  "scm:hasVariant", // Product → SKU
  "scm:orderHasLine", // Order → SalesOrderLine
  "scm:hasStop", // TransportOrder → Stop
  "scm:warehouseHasZone", // Warehouse → StorageZone
  "scm:warehouseHasAisle", // Warehouse → Aisle
  "scm:aisleContainsBin", // Aisle → BinLocation
  "scm:containsBin", // StorageZone → BinLocation
  "scm:loadPlanContainsProduct", // LoadPlan → Product
  "scm:containedInPackingList", // Product → PackingList
]);

/** 沿组合关系收集 id 的全部传递子孙（带环保护） */
function collectDescendants(
  id: string,
  children: Map<string, string[]>,
): Set<string> {
  const result = new Set<string>();
  const visit = (pid: string) => {
    for (const child of children.get(pid) ?? []) {
      if (result.has(child)) continue;
      result.add(child);
      visit(child);
    }
  };
  visit(id);
  return result;
}

function EditorInner() {
  const { state, dispatch } = useEditor();
  const [sidebarTab, setSidebarTab] = useState<
    "entities" | "relations" | "constraints" | "code" | "export"
  >("entities");
  const [detailTab, setDetailTab] = useState<"entity" | "relation">("entity");
  const [exportFormat, setExportFormat] = useState<
    "typescript" | "mermaid" | "owl" | "shacl"
  >("typescript");
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Graph display configuration
  const graphRef = useRef<CytoscapeGraphHandle>(null);
  const [controlsOpen, setControlsOpen] = useState(true);
  const [graphLayout, setGraphLayout] = useState<GraphLayoutName>("fcose");
  const [showNodeLabels, setShowNodeLabels] = useState(true);
  const [showEdgeLabels, setShowEdgeLabels] = useState(false);
  const [nodeSize, setNodeSize] = useState(50);
  const [edgeWidth, setEdgeWidth] = useState(2);
  const [edgeLength, setEdgeLength] = useState(50);
  const [nodeRepulsion, setNodeRepulsion] = useState(4500);
  const [gravity, setGravity] = useState(0.25);
  const [highlightQuery, setHighlightQuery] = useState("");
  const [collapsedIds, setCollapsedIds] = useState<string[]>([]);
  const [kindFilter, setKindFilter] = useState<
    Record<EditorEntity["kind"], boolean>
  >({ entity: true, event: true, role: true, value: true });

  // 折叠语义：组合/包含关系（父 → 子），双击节点折叠/展开其子树
  const containmentChildren = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const r of state.relations) {
      if (!CONTAINMENT_RELATIONS.has(r.id)) continue;
      const list = map.get(r.source);
      if (list) {
        if (!list.includes(r.target)) list.push(r.target);
      } else {
        map.set(r.source, [r.target]);
      }
    }
    return map;
  }, [state.relations]);

  /** 折叠根 → 其隐藏的传递闭包子节点数量 */
  const hiddenCountByRoot = useMemo(() => {
    const counts = new Map<string, number>();
    for (const id of collapsedIds) {
      counts.set(id, collectDescendants(id, containmentChildren).size);
    }
    return counts;
  }, [collapsedIds, containmentChildren]);

  const hiddenIds = useMemo(() => {
    const hidden = new Set<string>();
    for (const id of collapsedIds) {
      for (const child of collectDescendants(id, containmentChildren)) {
        hidden.add(child);
      }
    }
    return hidden;
  }, [collapsedIds, containmentChildren]);

  const visibleEntities = useMemo(
    () =>
      state.entities.filter((e) => kindFilter[e.kind] && !hiddenIds.has(e.id)),
    [state.entities, kindFilter, hiddenIds],
  );

  const handleNodeDoubleClick = useCallback((nodeId: string) => {
    setCollapsedIds((prev) =>
      prev.includes(nodeId)
        ? prev.filter((x) => x !== nodeId)
        : [...prev, nodeId],
    );
  }, []);

  const labelById = useMemo(
    () => new Map(state.entities.map((e) => [e.id, e.label])),
    [state.entities],
  );

  const graphNodes: GraphNode[] = visibleEntities.map((e) => ({
    id: e.id,
    label:
      e.label +
      (hiddenCountByRoot.has(e.id) ? ` (+${hiddenCountByRoot.get(e.id)})` : ""),
    group: e.kind,
    color: e.color,
    properties: { id: e.id, kind: e.kind, attributes: e.attributes.length },
  }));

  const visibleIds = new Set(visibleEntities.map((e) => e.id));
  const graphEdges = state.relations
    .filter(
      (r: EditorRelation) =>
        visibleIds.has(r.source) && visibleIds.has(r.target),
    )
    .map((r: EditorRelation, i: number) => ({
      id: `edge-${i}`,
      source: r.source,
      target: r.target,
      label: r.label,
      relationId: r.id,
      inverse: r.inverse,
      description: r.description,
      sourceLabel: labelById.get(r.source) ?? r.source,
      targetLabel: labelById.get(r.target) ?? r.target,
    }));

  const handleNodeClick = useCallback(
    (nodeId: string) => {
      dispatch({ type: "SELECT_ENTITY", id: nodeId });
      setDetailTab("entity");
    },
    [dispatch],
  );

  const selectedEntity = useMemo(
    () => state.entities.find((e) => e.id === state.selectedEntityId),
    [state.entities, state.selectedEntityId],
  );

  const entityRelations = useMemo(
    () =>
      state.relations.filter(
        (r: EditorRelation) =>
          r.source === state.selectedEntityId ||
          r.target === state.selectedEntityId,
      ),
    [state.relations, state.selectedEntityId],
  );

  const entityConstraints = useMemo(
    () =>
      state.constraints.filter(
        (c: EditorConstraint) => c.entityType === state.selectedEntityId,
      ),
    [state.constraints, state.selectedEntityId],
  );

  const filteredEntities = state.entities.filter(
    (e) =>
      e.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.id.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleExport = () => {
    const content = getGeneratedCode();
    const ext = exportFormat === "typescript" ? "ts" : "ttl";
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ontology.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getGeneratedCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getGeneratedCode = () => {
    switch (exportFormat) {
      case "typescript":
        return generateTypeScript(state);
      case "mermaid":
        return generateMermaid(state);
      case "owl":
        return generateOWL(state);
      case "shacl":
        return generateSHACL(state);
    }
  };

  const handleReset = () => {
    if (confirm("Reset all data? This cannot be undone.")) {
      dispatch({ type: "RESET_STATE" });
      setDetailTab("entity");
    }
  };

  const sidebarItems = [
    {
      key: "entities" as const,
      label: "Entities",
      count: state.entities.length,
    },
    {
      key: "relations" as const,
      label: "Relations",
      count: state.relations.length,
    },
    {
      key: "constraints" as const,
      label: "Constraints",
      count: state.constraints.length,
    },
    { key: "code" as const, label: "Code", count: 0 },
    { key: "export" as const, label: "Export", count: 0 },
  ];

  return (
    <div className="h-screen flex flex-col bg-fd-background text-fd-foreground">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-fd-border bg-fd-card flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-sm bg-fd-primary flex items-center justify-center">
            <svg
              className="w-4 h-4 text-fd-primary-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-label="Ontograph"
            >
              <circle cx="12" cy="12" r="10" strokeWidth={2} />
              <circle cx="8" cy="10" r="1.5" fill="currentColor" />
              <circle cx="16" cy="10" r="1.5" fill="currentColor" />
              <circle cx="12" cy="16" r="1.5" fill="currentColor" />
              <line x1="8" y1="10" x2="16" y2="10" strokeWidth={1.5} />
              <line x1="8" y1="10" x2="12" y2="16" strokeWidth={1.5} />
              <line x1="16" y1="10" x2="12" y2="16" strokeWidth={1.5} />
            </svg>
          </div>
          <h1 className="text-sm font-serif font-bold tracking-tight">
            Ontograph Editor
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 text-xs text-fd-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#B93A2E]" />
              {state.entities.length} entities
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#1F6E93]" />
              {state.relations.length} relations
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#E0B84D]" />
              {state.constraints.length} constraints
            </span>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-1.5 text-xs font-medium rounded-sm bg-fd-muted text-fd-muted-foreground hover:text-fd-foreground hover:bg-fd-accent transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Main three-column layout */}
      <div className="flex flex-1 min-h-0">
        {/* Left sidebar */}
        <div className="w-72 border-r border-fd-border bg-fd-card flex flex-col flex-shrink-0">
          {/* Sidebar tab switcher */}
          <div className="flex border-b border-fd-border">
            {sidebarItems.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setSidebarTab(item.key)}
                className={`flex-1 px-2 py-2.5 text-xs font-medium transition-colors border-b-2 ${sidebarTab === item.key ? "text-fd-primary border-fd-primary" : "text-fd-muted-foreground border-transparent hover:text-fd-foreground"}`}
              >
                {item.label}
                {item.count > 0 && (
                  <span
                    className={`ml-1 px-1.5 py-0.5 rounded-sm text-[10px] ${sidebarTab === item.key ? "bg-fd-accent text-fd-primary" : "bg-fd-muted text-fd-muted-foreground"}`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Sidebar content */}
          <div className="flex-1 overflow-y-auto">
            {sidebarTab === "entities" && (
              <LeftSidebarEntities
                filtered={filteredEntities}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
              />
            )}
            {sidebarTab === "relations" && <LeftSidebarRelations />}
            {sidebarTab === "constraints" && <LeftSidebarConstraints />}
            {sidebarTab === "code" && (
              <LeftSidebarCode
                getCode={getGeneratedCode}
                onCopy={handleCopy}
                copied={copied}
              />
            )}
            {sidebarTab === "export" && (
              <LeftSidebarExport
                exportFormat={exportFormat}
                setExportFormat={setExportFormat}
                getCode={getGeneratedCode}
                onCopy={handleCopy}
                onDownload={handleExport}
                copied={copied}
              />
            )}
          </div>
        </div>

        {/* Center: Graph canvas */}
        <div className="flex-1 min-w-0 relative">
          <CytoscapeGraph
            ref={graphRef}
            nodes={graphNodes}
            edges={graphEdges}
            onNodeClick={handleNodeClick}
            onNodeDoubleClick={handleNodeDoubleClick}
            highlightQuery={highlightQuery}
            display={{
              layout: graphLayout,
              showNodeLabels,
              showEdgeLabels,
              nodeSize,
              edgeWidth,
              edgeLength,
              nodeRepulsion,
              gravity,
            }}
          />
          <GraphControlPanel
            open={controlsOpen}
            onToggle={() => setControlsOpen((v) => !v)}
            layout={graphLayout}
            setLayout={setGraphLayout}
            highlightQuery={highlightQuery}
            setHighlightQuery={setHighlightQuery}
            showNodeLabels={showNodeLabels}
            setShowNodeLabels={setShowNodeLabels}
            showEdgeLabels={showEdgeLabels}
            setShowEdgeLabels={setShowEdgeLabels}
            nodeSize={nodeSize}
            setNodeSize={setNodeSize}
            edgeWidth={edgeWidth}
            setEdgeWidth={setEdgeWidth}
            edgeLength={edgeLength}
            setEdgeLength={setEdgeLength}
            nodeRepulsion={nodeRepulsion}
            setNodeRepulsion={setNodeRepulsion}
            gravity={gravity}
            setGravity={setGravity}
            kindFilter={kindFilter}
            setKindFilter={setKindFilter}
            onFit={() => graphRef.current?.fit()}
            onRelayout={() => graphRef.current?.reheat()}
            onExportPng={() => graphRef.current?.exportPng()}
          />
          {state.entities.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 rounded-sm bg-fd-muted flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-fd-muted-foreground"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-label="No data"
                  >
                    <circle cx="12" cy="12" r="10" strokeWidth={1.5} />
                    <line x1="8" y1="12" x2="16" y2="12" strokeWidth={1.5} />
                  </svg>
                </div>
                <p className="text-fd-muted-foreground text-sm mb-1">
                  No ontology defined yet
                </p>
                <p className="text-fd-muted-foreground text-xs">
                  Use the left panel to add entities and relations
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right detail panel */}
        <div className="w-80 border-l border-fd-border bg-fd-card flex flex-col flex-shrink-0">
          {selectedEntity ? (
            <RightDetailPanel
              entity={selectedEntity}
              relations={entityRelations}
              constraints={entityConstraints}
              detailTab={detailTab}
              setDetailTab={setDetailTab}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center px-6">
                <div className="w-12 h-12 rounded-sm bg-fd-muted flex items-center justify-center mx-auto mb-3">
                  <svg
                    className="w-6 h-6 text-fd-muted-foreground"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-label="Select node"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
                    />
                  </svg>
                </div>
                <p className="text-fd-muted-foreground text-sm mb-1">
                  No selection
                </p>
                <p className="text-fd-muted-foreground text-xs">
                  Click a node in the graph to view details, or select from the
                  entities list
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Left Sidebar sub-components ─── */

function LeftSidebarEntities({
  filtered,
  searchQuery,
  setSearchQuery,
}: {
  filtered: import("@/lib/editor-types").EditorEntity[];
  searchQuery: string;
  setSearchQuery: (v: string) => void;
}) {
  const { state, dispatch } = useEditor();
  return (
    <div className="p-3 space-y-2">
      <div className="flex items-center gap-2 mb-2">
        <div className="flex-1 relative">
          <svg
            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-fd-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-label="Search"
          >
            <circle cx="11" cy="11" r="8" strokeWidth={2} />
            <path d="M21 21l-4.35-4.35" strokeWidth={2} strokeLinecap="round" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search entities..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-fd-muted border border-fd-border rounded-sm text-fd-foreground placeholder:text-fd-muted-foreground focus:outline-none focus:border-fd-primary"
          />
        </div>
        <button
          type="button"
          onClick={() => {
            const rawId = prompt("Entity ID (e.g. ProductCategory)", "");
            if (!rawId) return;
            const id = `scm:${rawId}`;
            if (state.entities.some((e) => e.id === id)) return;
            const rawLabel = prompt("Entity label", rawId) ?? rawId;
            // 五行五色数据色阶
            const colors = [
              "#B93A2E", // 朱砂 · 赤
              "#1F6E93", // 靛青 · 青
              "#E0B84D", // 缃金 · 黄
              "#3E8C7A", // 青碧 · 碧
              "#8A5A42", // 赭 · 土
            ];
            dispatch({
              type: "ADD_ENTITY",
              entity: {
                id,
                label: rawLabel,
                kind: "entity",
                color: colors[Math.floor(Math.random() * colors.length)],
                attributes: [],
              },
            });
          }}
          className="px-2 py-1.5 text-xs font-medium rounded-sm bg-fd-primary text-fd-primary-foreground hover:bg-fd-primary/90 transition-colors"
        >
          +
        </button>
      </div>
      {filtered.length === 0 && (
        <p className="text-xs text-fd-muted-foreground text-center py-6">
          No entities found
        </p>
      )}
      {filtered.map((e) => (
        <button
          key={e.id}
          type="button"
          onClick={() => dispatch({ type: "SELECT_ENTITY", id: e.id })}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-sm text-left transition-all ${state.selectedEntityId === e.id ? "bg-fd-accent border border-fd-primary/30" : "hover:bg-fd-muted border border-transparent"}`}
        >
          <div
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: e.color }}
          />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-fd-foreground truncate">
              {e.label}
            </div>
            <div className="text-[10px] text-fd-muted-foreground font-mono truncate">
              {e.id}
            </div>
          </div>
          <span className="text-[10px] text-fd-muted-foreground">
            {e.attributes.length}
          </span>
        </button>
      ))}
    </div>
  );
}

function LeftSidebarRelations() {
  const { state, dispatch } = useEditor();
  return (
    <div className="p-3 space-y-2">
      <div className="flex items-center justify-between mb-2">
        {null}
        <span className="text-xs text-fd-muted-foreground">
          {state.relations.length} relations
        </span>
        <button
          type="button"
          onClick={() => {
            if (state.entities.length < 2) return;
            const rawId = prompt("Relation ID (e.g. transports)", "");
            if (!rawId) return;
            const id = `scm:${rawId}`;
            if (state.relations.some((r) => r.id === id)) return;
            dispatch({
              type: "ADD_RELATION",
              relation: {
                id,
                label: prompt("Label", rawId) ?? rawId,
                source: state.entities[0].id,
                target: state.entities[1].id,
              },
            });
          }}
          className="px-2 py-1.5 text-xs font-medium rounded-sm bg-fd-primary text-fd-primary-foreground hover:bg-fd-primary/90 transition-colors"
        >
          +
        </button>
      </div>
      {state.relations.length === 0 && (
        <p className="text-xs text-fd-muted-foreground text-center py-6">
          No relations
        </p>
      )}
      {state.relations.map((r) => (
        <div
          key={r.id}
          className="px-3 py-2 rounded-sm border border-fd-border bg-fd-muted"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-fd-foreground">
              {r.label}
            </span>
            <button
              type="button"
              onClick={() => dispatch({ type: "DELETE_RELATION", id: r.id })}
              className="text-fd-muted-foreground hover:text-fd-primary transition-colors"
            >
              <svg
                className="w-3 h-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-label="Delete"
              >
                <path
                  d="M6 18L18 6M6 6l12 12"
                  strokeWidth={2}
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-fd-muted-foreground font-mono">
            <span className="truncate flex-1" title={r.source}>
              {r.source.split(":")[1] ?? r.source}
            </span>
            <span className="text-fd-primary flex-shrink-0">→</span>
            <span className="truncate flex-1 text-right" title={r.target}>
              {r.target.split(":")[1] ?? r.target}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function LeftSidebarConstraints() {
  const { state, dispatch } = useEditor();
  return (
    <div className="p-3 space-y-2">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-fd-muted-foreground">
          {state.constraints.length} constraints
        </span>
        <button
          type="button"
          onClick={() => {
            if (state.entities.length === 0) return;
            const rawId = prompt("Constraint ID (e.g. MaxQuantity)", "");
            if (!rawId) return;
            const id = `scm:${rawId}`;
            dispatch({
              type: "ADD_CONSTRAINT",
              constraint: {
                id,
                label: rawId,
                entityType: state.entities[0].id,
                expression: prompt("Expression", "") ?? "",
              },
            });
          }}
          className="px-2 py-1.5 text-xs font-medium rounded-sm bg-fd-primary text-fd-primary-foreground hover:bg-fd-primary/90 transition-colors"
        >
          +
        </button>
      </div>
      {state.constraints.length === 0 && (
        <p className="text-xs text-fd-muted-foreground text-center py-6">
          No constraints
        </p>
      )}
      {state.constraints.map((c) => {
        const entityType = state.entities.find((e) => e.id === c.entityType);
        return (
          <div
            key={c.id}
            className="px-3 py-2 rounded-sm border border-fd-border bg-fd-muted"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-fd-foreground">
                {c.label}
              </span>
              <button
                type="button"
                onClick={() =>
                  dispatch({ type: "DELETE_CONSTRAINT", id: c.id })
                }
                className="text-fd-muted-foreground hover:text-fd-primary transition-colors"
              >
                <svg
                  className="w-3 h-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-label="Delete"
                >
                  <path
                    d="M6 18L18 6M6 6l12 12"
                    strokeWidth={2}
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
            <div
              className="text-[10px] text-fd-muted-foreground font-mono truncate"
              title={c.expression}
            >
              {c.expression}
            </div>
            <div className="text-[10px] text-fd-muted-foreground mt-1">
              on{" "}
              <span className="text-fd-muted-foreground">
                {entityType?.label ?? c.entityType}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function LeftSidebarCode({
  getCode,
  onCopy,
  copied,
}: {
  getCode: () => string;
  onCopy: () => void;
  copied: boolean;
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-3 border-b border-fd-border">
        <span className="text-xs text-fd-muted-foreground">
          Generated TypeScript
        </span>
        <button
          type="button"
          onClick={onCopy}
          className="px-2 py-1 text-[10px] font-medium rounded-sm bg-fd-muted text-fd-muted-foreground hover:text-fd-foreground transition-colors"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="flex-1 overflow-auto p-3 text-[10px] text-fd-muted-foreground font-mono leading-relaxed">
        {getCode() || "// Add entities and relations first"}
      </pre>
    </div>
  );
}

function LeftSidebarExport({
  exportFormat,
  setExportFormat,
  getCode,
  onCopy,
  onDownload,
  copied,
}: {
  exportFormat: "typescript" | "mermaid" | "owl" | "shacl";
  setExportFormat: (v: "typescript" | "mermaid" | "owl" | "shacl") => void;
  getCode: () => string;
  onCopy: () => void;
  onDownload: () => void;
  copied: boolean;
}) {
  return (
    <div className="p-3 space-y-3">
      <div className="space-y-2">
        {(["typescript", "mermaid", "owl", "shacl"] as const).map((fmt) => (
          <button
            key={fmt}
            type="button"
            onClick={() => setExportFormat(fmt)}
            className={`w-full px-3 py-2 rounded-sm text-xs font-medium text-left transition-colors ${exportFormat === fmt ? "bg-fd-accent border border-fd-primary/30 text-fd-primary" : "border border-fd-border text-fd-muted-foreground hover:text-fd-foreground"}`}
          >
            {fmt === "typescript" && "TypeScript Code"}
            {fmt === "mermaid" && "Mermaid Diagram"}
            {fmt === "owl" && "OWL 2 Turtle"}
            {fmt === "shacl" && "SHACL Shapes"}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onDownload}
          className="flex-1 px-3 py-2 text-xs font-medium rounded-sm bg-fd-primary text-fd-primary-foreground hover:bg-fd-primary/90 transition-colors"
        >
          Download
        </button>
        <button
          type="button"
          onClick={onCopy}
          className="px-3 py-2 text-xs font-medium rounded-sm bg-fd-muted text-fd-foreground hover:bg-fd-accent transition-colors"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}

/* ─── Graph Control Panel（画布左上角悬浮控制面板） ─── */

const LAYOUT_OPTIONS: { value: GraphLayoutName; label: string }[] = [
  // 力导向家族
  { value: "fcose", label: "fcose · 快速复合力导向（大图谱首选）" },
  { value: "cola", label: "cola · 高动态力导向（平滑交互）" },
  { value: "cose", label: "cose · 官方复合弹簧力导向" },
  { value: "euler", label: "euler · 轻量极速力导向" },
  // 层次家族
  { value: "dagre", label: "dagre · 有向层次布局（DAG）" },
  { value: "klay", label: "klay · 企业级层级布局" },
  { value: "breadthfirst", label: "breadthfirst · 广度优先树状" },
  // 圆形家族
  { value: "cise", label: "cise · 圆形弹簧嵌套（按 kind 聚簇）" },
  { value: "circle", label: "circle · 圆形（小规模循环）" },
  { value: "concentric", label: "concentric · 同心圆（按度数）" },
  { value: "avsdf", label: "avsdf · 低交叉圆形布局" },
  // 其他
  { value: "grid", label: "grid · 网格（对比/总数）" },
  { value: "random", label: "random · 随机（测试）" },
];

const KIND_OPTIONS: { value: EditorEntity["kind"]; label: string }[] = [
  { value: "entity", label: "Entity" },
  { value: "event", label: "Event" },
  { value: "role", label: "Role" },
  { value: "value", label: "Value" },
];

function GraphControlPanel({
  open,
  onToggle,
  layout,
  setLayout,
  highlightQuery,
  setHighlightQuery,
  showNodeLabels,
  setShowNodeLabels,
  showEdgeLabels,
  setShowEdgeLabels,
  nodeSize,
  setNodeSize,
  edgeWidth,
  setEdgeWidth,
  edgeLength,
  setEdgeLength,
  nodeRepulsion,
  setNodeRepulsion,
  gravity,
  setGravity,
  kindFilter,
  setKindFilter,
  onFit,
  onRelayout,
  onExportPng,
}: {
  open: boolean;
  onToggle: () => void;
  layout: GraphLayoutName;
  setLayout: (v: GraphLayoutName) => void;
  highlightQuery: string;
  setHighlightQuery: (v: string) => void;
  showNodeLabels: boolean;
  setShowNodeLabels: (v: boolean) => void;
  showEdgeLabels: boolean;
  setShowEdgeLabels: (v: boolean) => void;
  nodeSize: number;
  setNodeSize: (v: number) => void;
  edgeWidth: number;
  setEdgeWidth: (v: number) => void;
  edgeLength: number;
  setEdgeLength: (v: number) => void;
  nodeRepulsion: number;
  setNodeRepulsion: (v: number) => void;
  gravity: number;
  setGravity: (v: number) => void;
  kindFilter: Record<EditorEntity["kind"], boolean>;
  setKindFilter: (v: Record<EditorEntity["kind"], boolean>) => void;
  onFit: () => void;
  onRelayout: () => void;
  onExportPng: () => void;
}) {
  return (
    <div className="absolute top-3 left-3 z-10 w-56 bg-fd-popover/95 border border-fd-border rounded-sm">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-fd-foreground hover:bg-fd-accent transition-colors"
      >
        Graph Controls
        <svg
          className={`w-3.5 h-3.5 text-fd-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-label={open ? "Collapse" : "Expand"}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 15l7-7 7 7"
          />
        </svg>
      </button>

      {open && (
        <div className="px-3 pb-3 pt-1 space-y-3 text-xs">
          {/* Layout */}
          <div>
            <label
              htmlFor="graph-layout"
              className="text-[10px] uppercase tracking-wider text-fd-muted-foreground font-medium mb-1 block"
            >
              Layout
            </label>
            <select
              id="graph-layout"
              value={layout}
              onChange={(e) => setLayout(e.target.value as GraphLayoutName)}
              className="w-full px-2 py-1.5 bg-fd-muted border border-fd-border rounded-sm text-fd-foreground focus:outline-none focus:border-fd-primary"
            >
              {LAYOUT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Highlight in graph */}
          <div>
            <label
              htmlFor="graph-highlight"
              className="text-[10px] uppercase tracking-wider text-fd-muted-foreground font-medium mb-1 block"
            >
              Highlight
            </label>
            <input
              id="graph-highlight"
              type="text"
              value={highlightQuery}
              onChange={(e) => setHighlightQuery(e.target.value)}
              placeholder="高亮节点及一阶邻居…"
              className="w-full px-2 py-1.5 text-xs bg-fd-muted border border-fd-border rounded-sm text-fd-foreground placeholder:text-fd-muted-foreground focus:outline-none focus:border-fd-primary"
            />
          </div>

          {/* Kind filter */}
          <div>
            <span className="text-[10px] uppercase tracking-wider text-fd-muted-foreground font-medium mb-1 block">
              Filter by kind
            </span>
            <div className="flex flex-wrap gap-1.5">
              {KIND_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() =>
                    setKindFilter({
                      ...kindFilter,
                      [value]: !kindFilter[value],
                    })
                  }
                  className={`px-2 py-1 rounded-sm border text-[10px] font-medium transition-colors ${kindFilter[value] ? "bg-fd-accent border-fd-primary/30 text-fd-primary" : "border-fd-border text-fd-muted-foreground hover:text-fd-foreground"}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Label toggles */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 cursor-pointer text-fd-foreground">
              <input
                type="checkbox"
                checked={showNodeLabels}
                onChange={(e) => setShowNodeLabels(e.target.checked)}
                className="w-3 h-3 accent-fd-primary"
              />
              Node labels
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-fd-foreground">
              <input
                type="checkbox"
                checked={showEdgeLabels}
                onChange={(e) => setShowEdgeLabels(e.target.checked)}
                className="w-3 h-3 accent-fd-primary"
              />
              Edge labels
            </label>
          </div>

          {/* Node size */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] uppercase tracking-wider text-fd-muted-foreground font-medium">
                Node size
              </span>
              <span className="text-[10px] text-fd-muted-foreground">
                {nodeSize}px
              </span>
            </div>
            <input
              type="range"
              min={20}
              max={100}
              step={5}
              value={nodeSize}
              onChange={(e) => setNodeSize(Number(e.target.value))}
              className="w-full accent-fd-primary"
            />
          </div>

          {/* Edge width */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] uppercase tracking-wider text-fd-muted-foreground font-medium">
                Edge width
              </span>
              <span className="text-[10px] text-fd-muted-foreground">
                {edgeWidth}px
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={6}
              step={0.5}
              value={edgeWidth}
              onChange={(e) => setEdgeWidth(Number(e.target.value))}
              className="w-full accent-fd-primary"
            />
          </div>

          {/* Physics（仅对力导向布局生效：fcose / cola / cose / euler） */}
          <div className="pt-1 border-t border-fd-border">
            <span className="text-[10px] uppercase tracking-wider text-fd-muted-foreground font-medium mb-1 block">
              Physics（力导向布局）
            </span>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-fd-muted-foreground">
                  Edge length
                </span>
                <span className="text-[10px] text-fd-muted-foreground">
                  {edgeLength}
                </span>
              </div>
              <input
                type="range"
                min={20}
                max={300}
                step={10}
                value={edgeLength}
                onChange={(e) => setEdgeLength(Number(e.target.value))}
                className="w-full accent-fd-primary"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-fd-muted-foreground">
                  Repulsion
                </span>
                <span className="text-[10px] text-fd-muted-foreground">
                  {nodeRepulsion}
                </span>
              </div>
              <input
                type="range"
                min={500}
                max={20000}
                step={500}
                value={nodeRepulsion}
                onChange={(e) => setNodeRepulsion(Number(e.target.value))}
                className="w-full accent-fd-primary"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-fd-muted-foreground">
                  Gravity
                </span>
                <span className="text-[10px] text-fd-muted-foreground">
                  {gravity.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={2}
                step={0.05}
                value={gravity}
                onChange={(e) => setGravity(Number(e.target.value))}
                className="w-full accent-fd-primary"
              />
            </div>
          </div>

          {/* View actions */}
          <div className="flex gap-1.5 pt-1">
            <button
              type="button"
              onClick={onFit}
              className="flex-1 px-2 py-1.5 text-[10px] font-medium rounded-sm bg-fd-muted text-fd-foreground hover:bg-fd-accent transition-colors border border-fd-border"
            >
              Fit
            </button>
            <button
              type="button"
              onClick={onRelayout}
              className="flex-1 px-2 py-1.5 text-[10px] font-medium rounded-sm bg-fd-muted text-fd-foreground hover:bg-fd-accent transition-colors border border-fd-border"
            >
              Relayout
            </button>
            <button
              type="button"
              onClick={onExportPng}
              className="flex-1 px-2 py-1.5 text-[10px] font-medium rounded-sm bg-fd-primary text-fd-primary-foreground hover:bg-fd-primary/90 transition-colors"
            >
              PNG
            </button>
          </div>

          {/* Interaction hints */}
          <div className="pt-1 border-t border-fd-border space-y-0.5">
            <p className="text-[10px] text-fd-muted-foreground">
              双击节点：折叠/展开子树
            </p>
            <p className="text-[10px] text-fd-muted-foreground">
              Shift/Ctrl/Cmd + 拖拽：套索选择
            </p>
            <p className="text-[10px] text-fd-muted-foreground">
              悬停边：关系详情
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Right Detail Panel ─── */

function RightDetailPanel({
  entity,
  relations,
  constraints,
  detailTab,
  setDetailTab,
}: {
  entity: import("@/lib/editor-types").EditorEntity;
  relations: import("@/lib/editor-types").EditorRelation[];
  constraints: import("@/lib/editor-types").EditorConstraint[];
  detailTab: "entity" | "relation";
  setDetailTab: (t: "entity" | "relation") => void;
}) {
  const { state, dispatch } = useEditor();
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="flex flex-col h-full">
      {/* Detail header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-fd-border">
        <div
          className="w-4 h-4 rounded-full"
          style={{ backgroundColor: entity.color }}
        />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-fd-foreground truncate">
            {entity.label}
          </div>
          <div className="text-[10px] text-fd-muted-foreground font-mono truncate">
            {entity.id}
          </div>
        </div>
        <button
          type="button"
          onClick={() => dispatch({ type: "DELETE_ENTITY", id: entity.id })}
          className="p-1.5 rounded-sm hover:bg-fd-primary/15 text-fd-muted-foreground hover:text-fd-primary transition-colors"
          title="Delete entity"
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-label="Delete"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>

      {/* Detail tabs */}
      <div className="flex border-b border-fd-border">
        <button
          type="button"
          onClick={() => {
            setDetailTab("entity");
            setIsEditing(false);
          }}
          className={`flex-1 px-3 py-2 text-xs font-medium transition-colors border-b-2 ${detailTab === "entity" ? "text-fd-primary border-fd-primary" : "text-fd-muted-foreground border-transparent hover:text-fd-foreground"}`}
        >
          Details
        </button>
        <button
          type="button"
          onClick={() => setDetailTab("relation")}
          className={`flex-1 px-3 py-2 text-xs font-medium transition-colors border-b-2 ${detailTab === "relation" ? "text-fd-primary border-fd-primary" : "text-fd-muted-foreground border-transparent hover:text-fd-foreground"}`}
        >
          Relations ({relations.length})
        </button>
      </div>

      {/* Detail content */}
      <div className="flex-1 overflow-y-auto">
        {detailTab === "entity" && (
          <div className="p-4 space-y-4">
            {/* Kind select */}
            <div>
              <label
                htmlFor="entity-kind"
                className="text-[10px] uppercase tracking-wider text-fd-muted-foreground font-medium mb-1.5 block"
              >
                Kind
              </label>
              <select
                id="entity-kind"
                value={entity.kind}
                onChange={(e) =>
                  dispatch({
                    type: "UPDATE_ENTITY",
                    id: entity.id,
                    entity: { kind: e.target.value as typeof entity.kind },
                  })
                }
                className="w-full px-3 py-2 text-xs bg-fd-muted border border-fd-border rounded-sm text-fd-foreground focus:outline-none focus:border-fd-primary"
              >
                <option value="entity">entity</option>
                <option value="event">event</option>
                <option value="role">role</option>
                <option value="value">value</option>
              </select>
            </div>

            <div>
              <span className="text-[10px] uppercase tracking-wider text-fd-muted-foreground font-medium mb-1.5 block">
                Color
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  "#B93A2E", // 朱砂 · 赤
                  "#1F6E93", // 靛青 · 青
                  "#E0B84D", // 缃金 · 黄
                  "#3E8C7A", // 青碧 · 碧
                  "#8A5A42", // 赭 · 土
                ].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() =>
                      dispatch({
                        type: "UPDATE_ENTITY",
                        id: entity.id,
                        entity: { color: c },
                      })
                    }
                    className={`w-5 h-5 rounded-full transition-transform ${entity.color === c ? "scale-125 ring-2 ring-white/30" : "hover:scale-110"}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            {/* Rename */}
            <div>
              <label
                htmlFor="entity-label"
                className="text-[10px] uppercase tracking-wider text-fd-muted-foreground font-medium mb-1.5 block"
              >
                Label
              </label>
              <input
                id="entity-label"
                type="text"
                value={entity.label}
                onChange={(e) =>
                  dispatch({
                    type: "UPDATE_ENTITY",
                    id: entity.id,
                    entity: { label: e.target.value },
                  })
                }
                className="w-full px-3 py-2 text-xs bg-fd-muted border border-fd-border rounded-sm text-fd-foreground focus:outline-none focus:border-fd-primary"
              />
            </div>

            {/* Attributes */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase tracking-wider text-fd-muted-foreground font-medium">
                  Attributes ({entity.attributes.length})
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const ref = prompt(
                      "Attribute name (e.g. scm:maxCapacity)",
                      "",
                    );
                    if (!ref) return;
                    if (entity.attributes.some((a) => a.ref === ref)) return;
                    dispatch({
                      type: "ADD_ATTRIBUTE",
                      entityId: entity.id,
                      attribute: { ref, required: false, identity: false },
                    });
                  }}
                  className="px-2 py-1 text-[10px] font-medium rounded-sm bg-fd-primary text-fd-primary-foreground hover:bg-fd-primary/90 transition-colors"
                >
                  + Add
                </button>
              </div>
              {entity.attributes.length === 0 && (
                <p className="text-[10px] text-fd-muted-foreground italic">
                  No attributes defined
                </p>
              )}
              <div className="space-y-1.5">
                {entity.attributes.map((attr) => (
                  <div
                    key={attr.ref}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-sm bg-fd-muted border border-fd-border"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] text-fd-foreground font-mono truncate">
                        {attr.ref}
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        {attr.identity && (
                          <span className="text-[9px] px-1 py-px rounded-sm bg-fd-selection text-fd-foreground">
                            ID
                          </span>
                        )}
                        {attr.required && (
                          <span className="text-[9px] px-1 py-px rounded-sm bg-fd-primary/15 text-fd-primary">
                            Required
                          </span>
                        )}
                      </div>
                    </div>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={attr.required}
                        onChange={() => {
                          dispatch({
                            type: "DELETE_ATTRIBUTE",
                            entityId: entity.id,
                            attributeRef: attr.ref,
                          });
                          dispatch({
                            type: "ADD_ATTRIBUTE",
                            entityId: entity.id,
                            attribute: { ...attr, required: !attr.required },
                          });
                        }}
                        className="w-3 h-3 rounded-sm border-fd-border bg-fd-muted text-fd-primary focus:ring-fd-ring"
                      />
                      <span className="text-[9px] text-fd-muted-foreground">
                        Req
                      </span>
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={attr.identity}
                        onChange={() => {
                          dispatch({
                            type: "DELETE_ATTRIBUTE",
                            entityId: entity.id,
                            attributeRef: attr.ref,
                          });
                          dispatch({
                            type: "ADD_ATTRIBUTE",
                            entityId: entity.id,
                            attribute: { ...attr, identity: !attr.identity },
                          });
                        }}
                        className="w-3 h-3 rounded-sm border-fd-border bg-fd-muted text-fd-primary focus:ring-fd-ring"
                      />
                      <span className="text-[9px] text-fd-muted-foreground">
                        ID
                      </span>
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        dispatch({
                          type: "DELETE_ATTRIBUTE",
                          entityId: entity.id,
                          attributeRef: attr.ref,
                        })
                      }
                      className="text-fd-muted-foreground hover:text-fd-primary transition-colors p-0.5"
                    >
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-label="Delete"
                      >
                        <path
                          d="M6 18L18 6M6 6l12 12"
                          strokeWidth={2}
                          strokeLinecap="round"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Constraints section */}
            {state.constraints.filter((c) => c.entityType === entity.id)
              .length > 0 && (
              <div>
                <span className="text-[10px] uppercase tracking-wider text-fd-muted-foreground font-medium mb-2 block">
                  Constraints (
                  {
                    state.constraints.filter(
                      (c: EditorConstraint) => c.entityType === entity.id,
                    ).length
                  }
                  )
                </span>
                <div className="space-y-1.5">
                  {state.constraints
                    .filter((c) => c.entityType === entity.id)
                    .map((c) => (
                      <div
                        key={c.id}
                        className="px-3 py-2 rounded-sm bg-fd-muted border border-fd-border"
                      >
                        <div className="text-[11px] text-fd-foreground font-medium">
                          {c.label}
                        </div>
                        <div className="text-[10px] text-fd-muted-foreground font-mono mt-0.5">
                          {c.expression}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {detailTab === "relation" && (
          <div className="p-4 space-y-3">
            {relations.length === 0 && (
              <div className="text-center py-8">
                <svg
                  className="w-8 h-8 text-fd-muted-foreground/40 mx-auto mb-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-label="No relations"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a7.99 7.99 0 01-4.2-1.18M3 12c0-4.418 3.582-8 8-8a7.99 7.99 0 014.2 1.18"
                  />
                </svg>
                <p className="text-xs text-fd-muted-foreground">
                  No relations connected to this entity
                </p>
              </div>
            )}
            {relations.map((r) => {
              const isSource = r.source === entity.id;
              const otherId = isSource ? r.target : r.source;
              const other = state.entities.find((e) => e.id === otherId);
              return (
                <div
                  key={r.id}
                  className="px-3 py-2.5 rounded-sm border border-fd-border bg-fd-muted"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${isSource ? "bg-[#1F6E93]" : "bg-[#3E8C7A]"}`}
                    />
                    <span className="text-[10px] text-fd-muted-foreground">
                      {isSource ? "from" : "to"}
                    </span>
                    <span className="text-xs font-medium text-fd-foreground">
                      {r.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-2 ml-4">
                    {other && (
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: other.color }}
                      />
                    )}
                    <span
                      className="text-[10px] text-fd-muted-foreground font-mono truncate"
                      title={otherId}
                    >
                      {other?.label ?? otherId}
                    </span>
                  </div>
                  {r.inverse && (
                    <div className="text-[10px] text-fd-muted-foreground mt-1 ml-4">
                      inverse: {r.inverse}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function OntologyEditorPage() {
  return (
    <EditorProvider>
      <EditorInner />
    </EditorProvider>
  );
}
