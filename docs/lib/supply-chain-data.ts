/**
 * Transform supply chain examples data into D3 force graph format.
 */

import type { GraphNode, GraphLink } from "../components/force-graph";

// Inline example data — mirrors src/examples/objects.ts
// This avoids bundling the entire src/examples/ into the docs site.

const INSTANCES = [
  {
    "@id": "scm:warehouse-sh-001",
    label: { zh: "上海浦东仓库", en: "Shanghai Pudong Warehouse" },
    classRef: "scm:WarehouseClass",
    propertyValues: {
      "scm:warehouseCode": "WH-SH-001",
      "scm:name": "上海浦东仓库",
      "scm:capacity": 50000,
      "scm:temperatureZone": "ambient",
      "scm:status": "active",
    },
  },
  {
    "@id": "scm:warehouse-bj-001",
    label: { zh: "北京大兴仓库", en: "Beijing Daxing Warehouse" },
    classRef: "scm:WarehouseClass",
    propertyValues: {
      "scm:warehouseCode": "WH-BJ-001",
      "scm:name": "北京大兴仓库",
      "scm:capacity": 30000,
      "scm:temperatureZone": "cold",
      "scm:status": "active",
    },
  },
  {
    "@id": "scm:warehouse-gz-001",
    label: { zh: "广州南沙仓库", en: "Guangzhou Nansha Warehouse" },
    classRef: "scm:WarehouseClass",
    propertyValues: {
      "scm:warehouseCode": "WH-GZ-001",
      "scm:name": "广州南沙仓库",
      "scm:capacity": 80000,
      "scm:temperatureZone": "ambient",
      "scm:status": "active",
    },
  },
  {
    "@id": "scm:shipment-001",
    label: { zh: "上海→北京运输批次", en: "Shanghai→Beijing Shipment" },
    classRef: "scm:ShipmentClass",
    propertyValues: {
      "scm:shipmentId": "SHP-2026-001",
      "scm:weight": 2500,
      "scm:shipmentStatus": "in_transit",
      "scm:estimatedArrival": "2026-04-08T18:00:00Z",
    },
  },
  {
    "@id": "scm:shipment-002",
    label: { zh: "北京→广州运输批次", en: "Beijing→Guangzhou Shipment" },
    classRef: "scm:ShipmentClass",
    propertyValues: {
      "scm:shipmentId": "SHP-2026-002",
      "scm:weight": 1800,
      "scm:shipmentStatus": "pending",
      "scm:estimatedArrival": "2026-04-12T12:00:00Z",
    },
  },
  {
    "@id": "scm:order-001",
    label: { zh: "采购订单 PO-2026-001", en: "Purchase Order PO-2026-001" },
    classRef: "scm:OrderClass",
    propertyValues: {
      "scm:orderNumber": "PO-2026-001",
      "scm:orderType": "purchase",
      "scm:totalAmount": 125000,
      "scm:currency": "CNY",
      "scm:orderStatus": "confirmed",
    },
  },
  {
    "@id": "scm:order-002",
    label: { zh: "销售订单 SO-2026-001", en: "Sales Order SO-2026-001" },
    classRef: "scm:OrderClass",
    propertyValues: {
      "scm:orderNumber": "SO-2026-001",
      "scm:orderType": "sales",
      "scm:totalAmount": 98000,
      "scm:currency": "CNY",
      "scm:orderStatus": "processing",
    },
  },
];

const LINKS = [
  {
    "@id": "scm:link-ship-origin-001",
    relationTypeRef: "scm:shippedFrom",
    fromObjectId: "scm:shipment-001",
    toObjectId: "scm:warehouse-sh-001",
    label: { zh: "从上海仓发货", en: "Shipped from Shanghai" },
  },
  {
    "@id": "scm:link-ship-dest-001",
    relationTypeRef: "scm:shippedTo",
    fromObjectId: "scm:shipment-001",
    toObjectId: "scm:warehouse-bj-001",
    label: { zh: "送达北京仓", en: "Delivered to Beijing" },
  },
  {
    "@id": "scm:link-ship-order-001",
    relationTypeRef: "scm:fulfillsOrder",
    fromObjectId: "scm:shipment-001",
    toObjectId: "scm:order-001",
    label: { zh: "履约采购订单", en: "Fulfills purchase order" },
    properties: { fulfillmentRatio: 0.75 },
  },
];

// Map classRef → color based on EntityType.ui.color from supply-chain/entities.ts
const CLASS_COLOR_MAP: Record<string, string> = {
  "scm:WarehouseClass": "#FF9800",
  "scm:ShipmentClass": "#0277BD",
  "scm:OrderClass": "#4CAF50",
};

// Map classRef → friendly group name
const CLASS_GROUP_MAP: Record<string, string> = {
  "scm:WarehouseClass": "Warehouse",
  "scm:ShipmentClass": "Shipment",
  "scm:OrderClass": "Order",
};

export function getSupplyChainGraphData(): {
  nodes: GraphNode[];
  links: GraphLink[];
} {
  const nodes: GraphNode[] = INSTANCES.map((inst) => ({
    id: inst["@id"],
    label: inst.label.zh,
    group: CLASS_GROUP_MAP[inst.classRef] ?? "Unknown",
    color: CLASS_COLOR_MAP[inst.classRef] ?? "#999",
    properties: inst.propertyValues,
  }));

  const links: GraphLink[] = LINKS.map((link) => ({
    source: link.fromObjectId,
    target: link.toObjectId,
    type: link.relationTypeRef,
    label: link.label.zh,
    properties: link.properties,
  }));

  return { nodes, links };
}
