import type { AttributeDefinition } from "../../types";

// ========== 标识类 (Identity) ==========

export const attributes: AttributeDefinition[] = [
	{
		"@id": "scm:orderNo",
		"@type": "Attribute",
		label: { zh: "订单号", en: "Order Number" },
		datatype: "string",
		identity: true,
		required: true,
	},
	{
		"@id": "scm:poNumber",
		"@type": "Attribute",
		label: { zh: "采购单号", en: "PO Number" },
		datatype: "string",
		identity: true,
		required: true,
	},
	{
		"@id": "scm:shipmentNo",
		"@type": "Attribute",
		label: { zh: "运单号", en: "Shipment Number" },
		datatype: "string",
		identity: true,
		required: true,
	},
	{
		"@id": "scm:trackingNo",
		"@type": "Attribute",
		label: { zh: "追踪号", en: "Tracking Number" },
		datatype: "string",
	},
	{
		"@id": "scm:invoiceNo",
		"@type": "Attribute",
		label: { zh: "发票号", en: "Invoice Number" },
		datatype: "string",
		identity: true,
	},
	{
		"@id": "scm:bolNumber",
		"@type": "Attribute",
		label: { zh: "提单号", en: "Bill of Lading Number" },
		datatype: "string",
		identity: true,
	},
	{
		"@id": "scm:skuCode",
		"@type": "Attribute",
		label: { zh: "SKU编码", en: "SKU Code" },
		datatype: "string",
		identity: true,
		required: true,
	},
	{
		"@id": "scm:gtin",
		"@type": "Attribute",
		label: { zh: "全球贸易项目编号", en: "GTIN" },
		description: { zh: "GS1标准", en: "GS1 standard" },
		datatype: "string",
	},
	{
		"@id": "scm:organizationCode",
		"@type": "Attribute",
		label: { zh: "组织编码", en: "Organization Code" },
		datatype: "string",
		identity: true,
	},
	{
		"@id": "scm:facilityCode",
		"@type": "Attribute",
		label: { zh: "设施编码", en: "Facility Code" },
		datatype: "string",
		identity: true,
	},
	{
		"@id": "scm:lotNumber",
		"@type": "Attribute",
		label: { zh: "批次号", en: "Lot Number" },
		datatype: "string",
	},
	{
		"@id": "scm:hsCode",
		"@type": "Attribute",
		label: { zh: "海关编码", en: "HS Code" },
		datatype: "string",
		validation: [
			{
				type: "pattern",
				value: "^\\d{6,10}$",
				message: {
					zh: "海关编码应为6-10位数字",
					en: "HS Code must be 6-10 digits",
				},
			},
		],
	},

	// ========== 度量类 (Measurement) ==========

	{
		"@id": "scm:quantity",
		"@type": "Attribute",
		label: { zh: "数量", en: "Quantity" },
		datatype: "float",
		validation: [
			{
				type: "min",
				value: 0,
				message: { zh: "数量不能为负数", en: "Quantity must not be negative" },
			},
		],
	},
	{
		"@id": "scm:weight",
		"@type": "Attribute",
		label: { zh: "重量", en: "Weight" },
		description: { zh: "单位: KG", en: "Unit: KG" },
		datatype: "float",
	},
	{
		"@id": "scm:volume",
		"@type": "Attribute",
		label: { zh: "体积", en: "Volume" },
		description: { zh: "单位: 立方米", en: "Unit: cubic meters" },
		datatype: "float",
	},
	{
		"@id": "scm:length",
		"@type": "Attribute",
		label: { zh: "长度", en: "Length" },
		datatype: "float",
	},
	{
		"@id": "scm:width",
		"@type": "Attribute",
		label: { zh: "宽度", en: "Width" },
		datatype: "float",
	},
	{
		"@id": "scm:height",
		"@type": "Attribute",
		label: { zh: "高度", en: "Height" },
		datatype: "float",
	},
	{
		"@id": "scm:capacity",
		"@type": "Attribute",
		label: { zh: "容量", en: "Capacity" },
		datatype: "float",
	},
	{
		"@id": "scm:uom",
		"@type": "Attribute",
		label: { zh: "计量单位", en: "Unit of Measure" },
		datatype: "ref",
		datatypeRef: "scm:UnitOfMeasure",
	},

	// ========== 时间类 (Temporal) ==========

	{
		"@id": "scm:orderDate",
		"@type": "Attribute",
		label: { zh: "订单日期", en: "Order Date" },
		datatype: "datetime",
	},
	{
		"@id": "scm:plannedDeparture",
		"@type": "Attribute",
		label: { zh: "计划出发", en: "Planned Departure" },
		datatype: "datetime",
	},
	{
		"@id": "scm:plannedArrival",
		"@type": "Attribute",
		label: { zh: "计划到达", en: "Planned Arrival" },
		datatype: "datetime",
	},
	{
		"@id": "scm:actualDeparture",
		"@type": "Attribute",
		label: { zh: "实际出发", en: "Actual Departure" },
		datatype: "datetime",
	},
	{
		"@id": "scm:actualArrival",
		"@type": "Attribute",
		label: { zh: "实际到达", en: "Actual Arrival" },
		datatype: "datetime",
	},
	{
		"@id": "scm:leadTime",
		"@type": "Attribute",
		label: { zh: "交货周期", en: "Lead Time" },
		description: { zh: "单位: 天", en: "Unit: days" },
		datatype: "integer",
	},
	{
		"@id": "scm:eventTimestamp",
		"@type": "Attribute",
		label: { zh: "事件时间戳", en: "Event Timestamp" },
		datatype: "datetime",
	},
	{
		"@id": "scm:expiryDate",
		"@type": "Attribute",
		label: { zh: "有效期", en: "Expiry Date" },
		datatype: "date",
	},

	// ========== 财务类 (Financial) ==========

	{
		"@id": "scm:unitPrice",
		"@type": "Attribute",
		label: { zh: "单价", en: "Unit Price" },
		datatype: "float",
	},
	{
		"@id": "scm:totalAmount",
		"@type": "Attribute",
		label: { zh: "总金额", en: "Total Amount" },
		datatype: "float",
	},
	{
		"@id": "scm:taxAmount",
		"@type": "Attribute",
		label: { zh: "税额", en: "Tax Amount" },
		datatype: "float",
	},
	{
		"@id": "scm:currency",
		"@type": "Attribute",
		label: { zh: "币种", en: "Currency" },
		datatype: "ref",
		datatypeRef: "scm:Currency",
	},
	{
		"@id": "scm:paymentStatus",
		"@type": "Attribute",
		label: { zh: "支付状态", en: "Payment Status" },
		datatype: "ref",
		datatypeRef: "scm:PaymentStatus",
	},
	{
		"@id": "scm:costCenter",
		"@type": "Attribute",
		label: { zh: "成本中心", en: "Cost Center" },
		datatype: "string",
	},

	// ========== 质量合规类 (Quality & Compliance) ==========

	{
		"@id": "scm:qualityGrade",
		"@type": "Attribute",
		label: { zh: "质量等级", en: "Quality Grade" },
		datatype: "ref",
		datatypeRef: "scm:QualityGrade",
	},
	{
		"@id": "scm:certification",
		"@type": "Attribute",
		label: { zh: "认证", en: "Certification" },
		description: { zh: "ISO9001, ISO14001等", en: "ISO9001, ISO14001, etc." },
		datatype: "string",
	},
	{
		"@id": "scm:complianceStatus",
		"@type": "Attribute",
		label: { zh: "合规状态", en: "Compliance Status" },
		datatype: "string",
		enum: ["compliant", "non_compliant", "pending_review"],
	},
	{
		"@id": "scm:riskLevel",
		"@type": "Attribute",
		label: { zh: "风险等级", en: "Risk Level" },
		datatype: "ref",
		datatypeRef: "scm:RiskLevel",
	},
	{
		"@id": "scm:carbonEmission",
		"@type": "Attribute",
		label: { zh: "碳排放", en: "Carbon Emission" },
		description: { zh: "单位: kg CO2e", en: "Unit: kg CO2e" },
		datatype: "float",
	},

	// ========== 位置类 (Location) ==========

	{
		"@id": "scm:address",
		"@type": "Attribute",
		label: { zh: "地址", en: "Address" },
		datatype: "string",
	},
	{
		"@id": "scm:latitude",
		"@type": "Attribute",
		label: { zh: "纬度", en: "Latitude" },
		datatype: "float",
	},
	{
		"@id": "scm:longitude",
		"@type": "Attribute",
		label: { zh: "经度", en: "Longitude" },
		datatype: "float",
	},
	{
		"@id": "scm:region",
		"@type": "Attribute",
		label: { zh: "区域", en: "Region" },
		datatype: "string",
	},
	{
		"@id": "scm:country",
		"@type": "Attribute",
		label: { zh: "国家", en: "Country" },
		description: { zh: "ISO 3166-1 alpha-2", en: "ISO 3166-1 alpha-2" },
		datatype: "string",
	},

	// ========== 通用类 (General) ==========

	{
		"@id": "scm:name",
		"@type": "Attribute",
		label: { zh: "名称", en: "Name" },
		datatype: "string",
	},
	{
		"@id": "scm:description",
		"@type": "Attribute",
		label: { zh: "描述", en: "Description" },
		datatype: "string",
	},
	{
		"@id": "scm:transportMode",
		"@type": "Attribute",
		label: { zh: "运输方式", en: "Transport Mode" },
		datatype: "ref",
		datatypeRef: "scm:TransportMode",
	},
	{
		"@id": "scm:supplierTier",
		"@type": "Attribute",
		label: { zh: "供应商层级", en: "Supplier Tier" },
		description: {
			zh: "1=一级, 2=二级, 3=三级",
			en: "1=Tier 1, 2=Tier 2, 3=Tier 3",
		},
		datatype: "integer",
	},

	// ========== 供应链节点类 ==========
	{
		"@id": "scm:nodeCode",
		"@type": "Attribute",
		label: { zh: "节点编码", en: "Node Code" },
		datatype: "string",
		identity: true,
	},
	{
		"@id": "scm:nodeType",
		"@type": "Attribute",
		label: { zh: "节点类型", en: "Node Type" },
		datatype: "ref",
		datatypeRef: "scm:NodeType",
	},
	{
		"@id": "scm:operatingHours",
		"@type": "Attribute",
		label: { zh: "运营时间", en: "Operating Hours" },
		datatype: "string",
	},

	// ========== 供应链链路类 ==========
	{
		"@id": "scm:linkCode",
		"@type": "Attribute",
		label: { zh: "链路编码", en: "Link Code" },
		datatype: "string",
		identity: true,
	},
	{
		"@id": "scm:linkType",
		"@type": "Attribute",
		label: { zh: "链路类型", en: "Link Type" },
		datatype: "ref",
		datatypeRef: "scm:LinkType",
	},
	{
		"@id": "scm:avgLeadTime",
		"@type": "Attribute",
		label: { zh: "平均交货周期", en: "Average Lead Time" },
		description: { zh: "单位: 天", en: "Unit: days" },
		datatype: "integer",
	},
	{
		"@id": "scm:costPerUnit",
		"@type": "Attribute",
		label: { zh: "单位成本", en: "Cost Per Unit" },
		datatype: "float",
	},
	{
		"@id": "scm:supplyChainDistance",
		"@type": "Attribute",
		label: { zh: "距离", en: "Distance" },
		description: { zh: "单位: 公里", en: "Unit: km" },
		datatype: "float",
	},

	// ========== 风险事件类 ==========
	{
		"@id": "scm:disruptionType",
		"@type": "Attribute",
		label: { zh: "中断类型", en: "Disruption Type" },
		datatype: "ref",
		datatypeRef: "scm:DisruptionType",
	},
	{
		"@id": "scm:severity",
		"@type": "Attribute",
		label: { zh: "严重程度", en: "Severity" },
		datatype: "ref",
		datatypeRef: "scm:SeverityLevel",
	},
	{
		"@id": "scm:affectedQty",
		"@type": "Attribute",
		label: { zh: "影响数量", en: "Affected Quantity" },
		datatype: "float",
	},
	{
		"@id": "scm:estimatedRecovery",
		"@type": "Attribute",
		label: { zh: "预计恢复时间", en: "Estimated Recovery Time" },
		datatype: "datetime",
	},
	{
		"@id": "scm:actualRecovery",
		"@type": "Attribute",
		label: { zh: "实际恢复时间", en: "Actual Recovery Time" },
		datatype: "datetime",
	},
	{
		"@id": "scm:financialImpact",
		"@type": "Attribute",
		label: { zh: "财务影响", en: "Financial Impact" },
		datatype: "float",
	},

	// ========== 质量事件类 ==========
	{
		"@id": "scm:issueType",
		"@type": "Attribute",
		label: { zh: "问题类型", en: "Issue Type" },
		datatype: "ref",
		datatypeRef: "scm:IssueType",
	},
	{
		"@id": "scm:affectedBatchNo",
		"@type": "Attribute",
		label: { zh: "影响批次号", en: "Affected Batch Number" },
		datatype: "string",
	},
	{
		"@id": "scm:defectRate",
		"@type": "Attribute",
		label: { zh: "缺陷率", en: "Defect Rate" },
		description: { zh: "单位: %", en: "Unit: %" },
		datatype: "float",
	},
	{
		"@id": "scm:recallQty",
		"@type": "Attribute",
		label: { zh: "召回数量", en: "Recall Quantity" },
		datatype: "float",
	},
	{
		"@id": "scm:rootCause",
		"@type": "Attribute",
		label: { zh: "根本原因", en: "Root Cause" },
		datatype: "string",
	},

	// ========== 延迟事件类 ==========
	{
		"@id": "scm:delayType",
		"@type": "Attribute",
		label: { zh: "延迟类型", en: "Delay Type" },
		datatype: "ref",
		datatypeRef: "scm:DelayType",
	},
	{
		"@id": "scm:delayDuration",
		"@type": "Attribute",
		label: { zh: "延迟时长", en: "Delay Duration" },
		description: { zh: "单位: 小时", en: "Unit: hours" },
		datatype: "float",
	},
	{
		"@id": "scm:plannedTime",
		"@type": "Attribute",
		label: { zh: "计划时间", en: "Planned Time" },
		datatype: "datetime",
	},
	{
		"@id": "scm:actualTime",
		"@type": "Attribute",
		label: { zh: "实际时间", en: "Actual Time" },
		datatype: "datetime",
	},
	{
		"@id": "scm:delayReason",
		"@type": "Attribute",
		label: { zh: "延迟原因", en: "Delay Reason" },
		datatype: "string",
	},
	{
		"@id": "scm:impactCost",
		"@type": "Attribute",
		label: { zh: "影响成本", en: "Impact Cost" },
		datatype: "float",
	},

	// ========== 绩效指标类 ==========
	{
		"@id": "scm:metricCode",
		"@type": "Attribute",
		label: { zh: "指标编码", en: "Metric Code" },
		datatype: "string",
		identity: true,
	},
	{
		"@id": "scm:metricName",
		"@type": "Attribute",
		label: { zh: "指标名称", en: "Metric Name" },
		datatype: "string",
	},
	{
		"@id": "scm:category",
		"@type": "Attribute",
		label: { zh: "类别", en: "Category" },
		datatype: "ref",
		datatypeRef: "scm:MetricCategory",
	},
	{
		"@id": "scm:value",
		"@type": "Attribute",
		label: { zh: "数值", en: "Value" },
		datatype: "float",
	},
	{
		"@id": "scm:target",
		"@type": "Attribute",
		label: { zh: "目标值", en: "Target" },
		datatype: "float",
	},
	{
		"@id": "scm:unit",
		"@type": "Attribute",
		label: { zh: "单位", en: "Unit" },
		datatype: "string",
	},
	{
		"@id": "scm:measurementPeriod",
		"@type": "Attribute",
		label: { zh: "测量周期", en: "Measurement Period" },
		datatype: "string",
	},
	{
		"@id": "scm:measurementTimestamp",
		"@type": "Attribute",
		label: { zh: "测量时间戳", en: "Measurement Timestamp" },
		datatype: "datetime",
	},

	// ========== 仓库月台 (Warehouse Dock) ==========
	{
		"@id": "scm:doorCode",
		"@type": "Attribute",
		label: { zh: "月台编码", en: "Door Code" },
		datatype: "string",
		identity: true,
	},
	{
		"@id": "scm:doorType",
		"@type": "Attribute",
		label: { zh: "月台类型", en: "Door Type" },
		datatype: "string",
		enum: ["receiving", "shipping", "staging"],
	},
	{
		"@id": "scm:doorStatus",
		"@type": "Attribute",
		label: { zh: "月台状态", en: "Door Status" },
		datatype: "string",
		enum: ["occupied", "available", "maintenance"],
	},

	// ========== 结算记录 (Settlement Record) ==========
	{
		"@id": "scm:settlementDate",
		"@type": "Attribute",
		label: { zh: "结算日期", en: "Settlement Date" },
		datatype: "datetime",
	},
	{
		"@id": "scm:amount",
		"@type": "Attribute",
		label: { zh: "金额", en: "Amount" },
		datatype: "float",
	},
	{
		"@id": "scm:settlementStatus",
		"@type": "Attribute",
		label: { zh: "结算状态", en: "Settlement Status" },
		datatype: "string",
		enum: ["pending", "completed", "partial"],
	},

	// ========== 路段 (Route Segment) ==========
	{
		"@id": "scm:segmentCode",
		"@type": "Attribute",
		label: { zh: "路段编码", en: "Segment Code" },
		datatype: "string",
		identity: true,
	},

	// ========== 出库订单 (Outbound Order) ==========
	{
		"@id": "scm:outboundOrderNo",
		"@type": "Attribute",
		label: { zh: "出库订单号", en: "Outbound Order No" },
		datatype: "string",
		identity: true,
	},
	{
		"@id": "scm:scheduledShipDate",
		"@type": "Attribute",
		label: { zh: "计划发货日期", en: "Scheduled Ship Date" },
		datatype: "datetime",
	},

	// ========== 运力预订 (Capacity Booking) ==========
	{
		"@id": "scm:bookingNo",
		"@type": "Attribute",
		label: { zh: "预订号", en: "Booking No" },
		datatype: "string",
		identity: true,
	},
	{
		"@id": "scm:bookingDate",
		"@type": "Attribute",
		label: { zh: "预订日期", en: "Booking Date" },
		datatype: "datetime",
	},
	{
		"@id": "scm:capacityType",
		"@type": "Attribute",
		label: { zh: "运力类型", en: "Capacity Type" },
		datatype: "string",
	},
	{
		"@id": "scm:bookedCapacity",
		"@type": "Attribute",
		label: { zh: "预订运力", en: "Booked Capacity" },
		datatype: "float",
	},
	{
		"@id": "scm:utilizedCapacity",
		"@type": "Attribute",
		label: { zh: "已用运力", en: "Utilized Capacity" },
		datatype: "float",
	},
	{
		"@id": "scm:bookingStatus",
		"@type": "Attribute",
		label: { zh: "预订状态", en: "Booking Status" },
		datatype: "string",
	},
	{
		"@id": "scm:validFrom",
		"@type": "Attribute",
		label: { zh: "生效日期", en: "Valid From" },
		datatype: "datetime",
	},
	{
		"@id": "scm:validTo",
		"@type": "Attribute",
		label: { zh: "失效日期", en: "Valid To" },
		datatype: "datetime",
	},

	// ========== 运输招标 (Transport Tender) ==========
	{
		"@id": "scm:tenderNo",
		"@type": "Attribute",
		label: { zh: "招标号", en: "Tender No" },
		datatype: "string",
		identity: true,
	},
	{
		"@id": "scm:tenderType",
		"@type": "Attribute",
		label: { zh: "招标类型", en: "Tender Type" },
		datatype: "string",
	},
	{
		"@id": "scm:tenderStatus",
		"@type": "Attribute",
		label: { zh: "招标状态", en: "Tender Status" },
		datatype: "string",
	},
	{
		"@id": "scm:bidsReceived",
		"@type": "Attribute",
		label: { zh: "收到的投标数", en: "Bids Received" },
		datatype: "integer",
	},
	{
		"@id": "scm:selectedBid",
		"@type": "Attribute",
		label: { zh: "中标投标", en: "Selected Bid" },
		datatype: "string",
	},
	{
		"@id": "scm:tenderDate",
		"@type": "Attribute",
		label: { zh: "招标日期", en: "Tender Date" },
		datatype: "datetime",
	},
	{
		"@id": "scm:awardDate",
		"@type": "Attribute",
		label: { zh: "授标日期", en: "Award Date" },
		datatype: "datetime",
	},
	{
		"@id": "scm:contractPeriod",
		"@type": "Attribute",
		label: { zh: "合同周期", en: "Contract Period" },
		datatype: "string",
	},

	// ========== 运输车道 (Transportation Lane) ==========
	{
		"@id": "scm:laneCode",
		"@type": "Attribute",
		label: { zh: "车道编码", en: "Lane Code" },
		datatype: "string",
		identity: true,
	},
	{
		"@id": "scm:laneName",
		"@type": "Attribute",
		label: { zh: "车道名称", en: "Lane Name" },
		datatype: "string",
	},
	{
		"@id": "scm:origin",
		"@type": "Attribute",
		label: { zh: "起点", en: "Origin" },
		datatype: "string",
	},
	{
		"@id": "scm:destination",
		"@type": "Attribute",
		label: { zh: "终点", en: "Destination" },
		datatype: "string",
	},
	{
		"@id": "scm:transitTime",
		"@type": "Attribute",
		label: { zh: "运输时间", en: "Transit Time" },
		description: { zh: "单位: 天", en: "Unit: days" },
		datatype: "integer",
	},
	{
		"@id": "scm:frequency",
		"@type": "Attribute",
		label: { zh: "频次", en: "Frequency" },
		datatype: "string",
	},
	{
		"@id": "scm:serviceLevel",
		"@type": "Attribute",
		label: { zh: "服务水平", en: "Service Level" },
		datatype: "string",
	},

	// ========== 承运商绩效 (Carrier Performance) ==========
	{
		"@id": "scm:performanceNo",
		"@type": "Attribute",
		label: { zh: "绩效编号", en: "Performance No" },
		datatype: "string",
		identity: true,
	},
	{
		"@id": "scm:evaluationPeriod",
		"@type": "Attribute",
		label: { zh: "评估周期", en: "Evaluation Period" },
		datatype: "string",
	},
	{
		"@id": "scm:onTimeRate",
		"@type": "Attribute",
		label: { zh: "准时率", en: "On-Time Rate" },
		description: { zh: "单位: %", en: "Unit: %" },
		datatype: "float",
	},
	{
		"@id": "scm:damageRate",
		"@type": "Attribute",
		label: { zh: "货损率", en: "Damage Rate" },
		description: { zh: "单位: %", en: "Unit: %" },
		datatype: "float",
	},
	{
		"@id": "scm:claimRate",
		"@type": "Attribute",
		label: { zh: "索赔率", en: "Claim Rate" },
		description: { zh: "单位: %", en: "Unit: %" },
		datatype: "float",
	},
	{
		"@id": "scm:costPerformance",
		"@type": "Attribute",
		label: { zh: "成本绩效", en: "Cost Performance" },
		datatype: "float",
	},
	{
		"@id": "scm:serviceScore",
		"@type": "Attribute",
		label: { zh: "服务评分", en: "Service Score" },
		datatype: "float",
	},
	{
		"@id": "scm:overallScore",
		"@type": "Attribute",
		label: { zh: "综合评分", en: "Overall Score" },
		datatype: "float",
	},
	{
		"@id": "scm:rating",
		"@type": "Attribute",
		label: { zh: "评级", en: "Rating" },
		datatype: "string",
	},

	// ========== 路径优化方案 (Route Optimization Plan) ==========
	{
		"@id": "scm:optimizationNo",
		"@type": "Attribute",
		label: { zh: "优化编号", en: "Optimization No" },
		datatype: "string",
		identity: true,
	},
	{
		"@id": "scm:optimizationDate",
		"@type": "Attribute",
		label: { zh: "优化日期", en: "Optimization Date" },
		datatype: "datetime",
	},
	{
		"@id": "scm:optimizationObjective",
		"@type": "Attribute",
		label: { zh: "优化目标", en: "Optimization Objective" },
		datatype: "string",
	},
	{
		"@id": "scm:optimizedCost",
		"@type": "Attribute",
		label: { zh: "优化后成本", en: "Optimized Cost" },
		datatype: "float",
	},
	{
		"@id": "scm:baselineCost",
		"@type": "Attribute",
		label: { zh: "基线成本", en: "Baseline Cost" },
		datatype: "float",
	},
	{
		"@id": "scm:savingsPercent",
		"@type": "Attribute",
		label: { zh: "节省百分比", en: "Savings Percent" },
		description: { zh: "单位: %", en: "Unit: %" },
		datatype: "float",
	},
	{
		"@id": "scm:algorithmUsed",
		"@type": "Attribute",
		label: { zh: "使用的算法", en: "Algorithm Used" },
		datatype: "string",
	},
	{
		"@id": "scm:constraints",
		"@type": "Attribute",
		label: { zh: "约束条件", en: "Constraints" },
		datatype: "string",
	},

	// ========== 运费审计 (Freight Audit) ==========
	{
		"@id": "scm:auditNo",
		"@type": "Attribute",
		label: { zh: "审计号", en: "Audit No" },
		datatype: "string",
		identity: true,
	},
	{
		"@id": "scm:auditDate",
		"@type": "Attribute",
		label: { zh: "审计日期", en: "Audit Date" },
		datatype: "datetime",
	},
	{
		"@id": "scm:auditStatus",
		"@type": "Attribute",
		label: { zh: "审计状态", en: "Audit Status" },
		datatype: "string",
	},
	{
		"@id": "scm:billedAmount",
		"@type": "Attribute",
		label: { zh: "账单金额", en: "Billed Amount" },
		datatype: "float",
	},
	{
		"@id": "scm:auditedAmount",
		"@type": "Attribute",
		label: { zh: "审计金额", en: "Audited Amount" },
		datatype: "float",
	},
	{
		"@id": "scm:discrepancyAmount",
		"@type": "Attribute",
		label: { zh: "差异金额", en: "Discrepancy Amount" },
		datatype: "float",
	},
	{
		"@id": "scm:discrepancyReason",
		"@type": "Attribute",
		label: { zh: "差异原因", en: "Discrepancy Reason" },
		datatype: "string",
	},
	{
		"@id": "scm:adjustmentAmount",
		"@type": "Attribute",
		label: { zh: "调整金额", en: "Adjustment Amount" },
		datatype: "float",
	},

	// ========== 可视性事件 (Visibility Event) ==========
	{
		"@id": "scm:eventType",
		"@type": "Attribute",
		label: { zh: "事件类型", en: "Event Type" },
		datatype: "string",
	},
	{
		"@id": "scm:altitude",
		"@type": "Attribute",
		label: { zh: "海拔", en: "Altitude" },
		description: { zh: "单位: 米", en: "Unit: meters" },
		datatype: "float",
	},
	{
		"@id": "scm:speed",
		"@type": "Attribute",
		label: { zh: "速度", en: "Speed" },
		description: { zh: "单位: km/h", en: "Unit: km/h" },
		datatype: "float",
	},
	{
		"@id": "scm:heading",
		"@type": "Attribute",
		label: { zh: "航向", en: "Heading" },
		description: { zh: "单位: 度", en: "Unit: degrees" },
		datatype: "float",
	},
	{
		"@id": "scm:temperature",
		"@type": "Attribute",
		label: { zh: "温度", en: "Temperature" },
		description: { zh: "单位: 摄氏度", en: "Unit: Celsius" },
		datatype: "float",
	},
	{
		"@id": "scm:humidity",
		"@type": "Attribute",
		label: { zh: "湿度", en: "Humidity" },
		description: { zh: "单位: %", en: "Unit: %" },
		datatype: "float",
	},
	{
		"@id": "scm:shockLevel",
		"@type": "Attribute",
		label: { zh: "冲击水平", en: "Shock Level" },
		datatype: "float",
	},
	{
		"@id": "scm:geofenceStatus",
		"@type": "Attribute",
		label: { zh: "地理围栏状态", en: "Geofence Status" },
		datatype: "string",
	},
	{
		"@id": "scm:deviceNo",
		"@type": "Attribute",
		label: { zh: "设备号", en: "Device No" },
		datatype: "string",
	},

	// ========== 运输异常 (Transportation Exception) ==========
	{
		"@id": "scm:exceptionNo",
		"@type": "Attribute",
		label: { zh: "异常号", en: "Exception No" },
		datatype: "string",
		identity: true,
	},
	{
		"@id": "scm:exceptionType",
		"@type": "Attribute",
		label: { zh: "异常类型", en: "Exception Type" },
		datatype: "string",
	},
	{
		"@id": "scm:exceptionStatus",
		"@type": "Attribute",
		label: { zh: "异常状态", en: "Exception Status" },
		datatype: "string",
		enum: ["open", "acknowledged", "resolved", "closed"],
	},
	{
		"@id": "scm:resolutionAction",
		"@type": "Attribute",
		label: { zh: "解决行动", en: "Resolution Action" },
		datatype: "string",
	},
	{
		"@id": "scm:exceptionResolvedAt",
		"@type": "Attribute",
		label: { zh: "异常解决时间", en: "Exception Resolved At" },
		datatype: "datetime",
	},

	// ========== 碳排放记录 (Carbon Emission Record) ==========
	{
		"@id": "scm:emissionNo",
		"@type": "Attribute",
		label: { zh: "排放记录号", en: "Emission No" },
		datatype: "string",
		identity: true,
	},
	{
		"@id": "scm:calculationDate",
		"@type": "Attribute",
		label: { zh: "计算日期", en: "Calculation Date" },
		datatype: "datetime",
	},
	{
		"@id": "scm:emissionScope",
		"@type": "Attribute",
		label: { zh: "排放范围", en: "Emission Scope" },
		datatype: "string",
		enum: ["scope1", "scope2", "scope3"],
	},
	{
		"@id": "scm:co2EmissionKg",
		"@type": "Attribute",
		label: { zh: "CO2 排放量", en: "CO2 Emission (kg)" },
		datatype: "float",
	},
	{
		"@id": "scm:ch4EmissionKg",
		"@type": "Attribute",
		label: { zh: "CH4 排放量", en: "CH4 Emission (kg)" },
		datatype: "float",
	},
	{
		"@id": "scm:n2oEmissionKg",
		"@type": "Attribute",
		label: { zh: "N2O 排放量", en: "N2O Emission (kg)" },
		datatype: "float",
	},
	{
		"@id": "scm:co2eTotal",
		"@type": "Attribute",
		label: { zh: "CO2e 总量", en: "CO2e Total" },
		description: { zh: "二氧化碳当量", en: "Carbon Dioxide Equivalent" },
		datatype: "float",
	},
	{
		"@id": "scm:calculationMethod",
		"@type": "Attribute",
		label: { zh: "计算方法", en: "Calculation Method" },
		datatype: "string",
	},
	{
		"@id": "scm:emissionFactor",
		"@type": "Attribute",
		label: { zh: "排放因子", en: "Emission Factor" },
		datatype: "float",
	},

	// ========== 安全评估 (Security Assessment) ==========
	{
		"@id": "scm:assessmentNo",
		"@type": "Attribute",
		label: { zh: "评估编号", en: "Assessment No" },
		datatype: "string",
		identity: true,
	},
	{
		"@id": "scm:securityAssessmentDate",
		"@type": "Attribute",
		label: { zh: "安全评估日期", en: "Security Assessment Date" },
		datatype: "datetime",
	},
	{
		"@id": "scm:assessmentType",
		"@type": "Attribute",
		label: { zh: "评估类型", en: "Assessment Type" },
		datatype: "string",
	},
	{
		"@id": "scm:riskScore",
		"@type": "Attribute",
		label: { zh: "风险评分", en: "Risk Score" },
		datatype: "float",
	},
	{
		"@id": "scm:assessor",
		"@type": "Attribute",
		label: { zh: "评估人", en: "Assessor" },
		datatype: "string",
	},
	{
		"@id": "scm:certValidUntil",
		"@type": "Attribute",
		label: { zh: "认证有效期至", en: "Certification Valid Until" },
		datatype: "datetime",
	},
	{
		"@id": "scm:certificationStatus",
		"@type": "Attribute",
		label: { zh: "认证状态", en: "Certification Status" },
		datatype: "string",
	},

	// ========== 安全事件 (Security Incident) ==========
	{
		"@id": "scm:incidentNo",
		"@type": "Attribute",
		label: { zh: "事件号", en: "Incident No" },
		datatype: "string",
		identity: true,
	},
	{
		"@id": "scm:incidentType",
		"@type": "Attribute",
		label: { zh: "事件类型", en: "Incident Type" },
		datatype: "string",
	},
	{
		"@id": "scm:incidentStatus",
		"@type": "Attribute",
		label: { zh: "事件状态", en: "Incident Status" },
		datatype: "string",
	},
	{
		"@id": "scm:reportedAt",
		"@type": "Attribute",
		label: { zh: "报告时间", en: "Reported At" },
		datatype: "datetime",
	},
	{
		"@id": "scm:incidentResolvedAt",
		"@type": "Attribute",
		label: { zh: "事件解决时间", en: "Incident Resolved At" },
		datatype: "datetime",
	},

	// ========== 可持续性指标 (Sustainability Metric) ==========
	{
		"@id": "scm:metricNo",
		"@type": "Attribute",
		label: { zh: "指标编号", en: "Metric No" },
		datatype: "string",
		identity: true,
	},
	{
		"@id": "scm:subcategory",
		"@type": "Attribute",
		label: { zh: "子类别", en: "Subcategory" },
		datatype: "string",
	},
	{
		"@id": "scm:reportingPeriod",
		"@type": "Attribute",
		label: { zh: "报告周期", en: "Reporting Period" },
		datatype: "string",
	},
	{
		"@id": "scm:reportingStandard",
		"@type": "Attribute",
		label: { zh: "报告标准", en: "Reporting Standard" },
		datatype: "string",
	},
	{
		"@id": "scm:dataQuality",
		"@type": "Attribute",
		label: { zh: "数据质量", en: "Data Quality" },
		datatype: "string",
	},
	{
		"@id": "scm:verificationStatus",
		"@type": "Attribute",
		label: { zh: "验证状态", en: "Verification Status" },
		datatype: "string",
	},

	// ========== 水资源使用 (Water Usage) ==========
	{
		"@id": "scm:usageNo",
		"@type": "Attribute",
		label: { zh: "使用编号", en: "Usage No" },
		datatype: "string",
		identity: true,
	},
	{
		"@id": "scm:waterUsageDate",
		"@type": "Attribute",
		label: { zh: "水资源使用日期", en: "Water Usage Date" },
		datatype: "datetime",
	},
	{
		"@id": "scm:waterSource",
		"@type": "Attribute",
		label: { zh: "水源", en: "Water Source" },
		datatype: "string",
	},
	{
		"@id": "scm:withdrawalVolume",
		"@type": "Attribute",
		label: { zh: "取水量", en: "Withdrawal Volume" },
		description: { zh: "单位: 立方米", en: "Unit: cubic meters" },
		datatype: "float",
	},
	{
		"@id": "scm:consumptionVolume",
		"@type": "Attribute",
		label: { zh: "消耗量", en: "Consumption Volume" },
		description: { zh: "单位: 立方米", en: "Unit: cubic meters" },
		datatype: "float",
	},
	{
		"@id": "scm:dischargeVolume",
		"@type": "Attribute",
		label: { zh: "排放量", en: "Discharge Volume" },
		description: { zh: "单位: 立方米", en: "Unit: cubic meters" },
		datatype: "float",
	},
	{
		"@id": "scm:waterStressLevel",
		"@type": "Attribute",
		label: { zh: "水压力等级", en: "Water Stress Level" },
		datatype: "string",
	},

	// ========== 废弃物记录 (Waste Record) ==========
	{
		"@id": "scm:wasteNo",
		"@type": "Attribute",
		label: { zh: "废弃物号", en: "Waste No" },
		datatype: "string",
		identity: true,
	},
	{
		"@id": "scm:generationDate",
		"@type": "Attribute",
		label: { zh: "产生日期", en: "Generation Date" },
		datatype: "datetime",
	},
	{
		"@id": "scm:wasteType",
		"@type": "Attribute",
		label: { zh: "废弃物类型", en: "Waste Type" },
		datatype: "string",
	},
	{
		"@id": "scm:wasteCategory",
		"@type": "Attribute",
		label: { zh: "废弃物类别", en: "Waste Category" },
		datatype: "string",
	},
	{
		"@id": "scm:treatmentMethod",
		"@type": "Attribute",
		label: { zh: "处理方法", en: "Treatment Method" },
		datatype: "string",
	},
	{
		"@id": "scm:recyclingRate",
		"@type": "Attribute",
		label: { zh: "回收率", en: "Recycling Rate" },
		description: { zh: "单位: %", en: "Unit: %" },
		datatype: "float",
	},
	{
		"@id": "scm:disposalFacility",
		"@type": "Attribute",
		label: { zh: "处置设施", en: "Disposal Facility" },
		datatype: "string",
	},

	// ========== 劳工合规 (Labor Compliance) ==========
	{
		"@id": "scm:complianceNo",
		"@type": "Attribute",
		label: { zh: "合规编号", en: "Compliance No" },
		datatype: "string",
		identity: true,
	},
	{
		"@id": "scm:laborAssessmentDate",
		"@type": "Attribute",
		label: { zh: "劳工评估日期", en: "Labor Assessment Date" },
		datatype: "datetime",
	},
	{
		"@id": "scm:standardType",
		"@type": "Attribute",
		label: { zh: "标准类型", en: "Standard Type" },
		datatype: "string",
	},
	{
		"@id": "scm:auditScore",
		"@type": "Attribute",
		label: { zh: "审计评分", en: "Audit Score" },
		datatype: "float",
	},
	{
		"@id": "scm:nonCompliances",
		"@type": "Attribute",
		label: { zh: "不合规项数", en: "Non-Compliances" },
		datatype: "integer",
	},
	{
		"@id": "scm:correctiveActions",
		"@type": "Attribute",
		label: { zh: "纠正措施", en: "Corrective Actions" },
		datatype: "string",
	},
	{
		"@id": "scm:complianceValidUntil",
		"@type": "Attribute",
		label: { zh: "合规有效期至", en: "Compliance Valid Until" },
		datatype: "datetime",
	},

	// ========== 产品生命周期 (Product Lifecycle) ==========
	{
		"@id": "scm:lifecycleNo",
		"@type": "Attribute",
		label: { zh: "生命周期号", en: "Lifecycle No" },
		datatype: "string",
		identity: true,
	},
	{
		"@id": "scm:productNo",
		"@type": "Attribute",
		label: { zh: "产品号", en: "Product No" },
		datatype: "string",
	},
	{
		"@id": "scm:stage",
		"@type": "Attribute",
		label: { zh: "阶段", en: "Stage" },
		datatype: "string",
	},
	{
		"@id": "scm:carbonFootprint",
		"@type": "Attribute",
		label: { zh: "碳足迹", en: "Carbon Footprint" },
		description: { zh: "单位: kg CO2e", en: "Unit: kg CO2e" },
		datatype: "float",
	},
	{
		"@id": "scm:waterFootprint",
		"@type": "Attribute",
		label: { zh: "水足迹", en: "Water Footprint" },
		description: { zh: "单位: 立方米", en: "Unit: cubic meters" },
		datatype: "float",
	},
	{
		"@id": "scm:energyUse",
		"@type": "Attribute",
		label: { zh: "能耗", en: "Energy Use" },
		description: { zh: "单位: kWh", en: "Unit: kWh" },
		datatype: "float",
	},
	{
		"@id": "scm:wasteGeneration",
		"@type": "Attribute",
		label: { zh: "废弃物产生", en: "Waste Generation" },
		description: { zh: "单位: kg", en: "Unit: kg" },
		datatype: "float",
	},
	{
		"@id": "scm:recyclability",
		"@type": "Attribute",
		label: { zh: "可回收性", en: "Recyclability" },
		description: { zh: "单位: %", en: "Unit: %" },
		datatype: "float",
	},

	// ========== 可再生能源 (Renewable Energy) ==========
	{
		"@id": "scm:energyNo",
		"@type": "Attribute",
		label: { zh: "能源编号", en: "Energy No" },
		datatype: "string",
		identity: true,
	},
	{
		"@id": "scm:energyUsageDate",
		"@type": "Attribute",
		label: { zh: "能源使用日期", en: "Energy Usage Date" },
		datatype: "datetime",
	},
	{
		"@id": "scm:energySource",
		"@type": "Attribute",
		label: { zh: "能源来源", en: "Energy Source" },
		datatype: "string",
	},
	{
		"@id": "scm:energyKWh",
		"@type": "Attribute",
		label: { zh: "能源量", en: "Energy (kWh)" },
		datatype: "float",
	},
	{
		"@id": "scm:renewablePercent",
		"@type": "Attribute",
		label: { zh: "可再生比例", en: "Renewable Percent" },
		description: { zh: "单位: %", en: "Unit: %" },
		datatype: "float",
	},
	{
		"@id": "scm:certificateType",
		"@type": "Attribute",
		label: { zh: "证书类型", en: "Certificate Type" },
		datatype: "string",
	},
	{
		"@id": "scm:certificateNo",
		"@type": "Attribute",
		label: { zh: "证书号", en: "Certificate No" },
		datatype: "string",
	},

	// ========== Phase 1C 补充属性 (Missing Attributes) ==========
	{
		"@id": "scm:materialCode",
		"@type": "Attribute",
		label: { zh: "物料编码", en: "Material Code" },
		datatype: "string",
		identity: true,
	},
	{
		"@id": "scm:contractNo",
		"@type": "Attribute",
		label: { zh: "合同号", en: "Contract No" },
		datatype: "string",
		identity: true,
	},
	{
		"@id": "scm:userCode",
		"@type": "Attribute",
		label: { zh: "用户编码", en: "User Code" },
		datatype: "string",
		identity: true,
	},
	{
		"@id": "scm:inspectorCode",
		"@type": "Attribute",
		label: { zh: "检验员编码", en: "Inspector Code" },
		datatype: "string",
		identity: true,
	},
	{
		"@id": "scm:actionNo",
		"@type": "Attribute",
		label: { zh: "行动编号", en: "Action No" },
		datatype: "string",
		identity: true,
	},
	{
		"@id": "scm:actionType",
		"@type": "Attribute",
		label: { zh: "行动类型", en: "Action Type" },
		datatype: "string",
	},
	{
		"@id": "scm:planNo",
		"@type": "Attribute",
		label: { zh: "计划编号", en: "Plan No" },
		datatype: "string",
		identity: true,
	},
	{
		"@id": "scm:email",
		"@type": "Attribute",
		label: { zh: "电子邮箱", en: "Email" },
		datatype: "string",
	},
	{
		"@id": "scm:invoiceSettlementNo",
		"@type": "Attribute",
		label: { zh: "发票结算号", en: "Invoice Settlement No" },
		datatype: "string",
		identity: true,
	},

	// ========== EPCIS 2.0 核心属性 (EPCIS 2.0 Core Attributes) ==========
	{
		"@id": "scm:action",
		"@type": "Attribute",
		label: { zh: "EPCIS 操作", en: "EPCIS Action" },
		description: {
			zh: "EPCIS 事件操作类型 (ADD/OBSERVE/DELETE)",
			en: "EPCIS event action type (ADD/OBSERVE/DELETE)",
		},
		datatype: "string",
	},
	{
		"@id": "scm:bizStep",
		"@type": "Attribute",
		label: { zh: "业务步骤", en: "Business Step" },
		description: {
			zh: "EPCIS 业务步骤标识 (GS1 CBV)",
			en: "EPCIS business step identifier (GS1 CBV)",
		},
		datatype: "string",
	},
	{
		"@id": "scm:disposition",
		"@type": "Attribute",
		label: { zh: "处置状态", en: "Disposition" },
		description: {
			zh: "EPCIS 业务处置状态 (GS1 CBV)",
			en: "EPCIS business disposition (GS1 CBV)",
		},
		datatype: "string",
	},
	{
		"@id": "scm:readPoint",
		"@type": "Attribute",
		label: { zh: "识读点", en: "Read Point" },
		description: {
			zh: "EPCIS 事件发生的识读点位置",
			en: "EPCIS read point location where event occurred",
		},
		datatype: "string",
	},
	{
		"@id": "scm:bizLocation",
		"@type": "Attribute",
		label: { zh: "业务地点", en: "Business Location" },
		description: {
			zh: "EPCIS 业务地点标识",
			en: "EPCIS business location identifier",
		},
		datatype: "string",
	},
	{
		"@id": "scm:parentID",
		"@type": "Attribute",
		label: { zh: "父级标识", en: "Parent ID" },
		description: {
			zh: "EPCIS 聚合事件中的父级对象标识",
			en: "Parent object identifier in EPCIS aggregation event",
		},
		datatype: "string",
	},
	{
		"@id": "scm:transactionType",
		"@type": "Attribute",
		label: { zh: "交易类型", en: "Transaction Type" },
		description: {
			zh: "EPCIS 交易事件类型",
			en: "EPCIS transaction event type",
		},
		datatype: "string",
	},
	{
		"@id": "scm:transactionID",
		"@type": "Attribute",
		label: { zh: "交易标识", en: "Transaction ID" },
		description: {
			zh: "EPCIS 交易事件的唯一标识",
			en: "Unique identifier for EPCIS transaction event",
		},
		datatype: "string",
	},
];
