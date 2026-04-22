import type { EntityType } from "../../types";

/**
 * EPCIS 2.0 事件类型 - 参考 GS1 EPCIS 2.0 (ISO/IEC 19987)
 *
 * 5 种核心事件类型:
 * 1. ObjectEvent - 对象事件 (观测/聚合对象)
 * 2. AggregationEvent - 聚合事件 (组装/拆解)
 * 3. TransactionEvent - 交易事件 (关联业务交易)
 * 4. TransformationEvent - 转化事件 (输入→输出转化)
 * 5. AssociationEvent - 关联事件 (对象关联)
 *
 * 每种事件具有 5 维度模型: What, When, Where, Why, How
 */

export const epcisEventTypes: EntityType[] = [
	// ========== ObjectEvent (对象事件) ==========
	{
		"@id": "scm:ObjectEvent",
		"@type": "EntityType",
		label: { zh: "对象事件", en: "Object Event" },
		kind: "event",
		description: {
			zh: "EPCIS 对象事件，记录对物理/数字对象的观测（如扫描、识读、检验）",
			en: "EPCIS Object Event, records observations of physical/digital objects (e.g., scan, read, inspect)",
		},
		attributes: [
			{ ref: "scm:eventTimestamp", identity: true, required: true },
			{ ref: "scm:eventType", required: true },
			{ ref: "scm:action" },
			{ ref: "scm:bizStep" },
			{ ref: "scm:disposition" },
			{ ref: "scm:readPoint" },
			{ ref: "scm:bizLocation" },
		],
		relations: [
			{ ref: "scm:epcisWhat" },
			{ ref: "scm:epcisWhen" },
			{ ref: "scm:epcisWhere" },
			{ ref: "scm:epcisWhy" },
			{ ref: "scm:epcisHow" },
		],
		constraints: [],
		ui: { color: "#1565C0", icon: "eye", group: "epcis" },
	},

	// ========== AggregationEvent (聚合事件) ==========
	{
		"@id": "scm:AggregationEvent",
		"@type": "EntityType",
		label: { zh: "聚合事件", en: "Aggregation Event" },
		kind: "event",
		description: {
			zh: "EPCIS 聚合事件，记录对象的组装或拆解（如装箱、拆箱、码垛）",
			en: "EPCIS Aggregation Event, records assembly or disassembly of objects (e.g., pack, unpack, palletize)",
		},
		attributes: [
			{ ref: "scm:eventTimestamp", identity: true, required: true },
			{ ref: "scm:eventType", required: true },
			{ ref: "scm:action" },
			{ ref: "scm:bizStep" },
			{ ref: "scm:disposition" },
			{ ref: "scm:readPoint" },
			{ ref: "scm:bizLocation" },
			{ ref: "scm:parentID" },
		],
		relations: [
			{ ref: "scm:epcisWhat" },
			{ ref: "scm:epcisWhen" },
			{ ref: "scm:epcisWhere" },
			{ ref: "scm:epcisWhy" },
		],
		constraints: [],
		ui: { color: "#0D47A1", icon: "package-variant", group: "epcis" },
	},

	// ========== TransactionEvent (交易事件) ==========
	{
		"@id": "scm:TransactionEvent",
		"@type": "EntityType",
		label: { zh: "交易事件", en: "Transaction Event" },
		kind: "event",
		description: {
			zh: "EPCIS 交易事件，将对象与业务交易关联（如订单、发货单、收据）",
			en: "EPCIS Transaction Event, associates objects with business transactions (e.g., order, shipment, receipt)",
		},
		attributes: [
			{ ref: "scm:eventTimestamp", identity: true, required: true },
			{ ref: "scm:eventType", required: true },
			{ ref: "scm:action" },
			{ ref: "scm:bizStep" },
			{ ref: "scm:disposition" },
			{ ref: "scm:readPoint" },
			{ ref: "scm:bizLocation" },
			{ ref: "scm:transactionType" },
			{ ref: "scm:transactionID" },
		],
		relations: [
			{ ref: "scm:epcisWhat" },
			{ ref: "scm:epcisWhen" },
			{ ref: "scm:epcisWhere" },
			{ ref: "scm:epcisWhy" },
		],
		constraints: [],
		ui: { color: "#2E7D32", icon: "swap-horizontal", group: "epcis" },
	},

	// ========== TransformationEvent (转化事件) ==========
	{
		"@id": "scm:TransformationEvent",
		"@type": "EntityType",
		label: { zh: "转化事件", en: "Transformation Event" },
		kind: "event",
		description: {
			zh: "EPCIS 转化事件，记录输入对象到输出对象的转化（如制造、加工、组装）",
			en: "EPCIS Transformation Event, records conversion of input objects to output objects (e.g., manufacture, process, assemble)",
		},
		attributes: [
			{ ref: "scm:eventTimestamp", identity: true, required: true },
			{ ref: "scm:eventType", required: true },
			{ ref: "scm:bizStep" },
			{ ref: "scm:disposition" },
			{ ref: "scm:readPoint" },
			{ ref: "scm:bizLocation" },
		],
		relations: [
			{ ref: "scm:epcisWhat" },
			{ ref: "scm:epcisWhen" },
			{ ref: "scm:epcisWhere" },
			{ ref: "scm:epcisWhy" },
			{ ref: "scm:epcisHow" },
			{ ref: "scm:inputQuantity" },
			{ ref: "scm:outputQuantity" },
		],
		constraints: [],
		ui: { color: "#E65100", icon: "transfer", group: "epcis" },
	},

	// ========== AssociationEvent (关联事件) ==========
	{
		"@id": "scm:AssociationEvent",
		"@type": "EntityType",
		label: { zh: "关联事件", en: "Association Event" },
		kind: "event",
		description: {
			zh: "EPCIS 关联事件，记录对象间的关联关系（如传感器绑定到货物）",
			en: "EPCIS Association Event, records associations between objects (e.g., sensor binding to cargo)",
		},
		attributes: [
			{ ref: "scm:eventTimestamp", identity: true, required: true },
			{ ref: "scm:eventType", required: true },
			{ ref: "scm:action" },
			{ ref: "scm:bizStep" },
			{ ref: "scm:disposition" },
			{ ref: "scm:readPoint" },
			{ ref: "scm:bizLocation" },
		],
		relations: [
			{ ref: "scm:epcisWhat" },
			{ ref: "scm:epcisWhen" },
			{ ref: "scm:epcisWhere" },
			{ ref: "scm:epcisWhy" },
			{ ref: "scm:epcisHow" },
		],
		constraints: [],
		ui: { color: "#6A1B9A", icon: "link-variant", group: "epcis" },
	},
];
