import type { ValueType } from "../../types";

export const valueTypes: ValueType[] = [
	{
		"@id": "scm:OrderStatus",
		"@type": "ValueType",
		label: {
			zh: "订单状态",
			en: "Order Status",
		},
		values: [
			"draft",
			"submitted",
			"confirmed",
			"in_production",
			"partially_shipped",
			"shipped",
			"delivered",
			"invoiced",
			"completed",
			"cancelled",
			"returned",
		],
	},
	{
		"@id": "scm:ShipmentStatus",
		"@type": "ValueType",
		label: {
			zh: "运输状态",
			en: "Shipment Status",
		},
		values: [
			"booking_confirmed",
			"dispatched",
			"in_transit",
			"at_port",
			"customs_clearance",
			"out_for_delivery",
			"delivered",
			"exception",
			"returned",
		],
	},
	{
		"@id": "scm:PaymentStatus",
		"@type": "ValueType",
		label: {
			zh: "支付状态",
			en: "Payment Status",
		},
		values: [
			"unpaid",
			"partially_paid",
			"paid",
			"overdue",
			"refunded",
			"disputed",
		],
	},
	{
		"@id": "scm:QualityGrade",
		"@type": "ValueType",
		label: {
			zh: "质量等级",
			en: "Quality Grade",
		},
		values: ["A", "B", "C", "D", "R"],
	},
	{
		"@id": "scm:RiskLevel",
		"@type": "ValueType",
		label: {
			zh: "风险等级",
			en: "Risk Level",
		},
		values: ["critical", "high", "medium", "low", "negligible"],
	},
	{
		"@id": "scm:TransportMode",
		"@type": "ValueType",
		label: {
			zh: "运输方式",
			en: "Transport Mode",
		},
		values: ["road", "rail", "sea", "air", "multimodal", "pipeline"],
	},
	{
		"@id": "scm:Currency",
		"@type": "ValueType",
		label: {
			zh: "币种",
			en: "Currency",
		},
		values: ["CNY", "USD", "EUR", "GBP", "JPY", "HKD", "SGD"],
	},
	{
		"@id": "scm:UnitOfMeasure",
		"@type": "ValueType",
		label: {
			zh: "计量单位",
			en: "Unit of Measure",
		},
		values: ["EA", "KG", "TON", "M3", "L", "M", "PAL", "CTN"],
	},
];
