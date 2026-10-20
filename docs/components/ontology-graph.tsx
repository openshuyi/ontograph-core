"use client";

import { toCytoscapeElements } from "@ontograph/core/exporters/cytoscape-exporter";
// 深路径导入: @ontograph/core barrel 经 datasource 引入 node:fs/promises，不可进浏览器 bundle
import type { OntologyDefinition } from "@ontograph/core/types";
import { useMemo } from "react";
import {
  CytoscapeGraph,
  type GraphEdge,
  type GraphNode,
} from "./cytoscape-graph";

/** docs 站点固定配色（保持与 figcaption 图例一致）· 五行五色数据色阶 */
const KIND_COLORS = {
  entity: "#B93A2E", // 朱砂 · 赤
  event: "#E0B84D", // 缃金 · 黄
  role: "#1F6E93", // 靛青 · 青
  value: "#3E8C7A", // 青碧 · 碧
} as const;

interface OntologyGraphProps {
  /** Schema-level ontology definition (entity/relation/value types) */
  ontology: OntologyDefinition;
  /** Canvas height in pixels (default 420) */
  height?: number;
  onNodeClick?: (nodeId: string) => void;
}

/**
 * Interactive schema-level ontology graph for MDX pages.
 *
 * Renders EntityType nodes colored by `kind`, ValueType enum nodes, and
 * RelationType edges labeled with cardinality. Data mapping is delegated to
 * `toCytoscapeElements` from @ontograph/core — this component only adapts the
 * exporter output to the docs' canvas props.
 */
export function OntologyGraph({
  ontology,
  height = 420,
  onNodeClick,
}: OntologyGraphProps) {
  const { nodes, edges } = useMemo(() => {
    const elements = toCytoscapeElements(ontology, {
      language: "en",
      labelWithCardinality: true,
      kindColors: KIND_COLORS,
    });

    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];
    for (const element of elements) {
      if (element.group === "nodes") {
        const properties: Record<string, unknown> = {};
        if (element.data.kind !== undefined)
          properties.kind = element.data.kind;
        if (element.data.attributeCount !== undefined) {
          properties.attributes = element.data.attributeCount;
        }
        if (element.data.relationCount !== undefined) {
          properties.relations = element.data.relationCount;
        }
        if (element.data.values !== undefined)
          properties.values = element.data.values;
        nodes.push({
          id: element.data.id,
          label: element.data.label,
          group: element.data.kind,
          color: element.data.color,
          properties,
        });
      } else {
        edges.push({
          id: element.data.id,
          source: element.data.source,
          target: element.data.target,
          label: element.data.label,
        });
      }
    }
    return { nodes, edges };
  }, [ontology]);

  if (nodes.length === 0) {
    return (
      <div className="not-prose my-6 flex h-40 items-center justify-center rounded-sm border border-fd-border bg-fd-card text-sm text-fd-muted-foreground">
        This ontology defines no types yet.
      </div>
    );
  }

  return (
    <figure className="not-prose my-6">
      <div
        style={{ height }}
        className="overflow-hidden rounded-sm border border-fd-border"
      >
        <CytoscapeGraph nodes={nodes} edges={edges} onNodeClick={onNodeClick} />
      </div>
      <figcaption className="mt-3 text-center text-xs text-fd-muted-foreground">
        Drag nodes to rearrange · hover a node for attribute counts · edge
        labels show cardinality ({"entity "}
        <span className="inline-block size-2 rounded-full bg-[#B93A2E] align-middle" />{" "}
        · event{" "}
        <span className="inline-block size-2 rounded-full bg-[#E0B84D] align-middle" />{" "}
        · role{" "}
        <span className="inline-block size-2 rounded-full bg-[#1F6E93] align-middle" />{" "}
        · value{" "}
        <span className="inline-block size-2 rounded-full bg-[#3E8C7A] align-middle" />
        )
      </figcaption>
    </figure>
  );
}
