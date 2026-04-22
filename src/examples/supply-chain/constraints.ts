import type { Constraint } from "../../types";

export const constraints: Constraint[] = [
	{
		"@id": "scm:ArrivalAfterDeparture",
		"@type": "Constraint",
		on: "scm:ShipmentDispatched",
		rule: "plannedArrival >= plannedDeparture",
		message: {
			zh: "到达时间必须晚于出发时间",
			en: "Arrival must be after departure",
		},
		severity: "error",
	},
	{
		"@id": "scm:ActualDatesConsistency",
		"@type": "Constraint",
		on: "scm:ShipmentDispatched",
		rule: "actualArrival >= actualDeparture",
		message: {
			zh: "实际到达不得早于实际出发",
			en: "Actual arrival must not precede actual departure",
		},
		severity: "error",
	},
	{
		"@id": "scm:PositiveQuantity",
		"@type": "Constraint",
		on: "scm:Order",
		rule: "quantity > 0",
		message: { zh: "数量必须大于零", en: "Quantity must be positive" },
		severity: "error",
	},
	{
		"@id": "scm:PositiveAmount",
		"@type": "Constraint",
		on: "scm:Invoice",
		rule: "totalAmount >= 0",
		message: { zh: "金额不得为负", en: "Amount must not be negative" },
		severity: "error",
	},
	{
		"@id": "scm:ValidSupplierTier",
		"@type": "Constraint",
		on: "scm:Supplier",
		rule: "supplierTier >= 1",
		message: {
			zh: "供应商层级必须大于等于1",
			en: "Supplier tier must be >= 1",
		},
		severity: "warning",
	},
	{
		"@id": "scm:ExpiryAfterProduction",
		"@type": "Constraint",
		on: "scm:Product",
		rule: "expiryDate > eventTimestamp",
		message: {
			zh: "有效期必须晚于生产日期",
			en: "Expiry must be after production date",
		},
		severity: "warning",
	},
	{
		"@id": "scm:CapacityNonNegative",
		"@type": "Constraint",
		on: "scm:Warehouse",
		rule: "capacity >= 0",
		message: { zh: "容量不得为负", en: "Capacity must be non-negative" },
		severity: "error",
	},
	{
		"@id": "scm:ValidHSCode",
		"@type": "Constraint",
		on: "scm:Product",
		rule: "hsCode matches ^\\d{6,10}$",
		message: { zh: "海关编码格式不正确", en: "Invalid HS Code format" },
		severity: "warning",
	},

	// ========== AI Text2Cypher 优化约束 ==========
	{
		"@id": "scm:ValidShipmentDate",
		"@type": "Constraint",
		on: "scm:TransportOrder",
		rule: "actualDeparture >= plannedDeparture",
		message: {
			zh: "实际出发时间不得早于计划",
			en: "Actual departure must not be before planned",
		},
		severity: "warning",
	},
	{
		"@id": "scm:OrderStatusValid",
		"@type": "Constraint",
		on: "scm:Order",
		rule: "paymentStatus in ['pending', 'paid', 'refunded']",
		message: { zh: "支付状态必须有效", en: "Payment status must be valid" },
		severity: "error",
	},
	{
		"@id": "scm:InventoryRespected",
		"@type": "Constraint",
		on: "scm:InventoryReservation",
		rule: "reservedQty <= onHandQty",
		message: {
			zh: "预订库存不得大于可用库存",
			en: "Reserved quantity must not exceed available",
		},
		severity: "error",
	},
	{
		"@id": "scm:DeliveryBeforePayment",
		"@type": "Constraint",
		on: "scm:Order",
		rule: "deliveryDate <= paymentDueDate",
		message: {
			zh: "交付日期应早于付款日期",
			en: "Delivery should be before payment due",
		},
		severity: "info",
	},
	{
		"@id": "scm:ValidRouteDistance",
		"@type": "Constraint",
		on: "scm:RouteSegment",
		rule: "distance > 0",
		message: {
			zh: "路段距离必须大于零",
			en: "Route segment distance must be positive",
		},
		severity: "error",
	},
	{
		"@id": "scm:SupplierLeadTimeValid",
		"@type": "Constraint",
		on: "scm:Supplier",
		rule: "leadTime >= 0 AND leadTime <= 365",
		message: {
			zh: "供应商交货期必须在 0-365 天内",
			en: "Supplier lead time must be 0-365 days",
		},
		severity: "warning",
	},
	{
		"@id": "scm:WarehouseUtilizationValid",
		"@type": "Constraint",
		on: "scm:Warehouse",
		rule: "utilizationRate >= 0 AND utilizationRate <= 100",
		message: {
			zh: "仓库利用率必须在 0-100%",
			en: "Warehouse utilization must be 0-100%",
		},
		severity: "error",
	},
	{
		"@id": "scm:CarrierOnTimePerformance",
		"@type": "Constraint",
		on: "scm:Carrier",
		rule: "onTimeRate >= 0 AND onTimeRate <= 1",
		message: {
			zh: "承运商准时率必须在 0-1 之间",
			en: "Carrier on-time rate must be 0-1",
		},
		severity: "warning",
	},

	// ========== AI Text2Cypher 优化约束 - 追溯查询 ==========
	{
		"@id": "scm:TraceabilityPathValid",
		"@type": "Constraint",
		on: "scm:Product",
		rule: "manufacturedAt.date <= NOW() AND manufacturedAt.date >= expiryDate",
		message: {
			zh: "生产日期必须在有效期内",
			en: "Manufacturing date must be within validity period",
		},
		severity: "warning",
	},
	{
		"@id": "scm:SupplyChainIntegrity",
		"@type": "Constraint",
		on: "scm:Supplier",
		rule: "leadTime >= 0 AND supplierTier >= 1 AND supplierTier <= 5",
		message: {
			zh: "供应商交货期和层级必须有效",
			en: "Supplier lead time and tier must be valid",
		},
		severity: "error",
	},

	// ========== AI Text2Cypher 优化约束 - 影响分析 ==========
	{
		"@id": "scm:ImpactAnalysisConsistency",
		"@type": "Constraint",
		on: "scm:DelayAlert",
		rule: "impactLevel >= 0 AND impactLevel <= 1 AND estimatedDelayHours >= 0",
		message: {
			zh: "影响分析和延迟时间必须有效",
			en: "Impact analysis and delay estimates must be valid",
		},
		severity: "error",
	},
	{
		"@id": "scm:InventoryDependencyValid",
		"@type": "Constraint",
		on: "scm:InventoryReservation",
		rule: "reservedQty > 0 AND reservedQty <= onHandQty AND reservationDate <= expirationDate",
		message: {
			zh: "库存预留数量和日期必须有效",
			en: "Inventory reservation quantity and date must be valid",
		},
		severity: "error",
	},

	// ========== AI Text2Cypher 优化约束 - 关键路径 ==========
	{
		"@id": "scm:CriticalPathPriority",
		"@type": "Constraint",
		on: "scm:TransportOrder",
		rule: "priority >= 1 AND priority <= 10 AND plannedDuration > 0",
		message: {
			zh: "关键路径优先级和持续时间必须有效",
			en: "Critical path priority and duration must be valid",
		},
		severity: "warning",
	},
	{
		"@id": "scm:OrderSequenceValid",
		"@type": "Constraint",
		on: "scm:Order",
		rule: "orderDate <= deliveryDate AND orderDate <= paymentDueDate",
		message: {
			zh: "订单日期必须早于交付和付款日期",
			en: "Order date must be before delivery and payment due dates",
		},
		severity: "error",
	},
];
