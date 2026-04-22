import type { EntityType } from "../../types";

/**
 * 高级供应链概念抽象
 *
 * 包含：
 * 1. SupplyChainNode - 供应链接点通用抽象
 * 2. SupplyChainLink - 供应链链路通用抽象
 * 3. RiskEvent - 风险事件类型
 */

export const advancedConcepts: EntityType[] = [
	// ========== 供应链接点抽象 ==========
	{
		"@id": "scm:SupplyChainNode",
		"@type": "EntityType",
		label: { zh: "供应链接点", en: "Supply Chain Node" },
		kind: "entity",
		description: {
			zh: "供应链网络中的通用节点抽象，可扩展为仓库、工厂、港口等",
			en: "Generic node abstraction in supply chain network, extensible to warehouse, factory, port, etc.",
		},
		extends: [
			"scm:Warehouse",
			"scm:Factory",
			"scm:Port",
			"scm:DistributionCenter",
		],
		attributes: [
			{ ref: "scm:nodeCode", identity: true, required: true },
			{ ref: "scm:nodeType", required: true },
			{ ref: "scm:latitude" },
			{ ref: "scm:longitude" },
			{ ref: "scm:region" },
			{ ref: "scm:country" },
			{ ref: "scm:operatingHours" },
		],
		relations: [
			{ ref: "scm:connectedTo" },
			{ ref: "scm:handlesProduct" },
			{ ref: "scm:operatedBy" },
		],
		constraints: [],
		ui: { color: "#5C6BC0", icon: "hub", group: "network" },
	},

	// ========== 供应链链路抽象 ==========
	{
		"@id": "scm:SupplyChainLink",
		"@type": "EntityType",
		label: { zh: "供应链链路", en: "Supply Chain Link" },
		kind: "entity",
		description: {
			zh: "供应链接点之间的连接抽象，支持物流、信息流、资金流",
			en: "Abstraction of connections between supply chain nodes, supporting logistics, information, and financial flows",
		},
		attributes: [
			{ ref: "scm:linkCode", identity: true, required: true },
			{ ref: "scm:linkType", required: true },
			{ ref: "scm:transportMode" },
			{ ref: "scm:avgLeadTime" },
			{ ref: "scm:costPerUnit" },
			{ ref: "scm:currency" },
			{ ref: "scm:supplyChainDistance" },
		],
		relations: [
			{ ref: "scm:connectsNodes" },
			{ ref: "scm:usedByRoute" },
			{ ref: "scm:hasCapacity" },
		],
		constraints: [],
		ui: { color: "#7986CB", icon: "link", group: "network" },
	},

	// ========== 风险事件类型 ==========
	{
		"@id": "scm:SupplyDisruption",
		"@type": "EntityType",
		label: { zh: "供应中断", en: "Supply Disruption" },
		kind: "event",
		description: {
			zh: "供应链中断风险事件，包括自然灾害、罢工、质量问题等",
			en: "Supply chain disruption risk events, including natural disasters, strikes, quality issues, etc.",
		},
		attributes: [
			{ ref: "scm:eventTimestamp", identity: true, required: true },
			{ ref: "scm:disruptionType", required: true },
			{ ref: "scm:severity", required: true },
			{ ref: "scm:affectedQty" },
			{ ref: "scm:estimatedRecovery" },
			{ ref: "scm:actualRecovery" },
			{ ref: "scm:financialImpact" },
		],
		relations: [
			{ ref: "scm:affectsSupplier" },
			{ ref: "scm:impactsProduct" },
			{ ref: "scm:disruptionImpactsOrder" },
			{ ref: "scm:mitigatedBy" },
		],
		constraints: [],
		ui: { color: "#EF5350", icon: "alert-triangle", group: "risk" },
	},

	// ========== 质量事件 ==========
	{
		"@id": "scm:QualityIssue",
		"@type": "EntityType",
		label: { zh: "质量问题", en: "Quality Issue" },
		kind: "event",
		description: {
			zh: "产品质量问题事件，包括缺陷、召回、检验失败等",
			en: "Product quality issue events, including defects, recalls, inspection failures, etc.",
		},
		attributes: [
			{ ref: "scm:eventTimestamp", identity: true, required: true },
			{ ref: "scm:issueType", required: true },
			{ ref: "scm:severity", required: true },
			{ ref: "scm:affectedBatchNo" },
			{ ref: "scm:defectRate" },
			{ ref: "scm:recallQty" },
			{ ref: "scm:rootCause" },
		],
		relations: [
			{ ref: "scm:affectsProduct" },
			{ ref: "scm:affectsBatch" },
			{ ref: "scm:detectedBy" },
			{ ref: "scm:resultsIn" },
		],
		constraints: [],
		ui: { color: "#FF7043", icon: "bug", group: "risk" },
	},

	// ========== 延迟事件 ==========
	{
		"@id": "scm:DelayEvent",
		"@type": "EntityType",
		label: { zh: "延迟事件", en: "Delay Event" },
		kind: "event",
		description: {
			zh: "供应链延迟事件，包括运输延迟、生产延迟、交付延迟等",
			en: "Supply chain delay events, including transportation, production, and delivery delays",
		},
		attributes: [
			{ ref: "scm:eventTimestamp", identity: true, required: true },
			{ ref: "scm:delayType", required: true },
			{ ref: "scm:delayDuration", required: true },
			{ ref: "scm:plannedTime" },
			{ ref: "scm:actualTime" },
			{ ref: "scm:delayReason" },
			{ ref: "scm:impactCost" },
		],
		relations: [
			{ ref: "scm:delaysShipment" },
			{ ref: "scm:delaysOrder" },
			{ ref: "scm:causedBy" },
			{ ref: "scm:affectsCustomer" },
		],
		constraints: [],
		ui: { color: "#FFA726", icon: "clock-alert", group: "risk" },
	},

	// ========== 绩效指标 ==========
	{
		"@id": "scm:PerformanceMetric",
		"@type": "EntityType",
		label: { zh: "绩效指标", en: "Performance Metric" },
		kind: "entity",
		description: {
			zh: "供应链绩效指标，支持 SCOR 模型的 5 大性能属性",
			en: "Supply chain performance metrics, supporting SCOR model's 5 performance attributes",
		},
		attributes: [
			{ ref: "scm:metricCode", identity: true, required: true },
			{ ref: "scm:metricName", required: true },
			{ ref: "scm:category", required: true },
			{ ref: "scm:value" },
			{ ref: "scm:target" },
			{ ref: "scm:unit" },
			{ ref: "scm:measurementPeriod" },
			{ ref: "scm:measurementTimestamp" },
		],
		relations: [
			{ ref: "scm:measuresEntity" },
			{ ref: "scm:belongsToCategory" },
			{ ref: "scm:aggregatesFrom" },
		],
		constraints: [],
		ui: { color: "#66BB6A", icon: "chart-line", group: "analytics" },
	},

	// ========== 绩效类别 ==========
	{
		"@id": "scm:PerformanceCategory",
		"@type": "EntityType",
		kind: "value",
		label: { zh: "绩效类别", en: "Performance Category" },
		description: {
			zh: "绩效指标分类，如可靠性、响应性、敏捷性、成本、资产管理",
			en: "Performance metric categories such as reliability, responsiveness, agility, cost, asset management",
		},
		attributes: [],
		relations: [],
		constraints: [],
	},
];
