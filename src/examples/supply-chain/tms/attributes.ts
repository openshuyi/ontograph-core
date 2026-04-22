import type { AttributeDefinition } from "../../../types";

export const tmsAttributes: AttributeDefinition[] = [
	// ========== 车辆类 (Vehicle) ==========
	{
		"@id": "scm:vehiclePlate",
		"@type": "Attribute",
		label: { zh: "车牌号", en: "Vehicle Plate" },
		datatype: "string",
		identity: true,
		required: true,
	},
	{
		"@id": "scm:vehicleType",
		"@type": "Attribute",
		label: { zh: "车辆类型", en: "Vehicle Type" },
		datatype: "string",
		enum: [
			"truck",
			"van",
			"trailer_truck",
			"flatbed",
			"reefer",
			"tanker",
			"container",
		],
	},
	{
		"@id": "scm:fuelType",
		"@type": "Attribute",
		label: { zh: "燃料类型", en: "Fuel Type" },
		datatype: "string",
		enum: ["diesel", "gasoline", "electric", "hybrid", "lng", "cng"],
	},
	{
		"@id": "scm:fuelVolume",
		"@type": "Attribute",
		label: { zh: "加油量", en: "Fuel Volume" },
		description: { zh: "单位: 升", en: "Unit: liters" },
		datatype: "float",
	},
	{
		"@id": "scm:fuelCost",
		"@type": "Attribute",
		label: { zh: "燃油费用", en: "Fuel Cost" },
		datatype: "float",
	},
	{
		"@id": "scm:odometer",
		"@type": "Attribute",
		label: { zh: "里程表读数", en: "Odometer Reading" },
		description: { zh: "单位: 公里", en: "Unit: km" },
		datatype: "integer",
	},

	// ========== 人员类 (Personnel) ==========
	{
		"@id": "scm:driverLicenseNo",
		"@type": "Attribute",
		label: { zh: "驾照号", en: "Driver License No" },
		datatype: "string",
		identity: true,
	},
	{
		"@id": "scm:licenseType",
		"@type": "Attribute",
		label: { zh: "驾照类型", en: "License Type" },
		datatype: "string",
		enum: ["A1", "A2", "B1", "B2", "C1"],
	},
	{
		"@id": "scm:phoneNumber",
		"@type": "Attribute",
		label: { zh: "电话号码", en: "Phone Number" },
		datatype: "string",
	},

	// ========== 车队与挂车 (Fleet & Trailer) ==========
	{
		"@id": "scm:fleetCode",
		"@type": "Attribute",
		label: { zh: "车队编码", en: "Fleet Code" },
		datatype: "string",
		identity: true,
	},
	{
		"@id": "scm:trailerNo",
		"@type": "Attribute",
		label: { zh: "挂车编号", en: "Trailer Number" },
		datatype: "string",
		identity: true,
	},

	// ========== 运输订单 (Transport Order) ==========
	{
		"@id": "scm:transportOrderNo",
		"@type": "Attribute",
		label: { zh: "运输订单号", en: "Transport Order No" },
		datatype: "string",
		identity: true,
		required: true,
	},
	{
		"@id": "scm:priority",
		"@type": "Attribute",
		label: { zh: "优先级", en: "Priority" },
		datatype: "string",
		enum: ["urgent", "high", "normal", "low"],
	},

	// ========== 路线与停靠 (Route & Stop) ==========
	{
		"@id": "scm:segmentNo",
		"@type": "Attribute",
		label: { zh: "路段编号", en: "Segment No" },
		datatype: "string",
		identity: true,
	},
	{
		"@id": "scm:transportDistance",
		"@type": "Attribute",
		label: { zh: "距离", en: "Distance" },
		description: { zh: "单位: 公里", en: "Unit: km" },
		datatype: "float",
	},
	{
		"@id": "scm:duration",
		"@type": "Attribute",
		label: { zh: "时长", en: "Duration" },
		description: { zh: "单位: 分钟", en: "Unit: minutes" },
		datatype: "integer",
	},
	{
		"@id": "scm:stopSequence",
		"@type": "Attribute",
		label: { zh: "停靠序号", en: "Stop Sequence" },
		datatype: "integer",
	},
	{
		"@id": "scm:stopType",
		"@type": "Attribute",
		label: { zh: "停靠类型", en: "Stop Type" },
		datatype: "string",
		enum: ["pickup", "delivery", "transit", "rest", "fuel"],
	},
	{
		"@id": "scm:originAddress",
		"@type": "Attribute",
		label: { zh: "出发地", en: "Origin Address" },
		datatype: "string",
	},
	{
		"@id": "scm:destinationAddress",
		"@type": "Attribute",
		label: { zh: "目的地", en: "Destination Address" },
		datatype: "string",
	},

	// ========== 费率与账单 (Rate & Billing) ==========
	{
		"@id": "scm:ratePerKm",
		"@type": "Attribute",
		label: { zh: "每公里费率", en: "Rate Per KM" },
		datatype: "float",
	},
	{
		"@id": "scm:ratePerKg",
		"@type": "Attribute",
		label: { zh: "每公斤费率", en: "Rate Per KG" },
		datatype: "float",
	},
	{
		"@id": "scm:ratePerPallet",
		"@type": "Attribute",
		label: { zh: "每托盘费率", en: "Rate Per Pallet" },
		datatype: "float",
	},
	{
		"@id": "scm:effectiveFrom",
		"@type": "Attribute",
		label: { zh: "生效日期", en: "Effective From" },
		datatype: "datetime",
	},
	{
		"@id": "scm:effectiveTo",
		"@type": "Attribute",
		label: { zh: "失效日期", en: "Effective To" },
		datatype: "datetime",
	},
	{
		"@id": "scm:freightBillNo",
		"@type": "Attribute",
		label: { zh: "运费账单号", en: "Freight Bill No" },
		datatype: "string",
		identity: true,
	},
	{
		"@id": "scm:baseCharge",
		"@type": "Attribute",
		label: { zh: "基础运费", en: "Base Charge" },
		datatype: "float",
	},
	{
		"@id": "scm:surchargeAmount",
		"@type": "Attribute",
		label: { zh: "附加费", en: "Surcharge Amount" },
		datatype: "float",
	},

	// ========== 签收 (Proof of Delivery) ==========
	{
		"@id": "scm:podNo",
		"@type": "Attribute",
		label: { zh: "签收单号", en: "POD Number" },
		datatype: "string",
		identity: true,
	},
	{
		"@id": "scm:signedBy",
		"@type": "Attribute",
		label: { zh: "签收人", en: "Signed By" },
		datatype: "string",
	},
	{
		"@id": "scm:signedAt",
		"@type": "Attribute",
		label: { zh: "签收时间", en: "Signed At" },
		datatype: "datetime",
	},

	// ========== 装载与月台 (Load & Dock) ==========
	{
		"@id": "scm:loadPlanNo",
		"@type": "Attribute",
		label: { zh: "装载计划号", en: "Load Plan No" },
		datatype: "string",
		identity: true,
	},
	{
		"@id": "scm:utilizationRate",
		"@type": "Attribute",
		label: { zh: "利用率", en: "Utilization Rate" },
		description: { zh: "百分比 0-100", en: "Percentage 0-100" },
		datatype: "float",
	},
	{
		"@id": "scm:dockCode",
		"@type": "Attribute",
		label: { zh: "月台编码", en: "Dock Code" },
		datatype: "string",
		identity: true,
	},
	{
		"@id": "scm:dockType",
		"@type": "Attribute",
		label: { zh: "月台类型", en: "Dock Type" },
		datatype: "string",
		enum: ["loading", "unloading", "cross_dock"],
	},

	// ========== 增强事件属性 (Enhanced Event Attributes) ==========
	{
		"@id": "scm:customsStatus",
		"@type": "Attribute",
		label: { zh: "清关状态", en: "Customs Status" },
		datatype: "string",
	},
	{
		"@id": "scm:declarationNo",
		"@type": "Attribute",
		label: { zh: "报关单号", en: "Declaration Number" },
		datatype: "string",
	},
	{
		"@id": "scm:bidAmount",
		"@type": "Attribute",
		label: { zh: "投标金额", en: "Bid Amount" },
		datatype: "float",
	},
	{
		"@id": "scm:locationCode",
		"@type": "Attribute",
		label: { zh: "位置代码", en: "Location Code" },
		datatype: "string",
	},
	{
		"@id": "scm:loadedQty",
		"@type": "Attribute",
		label: { zh: "已装载数量", en: "Loaded Quantity" },
		datatype: "integer",
	},
	{
		"@id": "scm:currentLocation",
		"@type": "Attribute",
		label: { zh: "当前位置", en: "Current Location" },
		datatype: "ref",
		datatypeRef: "scm:Location",
	},
	{
		"@id": "scm:eta",
		"@type": "Attribute",
		label: { zh: "预计到达时间", en: "Estimated Time of Arrival" },
		datatype: "datetime",
	},
	{
		"@id": "scm:geofenceNo",
		"@type": "Attribute",
		label: { zh: "电子围栏编号", en: "Geofence Number" },
		datatype: "string",
	},
	{
		"@id": "scm:geofenceName",
		"@type": "Attribute",
		label: { zh: "电子围栏名称", en: "Geofence Name" },
		datatype: "string",
	},
	{
		"@id": "scm:deliveryNo",
		"@type": "Attribute",
		label: { zh: "交货单号", en: "Delivery Number" },
		datatype: "string",
	},
	{
		"@id": "scm:deliveredQty",
		"@type": "Attribute",
		label: { zh: "已交付数量", en: "Delivered Quantity" },
		datatype: "integer",
	},
	{
		"@id": "scm:plannedRoute",
		"@type": "Attribute",
		label: { zh: "计划路线", en: "Planned Route" },
		datatype: "ref",
		datatypeRef: "scm:Route",
	},
	{
		"@id": "scm:actualRoute",
		"@type": "Attribute",
		label: { zh: "实际路线", en: "Actual Route" },
		datatype: "ref",
		datatypeRef: "scm:Route",
	},
	{
		"@id": "scm:deviationDistance",
		"@type": "Attribute",
		label: { zh: "偏离距离", en: "Deviation Distance" },
		datatype: "float",
	},
	{
		"@id": "scm:minTemperature",
		"@type": "Attribute",
		label: { zh: "最低温度", en: "Minimum Temperature" },
		datatype: "float",
	},
	{
		"@id": "scm:maxTemperature",
		"@type": "Attribute",
		label: { zh: "最高温度", en: "Maximum Temperature" },
		datatype: "float",
	},
	{
		"@id": "scm:customsOffice",
		"@type": "Attribute",
		label: { zh: "海关办公室", en: "Customs Office" },
		datatype: "string",
	},
	{
		"@id": "scm:expectedRelease",
		"@type": "Attribute",
		label: { zh: "预计放行时间", en: "Expected Release Time" },
		datatype: "datetime",
	},
	{
		"@id": "scm:feeType",
		"@type": "Attribute",
		label: { zh: "费用类型", en: "Fee Type" },
		datatype: "string",
	},
	{
		"@id": "scm:freeTimeExpired",
		"@type": "Attribute",
		label: { zh: "免费期已过", en: "Free Time Expired" },
		datatype: "string",
	},
	{
		"@id": "scm:accruedDays",
		"@type": "Attribute",
		label: { zh: "滞期天数", en: "Accrued Days" },
		datatype: "integer",
	},
	{
		"@id": "scm:feeAmount",
		"@type": "Attribute",
		label: { zh: "费用金额", en: "Fee Amount" },
		datatype: "float",
	},
];
