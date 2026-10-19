/**
 * Cytoscape Exporter — OntologyDefinition → cytoscape.js 元素 JSON
 *
 * 映射规则:
 * - EntityType (+ eventTypes + roleTypes) → 节点（kind 作为分组, ui.color 或 kind 默认色）
 * - ValueType                            → 枚举节点（kind = "value"）
 * - RelationType                         → domain → range 直连边（含 cardinality）
 * - EntityType.extends                   → 继承边（kind = "extends", 虚线样式由渲染层处理）
 *
 * 输出为与 cytoscape.ElementDefinition 结构兼容的纯数据（无 DOM 依赖），
 * 可直接传入 cytoscape({ elements })，也可在 Node 端 headless 用于预计算布局后
 * 通过 options.positions 回填坐标（配合 "preset" 布局零成本加载）。
 */
import type { EntityType, OntologyDefinition, RelationType, ValueType } from "../types";

/** Cytoscape 节点 data 载荷（结构兼容 cytoscape.NodeDataDefinition） */
export interface CytoscapeNodeData {
  id: string;
  label: string;
  /** entity | event | role | value | relation */
  kind: string;
  color: string;
  description?: string;
  [key: string]: unknown;
}

/** Cytoscape 边 data 载荷（结构兼容 cytoscape.EdgeDataDefinition） */
export interface CytoscapeEdgeData {
  id: string;
  source: string;
  target: string;
  label: string;
  /** relation | extends | domain | range */
  kind: string;
  cardinality?: string;
  [key: string]: unknown;
}

export interface CytoscapeNodeDefinition {
  group: "nodes";
  data: CytoscapeNodeData;
  /** preset 布局用的预计算坐标 */
  position?: { x: number; y: number };
  classes?: string;
}

export interface CytoscapeEdgeDefinition {
  group: "edges";
  data: CytoscapeEdgeData;
  classes?: string;
}

export type CytoscapeElementDefinition = CytoscapeNodeDefinition | CytoscapeEdgeDefinition;

export interface CytoscapeExportOptions {
  /** 标签语言偏好；回退顺序 lang → en → zh → 首个非空值 → @id 局部名。默认 "en" */
  language?: string;
  /**
   * 关系类型物化为中间节点（relation 节点 + domain/range 两条边）。
   * 默认 false：关系渲染为 domain → range 直连边。
   */
  includeRelationTypeNodes?: boolean;
  /** 是否包含 ValueType 枚举节点。默认 true */
  includeValueTypes?: boolean;
  /** 是否包含 extends 继承边。默认 true */
  includeInheritance?: boolean;
  /** 是否在边 label 中附带基数（如 "发货 (0..n)"）。默认 false，基数始终写入 data.cardinality */
  labelWithCardinality?: boolean;
  /** kind → 颜色覆盖；未覆盖的 kind 使用默认调色板 */
  kindColors?: Partial<Record<"entity" | "event" | "role" | "value" | "relation", string>>;
  /** 预计算坐标（键为元素 @id），写入节点 position 供 "preset" 布局使用 */
  positions?: Record<string, { x: number; y: number }>;
}

const DEFAULT_KIND_COLORS: Record<"entity" | "event" | "role" | "value" | "relation", string> = {
  entity: "#3b82f6",
  event: "#a855f7",
  role: "#f97316",
  value: "#22c55e",
  relation: "#94a3b8",
};

/** 提取 "sc:Warehouse" 中的局部名 "Warehouse" */
function localName(id: string): string {
  const parts = id.split(":");
  return parts[parts.length - 1] ?? id;
}

export class CytoscapeExporter {
  private ontology: OntologyDefinition;
  private options: Required<Omit<CytoscapeExportOptions, "kindColors" | "positions">> &
    Pick<CytoscapeExportOptions, "kindColors" | "positions">;

  constructor(ontology: OntologyDefinition, options?: CytoscapeExportOptions) {
    this.ontology = ontology;
    this.options = {
      language: options?.language ?? "en",
      includeRelationTypeNodes: options?.includeRelationTypeNodes ?? false,
      includeValueTypes: options?.includeValueTypes ?? true,
      includeInheritance: options?.includeInheritance ?? true,
      labelWithCardinality: options?.labelWithCardinality ?? false,
      kindColors: options?.kindColors,
      positions: options?.positions,
    };
  }

  export(): CytoscapeElementDefinition[] {
    const elements: CytoscapeElementDefinition[] = [];
    const allTypes = this.getAllEntityTypes();

    for (const entityType of allTypes) {
      elements.push(this.entityTypeToNode(entityType));
    }

    if (this.options.includeValueTypes) {
      for (const valueType of this.ontology.valueTypes ?? []) {
        elements.push(this.valueTypeToNode(valueType));
      }
    }

    if (this.options.includeInheritance) {
      for (const entityType of allTypes) {
        for (const parentId of entityType.extends ?? []) {
          elements.push({
            group: "edges",
            data: {
              id: `extends:${entityType["@id"]}:${parentId}`,
              source: parentId,
              target: entityType["@id"],
              label: "extends",
              kind: "extends",
            },
            classes: "extends",
          });
        }
      }
    }

    for (const relationType of this.ontology.relationTypes) {
      if (this.options.includeRelationTypeNodes) {
        elements.push(this.relationTypeToNode(relationType));
        elements.push({
          group: "edges",
          data: {
            id: `domain:${relationType["@id"]}`,
            source: relationType["@id"],
            target: relationType.domain,
            label: "domain",
            kind: "domain",
          },
        });
        elements.push({
          group: "edges",
          data: {
            id: `range:${relationType["@id"]}`,
            source: relationType["@id"],
            target: relationType.range,
            label: "range",
            kind: "range",
          },
        });
      } else {
        elements.push(this.relationTypeToEdge(relationType));
      }
    }

    return elements;
  }

  private getAllEntityTypes(): EntityType[] {
    return [
      ...(this.ontology.entityTypes ?? []),
      ...(this.ontology.eventTypes ?? []),
      ...(this.ontology.roleTypes ?? []),
    ];
  }

  private localizedLabel(label: Record<string, string | undefined> | undefined, fallback: string): string {
    if (!label) return fallback;
    return label[this.options.language] ?? label.en ?? label.zh ?? Object.values(label).find(Boolean) ?? fallback;
  }

  private kindColor(kind: string, override?: string): string {
    if (override) return override;
    const custom = this.options.kindColors?.[kind as "entity" | "event" | "role" | "value" | "relation"];
    return custom ?? DEFAULT_KIND_COLORS[kind as keyof typeof DEFAULT_KIND_COLORS] ?? "#64748b";
  }

  private applyPosition(nodeId: string): { x: number; y: number } | undefined {
    return this.options.positions?.[nodeId];
  }

  private entityTypeToNode(entityType: EntityType): CytoscapeNodeDefinition {
    return {
      group: "nodes",
      data: {
        id: entityType["@id"],
        label: this.localizedLabel(entityType.label, localName(entityType["@id"])),
        kind: entityType.kind,
        color: this.kindColor(entityType.kind, entityType.ui?.color),
        description: this.localizedLabel(entityType.description, ""),
        attributeCount: entityType.attributes.length,
        relationCount: entityType.relations.length,
      },
      position: this.applyPosition(entityType["@id"]),
    };
  }

  private valueTypeToNode(valueType: ValueType): CytoscapeNodeDefinition {
    return {
      group: "nodes",
      data: {
        id: valueType["@id"],
        label: this.localizedLabel(valueType.label, localName(valueType["@id"])),
        kind: "value",
        color: this.kindColor("value"),
        values: valueType.values.join(", "),
      },
      position: this.applyPosition(valueType["@id"]),
    };
  }

  private relationTypeToNode(relationType: RelationType): CytoscapeNodeDefinition {
    return {
      group: "nodes",
      data: {
        id: relationType["@id"],
        label: this.localizedLabel(relationType.label, localName(relationType["@id"])),
        kind: "relation",
        color: this.kindColor("relation"),
        description: this.localizedLabel(relationType.description, ""),
      },
      position: this.applyPosition(relationType["@id"]),
    };
  }

  private cardinality(relationType: RelationType): string | undefined {
    if (relationType.min === undefined && relationType.max === undefined) return undefined;
    const min = relationType.min ?? 0;
    const max = relationType.max === null ? "n" : (relationType.max ?? "n");
    return `${min}..${max}`;
  }

  private relationTypeToEdge(relationType: RelationType): CytoscapeEdgeDefinition {
    const label = this.localizedLabel(relationType.label, localName(relationType["@id"]));
    const cardinality = this.cardinality(relationType);
    return {
      group: "edges",
      data: {
        id: relationType["@id"],
        source: relationType.domain,
        target: relationType.range,
        label: this.options.labelWithCardinality && cardinality ? `${label} (${cardinality})` : label,
        kind: "relation",
        color: this.kindColor("relation"),
        relationType: relationType["@id"],
        cardinality,
      },
    };
  }
}

/** 便捷函数：本体定义 → cytoscape 元素数组 */
export function toCytoscapeElements(
  ontology: OntologyDefinition,
  options?: CytoscapeExportOptions,
): CytoscapeElementDefinition[] {
  return new CytoscapeExporter(ontology, options).export();
}
