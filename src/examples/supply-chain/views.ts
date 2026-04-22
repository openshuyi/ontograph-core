import type { ViewDefinition } from "../../types";

export const views: ViewDefinition[] = [
	// ========== 供应链网络视图 ==========
	{
		"@id": "scm:NetworkView",
		"@type": "View",
		label: { zh: "供应链网络视图", en: "Supply Chain Network View" },
		forType: "scm:SupplyChainNode",
		layout: "force",
		filter: [
			{ type: "entity", property: "kind", operator: "eq", value: "entity" },
			{ type: "entity", property: "visible", operator: "eq", value: true },
		],
		highlight: [
			{
				condition: "riskLevel == 'high'",
				style: { color: "#EF5350", size: 20, opacity: 1 },
			},
			{
				condition: "riskLevel == 'medium'",
				style: { color: "#FFA726", size: 15, opacity: 0.8 },
			},
		],
	},

	// ========== 订单追踪视图 ==========
	{
		"@id": "scm:OrderTrackingView",
		"@type": "View",
		label: { zh: "订单追踪视图", en: "Order Tracking View" },
		forType: "scm:Order",
		layout: "hierarchical",
		filter: [
			{
				type: "entity",
				property: "paymentStatus",
				operator: "neq",
				value: "refunded",
			},
		],
		highlight: [
			{
				condition: "paymentStatus == 'pending'",
				style: { color: "#FFB74D", size: 12, opacity: 0.9 },
			},
			{
				condition: "paymentStatus == 'paid'",
				style: { color: "#66BB6A", size: 12, opacity: 1 },
			},
		],
	},

	// ========== 库存热力视图 ==========
	{
		"@id": "scm:InventoryHeatmapView",
		"@type": "View",
		label: { zh: "库存热力视图", en: "Inventory Heatmap View" },
		forType: "scm:Warehouse",
		layout: "grid",
		filter: [
			{ type: "entity", property: "capacity", operator: "exists", value: true },
		],
		highlight: [
			{
				condition: "utilizationRate > 90",
				style: { color: "#EF5350", size: 18, opacity: 1 },
			},
			{
				condition: "utilizationRate > 70 && utilizationRate <= 90",
				style: { color: "#FFA726", size: 15, opacity: 0.9 },
			},
			{
				condition: "utilizationRate <= 70",
				style: { color: "#66BB6A", size: 12, opacity: 0.8 },
			},
		],
	},

	// ========== 风险事件视图 ==========
	{
		"@id": "scm:RiskEventView",
		"@type": "View",
		label: { zh: "风险事件视图", en: "Risk Event View" },
		forType: "scm:SupplyDisruption",
		layout: "radial",
		filter: [
			{ type: "entity", property: "severity", operator: "eq", value: "high" },
		],
		highlight: [
			{
				condition: "severity == 'critical'",
				style: { color: "#B71C1C", size: 24, opacity: 1 },
			},
			{
				condition: "severity == 'high'",
				style: { color: "#D32F2F", size: 20, opacity: 0.9 },
			},
		],
	},

	// ========== 运输路线视图 ==========
	{
		"@id": "scm:TransportRouteView",
		"@type": "View",
		label: { zh: "运输路线视图", en: "Transport Route View" },
		forType: "scm:Route",
		layout: "hierarchical",
		filter: [
			{
				type: "relation",
				property: "usedByTransport",
				operator: "exists",
				value: true,
			},
		],
		highlight: [
			{
				condition: "transportMode == 'air'",
				style: { color: "#29B6F6", size: 8, opacity: 0.6 },
			},
			{
				condition: "transportMode == 'sea'",
				style: { color: "#0277BD", size: 6, opacity: 0.5 },
			},
			{
				condition: "transportMode == 'road'",
				style: { color: "#78909C", size: 4, opacity: 0.4 },
			},
		],
	},

	// ========== 供应商绩效视图 ==========
	{
		"@id": "scm:SupplierPerformanceView",
		"@type": "View",
		label: { zh: "供应商绩效视图", en: "Supplier Performance View" },
		forType: "scm:Supplier",
		layout: "grid",
		filter: [
			{
				type: "entity",
				property: "supplierTier",
				operator: "exists",
				value: true,
			},
		],
		highlight: [
			{
				condition: "onTimeRate >= 0.95",
				style: { color: "#66BB6A", size: 16, opacity: 1 },
			},
			{
				condition: "onTimeRate >= 0.85 && onTimeRate < 0.95",
				style: { color: "#FFA726", size: 14, opacity: 0.8 },
			},
			{
				condition: "onTimeRate < 0.85",
				style: { color: "#EF5350", size: 12, opacity: 0.7 },
			},
		],
	},
];
