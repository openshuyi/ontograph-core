import type { OntologyDefinition } from "../../types";
import { supplyChainActions } from "./actions";
import { advancedConcepts } from "./advanced-concepts";
import { advancedRelations } from "./advanced-relations";
import { attributes } from "./attributes";
import { bmsAttributes } from "./bms/attributes";
import { bmsEntityTypes } from "./bms/entities";
import { bmsEventTypes } from "./bms/events";
import { bmsRelationTypes } from "./bms/relations";
import { constraints } from "./constraints";
import { entityTypes } from "./entities";
import { epcisEventTypes } from "./epcis-events";
import { eventTypes } from "./events";
import { omsAttributes } from "./oms/attributes";
import { omsEntityTypes } from "./oms/entities";
import { omsEventTypes } from "./oms/events";
import { omsRelationTypes } from "./oms/relations";
import { relationTypes } from "./relations";
import { roleTypes } from "./roles";
import { sustainabilityEntities } from "./sustainability";
import { sustainabilityRelations } from "./sustainability-relations";
import { advancedTmsConcepts } from "./tms/advanced";
import { tmsAttributes } from "./tms/attributes";
import { tmsEntityTypes } from "./tms/entities";
import { tmsEventTypes } from "./tms/events";
import { enhancedTmsEvents } from "./tms/events-enhanced";
import { tmsRelationTypes } from "./tms/relations";
import { valueTypes } from "./value-types";
import { views } from "./views";
import { wmsAttributes } from "./wms/attributes";
import { wmsEntityTypes } from "./wms/entities";
import { wmsEventTypes } from "./wms/events";
import { wmsRelationTypes } from "./wms/relations";

export const supplyChainOntology: OntologyDefinition = {
	"@context": {
		ontograph: "https://ontograph.app/ontology/scm#",
		scm: "http://example.com/supplychain#",
		xsd: "http://www.w3.org/2001/XMLSchema#",
		epcis: "https://ref.gs1.org/standards/epcis/2.0.0/epcis-context.jsonld#",
		cbv: "https://ref.gs1.org/cbv/",
		sosa: "http://www.w3.org/ns/sosa/",
		ssn: "http://www.w3.org/ns/ssn/",
		gs1: "https://gs1.org/voc/",
	},
	"@id": "scm:SupplyChainOntology",
	"@type": "Ontology",
	version: "3.0.0",
	label: { zh: "供应链本体", en: "Supply Chain Ontology" },
	description: {
		zh: "供应链与物流领域综合本体模型，涵盖 TMS/WMS/OMS/BMS 四大子系统及组织、产品、设施、文档、事件、角色等核心概念",
		en: "Comprehensive ontology model for supply chain and logistics, covering TMS/WMS/OMS/BMS subsystems with organizations, products, facilities, documents, events, roles and cross-system relations",
	},
	entityTypes: [
		...entityTypes,
		...tmsEntityTypes,
		...wmsEntityTypes,
		...omsEntityTypes,
		...bmsEntityTypes,
		...advancedConcepts,
		...advancedTmsConcepts,
		...sustainabilityEntities,
	],
	eventTypes: [
		...eventTypes,
		...tmsEventTypes,
		...wmsEventTypes,
		...omsEventTypes,
		...bmsEventTypes,
		...enhancedTmsEvents,
		...epcisEventTypes,
	],
	roleTypes,
	relationTypes: [
		...relationTypes,
		...tmsRelationTypes,
		...wmsRelationTypes,
		...omsRelationTypes,
		...bmsRelationTypes,
		...advancedRelations,
		...sustainabilityRelations,
	],
	actionTypes: [...supplyChainActions],
	valueTypes: [
		...valueTypes,
		{
			"@id": "scm:VehicleStatus",
			"@type": "ValueType",
			label: { zh: "车辆状态", en: "Vehicle Status" },
			values: [
				"available",
				"in_transit",
				"maintenance",
				"out_of_service",
				"loading",
				"unloading",
			],
		},
		{
			"@id": "scm:FreightBillStatus",
			"@type": "ValueType",
			label: { zh: "运费账单状态", en: "Freight Bill Status" },
			values: [
				"draft",
				"submitted",
				"approved",
				"paid",
				"disputed",
				"cancelled",
			],
		},
		{
			"@id": "scm:WaveStatus",
			"@type": "ValueType",
			label: { zh: "波次状态", en: "Wave Status" },
			values: ["planned", "released", "in_progress", "completed", "cancelled"],
		},
		{
			"@id": "scm:CountStatus",
			"@type": "ValueType",
			label: { zh: "盘点状态", en: "Count Status" },
			values: [
				"pending",
				"in_progress",
				"completed",
				"variance_confirmed",
				"adjusted",
			],
		},
		{
			"@id": "scm:ReturnReason",
			"@type": "ValueType",
			label: { zh: "退货原因", en: "Return Reason" },
			values: [
				"defective",
				"wrong_item",
				"damaged",
				"not_as_described",
				"changed_mind",
				"late_delivery",
			],
		},
		{
			"@id": "scm:TicketStatus",
			"@type": "ValueType",
			label: { zh: "工单状态", en: "Ticket Status" },
			values: [
				"open",
				"in_progress",
				"waiting_customer",
				"resolved",
				"closed",
				"escalated",
			],
		},
		{
			"@id": "scm:InboundStatus",
			"@type": "ValueType",
			label: { zh: "入库状态", en: "Inbound Status" },
			values: [
				"expected",
				"arrived",
				"receiving",
				"received",
				"putaway",
				"completed",
				"cancelled",
			],
		},
		{
			"@id": "scm:ChargeType",
			"@type": "ValueType",
			label: { zh: "费用类型", en: "Charge Type" },
			values: [
				"freight",
				"storage",
				"handling",
				"fuel_surcharge",
				"accessorial",
				"demurrage",
				"insurance",
				"customs_duty",
				"tax",
			],
		},
		{
			"@id": "scm:TransportOrderStatus",
			"@type": "ValueType",
			label: { zh: "运输订单状态", en: "Transport Order Status" },
			values: [
				"draft",
				"confirmed",
				"assigned",
				"in_transit",
				"at_destination",
				"delivered",
				"exception",
				"cancelled",
			],
		},
		{
			"@id": "scm:FulfillmentStatus",
			"@type": "ValueType",
			label: { zh: "履约状态", en: "Fulfillment Status" },
			values: ["unfulfilled", "partially_fulfilled", "fulfilled", "cancelled"],
		},
	],
	attributes: [
		...attributes,
		...tmsAttributes,
		...wmsAttributes,
		...omsAttributes,
		...bmsAttributes,
	],
	constraints: [
		...constraints,
		{
			"@id": "scm:PositiveDistance",
			"@type": "Constraint",
			on: "scm:RouteSegment",
			rule: "distance >= 0",
			message: { zh: "距离不得为负", en: "Distance must not be negative" },
			severity: "error",
		},
		{
			"@id": "scm:PositiveDuration",
			"@type": "Constraint",
			on: "scm:RouteSegment",
			rule: "duration >= 0",
			message: { zh: "时长不得为负", en: "Duration must not be negative" },
			severity: "error",
		},
		{
			"@id": "scm:ValidUtilizationRate",
			"@type": "Constraint",
			on: "scm:LoadPlan",
			rule: "utilizationRate >= 0 AND utilizationRate <= 100",
			message: {
				zh: "利用率必须在0-100之间",
				en: "Utilization rate must be between 0-100",
			},
			severity: "warning",
		},
		{
			"@id": "scm:ValidTemperatureRange",
			"@type": "Constraint",
			on: "scm:StorageZone",
			rule: "temperatureMax >= temperatureMin",
			message: {
				zh: "最高温度必须大于等于最低温度",
				en: "Max temperature must be >= min temperature",
			},
			severity: "error",
		},
		{
			"@id": "scm:ValidHumidityRange",
			"@type": "Constraint",
			on: "scm:StorageZone",
			rule: "humidityMax >= humidityMin",
			message: {
				zh: "最高湿度必须大于等于最低湿度",
				en: "Max humidity must be >= min humidity",
			},
			severity: "error",
		},
		{
			"@id": "scm:PositiveATP",
			"@type": "Constraint",
			on: "scm:InventoryPromise",
			rule: "atpQty >= 0",
			message: {
				zh: "可承诺量不得为负",
				en: "ATP quantity must not be negative",
			},
			severity: "error",
		},
		{
			"@id": "scm:PositiveRefundAmount",
			"@type": "Constraint",
			on: "scm:RefundOrder",
			rule: "refundAmount >= 0",
			message: {
				zh: "退款金额不得为负",
				en: "Refund amount must not be negative",
			},
			severity: "error",
		},
		{
			"@id": "scm:PositiveCreditLimit",
			"@type": "Constraint",
			on: "scm:CreditAccount",
			rule: "creditLimit >= 0",
			message: {
				zh: "信用额度不得为负",
				en: "Credit limit must not be negative",
			},
			severity: "error",
		},
		{
			"@id": "scm:ValidTaxRate",
			"@type": "Constraint",
			on: "scm:TaxRule",
			rule: "taxRate >= 0 AND taxRate <= 100",
			message: {
				zh: "税率必须在0-100之间",
				en: "Tax rate must be between 0-100",
			},
			severity: "error",
		},
		{
			"@id": "scm:PositiveChargeAmount",
			"@type": "Constraint",
			on: "scm:CostItem",
			rule: "chargeAmount >= 0",
			message: {
				zh: "费用金额不得为负",
				en: "Charge amount must not be negative",
			},
			severity: "error",
		},
		{
			"@id": "scm:EffectiveDateRange",
			"@type": "Constraint",
			on: "scm:FreightRate",
			rule: "effectiveTo > effectiveFrom",
			message: {
				zh: "失效日期必须晚于生效日期",
				en: "Effective to must be after effective from",
			},
			severity: "warning",
		},
	],
	views: [
		...views,
		{
			"@id": "scm:TransportManagementView",
			"@type": "View",
			label: { zh: "运输管理视图", en: "Transport Management View" },
			layout: "hierarchical",
			filter: [
				{ type: "relation", property: "group", operator: "eq", value: "tms" },
			],
		},
		{
			"@id": "scm:WarehouseManagementView",
			"@type": "View",
			label: { zh: "仓库管理视图", en: "Warehouse Management View" },
			layout: "hierarchical",
			filter: [
				{ type: "relation", property: "group", operator: "eq", value: "wms" },
			],
		},
		{
			"@id": "scm:OrderManagementView",
			"@type": "View",
			label: { zh: "订单管理视图", en: "Order Management View" },
			layout: "hierarchical",
			forType: "scm:Order",
		},
		{
			"@id": "scm:BillingManagementView",
			"@type": "View",
			label: { zh: "计费管理视图", en: "Billing Management View" },
			layout: "grid",
			highlight: [
				{
					condition: "disputeStatus == 'open'",
					style: { color: "#FF1744", size: 30, opacity: 1.0 },
				},
				{
					condition: "paymentStatus == 'overdue'",
					style: { color: "#FF6D00", size: 25, opacity: 0.9 },
				},
			],
		},
		{
			"@id": "scm:CrossSystemFlowView",
			"@type": "View",
			label: { zh: "跨系统流程视图", en: "Cross-System Flow View" },
			layout: "force",
		},
	],
};
