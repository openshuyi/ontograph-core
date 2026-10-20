// 深路径导入: @ontograph/core barrel 经 datasource 引入 node:fs/promises，不可进浏览器 bundle

import { MermaidExporter } from "@ontograph/core/exporters/mermaid-exporter";
import type { MermaidExportOptions } from "@ontograph/core/exporters/mermaid-exporter";
import type {
  AttributeDefinition,
  EntityType,
  OntologyDefinition,
  RelationType,
} from "@ontograph/core/types";

/**
 * Example ontologies for the docs, mirroring the code samples in
 * quick-start.mdx and core/builder.mdx, plus Mermaid wrappers that run the
 * real `MermaidExporter` from `@ontograph/core` (build/server time).
 */

function attr(
  id: string,
  en: string,
  datatype: AttributeDefinition["datatype"],
  opts?: { required?: boolean; identity?: boolean },
): AttributeDefinition {
  return {
    "@id": id,
    "@type": "Attribute",
    label: { en },
    datatype,
    required: opts?.required,
    identity: opts?.identity,
  };
}

function entity(
  id: string,
  en: string,
  attributes: EntityType["attributes"],
  relations: EntityType["relations"] = [],
  extra?: Partial<EntityType>,
): EntityType {
  return {
    "@id": id,
    "@type": "EntityType",
    label: { en },
    kind: "entity",
    attributes,
    relations,
    constraints: [],
    ...extra,
  };
}

function relation(
  id: string,
  en: string,
  domain: string,
  range: string,
  cardinality?: { min?: number; max?: number | null },
  inverse?: string,
): RelationType {
  return {
    "@id": id,
    "@type": "RelationType",
    label: { en },
    domain,
    range,
    min: cardinality?.min,
    max: cardinality?.max,
    inverse,
  };
}

/** Mirrors the sample in quick-start.mdx (namespace `sc:`) */
export const quickStartOntology: OntologyDefinition = {
  "@context": {
    ontograph: "https://ontograph.app/ontology/sc#",
    sc: "http://example.com/sc#",
  },
  "@id": "sc:QuickStartOntology",
  "@type": "Ontology",
  version: "1.0.0",
  label: { en: "Quick Start Ontology" },
  entityTypes: [
    entity("sc:Warehouse", "Warehouse", [
      { ref: "sc:capacity", required: true },
      { ref: "sc:location", required: true },
    ]),
    entity(
      "sc:Product",
      "Product",
      [{ ref: "sc:sku", required: true, identity: true }, { ref: "sc:weight" }],
      [{ ref: "sc:storedIn", min: 0, max: null }],
    ),
  ],
  relationTypes: [
    relation("sc:storedIn", "stored in", "sc:Product", "sc:Warehouse", {
      min: 0,
      max: null,
    }),
  ],
  attributes: [
    attr("sc:capacity", "Capacity", "integer", { required: true }),
    attr("sc:location", "Location", "geopoint", { required: true }),
    attr("sc:sku", "SKU", "string", { required: true, identity: true }),
    attr("sc:weight", "Weight", "float"),
  ],
  constraints: [
    {
      "@id": "sc:PositiveCapacity",
      "@type": "Constraint",
      on: "sc:Warehouse",
      rule: "gt(sc:capacity, 0)",
    },
  ],
};

const scmContext = {
  ontograph: "https://ontograph.app/ontology/scm#",
  scm: "http://example.com/supplychain#",
};

/** Mirrors the `defineEntity` example in core/builder.mdx (namespace `scm:`) */
export const builderEntityOntology: OntologyDefinition = {
  "@context": scmContext,
  "@id": "scm:BuilderEntityExample",
  "@type": "Ontology",
  version: "1.0.0",
  label: { en: "Builder Entity Example" },
  entityTypes: [
    entity("scm:BaseItem", "Base Item", [{ ref: "scm:createdBy" }]),
    entity(
      "scm:Product",
      "Product",
      [
        { ref: "scm:skuCode", required: true, identity: true },
        { ref: "scm:name", required: true },
        { ref: "scm:unitPrice" },
        { ref: "scm:weight" },
      ],
      [
        { ref: "scm:suppliedBy", min: 1, max: null },
        { ref: "scm:storedIn", min: 0, max: 5 },
      ],
      {
        extends: ["scm:BaseItem"],
        implements: ["scm:TraceableItem"],
        constraints: [{ ref: "scm:PositivePrice" }, { ref: "scm:ValidSKU" }],
        ui: {
          color: "#2E7D32",
          icon: "package",
          visible: true,
          group: "inventory",
        },
      },
    ),
  ],
  relationTypes: [],
  attributes: [
    attr("scm:skuCode", "SKU Code", "string", {
      required: true,
      identity: true,
    }),
    attr("scm:name", "Name", "string", { required: true }),
    attr("scm:unitPrice", "Unit Price", "float"),
    attr("scm:weight", "Weight", "float"),
    attr("scm:createdBy", "Created By", "string"),
  ],
  constraints: [
    {
      "@id": "scm:PositivePrice",
      "@type": "Constraint",
      on: "scm:Product",
      rule: "gte(scm:unitPrice, 0)",
    },
    {
      "@id": "scm:ValidSKU",
      "@type": "Constraint",
      on: "scm:Product",
      rule: "matches(scm:skuCode, '^[A-Z]{3}-\\\\d{4}$')",
    },
  ],
};

/** Full builder example: Product + Supplier + Warehouse with relations */
export const builderOntology: OntologyDefinition = {
  ...builderEntityOntology,
  "@id": "scm:BuilderExample",
  label: { en: "Builder Example" },
  entityTypes: [
    ...builderEntityOntology.entityTypes,
    entity("scm:Supplier", "Supplier", [
      { ref: "scm:organizationCode", required: true, identity: true },
      { ref: "scm:supplierName", required: true },
    ]),
    entity("scm:Warehouse", "Warehouse", [
      { ref: "scm:facilityCode", required: true, identity: true },
      { ref: "scm:warehouseName", required: true },
      { ref: "scm:capacity" },
    ]),
  ],
  relationTypes: [
    relation(
      "scm:suppliedBy",
      "supplied by",
      "scm:Product",
      "scm:Supplier",
      { min: 1, max: null },
      "scm:supplies",
    ),
    relation(
      "scm:storedIn",
      "stored in",
      "scm:Product",
      "scm:Warehouse",
      { min: 0, max: 5 },
      "scm:stores",
    ),
  ],
  attributes: [
    ...builderEntityOntology.attributes,
    attr("scm:organizationCode", "Organization Code", "string", {
      required: true,
      identity: true,
    }),
    attr("scm:supplierName", "Supplier Name", "string", { required: true }),
    attr("scm:facilityCode", "Facility Code", "string", {
      required: true,
      identity: true,
    }),
    attr("scm:warehouseName", "Warehouse Name", "string", { required: true }),
    attr("scm:capacity", "Capacity", "integer"),
  ],
};

/** Demonstrates every `kind` shape plus inheritance (for core/types.mdx) */
export const kindsOntology: OntologyDefinition = {
  "@context": scmContext,
  "@id": "scm:KindsExample",
  "@type": "Ontology",
  version: "1.0.0",
  label: { en: "Kind Shapes Example" },
  entityTypes: [
    entity("scm:BaseItem", "Base Item", [{ ref: "scm:createdBy" }]),
    entity(
      "scm:Product",
      "Product",
      [
        { ref: "scm:skuCode", required: true, identity: true },
        { ref: "scm:name", required: true },
      ],
      [{ ref: "scm:storedIn", min: 0, max: 5 }],
      { extends: ["scm:BaseItem"] },
    ),
    entity(
      "scm:Order",
      "Order",
      [{ ref: "scm:orderNo", required: true, identity: true }],
      [{ ref: "scm:hasStatus", min: 1, max: 1 }, { ref: "scm:fulfilledAs" }],
    ),
    entity("scm:Warehouse", "Warehouse", [
      { ref: "scm:facilityCode", required: true, identity: true },
    ]),
    {
      ...entity("scm:Carrier", "Carrier", [
        { ref: "scm:organizationCode", required: true, identity: true },
      ]),
      relations: [{ ref: "scm:hasRole", min: 1, max: 1 }],
    },
    {
      ...entity("scm:OrderCreated", "Order Created", [
        { ref: "scm:occurredAt", required: true },
      ]),
      kind: "event",
    },
    {
      ...entity("scm:CarrierRole", "Carrier Role", [
        { ref: "scm:roleName", required: true },
      ]),
      kind: "role",
    },
  ],
  valueTypes: [
    {
      "@id": "scm:OrderStatus",
      "@type": "ValueType",
      label: { en: "Order Status" },
      values: ["Placed", "Shipped", "Delivered"],
    },
  ],
  relationTypes: [
    relation("scm:storedIn", "stored in", "scm:Product", "scm:Warehouse", {
      min: 0,
      max: 5,
    }),
    relation("scm:hasStatus", "has status", "scm:Order", "scm:OrderStatus", {
      min: 1,
      max: 1,
    }),
    relation(
      "scm:fulfilledAs",
      "fulfilled as",
      "scm:Order",
      "scm:OrderCreated",
    ),
    relation("scm:hasRole", "has role", "scm:Carrier", "scm:CarrierRole", {
      min: 1,
      max: 1,
    }),
  ],
  attributes: [
    attr("scm:skuCode", "SKU Code", "string", {
      required: true,
      identity: true,
    }),
    attr("scm:name", "Name", "string", { required: true }),
    attr("scm:createdBy", "Created By", "string"),
    attr("scm:orderNo", "Order No", "string", {
      required: true,
      identity: true,
    }),
    attr("scm:facilityCode", "Facility Code", "string", {
      required: true,
      identity: true,
    }),
    attr("scm:organizationCode", "Organization Code", "string", {
      required: true,
      identity: true,
    }),
    attr("scm:occurredAt", "Occurred At", "datetime", { required: true }),
    attr("scm:roleName", "Role Name", "string", { required: true }),
  ],
  constraints: [],
};

/** UML-style class diagram via the real `MermaidExporter` */
export function mermaidClassDiagram(
  ontology: OntologyDefinition,
  options?: MermaidExportOptions,
): string {
  return new MermaidExporter(ontology, {
    direction: "LR",
    ...options,
  }).export();
}

/** Simple entity-relationship graph via the real `MermaidExporter` */
export function mermaidRelationGraph(ontology: OntologyDefinition): string {
  return new MermaidExporter(ontology, {
    diagramType: "graph",
    direction: "LR",
    showKind: true,
  }).export();
}
