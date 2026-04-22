import type { LogicRule } from "../../types";

/**
 * InventoryAlertRule - 库存预警规则
 * 当库存低于安全阈值时触发预警
 */
export const InventoryAlertRule: LogicRule = {
	"@id": "sc:InventoryAlertRule",
	"@type": "LogicRule",
	label: { zh: "库存预警规则", en: "Inventory Alert Rule" },
	description: {
		zh: "当库存低于安全阈值时触发预警通知",
		en: "Trigger alert when inventory falls below safety threshold",
	},
	category: "trigger",
	trigger: {
		mode: "on_change",
		targetTypes: ["scm:InventorySnapshot"],
		watchedAttributes: ["scm:onHandQty", "scm:availableQty"],
		priority: 100,
	},
	condition: {
		language: "typescript",
		body: "entity.availableQty < entity.safetyStockThreshold || (entity.availableQty / entity.reorderPoint) < 0.2",
		description: {
			zh: "检查可用库存是否低于安全库存阈值或达到再订货点的20%",
			en: "Check if available quantity is below safety stock threshold or reaches 20% of reorder point",
		},
	},
	action: {
		language: "typescript",
		body: `
      const alertLevel = entity.availableQty === 0 ? 'critical' : 
                        entity.availableQty < entity.safetyStockThreshold ? 'warning' : 'info';
      emitEvent('scm:InventoryAlert', {
        product: entity.product,
        warehouse: entity.warehouse,
        currentQty: entity.onHandQty,
        availableQty: entity.availableQty,
        threshold: entity.safetyStockThreshold,
        alertLevel: alertLevel,
        suggestedAction: alertLevel === 'critical' ? '紧急补货' : '计划补货',
        timestamp: new Date().toISOString()
      });
      notifyRoles(['scm:InventoryManager', 'scm:PurchasingManager'], {
        channel: alertLevel === 'critical' ? 'sms' : 'email',
        message: \`库存预警: \${entity.product} 在 \${entity.warehouse} 的可用库存(\${entity.availableQty})低于阈值(\${entity.safetyStockThreshold})\`
      });
    `,
		description: {
			zh: "发送库存预警通知给库存经理和采购经理",
			en: "Send inventory alert notification to inventory manager and purchasing manager",
		},
	},
	conflictResolution: {
		strategy: "highest_priority",
	},
	enabled: true,
	tags: ["inventory", "alert", "threshold", "reorder"],
};

/**
 * SupplierRatingRule - 供应商评级规则
 * 根据交付准时率、质量合格率等指标评估供应商绩效
 */
export const SupplierRatingRule: LogicRule = {
	"@id": "sc:SupplierRatingRule",
	"@type": "LogicRule",
	label: { zh: "供应商评级规则", en: "Supplier Rating Rule" },
	description: {
		zh: "根据交付准时率、质量合格率、响应速度等指标自动计算供应商评级",
		en: "Automatically calculate supplier rating based on on-time delivery rate, quality pass rate, and response time",
	},
	category: "derivation",
	trigger: {
		mode: "scheduled",
		cronExpression: "0 0 1 * *", // 每月1日执行
		targetTypes: ["scm:Supplier"],
		priority: 50,
	},
	condition: {
		language: "typescript",
		body: "entity.transactions && entity.transactions.length > 0",
		description: {
			zh: "供应商有交易记录时执行评级计算",
			en: "Execute rating calculation when supplier has transaction records",
		},
	},
	action: {
		language: "typescript",
		body: `
      const stats = calculateSupplierStats(entity['@id'], { period: 'last_90_days' });
      const onTimeRate = stats.onTimeDeliveries / stats.totalDeliveries;
      const qualityRate = 1 - (stats.defectiveQty / stats.totalQty);
      const responseScore = Math.min(stats.avgResponseTime / 24, 5); // 响应时间评分，越短越好
      
      // 加权计算综合评分 (满分100)
      const overallScore = Math.round(
        onTimeRate * 40 +           // 交付准时率占40%
        qualityRate * 40 +          // 质量合格率占40%
        (1 - responseScore / 5) * 20 // 响应速度占20%
      );
      
      // 确定评级等级
      let rating;
      if (overallScore >= 90) rating = 'A';
      else if (overallScore >= 80) rating = 'B';
      else if (overallScore >= 70) rating = 'C';
      else if (overallScore >= 60) rating = 'D';
      else rating = 'F';
      
      updateEntity(entity['@id'], {
        rating: rating,
        overallScore: overallScore,
        onTimeRate: Math.round(onTimeRate * 100) / 100,
        qualityRate: Math.round(qualityRate * 100) / 100,
        lastEvaluatedAt: new Date().toISOString()
      });
      
      if (rating === 'F' || rating === 'D') {
        emitEvent('scm:SupplierPerformanceAlert', {
          supplier: entity['@id'],
          rating: rating,
          score: overallScore,
          reason: rating === 'F' ? '绩效严重不足，建议更换供应商' : '绩效偏低，需要改进',
          recommendedAction: rating === 'F' ? '启动供应商退出流程' : '制定改进计划'
        });
      }
    `,
		description: {
			zh: "计算供应商综合评分并更新评级",
			en: "Calculate supplier composite score and update rating",
		},
	},
	conflictResolution: {
		strategy: "first_match",
	},
	enabled: true,
	tags: ["supplier", "rating", "performance", "evaluation"],
};

/**
 * DemandForecastRule - 需求预测规则
 * 基于历史销售数据和市场趋势预测未来需求
 */
export const DemandForecastRule: LogicRule = {
	"@id": "sc:DemandForecastRule",
	"@type": "LogicRule",
	label: { zh: "需求预测规则", en: "Demand Forecast Rule" },
	description: {
		zh: "基于历史销售数据、季节性趋势和市场活动预测未来产品需求",
		en: "Predict future product demand based on historical sales data, seasonal trends, and market activities",
	},
	category: "derivation",
	trigger: {
		mode: "scheduled",
		cronExpression: "0 2 * * 1", // 每周一凌晨2点执行
		targetTypes: ["scm:Product"],
		priority: 40,
	},
	condition: {
		language: "typescript",
		body: "entity.salesHistory && entity.salesHistory.length >= 30",
		description: {
			zh: "产品有至少30天的销售历史数据时进行预测",
			en: "Forecast when product has at least 30 days of sales history",
		},
	},
	action: {
		language: "typescript",
		body: `
      const history = entity.salesHistory;
      const trends = analyzeTrends(history, { method: 'ema', period: 7 });
      const seasonality = detectSeasonality(history, { period: 365 });
      
      // 生成未来14天的预测
      const forecast = [];
      const now = new Date();
      for (let i = 1; i <= 14; i++) {
        const forecastDate = new Date(now);
        forecastDate.setDate(now.getDate() + i);
        
        // 基础趋势 + 季节性因子 + 增长趋势
        const dayOfWeek = forecastDate.getDay();
        const dayOfYear = Math.floor((forecastDate - new Date(forecastDate.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
        
        let baseDemand = trends.forecast[i] || trends.avg;
        const seasonalFactor = seasonality.factors[dayOfYear % 365] || 1.0;
        const weeklyFactor = seasonality.weeklyFactors[dayOfWeek] || 1.0;
        
        const predictedDemand = Math.round(baseDemand * seasonalFactor * weeklyFactor);
        const confidence = Math.max(0.6, 1 - (i * 0.02)); // 预测越远，置信度越低
        
        forecast.push({
          date: forecastDate.toISOString().split('T')[0],
          predictedDemand: predictedDemand,
          confidence: Math.round(confidence * 100) / 100,
          lowerBound: Math.round(predictedDemand * (1 - (1 - confidence))),
          upperBound: Math.round(predictedDemand * (1 + (1 - confidence)))
        });
      }
      
      // 计算建议补货量
      const totalForecast = forecast.reduce((sum, f) => sum + f.predictedDemand, 0);
      const currentStock = entity.currentStock || 0;
      const safetyStock = entity.safetyStock || 0;
      const recommendedReorder = Math.max(0, totalForecast + safetyStock - currentStock);
      
      updateEntity(entity['@id'], {
        demandForecast: forecast,
        forecastGeneratedAt: new Date().toISOString(),
        forecastPeriod: '14_days',
        recommendedReorderQty: recommendedReorder,
        forecastConfidence: forecast[0]?.confidence || 0.8
      });
      
      // 如果预测需求激增，触发预警
      const avgDailyDemand = trends.avg;
      const peakDemand = Math.max(...forecast.map(f => f.predictedDemand));
      if (peakDemand > avgDailyDemand * 2) {
        emitEvent('scm:DemandSurgeAlert', {
          product: entity['@id'],
          peakDate: forecast.find(f => f.predictedDemand === peakDemand)?.date,
          peakDemand: peakDemand,
          avgDemand: avgDailyDemand,
          surgeFactor: Math.round((peakDemand / avgDailyDemand) * 100) / 100,
          recommendedAction: '增加安全库存或提前备货'
        });
      }
    `,
		description: {
			zh: "生成未来14天的需求预测并计算建议补货量",
			en: "Generate 14-day demand forecast and calculate recommended reorder quantity",
		},
	},
	conflictResolution: {
		strategy: "merge",
		mergeExpression: {
			language: "typescript",
			body: "mergeForecastResults(results)",
		},
	},
	enabled: true,
	tags: ["demand", "forecast", "prediction", "inventory-planning"],
};

/**
 * QualityAnomalyDetectionRule - 质量异常检测规则
 * 检测产品质量指标异常，触发质量警报
 */
export const QualityAnomalyDetectionRule: LogicRule = {
	"@id": "sc:QualityAnomalyDetectionRule",
	"@type": "LogicRule",
	label: { zh: "质量异常检测规则", en: "Quality Anomaly Detection Rule" },
	description: {
		zh: "检测产品缺陷率、退货率等质量指标的异常波动",
		en: "Detect abnormal fluctuations in product defect rate, return rate and other quality metrics",
	},
	category: "validation",
	trigger: {
		mode: "on_change",
		targetTypes: ["scm:QualityInspected", "scm:Product"],
		watchedAttributes: ["scm:defectRate", "scm:qualityGrade"],
		priority: 90,
	},
	condition: {
		language: "typescript",
		body: "entity.defectRate > 0.05 || entity.qualityGrade === 'reject' || entity.returnRate > 0.03",
		description: {
			zh: "缺陷率超过5%或质量等级为拒收或退货率超过3%时触发",
			en: "Trigger when defect rate exceeds 5% or quality grade is reject or return rate exceeds 3%",
		},
	},
	action: {
		language: "typescript",
		body: `
      const severity = entity.defectRate > 0.1 || entity.returnRate > 0.05 ? 'critical' : 
                      entity.defectRate > 0.05 || entity.returnRate > 0.03 ? 'high' : 'medium';
      
      const anomalyType = entity.defectRate > 0.05 ? 'DEFECT_RATE_SPIKE' :
                         entity.qualityGrade === 'reject' ? 'QUALITY_REJECTED' :
                         entity.returnRate > 0.03 ? 'RETURN_RATE_HIGH' : 'QUALITY_ANOMALY';
      
      // 创建质量事件
      const qualityEvent = createEntity('scm:QualityIssue', {
        eventTimestamp: new Date().toISOString(),
        issueType: anomalyType,
        severity: severity,
        product: entity.product || entity['@id'],
        defectRate: entity.defectRate,
        returnRate: entity.returnRate,
        batchNumber: entity.batchNumber,
        supplier: entity.supplier,
        description: \`质量异常检测: \${anomalyType}, 缺陷率: \${(entity.defectRate * 100).toFixed(1)}%\`,
        status: 'open'
      });
      
      // 发送通知
      notifyRoles(['scm:QualityManager', 'scm:ProductionManager', 'scm:SupplierManager'], {
        channel: severity === 'critical' ? 'sms' : 'email',
        priority: severity,
        message: \`[\${severity.toUpperCase()}] 质量异常: 产品 \${entity.product || entity['@id']} \${anomalyType}, 缺陷率 \${(entity.defectRate * 100).toFixed(1)}%\`
      });
      
      // 触发关联流程
      if (severity === 'critical') {
        emitEvent('scm:QualityHoldTriggered', {
          product: entity.product || entity['@id'],
          batchNumber: entity.batchNumber,
          reason: anomalyType,
          holdType: 'quality_hold',
          requiresRecall: entity.defectRate > 0.15
        });
        
        // 自动创建供应商审核任务
        if (entity.supplier) {
          emitEvent('scm:SupplierAuditRequired', {
            supplier: entity.supplier,
            triggeredBy: qualityEvent['@id'],
            auditType: 'quality_review',
            priority: 'urgent'
          });
        }
      }
      
      // 更新产品质量状态
      updateEntity(entity.product || entity['@id'], {
        qualityStatus: severity === 'critical' ? 'hold' : 'review',
        lastQualityCheck: new Date().toISOString(),
        qualityAlertCount: (entity.qualityAlertCount || 0) + 1
      });
    `,
		description: {
			zh: "创建质量事件并触发相应处理流程",
			en: "Create quality event and trigger corresponding handling process",
		},
	},
	conflictResolution: {
		strategy: "all",
	},
	enabled: true,
	tags: ["quality", "anomaly", "detection", "defect", "alert"],
};

/**
 * LeadTimeVarianceRule - 交货周期偏差规则
 * 监控供应商实际交货周期与承诺周期的偏差
 */
export const LeadTimeVarianceRule: LogicRule = {
	"@id": "sc:LeadTimeVarianceRule",
	"@type": "LogicRule",
	label: { zh: "交货周期偏差规则", en: "Lead Time Variance Rule" },
	description: {
		zh: "监控供应商实际交货周期与承诺周期的偏差，识别交付风险",
		en: "Monitor variance between actual and promised lead times to identify delivery risks",
	},
	category: "trigger",
	trigger: {
		mode: "on_change",
		targetTypes: ["scm:PurchaseOrder"],
		watchedAttributes: ["scm:actualArrival", "scm:plannedArrival"],
		priority: 60,
	},
	condition: {
		language: "typescript",
		body: "entity.actualArrival && entity.plannedArrival && (new Date(entity.actualArrival) - new Date(entity.plannedArrival)) > (24 * 60 * 60 * 1000)",
		description: {
			zh: "实际到达时间晚于计划到达时间超过1天时触发",
			en: "Trigger when actual arrival is more than 1 day later than planned arrival",
		},
	},
	action: {
		language: "typescript",
		body: `
      const varianceDays = Math.ceil((new Date(entity.actualArrival) - new Date(entity.plannedArrival)) / (24 * 60 * 60 * 1000));
      const variancePct = Math.round((varianceDays / entity.leadTime) * 100);
      
      const severity = varianceDays > 7 ? 'critical' : varianceDays > 3 ? 'high' : 'medium';
      
      // 记录偏差事件
      createEntity('scm:DeliveryDelay', {
        eventTimestamp: new Date().toISOString(),
        purchaseOrder: entity['@id'],
        supplier: entity.supplier,
        plannedDate: entity.plannedArrival,
        actualDate: entity.actualArrival,
        varianceDays: varianceDays,
        variancePct: variancePct,
        severity: severity,
        impact: calculateDelayImpact(entity, varianceDays)
      });
      
      // 更新供应商准时率统计
      updateSupplierStats(entity.supplier, {
        delayedDeliveries: { increment: 1 },
        totalDeliveries: { increment: 1 },
        avgVariance: { avg: varianceDays }
      });
      
      if (varianceDays > 3) {
        notifyRoles(['scm:PurchasingManager', 'scm:SupplierManager'], {
          channel: severity === 'critical' ? 'sms' : 'email',
          message: \`交付延迟警告: PO \${entity.poNumber} 延迟 \${varianceDays} 天(\${variancePct}%超出承诺周期)\`
        });
      }
    `,
		description: {
			zh: "记录交货延迟并更新供应商统计",
			en: "Record delivery delay and update supplier statistics",
		},
	},
	conflictResolution: {
		strategy: "highest_priority",
	},
	enabled: true,
	tags: ["lead-time", "delivery", "variance", "supplier-performance"],
};

/**
 * Supply chain logic rules collection
 * 包含所有供应链相关的逻辑规则
 */
export const supplyChainRules: LogicRule[] = [
	InventoryAlertRule,
	SupplierRatingRule,
	DemandForecastRule,
	QualityAnomalyDetectionRule,
	LeadTimeVarianceRule,
];
