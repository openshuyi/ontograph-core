import type { EntityType } from "../../../types";

/**
 * 先进 TMS 概念 - 参考 Oracle Transportation Management / SAP TM
 *
 * 包含：
 * 1. 运力管理 (Capacity Management)
 * 2. 路径优化 (Route Optimization)
 * 3. 承运商选择 (Carrier Selection)
 * 4. 运费审计 (Freight Audit)
 * 5. 运输可视性 (Transportation Visibility)
 */

export const advancedTmsConcepts: EntityType[] = [
	// ========== 运力预订 (Capacity Booking) ==========
	{
		"@id": "scm:CapacityBooking",
		"@type": "EntityType",
		label: { zh: "运力预订", en: "Capacity Booking" },
		kind: "entity",
		description: {
			zh: "向承运商预订运输容量，支持合同运力管理",
			en: "Book transportation capacity with carriers, supporting contract capacity management",
		},
		attributes: [
			{ ref: "scm:bookingNo", identity: true, required: true },
			{ ref: "scm:bookingDate", required: true },
			{ ref: "scm:capacityType" }, // FTL, LTL, Container
			{ ref: "scm:bookedCapacity" },
			{ ref: "scm:utilizedCapacity" },
			{ ref: "scm:bookingStatus" },
			{ ref: "scm:validFrom" },
			{ ref: "scm:validTo" },
		],
		relations: [
			{ ref: "scm:booksWithCarrier" },
			{ ref: "scm:forRoute" },
			{ ref: "scm:bookingUsedByTransport" },
		],
		constraints: [],
		ui: { color: "#00ACC1", icon: "booking", group: "capacity" },
	},

	// ========== 运输招标 (Transportation Tendering) ==========
	{
		"@id": "scm:TransportTender",
		"@type": "EntityType",
		label: { zh: "运输招标", en: "Transportation Tender" },
		kind: "entity",
		description: {
			zh: "向多个承运商发起运输投标，支持竞价和合同谈判",
			en: "Launch transportation bidding to multiple carriers, supporting bidding and contract negotiation",
		},
		attributes: [
			{ ref: "scm:tenderNo", identity: true, required: true },
			{ ref: "scm:tenderType" }, // Spot, Contract
			{ ref: "scm:tenderStatus" },
			{ ref: "scm:bidsReceived" },
			{ ref: "scm:selectedBid" },
			{ ref: "scm:tenderDate" },
			{ ref: "scm:awardDate" },
			{ ref: "scm:contractPeriod" },
		],
		relations: [
			{ ref: "scm:invitesCarrier" },
			{ ref: "scm:receivesBid" },
			{ ref: "scm:awardsToCarrier" },
			{ ref: "scm:forLane" },
		],
		constraints: [],
		ui: { color: "#673AB7", icon: "tender", group: "sourcing" },
	},

	// ========== 运输车道 (Transportation Lane) ==========
	{
		"@id": "scm:TransportationLane",
		"@type": "EntityType",
		label: { zh: "运输车道", en: "Transportation Lane" },
		kind: "entity",
		description: {
			zh: "定义的运输线路，包含起点、终点、承运商、费率等信息",
			en: "Defined transportation route with origin, destination, carrier, rate information",
		},
		attributes: [
			{ ref: "scm:laneCode", identity: true, required: true },
			{ ref: "scm:laneName" },
			{ ref: "scm:origin" },
			{ ref: "scm:destination" },
			{ ref: "scm:transportDistance" },
			{ ref: "scm:transitTime" },
			{ ref: "scm:frequency" },
			{ ref: "scm:serviceLevel" },
		],
		relations: [
			{ ref: "scm:servedByCarrier" },
			{ ref: "scm:hasRate" },
			{ ref: "scm:laneUsedByRoute" },
		],
		constraints: [],
		ui: { color: "#0097A7", icon: "lane", group: "network" },
	},

	// ========== 承运商绩效 (Carrier Performance) ==========
	{
		"@id": "scm:CarrierPerformance",
		"@type": "EntityType",
		label: { zh: "承运商绩效", en: "Carrier Performance" },
		kind: "entity",
		description: {
			zh: "承运商 KPI 评估，包括准时率、货损率、服务质量等",
			en: "Carrier KPI evaluation including on-time rate, damage rate, service quality",
		},
		attributes: [
			{ ref: "scm:performanceNo", identity: true, required: true },
			{ ref: "scm:evaluationPeriod" },
			{ ref: "scm:onTimeRate" },
			{ ref: "scm:damageRate" },
			{ ref: "scm:claimRate" },
			{ ref: "scm:costPerformance" },
			{ ref: "scm:serviceScore" },
			{ ref: "scm:overallScore" },
			{ ref: "scm:rating" }, // A, B, C, D
		],
		relations: [
			{ ref: "scm:evaluatesCarrier" },
			{ ref: "scm:meetsSLA" },
			{ ref: "scm:impactsSelection" },
		],
		constraints: [],
		ui: { color: "#FF9800", icon: "performance", group: "analytics" },
	},

	// ========== 路径优化方案 (Route Optimization Plan) ==========
	{
		"@id": "scm:RouteOptimizationPlan",
		"@type": "EntityType",
		label: { zh: "路径优化方案", en: "Route Optimization Plan" },
		kind: "entity",
		description: {
			zh: "运输路径优化方案，支持多目标优化（成本、时效、碳排放）",
			en: "Transportation route optimization plan supporting multi-objective optimization (cost, time, carbon)",
		},
		attributes: [
			{ ref: "scm:optimizationNo", identity: true, required: true },
			{ ref: "scm:optimizationDate" },
			{ ref: "scm:optimizationObjective" }, // Cost, Time, Carbon
			{ ref: "scm:optimizedCost" },
			{ ref: "scm:baselineCost" },
			{ ref: "scm:savingsPercent" },
			{ ref: "scm:algorithmUsed" },
			{ ref: "scm:constraints" },
		],
		relations: [
			{ ref: "scm:optimizesRoute" },
			{ ref: "scm:comparesToBaseline" },
			{ ref: "scm:recommendsCarrier" },
		],
		constraints: [],
		ui: { color: "#4CAF50", icon: "optimization", group: "planning" },
	},

	// ========== 运费审计 (Freight Audit) ==========
	{
		"@id": "scm:FreightAudit",
		"@type": "EntityType",
		label: { zh: "运费审计", en: "Freight Audit" },
		kind: "entity",
		description: {
			zh: "运费账单审计，验证计费准确性，处理差异和争议",
			en: "Freight bill audit, verifying billing accuracy, handling discrepancies and disputes",
		},
		attributes: [
			{ ref: "scm:auditNo", identity: true, required: true },
			{ ref: "scm:auditDate" },
			{ ref: "scm:auditStatus" },
			{ ref: "scm:billedAmount" },
			{ ref: "scm:auditedAmount" },
			{ ref: "scm:discrepancyAmount" },
			{ ref: "scm:discrepancyReason" },
			{ ref: "scm:adjustmentAmount" },
		],
		relations: [
			{ ref: "scm:auditsBill" },
			{ ref: "scm:comparesToContract" },
			{ ref: "scm:createsDispute" },
			{ ref: "scm:approvesPayment" },
		],
		constraints: [],
		ui: { color: "#F44336", icon: "audit", group: "finance" },
	},

	// ========== 运输可视性事件 (Transportation Visibility Event) ==========
	{
		"@id": "scm:VisibilityEvent",
		"@type": "EntityType",
		label: { zh: "运输可视性事件", en: "Transportation Visibility Event" },
		kind: "event",
		description: {
			zh: "实时运输追踪事件，支持 IoT 设备数据集成",
			en: "Real-time transportation tracking event, supporting IoT device data integration",
		},
		attributes: [
			{ ref: "scm:eventTimestamp", identity: true, required: true },
			{ ref: "scm:eventType" }, // Location Update, Temperature, Shock, Geofence
			{ ref: "scm:latitude" },
			{ ref: "scm:longitude" },
			{ ref: "scm:altitude" },
			{ ref: "scm:speed" },
			{ ref: "scm:heading" },
			{ ref: "scm:temperature" },
			{ ref: "scm:humidity" },
			{ ref: "scm:shockLevel" },
			{ ref: "scm:geofenceStatus" },
			{ ref: "scm:deviceNo" },
		],
		relations: [
			{ ref: "scm:tracksShipment" },
			{ ref: "scm:fromDevice" },
			{ ref: "scm:triggersAlert" },
		],
		constraints: [],
		ui: { color: "#2196F3", icon: "visibility", group: "tracking" },
	},

	// ========== 运输异常 (Transportation Exception) ==========
	{
		"@id": "scm:TransportationException",
		"@type": "EntityType",
		label: { zh: "运输异常", en: "Transportation Exception" },
		kind: "event",
		description: {
			zh: "运输过程中的异常事件，需要人工干预或自动处理",
			en: "Exception events during transportation requiring manual intervention or automated handling",
		},
		attributes: [
			{ ref: "scm:exceptionNo", identity: true, required: true },
			{ ref: "scm:eventTimestamp", identity: true, required: true },
			{ ref: "scm:exceptionType" }, // Delay, Damage, Lost, Route Deviation, Temperature Excursion
			{ ref: "scm:severity" },
			{ ref: "scm:exceptionStatus" },
			{ ref: "scm:description" },
			{ ref: "scm:rootCause" },
			{ ref: "scm:impactCost" },
			{ ref: "scm:resolutionAction" },
			{ ref: "scm:exceptionResolvedAt" },
		],
		relations: [
			{ ref: "scm:affectsShipment" },
			{ ref: "scm:notifiedTo" },
			{ ref: "scm:requiresAction" },
			{ ref: "scm:resolvesWith" },
		],
		constraints: [],
		ui: { color: "#E53935", icon: "exception", group: "exceptions" },
	},

	// ========== 碳排放记录 (Carbon Emission Record) ==========
	{
		"@id": "scm:CarbonEmissionRecord",
		"@type": "EntityType",
		label: { zh: "碳排放记录", en: "Carbon Emission Record" },
		kind: "entity",
		description: {
			zh: "运输活动碳排放记录，支持 Scope 3 排放报告",
			en: "Transportation carbon emission record, supporting Scope 3 emission reporting",
		},
		attributes: [
			{ ref: "scm:emissionNo", identity: true, required: true },
			{ ref: "scm:calculationDate" },
			{ ref: "scm:emissionScope" }, // Scope 1, Scope 2, Scope 3
			{ ref: "scm:co2EmissionKg" },
			{ ref: "scm:ch4EmissionKg" },
			{ ref: "scm:n2oEmissionKg" },
			{ ref: "scm:co2eTotal" },
			{ ref: "scm:calculationMethod" }, // GLEC, ISO 14083
			{ ref: "scm:emissionFactor" },
		],
		relations: [
			{ ref: "scm:fromShipment" },
			{ ref: "scm:usesVehicle" },
			{ ref: "scm:carbonReportedTo" },
		],
		constraints: [],
		ui: { color: "#43A047", icon: "carbon", group: "sustainability" },
	},
];
