/**
 * 对象模型示例 -- 供应链业务对象
 *
 * 包含 Warehouse / Shipment / Order 三个对象类，
 * 对应的实例和关系链接示例。
 */

import type {
	ObjectClass,
	ObjectInstance,
	ObjectLink,
	ObjectModelDefinition,
	ObjectPackage,
} from "../object-model";

const warehouseClass: ObjectClass = {
	"@id": "scm:WarehouseClass",
	"@type": "ObjectClass",
	entityTypeRef: "scm:Warehouse",
	label: { zh: "仓库对象类", en: "Warehouse Object Class" },
	description: {
		zh: "仓储设施的业务对象类",
		en: "Business object class for warehouse facilities",
	},
	properties: [
		{
			"@id": "scm:warehouseCode",
			label: { zh: "仓库编码", en: "Warehouse Code" },
			datatype: "string",
			required: true,
			identity: true,
		},
		{
			"@id": "scm:name",
			label: { zh: "仓库名称", en: "Warehouse Name" },
			datatype: "string",
			required: true,
		},
		{
			"@id": "scm:address",
			label: { zh: "地址", en: "Address" },
			datatype: "string",
		},
		{
			"@id": "scm:capacity",
			label: { zh: "容量", en: "Capacity" },
			datatype: "float",
		},
		{
			"@id": "scm:temperatureZone",
			label: { zh: "温区", en: "Temperature Zone" },
			datatype: "string",
			enum: ["ambient", "cold", "frozen"],
		},
		{
			"@id": "scm:status",
			label: { zh: "状态", en: "Status" },
			datatype: "string",
			required: true,
			defaultValue: "active",
			enum: ["active", "inactive", "maintenance"],
		},
	],
};

const shipmentClass: ObjectClass = {
	"@id": "scm:ShipmentClass",
	"@type": "ObjectClass",
	entityTypeRef: "scm:Shipment",
	label: { zh: "运输批次对象类", en: "Shipment Object Class" },
	description: {
		zh: "物流运输批次的业务对象类",
		en: "Business object class for logistics shipments",
	},
	properties: [
		{
			"@id": "scm:shipmentId",
			label: { zh: "运输批次号", en: "Shipment ID" },
			datatype: "string",
			required: true,
			identity: true,
		},
		{
			"@id": "scm:originRef",
			label: { zh: "发货地", en: "Origin" },
			datatype: "ref",
			required: true,
			datatypeRef: "scm:WarehouseClass",
		},
		{
			"@id": "scm:destinationRef",
			label: { zh: "目的地", en: "Destination" },
			datatype: "ref",
			required: true,
			datatypeRef: "scm:WarehouseClass",
		},
		{
			"@id": "scm:estimatedArrival",
			label: { zh: "预计到达时间", en: "Estimated Arrival" },
			datatype: "datetime",
		},
		{
			"@id": "scm:actualArrival",
			label: { zh: "实际到达时间", en: "Actual Arrival" },
			datatype: "datetime",
		},
		{
			"@id": "scm:weight",
			label: { zh: "重量(kg)", en: "Weight (kg)" },
			datatype: "float",
		},
		{
			"@id": "scm:shipmentStatus",
			label: { zh: "状态", en: "Status" },
			datatype: "string",
			required: true,
			defaultValue: "pending",
			enum: ["pending", "in_transit", "delivered", "cancelled"],
		},
	],
};

const orderClass: ObjectClass = {
	"@id": "scm:OrderClass",
	"@type": "ObjectClass",
	entityTypeRef: "scm:Order",
	label: { zh: "订单对象类", en: "Order Object Class" },
	description: {
		zh: "采购/销售订单的业务对象类",
		en: "Business object class for purchase/sales orders",
	},
	properties: [
		{
			"@id": "scm:orderNumber",
			label: { zh: "订单号", en: "Order Number" },
			datatype: "string",
			required: true,
			identity: true,
		},
		{
			"@id": "scm:orderType",
			label: { zh: "订单类型", en: "Order Type" },
			datatype: "string",
			required: true,
			enum: ["purchase", "sales", "return"],
		},
		{
			"@id": "scm:totalAmount",
			label: { zh: "总金额", en: "Total Amount" },
			datatype: "float",
			required: true,
		},
		{
			"@id": "scm:currency",
			label: { zh: "币种", en: "Currency" },
			datatype: "string",
			defaultValue: "CNY",
			enum: ["CNY", "USD", "EUR"],
		},
		{
			"@id": "scm:orderDate",
			label: { zh: "订单日期", en: "Order Date" },
			datatype: "date",
			required: true,
		},
		{
			"@id": "scm:deliveryDate",
			label: { zh: "交付日期", en: "Delivery Date" },
			datatype: "date",
		},
		{
			"@id": "scm:orderStatus",
			label: { zh: "状态", en: "Status" },
			datatype: "string",
			required: true,
			defaultValue: "draft",
			enum: [
				"draft",
				"confirmed",
				"processing",
				"shipped",
				"completed",
				"cancelled",
			],
		},
	],
};

const now = new Date();
const isoNow = now.toISOString();

const warehouseShanghai: ObjectInstance = {
	"@id": "scm:warehouse-sh-001",
	"@type": "ObjectInstance",
	classRef: "scm:WarehouseClass",
	label: { zh: "上海浦东仓库", en: "Shanghai Pudong Warehouse" },
	description: {
		zh: "位于上海浦东新区的中央仓库",
		en: "Central warehouse in Pudong, Shanghai",
	},
	propertyValues: {
		"scm:warehouseCode": "WH-SH-001",
		"scm:name": "上海浦东仓库",
		"scm:address": "上海市浦东新区张江高科技园区",
		"scm:capacity": 50000,
		"scm:temperatureZone": "ambient",
		"scm:status": "active",
	},
	metadata: {
		version: 1,
		createdAt: isoNow,
		updatedAt: isoNow,
		createdBy: "scm:admin",
	},
};

const warehouseBeijing: ObjectInstance = {
	"@id": "scm:warehouse-bj-001",
	"@type": "ObjectInstance",
	classRef: "scm:WarehouseClass",
	label: { zh: "北京大兴仓库", en: "Beijing Daxing Warehouse" },
	description: {
		zh: "位于北京大兴的冷链仓库",
		en: "Cold chain warehouse in Daxing, Beijing",
	},
	propertyValues: {
		"scm:warehouseCode": "WH-BJ-001",
		"scm:name": "北京大兴仓库",
		"scm:address": "北京市大兴区亦庄经济开发区",
		"scm:capacity": 30000,
		"scm:temperatureZone": "cold",
		"scm:status": "active",
	},
	metadata: {
		version: 1,
		createdAt: isoNow,
		updatedAt: isoNow,
		createdBy: "scm:admin",
	},
};

const warehouseGuangzhou: ObjectInstance = {
	"@id": "scm:warehouse-gz-001",
	"@type": "ObjectInstance",
	classRef: "scm:WarehouseClass",
	label: { zh: "广州南沙仓库", en: "Guangzhou Nansha Warehouse" },
	propertyValues: {
		"scm:warehouseCode": "WH-GZ-001",
		"scm:name": "广州南沙仓库",
		"scm:address": "广州市南沙区保税港区",
		"scm:capacity": 80000,
		"scm:temperatureZone": "ambient",
		"scm:status": "active",
	},
	metadata: {
		version: 2,
		createdAt: isoNow,
		updatedAt: isoNow,
		createdBy: "scm:admin",
		tags: ["hub", "export"],
	},
};

const shipmentSHtoBJ: ObjectInstance = {
	"@id": "scm:shipment-001",
	"@type": "ObjectInstance",
	classRef: "scm:ShipmentClass",
	label: { zh: "上海→北京运输批次", en: "Shanghai→Beijing Shipment" },
	propertyValues: {
		"scm:shipmentId": "SHP-2026-001",
		"scm:originRef": "scm:warehouse-sh-001",
		"scm:destinationRef": "scm:warehouse-bj-001",
		"scm:estimatedArrival": "2026-04-08T18:00:00Z",
		"scm:weight": 2500,
		"scm:shipmentStatus": "in_transit",
	},
	metadata: {
		version: 1,
		createdAt: isoNow,
		updatedAt: isoNow,
		createdBy: "scm:logistics-manager",
	},
};

const shipmentBJtoGZ: ObjectInstance = {
	"@id": "scm:shipment-002",
	"@type": "ObjectInstance",
	classRef: "scm:ShipmentClass",
	label: { zh: "北京→广州运输批次", en: "Beijing→Guangzhou Shipment" },
	propertyValues: {
		"scm:shipmentId": "SHP-2026-002",
		"scm:originRef": "scm:warehouse-bj-001",
		"scm:destinationRef": "scm:warehouse-gz-001",
		"scm:estimatedArrival": "2026-04-12T12:00:00Z",
		"scm:weight": 1800,
		"scm:shipmentStatus": "pending",
	},
	metadata: {
		version: 1,
		createdAt: isoNow,
		updatedAt: isoNow,
		createdBy: "scm:logistics-manager",
	},
};

const orderPurchase: ObjectInstance = {
	"@id": "scm:order-001",
	"@type": "ObjectInstance",
	classRef: "scm:OrderClass",
	label: { zh: "采购订单 PO-2026-001", en: "Purchase Order PO-2026-001" },
	propertyValues: {
		"scm:orderNumber": "PO-2026-001",
		"scm:orderType": "purchase",
		"scm:totalAmount": 125000,
		"scm:currency": "CNY",
		"scm:orderDate": "2026-04-05",
		"scm:deliveryDate": "2026-04-15",
		"scm:orderStatus": "confirmed",
	},
	metadata: {
		version: 2,
		createdAt: isoNow,
		updatedAt: isoNow,
		createdBy: "scm:buyer-01",
	},
};

const orderSales: ObjectInstance = {
	"@id": "scm:order-002",
	"@type": "ObjectInstance",
	classRef: "scm:OrderClass",
	label: { zh: "销售订单 SO-2026-001", en: "Sales Order SO-2026-001" },
	propertyValues: {
		"scm:orderNumber": "SO-2026-001",
		"scm:orderType": "sales",
		"scm:totalAmount": 98000,
		"scm:currency": "CNY",
		"scm:orderDate": "2026-04-06",
		"scm:orderStatus": "processing",
	},
	metadata: {
		version: 1,
		createdAt: isoNow,
		updatedAt: isoNow,
		createdBy: "scm:sales-01",
	},
};

const linkShipmentOrigin: ObjectLink = {
	"@id": "scm:link-ship-origin-001",
	"@type": "ObjectLink",
	relationTypeRef: "scm:shippedFrom",
	fromObjectId: "scm:shipment-001",
	toObjectId: "scm:warehouse-sh-001",
	label: { zh: "从上海仓发货", en: "Shipped from Shanghai warehouse" },
};

const linkShipmentDest: ObjectLink = {
	"@id": "scm:link-ship-dest-001",
	"@type": "ObjectLink",
	relationTypeRef: "scm:shippedTo",
	fromObjectId: "scm:shipment-001",
	toObjectId: "scm:warehouse-bj-001",
	label: { zh: "送达北京仓", en: "Delivered to Beijing warehouse" },
};

const linkShipmentOrder: ObjectLink = {
	"@id": "scm:link-ship-order-001",
	"@type": "ObjectLink",
	relationTypeRef: "scm:fulfillsOrder",
	fromObjectId: "scm:shipment-001",
	toObjectId: "scm:order-001",
	label: { zh: "履约采购订单", en: "Fulfills purchase order" },
	properties: { fulfillmentRatio: 0.75 },
};

const supplyChainPackage: ObjectPackage = {
	"@id": "scm:supply-chain-objects",
	"@type": "ObjectPackage",
	label: { zh: "供应链业务对象包", en: "Supply Chain Objects Package" },
	description: {
		zh: "包含仓库、运输批次、订单等供应链核心业务对象",
		en: "Core supply chain business objects including warehouses, shipments and orders",
	},
	classes: [warehouseClass, shipmentClass, orderClass],
	instances: [
		warehouseShanghai,
		warehouseBeijing,
		warehouseGuangzhou,
		shipmentSHtoBJ,
		shipmentBJtoGZ,
		orderPurchase,
		orderSales,
	],
	links: [linkShipmentOrigin, linkShipmentDest, linkShipmentOrder],
	version: "1.0.0",
};

export const supplyChainObjectModel: ObjectModelDefinition = {
	"@id": "scm:SupplyChainObjectModel",
	"@type": "ObjectModel",
	label: { zh: "供应链对象模型", en: "Supply Chain Object Model" },
	description: {
		zh: "供应链领域业务对象模型，包含仓库、运输批次和订单",
		en: "Supply chain domain object model with warehouses, shipments and orders",
	},
	version: "1.0.0",
	ontologyRef: "scm:SupplyChainOntology",
	classes: [warehouseClass, shipmentClass, orderClass],
	instances: [
		warehouseShanghai,
		warehouseBeijing,
		warehouseGuangzhou,
		shipmentSHtoBJ,
		shipmentBJtoGZ,
		orderPurchase,
		orderSales,
	],
	links: [linkShipmentOrigin, linkShipmentDest, linkShipmentOrder],
	packages: [supplyChainPackage],
};
