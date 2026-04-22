import type { ActionType } from "../../types";

/**
 * CreatePurchaseOrder - 创建采购订单
 * 向供应商发起采购订单，明确采购的物品、数量、价格和交货要求
 */
export const CreatePurchaseOrder: ActionType = {
	"@id": "sc:CreatePurchaseOrder",
	"@type": "ActionType",
	label: { zh: "创建采购订单", en: "Create Purchase Order" },
	description: {
		zh: "向供应商发起采购订单，明确采购的物品、数量、价格和交货要求",
		en: "Initiate a purchase order to supplier specifying items, quantities, prices and delivery requirements",
	},
	parameters: [
		{
			name: "supplier",
			label: { zh: "供应商", en: "Supplier" },
			type: "ref",
			required: true,
			description: {
				zh: "选择供应商",
				en: "Select supplier",
			},
		},
		{
			name: "items",
			label: { zh: "采购明细", en: "Purchase Items" },
			type: "array",
			required: true,
			description: {
				zh: "采购物品列表，包含物料ID、数量和单价",
				en: "List of purchase items including material ID, quantity and unit price",
			},
		},
		{
			name: "amount",
			label: { zh: "总金额", en: "Total Amount" },
			type: "float",
			required: true,
			validation: [
				{
					type: "min",
					value: 0,
					message: { zh: "金额必须大于0", en: "Amount must be greater than 0" },
				},
			],
			description: {
				zh: "采购订单总金额",
				en: "Total amount of purchase order",
			},
		},
		{
			name: "expectedDeliveryDate",
			label: { zh: "期望交货日期", en: "Expected Delivery Date" },
			type: "date",
			required: false,
			description: {
				zh: "期望供应商交货的日期",
				en: "Expected delivery date from supplier",
			},
		},
		{
			name: "warehouse",
			label: { zh: "目标仓库", en: "Target Warehouse" },
			type: "ref",
			required: false,
			description: {
				zh: "货物送达的目标仓库",
				en: "Target warehouse for goods delivery",
			},
		},
	],
	targetTypes: ["scm:Supplier"],
	sideEffects: [
		{
			type: "stateChange",
			config: {
				newStatus: "pending_approval",
				entityType: "scm:PurchaseOrder",
			},
			description: {
				zh: "创建待审批的采购订单记录",
				en: "Create purchase order record with pending approval status",
			},
		},
		{
			type: "emitEvent",
			config: { eventType: "scm:PurchaseOrderCreated" },
			description: {
				zh: "触发采购订单创建事件",
				en: "Trigger purchase order created event",
			},
		},
	],
	approvalPolicy: {
		required: true,
		approvers: ["scm:PurchasingManager"],
		timeout: 86400000,
	},
	auditConfig: {
		enabled: true,
		logLevel: "full",
		retentionDays: 1825,
	},
	tags: ["procurement", "order", "supplier", "approval"],
};

/**
 * RerouteShipment - 改航线
 * 在运输过程中修改运输路线，通常应对运输异常或优化运输成本
 */
export const RerouteShipment: ActionType = {
	"@id": "sc:RerouteShipment",
	"@type": "ActionType",
	label: { zh: "改航线", en: "Reroute Shipment" },
	description: {
		zh: "在运输过程中修改运输路线，通常应对运输异常或优化运输成本",
		en: "Modify transportation route during transit, typically to handle exceptions or optimize costs",
	},
	parameters: [
		{
			name: "shipment",
			label: { zh: "运输单号", en: "Shipment ID" },
			type: "ref",
			required: true,
			description: {
				zh: "需要改航线的运输单",
				en: "Shipment that needs route change",
			},
		},
		{
			name: "newRoute",
			label: { zh: "新路线", en: "New Route" },
			type: "array",
			required: true,
			description: {
				zh: "新的运输路线点列表",
				en: "List of new route waypoints",
			},
		},
		{
			name: "reason",
			label: { zh: "改航线原因", en: "Reroute Reason" },
			type: "string",
			required: true,
			description: {
				zh: "改航线的原因说明",
				en: "Reason for route change",
			},
		},
		{
			name: "additionalCost",
			label: { zh: "额外费用", en: "Additional Cost" },
			type: "float",
			required: false,
			validation: [
				{
					type: "min",
					value: 0,
					message: { zh: "费用不能为负", en: "Cost cannot be negative" },
				},
			],
			description: {
				zh: "改航线产生的额外费用",
				en: "Additional cost incurred by rerouting",
			},
		},
	],
	targetTypes: ["scm:TransportOrder"],
	sideEffects: [
		{
			type: "stateChange",
			config: { newStatus: "rerouted", entityType: "scm:TransportOrder" },
			description: {
				zh: "更新运输单状态为已改航",
				en: "Update transport order status to rerouted",
			},
		},
		{
			type: "notification",
			config: {
				recipients: ["scm:LogisticsCoordinator", "scm:Driver"],
				channel: "sms",
			},
			description: {
				zh: "通知物流协调员和司机路线变更",
				en: "Notify logistics coordinator and driver about route change",
			},
		},
	],
	approvalPolicy: {
		required: true,
		approvers: ["scm:LogisticsManager"],
		autoApproveConditions: ["additionalCost <= 0", "reason includes 'weather'"],
		timeout: 43200000,
	},
	auditConfig: {
		enabled: true,
		logLevel: "full",
		retentionDays: 730,
	},
	tags: ["transport", "logistics", "route", "exception"],
};

/**
 * AdjustProductionSchedule - 调整生产计划
 * 修改生产排程，调整生产优先级、产能分配或生产时间
 */
export const AdjustProductionSchedule: ActionType = {
	"@id": "sc:AdjustProductionSchedule",
	"@type": "ActionType",
	label: { zh: "调整生产计划", en: "Adjust Production Schedule" },
	description: {
		zh: "修改生产排程，调整生产优先级、产能分配或生产时间",
		en: "Modify production schedule, adjusting priorities, capacity allocation or production timing",
	},
	parameters: [
		{
			name: "productionOrder",
			label: { zh: "生产订单", en: "Production Order" },
			type: "ref",
			required: true,
			description: {
				zh: "需要调整的生产订单",
				en: "Production order to adjust",
			},
		},
		{
			name: "newPriority",
			label: { zh: "新优先级", en: "New Priority" },
			type: "integer",
			required: true,
			validation: [
				{
					type: "min",
					value: 1,
					message: {
						zh: "优先级必须至少为1",
						en: "Priority must be at least 1",
					},
				},
				{
					type: "max",
					value: 10,
					message: { zh: "优先级不能超过10", en: "Priority cannot exceed 10" },
				},
			],
			description: {
				zh: "新的生产优先级，1最高，10最低",
				en: "New production priority, 1 is highest, 10 is lowest",
			},
		},
		{
			name: "adjustmentType",
			label: { zh: "调整类型", en: "Adjustment Type" },
			type: "string",
			required: true,
			defaultValue: "priority_change",
			description: {
				zh: "调整类型：优先级变更/产能重新分配/时间延期",
				en: "Adjustment type: priority change/capacity reallocation/timeline delay",
			},
		},
		{
			name: "reason",
			label: { zh: "调整原因", en: "Adjustment Reason" },
			type: "string",
			required: false,
			description: {
				zh: "调整生产计划的原因",
				en: "Reason for production schedule adjustment",
			},
		},
		{
			name: "newStartDate",
			label: { zh: "新开始日期", en: "New Start Date" },
			type: "date",
			required: false,
			description: {
				zh: "新的生产开始日期",
				en: "New production start date",
			},
		},
	],
	targetTypes: ["scm:ProductionOrder"],
	sideEffects: [
		{
			type: "stateChange",
			config: { newStatus: "rescheduled", entityType: "scm:ProductionOrder" },
			description: {
				zh: "更新生产订单状态为已重新排程",
				en: "Update production order status to rescheduled",
			},
		},
		{
			type: "webhook",
			config: { endpoint: "/api/production/schedule-updated", method: "POST" },
			description: {
				zh: "通知生产排程系统更新",
				en: "Notify production scheduling system of update",
			},
		},
	],
	approvalPolicy: {
		required: true,
		approvers: ["scm:ProductionManager"],
		autoApproveConditions: [
			"adjustmentType == 'priority_change'",
			"newPriority < currentPriority",
		],
		timeout: 86400000,
	},
	auditConfig: {
		enabled: true,
		logLevel: "full",
		retentionDays: 1095,
	},
	tags: ["production", "schedule", "priority", "capacity"],
};

/**
 * ReallocateInventory - 调拨库存
 * 在仓库间或仓库内移动库存，以满足需求平衡或优化仓储
 */
export const ReallocateInventory: ActionType = {
	"@id": "sc:ReallocateInventory",
	"@type": "ActionType",
	label: { zh: "调拨库存", en: "Reallocate Inventory" },
	description: {
		zh: "在仓库间或仓库内移动库存，以满足需求平衡或优化仓储",
		en: "Move inventory between warehouses or within a warehouse to balance demand or optimize storage",
	},
	parameters: [
		{
			name: "sourceWarehouse",
			label: { zh: "源仓库", en: "Source Warehouse" },
			type: "ref",
			required: true,
			description: {
				zh: "调出的仓库",
				en: "Source warehouse for inventory",
			},
		},
		{
			name: "targetWarehouse",
			label: { zh: "目标仓库", en: "Target Warehouse" },
			type: "ref",
			required: true,
			description: {
				zh: "调入的仓库",
				en: "Target warehouse for inventory",
			},
		},
		{
			name: "items",
			label: { zh: "调拨明细", en: "Reallocation Items" },
			type: "array",
			required: true,
			description: {
				zh: "调拨物品列表，包含物料ID和数量",
				en: "List of items to reallocate including material ID and quantity",
			},
		},
		{
			name: "reason",
			label: { zh: "调拨原因", en: "Reallocation Reason" },
			type: "string",
			required: false,
			description: {
				zh: "调拨库存的原因",
				en: "Reason for inventory reallocation",
			},
		},
		{
			name: "priority",
			label: { zh: "优先级", en: "Priority" },
			type: "integer",
			required: false,
			defaultValue: 3,
			validation: [
				{
					type: "min",
					value: 1,
					message: {
						zh: "优先级必须至少为1",
						en: "Priority must be at least 1",
					},
				},
				{
					type: "max",
					value: 5,
					message: { zh: "优先级不能超过5", en: "Priority cannot exceed 5" },
				},
			],
			description: {
				zh: "调拨优先级，1最高",
				en: "Reallocation priority, 1 is highest",
			},
		},
	],
	targetTypes: ["scm:Inventory", "scm:Warehouse"],
	sideEffects: [
		{
			type: "stateChange",
			config: { action: "decrease", entityType: "scm:Inventory" },
			description: {
				zh: "减少源仓库库存",
				en: "Decrease source warehouse inventory",
			},
		},
		{
			type: "stateChange",
			config: { action: "increase", entityType: "scm:Inventory" },
			description: {
				zh: "增加目标仓库库存",
				en: "Increase target warehouse inventory",
			},
		},
		{
			type: "emitEvent",
			config: { eventType: "scm:InventoryReallocation" },
			description: {
				zh: "触发库存调拨事件",
				en: "Trigger inventory reallocation event",
			},
		},
	],
	approvalPolicy: {
		required: false,
		autoApproveConditions: [
			"priority <= 3",
			"sourceWarehouse == targetWarehouse",
		],
	},
	auditConfig: {
		enabled: true,
		logLevel: "full",
		retentionDays: 365,
	},
	tags: ["inventory", "warehouse", "reallocation", "logistics"],
};

/**
 * FlagSupplierRisk - 标记供应商风险
 * 识别并标记供应商风险等级，触发风险管理流程
 */
export const FlagSupplierRisk: ActionType = {
	"@id": "sc:FlagSupplierRisk",
	"@type": "ActionType",
	label: { zh: "标记供应商风险", en: "Flag Supplier Risk" },
	description: {
		zh: "识别并标记供应商风险等级，触发风险管理流程",
		en: "Identify and mark supplier risk level, trigger risk management process",
	},
	parameters: [
		{
			name: "supplier",
			label: { zh: "供应商", en: "Supplier" },
			type: "ref",
			required: true,
			description: {
				zh: "需要标记风险的供应商",
				en: "Supplier to flag for risk",
			},
		},
		{
			name: "riskLevel",
			label: { zh: "风险等级", en: "Risk Level" },
			type: "string",
			required: true,
			validation: [
				{
					type: "custom",
					value: "value in ['low', 'medium', 'high', 'critical']",
					message: {
						zh: "风险等级必须是 low/medium/high/critical",
						en: "Risk level must be low/medium/high/critical",
					},
				},
			],
			description: {
				zh: "供应商风险等级",
				en: "Supplier risk level",
			},
		},
		{
			name: "riskType",
			label: { zh: "风险类型", en: "Risk Type" },
			type: "string",
			required: true,
			description: {
				zh: "风险类型：质量/交付/财务/合规/其他",
				en: "Risk type: quality/delivery/financial/compliance/other",
			},
		},
		{
			name: "description",
			label: { zh: "风险描述", en: "Risk Description" },
			type: "string",
			required: true,
			description: {
				zh: "详细描述风险情况",
				en: "Detailed description of risk",
			},
		},
		{
			name: "evidence",
			label: { zh: "证据", en: "Evidence" },
			type: "string",
			required: false,
			description: {
				zh: "支撑风险标记的证据或文档",
				en: "Evidence or documents supporting risk flag",
			},
		},
		{
			name: "mitigationPlan",
			label: { zh: "缓解计划", en: "Mitigation Plan" },
			type: "string",
			required: false,
			description: {
				zh: "风险缓解计划",
				en: "Risk mitigation plan",
			},
		},
	],
	targetTypes: ["scm:Supplier"],
	sideEffects: [
		{
			type: "stateChange",
			config: { property: "riskLevel", entityType: "scm:Supplier" },
			description: {
				zh: "更新供应商风险等级",
				en: "Update supplier risk level",
			},
		},
		{
			type: "notification",
			config: {
				recipients: ["scm:ProcurementManager", "scm:RiskManager"],
				channel: "email",
				priority: "high",
			},
			description: {
				zh: "通知采购经理和风险经理",
				en: "Notify procurement manager and risk manager",
			},
		},
		{
			type: "emitEvent",
			config: { eventType: "scm:SupplierRiskFlagged" },
			description: {
				zh: "触发供应商风险标记事件",
				en: "Trigger supplier risk flagged event",
			},
		},
	],
	approvalPolicy: {
		required: false,
		autoApproveConditions: ["riskLevel != 'critical'"],
	},
	auditConfig: {
		enabled: true,
		logLevel: "full",
		retentionDays: 1825,
	},
	tags: ["risk", "supplier", "compliance", "procurement"],
};

/**
 * TriggerContingency - 触发应急预案
 * 当发生重大供应链中断时触发应急响应流程
 */
export const TriggerContingency: ActionType = {
	"@id": "sc:TriggerContingency",
	"@type": "ActionType",
	label: { zh: "触发应急预案", en: "Trigger Contingency" },
	description: {
		zh: "当发生重大供应链中断时触发应急响应流程",
		en: "Trigger emergency response process when major supply chain disruption occurs",
	},
	parameters: [
		{
			name: "incidentType",
			label: { zh: "事件类型", en: "Incident Type" },
			type: "string",
			required: true,
			validation: [
				{
					type: "custom",
					value:
						"value in ['natural_disaster', 'supplier_bankruptcy', 'transport_disruption', 'pandemic', 'geopolitical', 'cyberattack', 'other']",
					message: {
						zh: "事件类型必须符合预定义列表",
						en: "Incident type must be one of predefined values",
					},
				},
			],
			description: {
				zh: "中断事件类型",
				en: "Type of disruption incident",
			},
		},
		{
			name: "severity",
			label: { zh: "严重程度", en: "Severity" },
			type: "string",
			required: true,
			validation: [
				{
					type: "custom",
					value: "value in ['minor', 'moderate', 'major', 'critical']",
					message: {
						zh: "严重程度必须是 minor/moderate/major/critical",
						en: "Severity must be minor/moderate/major/critical",
					},
				},
			],
			description: {
				zh: "事件严重程度",
				en: "Incident severity",
			},
		},
		{
			name: "affectedEntities",
			label: { zh: "受影响实体", en: "Affected Entities" },
			type: "array",
			required: true,
			description: {
				zh: "受影响的供应商、仓库、运输路线等",
				en: "Affected suppliers, warehouses, transport routes etc.",
			},
		},
		{
			name: "description",
			label: { zh: "事件描述", en: "Incident Description" },
			type: "string",
			required: true,
			description: {
				zh: "详细描述中断事件",
				en: "Detailed description of disruption incident",
			},
		},
		{
			name: "estimatedImpact",
			label: { zh: "预估影响", en: "Estimated Impact" },
			type: "string",
			required: false,
			description: {
				zh: "预估对供应链的影响范围和程度",
				en: "Estimated impact scope and degree on supply chain",
			},
		},
		{
			name: "contingencyPlan",
			label: { zh: "应急方案", en: "Contingency Plan" },
			type: "ref",
			required: false,
			description: {
				zh: "选择预先定义的应急方案",
				en: "Select predefined contingency plan",
			},
		},
	],
	sideEffects: [
		{
			type: "stateChange",
			config: {
				entityType: "scm:ContingencyIncident",
				property: "status",
				value: "active",
			},
			description: {
				zh: "创建并激活应急预案事件",
				en: "Create and activate contingency incident",
			},
		},
		{
			type: "notification",
			config: {
				recipients: [
					"scm:SupplyChainDirector",
					"scm:RiskManager",
					"scm:IncidentResponseTeam",
				],
				channel: "all",
				priority: "critical",
			},
			description: {
				zh: "紧急通知供应链总监、风险经理和应急响应团队",
				en: "Emergency notification to supply chain director, risk manager and incident response team",
			},
		},
		{
			type: "webhook",
			config: {
				endpoint: "/api/incidents/emergency",
				method: "POST",
				priority: "high",
			},
			description: {
				zh: "触发应急事件API",
				en: "Trigger emergency incident API",
			},
		},
	],
	approvalPolicy: {
		required: true,
		approvers: ["scm:SupplyChainDirector"],
		timeout: 3600000,
	},
	auditConfig: {
		enabled: true,
		logLevel: "full",
		retentionDays: 3650,
	},
	tags: ["emergency", "contingency", "risk", "disruption", "critical"],
};

/**
 * SyncToERP - 同步到ERP
 * 将供应链数据同步到企业ERP系统
 */
export const SyncToERP: ActionType = {
	"@id": "sc:SyncToERP",
	"@type": "ActionType",
	label: { zh: "同步到ERP", en: "Sync to ERP" },
	description: {
		zh: "将供应链数据同步到企业ERP系统",
		en: "Sync supply chain data to enterprise ERP system",
	},
	parameters: [
		{
			name: "dataType",
			label: { zh: "数据类型", en: "Data Type" },
			type: "string",
			required: true,
			validation: [
				{
					type: "custom",
					value:
						"value in ['purchase_order', 'inventory', 'shipment', 'invoice', 'all']",
					message: {
						zh: "数据类型必须是 purchase_order/inventory/shipment/invoice/all",
						en: "Data type must be purchase_order/inventory/shipment/invoice/all",
					},
				},
			],
			description: {
				zh: "要同步的数据类型",
				en: "Type of data to sync",
			},
		},
		{
			name: "entityIds",
			label: { zh: "实体ID列表", en: "Entity IDs" },
			type: "array",
			required: false,
			description: {
				zh: "要同步的实体ID列表，不传则同步所有",
				en: "List of entity IDs to sync, sync all if not provided",
			},
		},
		{
			name: "syncMode",
			label: { zh: "同步模式", en: "Sync Mode" },
			type: "string",
			required: false,
			defaultValue: "incremental",
			validation: [
				{
					type: "custom",
					value: "value in ['full', 'incremental', 'delta']",
					message: {
						zh: "同步模式必须是 full/incremental/delta",
						en: "Sync mode must be full/incremental/delta",
					},
				},
			],
			description: {
				zh: "同步模式：全量/增量/增量变更",
				en: "Sync mode: full/incremental/delta",
			},
		},
	],
	sideEffects: [
		{
			type: "webhook",
			config: {
				endpoint: "/api/erp/sync",
				method: "POST",
				retries: 3,
			},
			description: {
				zh: "调用ERP同步API",
				en: "Call ERP sync API",
			},
		},
		{
			type: "stateChange",
			config: {
				entityType: "scm:SyncRecord",
				property: "status",
				value: "synced",
			},
			description: {
				zh: "创建同步记录",
				en: "Create sync record",
			},
		},
	],
	approvalPolicy: {
		required: false,
	},
	auditConfig: {
		enabled: true,
		logLevel: "minimal",
		retentionDays: 180,
	},
	tags: ["integration", "erp", "sync", "data"],
};

/**
 * Supply chain action types collection
 * 包含所有供应链相关的可执行操作类型
 */
export const supplyChainActions: ActionType[] = [
	CreatePurchaseOrder,
	RerouteShipment,
	AdjustProductionSchedule,
	ReallocateInventory,
	FlagSupplierRisk,
	TriggerContingency,
	SyncToERP,
];
