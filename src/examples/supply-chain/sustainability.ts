import type { EntityType } from "../../types";

/**
 * 可持续性与 ESG - 参考 ISO 28000、SCOR DS 2026
 *
 * 包含：
 * 1. 供应链安全 (Supply Chain Security)
 * 2. 可持续性指标 (Sustainability Metrics)
 * 3. ESG 报告 (ESG Reporting)
 * 4. 循环经济学 (Circular Economy)
 */

export const sustainabilityEntities: EntityType[] = [
	// ========== 供应链安全 (ISO 28000) ==========
	{
		"@id": "scm:SecurityAssessment",
		"@type": "EntityType",
		label: { zh: "安全评估", en: "Security Assessment" },
		kind: "entity",
		description: {
			zh: "供应链安全风险评估，参考 ISO 28000:2022 标准",
			en: "Supply chain security risk assessment per ISO 28000:2022",
		},
		attributes: [
			{ ref: "scm:assessmentNo", identity: true, required: true },
			{ ref: "scm:securityAssessmentDate", required: true },
			{ ref: "scm:assessmentType" }, // Physical, Cyber, Operational
			{ ref: "scm:riskLevel" },
			{ ref: "scm:riskScore" },
			{ ref: "scm:assessor" },
			{ ref: "scm:certValidUntil" },
			{ ref: "scm:certificationStatus" },
		],
		relations: [
			{ ref: "scm:assessesFacility" },
			{ ref: "scm:assessesSupplier" },
			{ ref: "scm:identifiesRisk" },
			{ ref: "scm:requiresMitigation" },
		],
		constraints: [],
		ui: { color: "#C62828", icon: "shield-check", group: "security" },
	},

	// ========== 安全事件 (Security Incident) ==========
	{
		"@id": "scm:SecurityIncident",
		"@type": "EntityType",
		label: { zh: "安全事件", en: "Security Incident" },
		kind: "event",
		description: {
			zh: "供应链安全事件，包括盗窃、破坏、网络攻击等",
			en: "Supply chain security incidents including theft, vandalism, cyber attacks",
		},
		attributes: [
			{ ref: "scm:incidentNo", identity: true, required: true },
			{ ref: "scm:eventTimestamp", identity: true, required: true },
			{ ref: "scm:incidentType" }, // Theft, Tampering, CyberAttack, UnauthorizedAccess
			{ ref: "scm:severity" },
			{ ref: "scm:incidentStatus" },
			{ ref: "scm:reportedAt" },
			{ ref: "scm:incidentResolvedAt" },
			{ ref: "scm:financialImpact" },
			{ ref: "scm:rootCause" },
		],
		relations: [
			{ ref: "scm:occursAtLocation" },
			{ ref: "scm:affectsShipment" },
			{ ref: "scm:affectsProduct" },
			{ ref: "scm:reportedTo" },
			{ ref: "scm:investigatedBy" },
		],
		constraints: [],
		ui: { color: "#B71C1C", icon: "alert-octagon", group: "security" },
	},

	// ========== 可持续性指标 (Sustainability Metric) ==========
	{
		"@id": "scm:SustainabilityMetric",
		"@type": "EntityType",
		label: { zh: "可持续性指标", en: "Sustainability Metric" },
		kind: "entity",
		description: {
			zh: "ESG 可持续性指标，支持 GRI、SASB、CDP 报告标准",
			en: "ESG sustainability metrics supporting GRI, SASB, CDP reporting standards",
		},
		attributes: [
			{ ref: "scm:metricNo", identity: true, required: true },
			{ ref: "scm:metricName", required: true },
			{ ref: "scm:category" }, // Environmental, Social, Governance
			{ ref: "scm:subcategory" }, // Emissions, Water, Waste, Labor, Ethics
			{ ref: "scm:value" },
			{ ref: "scm:unit" },
			{ ref: "scm:reportingPeriod" },
			{ ref: "scm:reportingStandard" }, // GRI, SASB, CDP, TCFD
			{ ref: "scm:dataQuality" }, // Estimated, Measured, Verified
			{ ref: "scm:verificationStatus" },
		],
		relations: [
			{ ref: "scm:sustainabilityMeasuresEntity" },
			{ ref: "scm:sustainabilityBelongsToCategory" },
			{ ref: "scm:reportedBy" },
			{ ref: "scm:verifiedBy" },
		],
		constraints: [],
		ui: { color: "#2E7D32", icon: "leaf", group: "sustainability" },
	},

	// ========== 水资源使用 (Water Usage) ==========
	{
		"@id": "scm:WaterUsage",
		"@type": "EntityType",
		label: { zh: "水资源使用", en: "Water Usage" },
		kind: "entity",
		description: {
			zh: "水资源消耗追踪，支持 CDP Water Security 报告",
			en: "Water consumption tracking supporting CDP Water Security reporting",
		},
		attributes: [
			{ ref: "scm:usageNo", identity: true, required: true },
			{ ref: "scm:waterUsageDate", required: true },
			{ ref: "scm:waterSource" }, // SurfaceWater, Groundwater, Seawater, RecycledWater
			{ ref: "scm:withdrawalVolume" },
			{ ref: "scm:consumptionVolume" },
			{ ref: "scm:dischargeVolume" },
			{ ref: "scm:unit" },
			{ ref: "scm:waterStressLevel" }, // Low, Medium, High
		],
		relations: [
			{ ref: "scm:atFacility" },
			{ ref: "scm:fromWatershed" },
			{ ref: "scm:dischargesTo" },
		],
		constraints: [],
		ui: { color: "#0277BD", icon: "water", group: "sustainability" },
	},

	// ========== 废弃物管理 (Waste Management) ==========
	{
		"@id": "scm:WasteRecord",
		"@type": "EntityType",
		label: { zh: "废弃物记录", en: "Waste Record" },
		kind: "entity",
		description: {
			zh: "废弃物产生、处理和回收记录，支持循环经济报告",
			en: "Waste generation, treatment and recycling records supporting circular economy reporting",
		},
		attributes: [
			{ ref: "scm:wasteNo", identity: true, required: true },
			{ ref: "scm:generationDate", required: true },
			{ ref: "scm:wasteType" }, // Hazardous, NonHazardous, Organic, Recyclable
			{ ref: "scm:wasteCategory" }, // Industrial, Commercial, Municipal
			{ ref: "scm:quantity" },
			{ ref: "scm:unit" },
			{ ref: "scm:treatmentMethod" }, // Recycle, Incinerate, Landfill, Compost
			{ ref: "scm:recyclingRate" },
			{ ref: "scm:disposalFacility" },
		],
		relations: [
			{ ref: "scm:generatedAt" },
			{ ref: "scm:treatedAt" },
			{ ref: "scm:fromProduct" },
		],
		constraints: [],
		ui: { color: "#5D4037", icon: "recycle", group: "sustainability" },
	},

	// ========== 劳动与社会责任 (Labor & Social Responsibility) ==========
	{
		"@id": "scm:LaborCompliance",
		"@type": "EntityType",
		label: { zh: "劳工合规", en: "Labor Compliance" },
		kind: "entity",
		description: {
			zh: "劳工标准和社会责任合规性评估，支持 SA8000、ISO 26000",
			en: "Labor standards and social responsibility compliance per SA8000, ISO 26000",
		},
		attributes: [
			{ ref: "scm:complianceNo", identity: true, required: true },
			{ ref: "scm:laborAssessmentDate", required: true },
			{ ref: "scm:standardType" }, // SA8000, ISO26000, BSCI, Sedex
			{ ref: "scm:complianceStatus" },
			{ ref: "scm:auditScore" },
			{ ref: "scm:nonCompliances" },
			{ ref: "scm:correctiveActions" },
			{ ref: "scm:complianceValidUntil" },
		],
		relations: [
			{ ref: "scm:assessesSupplier" },
			{ ref: "scm:assessesFacility" },
			{ ref: "scm:complianceAuditedBy" },
		],
		constraints: [],
		ui: { color: "#E65100", icon: "users", group: "sustainability" },
	},

	// ========== 产品生命周期 (Product Lifecycle) ==========
	{
		"@id": "scm:ProductLifecycle",
		"@type": "EntityType",
		label: { zh: "产品生命周期", en: "Product Lifecycle" },
		kind: "entity",
		description: {
			zh: "产品从原材料到废弃的完整生命周期，支持 LCA 评估",
			en: "Complete product lifecycle from raw materials to disposal supporting LCA assessment",
		},
		attributes: [
			{ ref: "scm:lifecycleNo", identity: true, required: true },
			{ ref: "scm:productNo" },
			{ ref: "scm:stage" }, // RawMaterial, Manufacturing, Distribution, Use, EndOfLife
			{ ref: "scm:carbonFootprint" },
			{ ref: "scm:waterFootprint" },
			{ ref: "scm:energyUse" },
			{ ref: "scm:wasteGeneration" },
			{ ref: "scm:recyclability" },
		],
		relations: [
			{ ref: "scm:forProduct" },
			{ ref: "scm:hasCarbonFootprint" },
			{ ref: "scm:hasWaterFootprint" },
		],
		constraints: [],
		ui: { color: "#689F38", icon: "cycle", group: "sustainability" },
	},

	// ========== 可再生能源 (Renewable Energy) ==========
	{
		"@id": "scm:RenewableEnergy",
		"@type": "EntityType",
		label: { zh: "可再生能源", en: "Renewable Energy" },
		kind: "entity",
		description: {
			zh: "可再生能源使用和采购记录，支持 RE100、CDP Renewables",
			en: "Renewable energy usage and procurement records supporting RE100, CDP Renewables",
		},
		attributes: [
			{ ref: "scm:energyNo", identity: true, required: true },
			{ ref: "scm:energyUsageDate", required: true },
			{ ref: "scm:energySource" }, // Solar, Wind, Hydro, Biomass, Geothermal
			{ ref: "scm:energyKWh" },
			{ ref: "scm:renewablePercent" },
			{ ref: "scm:certificateType" }, // REC, GO, IREC
			{ ref: "scm:certificateNo" },
		],
		relations: [
			{ ref: "scm:usedByFacility" },
			{ ref: "scm:energySuppliedBy" },
			{ ref: "scm:certifiedBy" },
		],
		constraints: [],
		ui: { color: "#FDD835", icon: "solar-power", group: "sustainability" },
	},

	// ========== 可持续性类别 (Sustainability Category) ==========
	{
		"@id": "scm:SustainabilityCategory",
		"@type": "EntityType",
		kind: "value",
		label: { zh: "可持续性类别", en: "Sustainability Category" },
		description: {
			zh: "可持续性指标分类，如环境、社会、治理",
			en: "Sustainability metric categories such as environmental, social, governance",
		},
		attributes: [],
		relations: [],
		constraints: [],
	},
];
