import type { LocalizedText } from "./types";

/**
 * 规则类型定义
 *
 * 支持多种规则语言：
 * - SWRL: Semantic Web Rule Language
 * - SHACL: Shapes Constraint Language
 * - custom: 自定义规则格式
 */
export type RuleType = "SWRL" | "SHACL" | "custom";

/**
 * 规则定义
 *
 * 基于生产式规则系统的核心结构，包含条件（IF）和结论（THEN）。
 *
 * @example
 * ```typescript
 * const rule: Rule = {
 *   "@id": "sc:low-stock-alert",
 *   "@type": "Rule",
 *   name: { zh: "低库存预警", en: "Low Stock Alert" },
 *   type: "custom",
 *   condition: {
 *     operator: "AND",
 *     conditions: [
 *       { property: "stock", operator: "<", value: 10 }
 *     ]
 *   },
 *   conclusion: {
 *     action: "alert",
 *     target: "warehouse"
 *   },
 *   priority: 100,
 *   enabled: true,
 *   metadata: {
 *     created: "2026-04-06",
 *     author: "system"
 *   }
 * };
 * ```
 */
export interface Rule {
	/** 全局唯一标识符，格式为 namespace:name */
	"@id": string;
	/** 类型标识符 */
	"@type": "Rule";
	/** 规则名称（支持多语言） */
	name: LocalizedText;
	/** 规则描述（可选） */
	description?: LocalizedText;
	/** 规则类型 */
	type: RuleType;
	/** 规则条件（IF 部分） */
	condition: RuleCondition;
	/** 规则结论（THEN 部分） */
	conclusion: RuleConclusion;
	/** 规则优先级（数值越大优先级越高） */
	priority: number;
	/** 规则是否启用 */
	enabled: boolean;
	/** 规则元数据 */
	metadata: RuleMetadata;
}

/**
 * 规则条件表达式
 *
 * 支持逻辑组合（AND、OR、NOT）和原子条件。
 */
export interface RuleCondition {
	/** 逻辑操作符 */
	operator: "AND" | "OR" | "NOT";
	/** 子条件列表（可以是原子条件或嵌套条件） */
	conditions: (AtomicCondition | RuleCondition)[];
}

/**
 * 原子条件
 *
 * 用于比较单个属性值的原子条件。
 */
export interface AtomicCondition {
	/** 属性名 */
	property: string;
	/** 比较操作符 */
	operator:
		| "=="
		| "!="
		| ">"
		| "<"
		| ">="
		| "<="
		| "contains"
		| "matches"
		| "exists";
	/** 比较值 */
	value: unknown;
}

/**
 * 规则结论
 *
 * 定义规则触发后执行的操作。
 */
export interface RuleConclusion {
	/** 操作类型 */
	action: "infer" | "modify" | "create" | "delete" | "alert";
	/** 操作目标（实体 ID 或属性名） */
	target: string;
	/** 属性变更（用于 modify 操作） */
	changes?: Record<string, unknown>;
}

/**
 * 规则元数据
 *
 * 记录规则的创建、修改等元信息。
 */
export interface RuleMetadata {
	/** 创建时间（ISO 8601 格式） */
	created: string;
	/** 创建者 */
	author: string;
	/** 修改时间（可选） */
	modified?: string;
	/** 修改者（可选） */
	modifiedBy?: string;
	/** 标签（可选） */
	tags?: string[];
	/** 自定义字段 */
	[key: string]: unknown;
}

/**
 * 事实（Fact）
 *
 * 推理引擎输入的基本数据单元。
 */
export interface Fact {
	/** 实体 ID */
	entityId: string;
	/** 实体类型 */
	entityType: string;
	/** 属性值集合 */
	properties: Record<string, unknown>;
	/** 时间戳 */
	timestamp: string;
}

/**
 * 推理目标（Goal）
 *
 * 反向推理的目标定义。
 */
export interface Goal {
	/** 目标实体 ID */
	entityId: string;
	/** 目标属性 */
	property: string;
	/** 期望值 */
	expectedValue?: unknown;
}

/**
 * 规则触发器（Trigger）
 *
 * 记录规则触发信息，用于冲突解决。
 */
export interface Trigger {
	/** 规则 ID */
	ruleId: string;
	/** 触发优先级 */
	priority: number;
	/** 匹配的事实 */
	matchedFacts: Fact[];
	/** 触发时间戳 */
	timestamp: string;
}

/**
 * 推理结果（InferenceResult）
 *
 * 记录单次推理的输出。
 */
export interface InferenceResult {
	/** 触发的规则 ID */
	ruleId: string;
	/** 执行的操作 */
	action: string;
	/** 推理出的新事实（可选） */
	newFact?: Fact;
	/** 推理结论 */
	conclusion: RuleConclusion;
	/** 推理时间戳 */
	timestamp: string;
}

/**
 * 推理解释（Explanation）
 *
 * 提供推理过程的可解释性说明。
 */
export interface Explanation {
	/** 推理结果 */
	result: InferenceResult;
	/** 使用的规则 */
	rule: Rule;
	/** 匹配的事实 */
	matchedFacts: Fact[];
	/** 推理路径 */
	reasoningPath: string[];
	/** 解释文本 */
	explanation: string;
}

/**
 * 规则验证结果
 *
 * 验证规则语法和语义的正确性。
 */
export interface RuleValidationResult {
	/** 是否有效 */
	valid: boolean;
	/** 语法错误列表 */
	syntaxErrors: string[];
	/** 语义错误列表 */
	semanticErrors: string[];
	/** 冲突列表 */
	conflicts: RuleConflict[];
}

/**
 * 规则冲突（RuleConflict）
 *
 * 记录规则之间的冲突关系。
 */
export interface RuleConflict {
	/** 冲突规则 ID 1 */
	ruleId1: string;
	/** 冲突规则 ID 2 */
	ruleId2: string;
	/** 冲突类型 */
	type: "contradiction" | "inconsistency" | "dependency";
	/** 冲突描述 */
	description: string;
}

/**
 * 规则测试结果
 *
 * 记录规则测试的执行结果。
 */
export interface RuleTestResult {
	/** 规则 ID */
	ruleId: string;
	/** 测试数据 */
	testData: Fact[];
	/** 是否触发 */
	triggered: boolean;
	/** 推理结果 */
	results?: InferenceResult[];
	/** 测试时间戳 */
	timestamp: string;
}

/**
 * 规则库（RuleSet）
 *
 * 规则集合，支持分组和管理。
 */
export interface RuleSet {
	/** 规则库 ID */
	"@id": string;
	/** 规则库名称 */
	name: LocalizedText;
	/** 描述 */
	description?: LocalizedText;
	/** 规则列表 */
	rules: Rule[];
	/** 版本 */
	version: string;
	/** 创建时间 */
	created: string;
	/** 最后修改时间 */
	lastModified: string;
}
