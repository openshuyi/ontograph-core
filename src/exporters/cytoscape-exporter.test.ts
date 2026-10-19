import { describe, expect, it } from "vitest";
import type { EntityType, OntologyDefinition, RelationType, ValueType } from "../types";
import type { CytoscapeNodeDefinition } from "./cytoscape-exporter";
import { toCytoscapeElements } from "./cytoscape-exporter";

const entity = (id: string, kind: EntityType["kind"] = "entity"): EntityType => ({
  "@id": id,
  "@type": "EntityType",
  label: { en: `${id}-en`, zh: `${id}-zh` },
  kind,
  attributes: [{ ref: "sc:name" }],
  relations: [],
  constraints: [],
});

const relation = (id: string, domain: string, range: string): RelationType => ({
  "@id": id,
  "@type": "RelationType",
  label: { en: `${id}-en`, zh: `${id}-zh` },
  domain,
  range,
});

const value: ValueType = {
  "@id": "sc:Status",
  "@type": "ValueType",
  label: { en: "Status" },
  values: ["open", "closed"],
};

const ontology: OntologyDefinition = {
  "@context": { ontograph: "https://ontograph.dev/" },
  "@id": "sc:test",
  "@type": "Ontology",
  version: "1.0.0",
  label: { en: "Test" },
  entityTypes: [entity("sc:Order"), entity("sc:Shipment"), entity("sc:Planner", "role")],
  eventTypes: [entity("sc:Delay", "event")],
  relationTypes: [
    { ...relation("sc:ships", "sc:Order", "sc:Shipment"), min: 0, max: null },
    relation("sc:causes", "sc:Delay", "sc:Shipment"),
  ],
  valueTypes: [value],
  attributes: [],
  constraints: [],
};

describe("toCytoscapeElements", () => {
  it("maps entity/event/role/value types to nodes with kind colors", () => {
    const elements = toCytoscapeElements(ontology);
    const nodes = elements.filter((e) => e.group === "nodes");

    // 3 entityTypes + 1 eventType(role 已在 entityTypes) + 1 value + 1 event
    expect(nodes).toHaveLength(5);

    const order = nodes.find((n) => n.data.id === "sc:Order");
    expect(order?.data.label).toBe("sc:Order-en");
    expect(order?.data.kind).toBe("entity");
    expect(order?.data.color).toBe("#3b82f6");

    const delay = nodes.find((n) => n.data.id === "sc:Delay");
    expect(delay?.data.kind).toBe("event");
    expect(delay?.data.color).toBe("#a855f7");

    const planner = nodes.find((n) => n.data.id === "sc:Planner");
    expect(planner?.data.color).toBe("#f97316");

    const status = nodes.find((n) => n.data.id === "sc:Status");
    expect(status?.data.kind).toBe("value");
    expect(status?.data.values).toBe("open, closed");
  });

  it("maps relations to direct domain→range edges with cardinality in data", () => {
    const elements = toCytoscapeElements(ontology);
    const edges = elements.filter((e) => e.group === "edges");

    const ships = edges.find((e) => e.data.id === "sc:ships");
    expect(ships?.data.source).toBe("sc:Order");
    expect(ships?.data.target).toBe("sc:Shipment");
    expect(ships?.data.label).toBe("sc:ships-en");
    expect(ships?.data.cardinality).toBe("0..n");
    expect(ships?.data.kind).toBe("relation");

    const causes = edges.find((e) => e.data.id === "sc:causes");
    expect(causes?.data.cardinality).toBeUndefined();
  });

  it("respects label localization fallback order", () => {
    const elements = toCytoscapeElements(ontology, { language: "zh" });
    const nodes = elements.filter((e) => e.group === "nodes");
    expect(nodes.find((n) => n.data.id === "sc:Order")?.data.label).toBe("sc:Order-zh");
  });

  it("reifies relation types as intermediate nodes when requested", () => {
    const elements = toCytoscapeElements(ontology, { includeRelationTypeNodes: true });
    const nodes = elements.filter((e) => e.group === "nodes");
    const edges = elements.filter((e) => e.group === "edges");

    const relNode = nodes.find((n) => n.data.id === "sc:ships");
    expect(relNode?.data.kind).toBe("relation");

    const domainEdge = edges.find((e) => e.data.id === "domain:sc:ships");
    expect(domainEdge?.data.source).toBe("sc:ships");
    expect(domainEdge?.data.target).toBe("sc:Order");

    const rangeEdge = edges.find((e) => e.data.id === "range:sc:ships");
    expect(rangeEdge?.data.target).toBe("sc:Shipment");

    // 直连边不应存在
    expect(edges.find((e) => e.data.id === "sc:ships")).toBeUndefined();
  });

  it("appends cardinality to edge labels when labelWithCardinality is set", () => {
    const elements = toCytoscapeElements(ontology, { labelWithCardinality: true });
    const ships = elements.find((e) => e.group === "edges" && e.data.id === "sc:ships");
    expect(ships?.data.label).toBe("sc:ships-en (0..n)");
  });

  it("emits extends edges and honors include toggles", () => {
    const withExtends: OntologyDefinition = {
      ...ontology,
      entityTypes: [entity("sc:Order"), { ...entity("sc:ExpressOrder"), extends: ["sc:Order"] }],
    };
    const elements = toCytoscapeElements(withExtends);
    const ext = elements.find((e) => e.group === "edges" && e.data.id === "extends:sc:ExpressOrder:sc:Order");
    expect(ext?.data.kind).toBe("extends");
    if (ext && ext.group === "edges") expect(ext.classes).toBe("extends");

    const without = toCytoscapeElements(withExtends, {
      includeInheritance: false,
      includeValueTypes: false,
    });
    expect(without.some((e) => e.data.id === "extends:sc:ExpressOrder:sc:Order")).toBe(false);
    expect(without.some((e) => e.data.id === "sc:Status")).toBe(false);
  });

  it("prefers ui.color and kindColors overrides over defaults", () => {
    const colored: OntologyDefinition = {
      ...ontology,
      entityTypes: [{ ...entity("sc:Order"), ui: { color: "#ff0000" } }, entity("sc:Shipment")],
    };
    const elements = toCytoscapeElements(colored, {
      kindColors: { entity: "#00ff00", relation: "#0000ff" },
    });
    expect(elements.find((e) => e.data.id === "sc:Order")?.data.color).toBe("#ff0000");
    expect(elements.find((e) => e.data.id === "sc:Shipment")?.data.color).toBe("#00ff00");
    expect(elements.find((e) => e.data.id === "sc:causes")?.data.color).toBe("#0000ff");
  });

  it("applies preset positions to nodes only", () => {
    const elements = toCytoscapeElements(ontology, {
      positions: { "sc:Order": { x: 10, y: -5 }, "sc:ships": { x: 1, y: 1 } },
    });
    const order = elements.find((e) => e.group === "nodes" && e.data.id === "sc:Order") as CytoscapeNodeDefinition;
    expect(order.position).toEqual({ x: 10, y: -5 });
    // 边上的 positions 条目被忽略（无 position 字段）
    const ships = elements.find((e) => e.data.id === "sc:ships");
    expect(ships && "position" in ships).toBe(false);
  });
});
