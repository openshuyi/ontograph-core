import type { EntityType } from "../../../types";

export const omsEventTypes: EntityType[] = [
	{
		"@id": "scm:OrderAllocated",
		"@type": "EntityType",
		label: { zh: "订单分配", en: "Order Allocated" },
		kind: "event",
		attributes: [
			{ ref: "scm:eventTimestamp", identity: true, required: true },
			{ ref: "scm:orderNo" },
			{ ref: "scm:allocationStrategy" },
		],
		relations: [
			{ ref: "scm:allocatesInventory" },
			{ ref: "scm:forOrder" },
			{ ref: "scm:atLocation" },
		],
		constraints: [],
		ui: { color: "#FF5252", icon: "event", group: "oms" },
	},
	{
		"@id": "scm:OrderSplit",
		"@type": "EntityType",
		label: { zh: "订单拆分", en: "Order Split" },
		kind: "event",
		attributes: [
			{ ref: "scm:eventTimestamp", identity: true, required: true },
			{ ref: "scm:orderNo" },
		],
		relations: [{ ref: "scm:splitsOrder" }, { ref: "scm:createsOrder" }],
		constraints: [],
		ui: { color: "#FF5252", icon: "event", group: "oms" },
	},
	{
		"@id": "scm:OrderCancelled",
		"@type": "EntityType",
		label: { zh: "订单取消", en: "Order Cancelled" },
		kind: "event",
		attributes: [
			{ ref: "scm:eventTimestamp", identity: true, required: true },
			{ ref: "scm:orderNo" },
			{ ref: "scm:description" },
		],
		relations: [
			{ ref: "scm:cancelsOrder" },
			{ ref: "scm:releasesInventory" },
			{ ref: "scm:notifiesCustomer" },
		],
		constraints: [],
		ui: { color: "#FF5252", icon: "event", group: "oms" },
	},
	{
		"@id": "scm:ReturnRequested",
		"@type": "EntityType",
		label: { zh: "退货申请", en: "Return Requested" },
		kind: "event",
		attributes: [
			{ ref: "scm:eventTimestamp", identity: true, required: true },
			{ ref: "scm:returnOrderNo" },
			{ ref: "scm:returnReason" },
		],
		relations: [
			{ ref: "scm:requestsReturn" },
			{ ref: "scm:forOrder" },
			{ ref: "scm:returnProduct" },
		],
		constraints: [],
		ui: { color: "#FF5252", icon: "event", group: "oms" },
	},
	{
		"@id": "scm:RefundProcessed",
		"@type": "EntityType",
		label: { zh: "退款处理", en: "Refund Processed" },
		kind: "event",
		attributes: [
			{ ref: "scm:eventTimestamp", identity: true, required: true },
			{ ref: "scm:refundOrderNo" },
			{ ref: "scm:refundAmount" },
			{ ref: "scm:currency" },
		],
		relations: [
			{ ref: "scm:refundsReturn" },
			{ ref: "scm:refundReferencesInvoice" },
		],
		constraints: [],
		ui: { color: "#FF5252", icon: "event", group: "oms" },
	},
	{
		"@id": "scm:BackorderCreated",
		"@type": "EntityType",
		label: { zh: "缺货登记", en: "Backorder Created" },
		kind: "event",
		attributes: [
			{ ref: "scm:eventTimestamp", identity: true, required: true },
			{ ref: "scm:orderNo" },
			{ ref: "scm:quantity" },
		],
		relations: [
			{ ref: "scm:forOrder" },
			{ ref: "scm:waitsInventory" },
			{ ref: "scm:notifiesCustomer" },
		],
		constraints: [],
		ui: { color: "#FF5252", icon: "event", group: "oms" },
	},
	{
		"@id": "scm:FulfillmentPlanCreated",
		"@type": "EntityType",
		label: { zh: "履约计划创建", en: "Fulfillment Plan Created" },
		kind: "event",
		attributes: [
			{ ref: "scm:eventTimestamp", identity: true, required: true },
			{ ref: "scm:fulfillmentPlanNo" },
		],
		relations: [
			{ ref: "scm:createsPlan" },
			{ ref: "scm:forOrder" },
			{ ref: "scm:allocatesToWarehouse" },
		],
		constraints: [],
		ui: { color: "#FF5252", icon: "event", group: "oms" },
	},
];
