import type { Expr } from "./expression/types";

export interface LocalizedText {
	zh?: string;
	en?: string;
	[lang: string]: string | undefined;
}

export type DataType =
	| "string"
	| "integer"
	| "float"
	| "decimal"
	| "boolean"
	| "datetime"
	| "date"
	| "array"
	| "object"
	| "ref"
	| "geopoint"
	| "geopolygon"
	| "vector"
	| "duration"
	| "currency"
	| "measurement"
	| "struct";

export interface AttributeDefinition {
	"@id": string;
	"@type": "Attribute";
	label: LocalizedText;
	description?: LocalizedText;
	datatype: DataType;
	datatypeRef?: string;
	required?: boolean;
	identity?: boolean;
	readonly?: boolean;
	defaultValue?: unknown;
	validation?: ValidationRule[];
	enum?: Array<string | number>;
	/** 结构体定义（当 datatype 为 struct 时使用） */
	structDefinition?: StructField[];
}

export interface ValidationRule {
	type: "min" | "max" | "pattern" | "custom";
	value?: unknown;
	message?: LocalizedText;
}

export interface RelationRef {
	ref: string;
	min?: number;
	max?: number | null;
	properties?: Record<string, unknown>;
}

export interface AttributeRef {
	ref: string;
	required?: boolean;
	identity?: boolean;
}

export interface ConstraintRef {
	ref: string;
}

/** 接口定义 — 对象类型多态 */
export interface InterfaceDefinition {
	/** 接口唯一标识，格式 namespace:name */
	"@id": string;
	/** 固定为 "Interface" */
	"@type": "Interface";
	/** 接口显示名称 */
	label: LocalizedText;
	/** 接口详细说明 */
	description?: LocalizedText;
	/** 接口要求的属性列表 */
	requiredAttributes: AttributeRef[];
	/** 接口要求的关系列表 */
	requiredRelations?: RelationRef[];
}

export interface EntityType {
	"@id": string;
	"@type": "EntityType";
	label: LocalizedText;
	description?: LocalizedText;
	kind: "entity" | "event" | "role" | "value";
	extends?: string[];
	/** 声明实现的接口 @id 列表 */
	implements?: string[];
	attributes: AttributeRef[];
	relations: RelationRef[];
	constraints: ConstraintRef[];
	ui?: EntityUIConfig;
}

export interface EntityUIConfig {
	color?: string;
	icon?: string;
	visible?: boolean;
	group?: string;
}

export interface RelationType {
	"@id": string;
	"@type": "RelationType";
	label: LocalizedText;
	description?: LocalizedText;
	domain: string;
	range: string;
	min?: number;
	max?: number | null;
	inverse?: string;
	properties?: AttributeRef[];
}

export interface ValueType {
	"@id": string;
	"@type": "ValueType";
	label: LocalizedText;
	values: string[];
}

export interface Constraint {
	"@id": string;
	"@type": "Constraint";
	label?: LocalizedText;
	on: string;
	rule: string;
	/** 结构化表达式（推荐替代 rule 字符串） */
	expr?: Expr;
	message?: LocalizedText;
	severity?: "error" | "warning" | "info";
}

/** 结构体字段 */
export interface StructField {
	/** 字段名 */
	name: string;
	/** 字段数据类型 */
	datatype: DataType;
	/** 是否必填 */
	required?: boolean;
	/** 字段说明 */
	description?: LocalizedText;
}

/** 派生属性 — 基于表达式的计算属性 */
export interface DerivedAttribute {
	/** 派生属性唯一标识 */
	"@id": string;
	/** 固定为 "DerivedAttribute" */
	"@type": "DerivedAttribute";
	/** 显示名称 */
	label: LocalizedText;
	/** 详细说明 */
	description?: LocalizedText;
	/** 返回数据类型 */
	datatype: DataType;
	/** 计算表达式 */
	expression: Expr;
	/** 缓存策略 */
	cache?: {
		/** 是否启用缓存 */
		enabled: boolean;
		/** 缓存过期时间（秒） */
		ttlSeconds?: number;
	};
}

export interface ViewDefinition {
	"@id": string;
	"@type": "View";
	label: LocalizedText;
	forType?: string;
	layout?: "force" | "hierarchical" | "radial" | "grid";
	filter?: ViewFilter[];
	highlight?: ViewHighlight[];
}

export interface ViewFilter {
	type: "entity" | "relation";
	property: string;
	operator: "eq" | "neq" | "gt" | "lt" | "contains" | "exists";
	value: unknown;
}

export interface ViewHighlight {
	condition: string;
	style: {
		color?: string;
		size?: number;
		opacity?: number;
	};
}

export interface MappingDefinition {
	"@id": string;
	"@type": "Mapping";
	source: string;
	targetType: string;
	fieldMappings: FieldMapping[];
}

export interface FieldMapping {
	sourceField: string;
	targetAttribute: string;
	transform?: string;
}

export interface OntologyContext {
	ontograph: string;
	scm?: string;
	xsd?: string;
	[key: string]: string | undefined;
}

/** Action parameter definition */
export interface ActionParameter {
	/** Unique identifier for this parameter */
	name: string;
	/** Display label */
	label: LocalizedText;
	/** Data type of parameter */
	type: DataType;
	/** Whether this parameter is required */
	required: boolean;
	/** Default value if not provided */
	defaultValue?: unknown;
	/** Validation rules for parameter value */
	validation?: ValidationRule[];
	/** Description of parameter */
	description?: LocalizedText;
}

/** Side effect triggered after action execution */
export interface SideEffect {
	/** Type of side effect */
	type: "notification" | "webhook" | "stateChange" | "emitEvent";
	/** Configuration for side effect */
	config: Record<string, unknown>;
	/** Description of what this side effect does */
	description?: LocalizedText;
}

/** Approval policy for action execution */
export interface ApprovalPolicy {
	/** Whether approval is required before execution */
	required: boolean;
	/** Conditions under which approval is automatically granted */
	autoApproveConditions?: string[];
	/** List of approver role IDs (references to EntityType with kind 'role') */
	approvers?: string[];
	/** Maximum wait time for approval in milliseconds */
	timeout?: number;
}

/** Audit configuration for action execution */
export interface AuditConfig {
	/** Whether audit logging is enabled */
	enabled: boolean;
	/** Log level: 'minimal' logs only success/failure; 'full' logs all details */
	logLevel: "minimal" | "full";
	/** Retention period in days */
	retentionDays?: number;
}

/** ActionType defines an executable operation on ontology objects (the "verb" layer) */
export interface ActionType {
	/** Unique identifier in namespace:name format (e.g., 'sc:CreatePurchaseOrder') */
	"@id": string;
	/** JSON-LD type marker */
	"@type": "ActionType";
	/** Display label */
	label: LocalizedText;
	/** Description of what this action does */
	description?: LocalizedText;
	/** Input parameters for action */
	parameters: ActionParameter[];
	/** The EntityType(s) this action applies to (references by @id) */
	targetTypes?: string[];
	/** Side effects triggered after successful execution */
	sideEffects?: SideEffect[];
	/** Approval policy for this action */
	approvalPolicy: ApprovalPolicy;
	/** Audit configuration */
	auditConfig: AuditConfig;
	/** 权限配置 */
	permissions?: {
		/** 允许执行的角色 ID 列表 */
		allowedRoles?: string[];
		/** 禁止执行的角色 ID 列表（黑名单优先） */
		deniedRoles?: string[];
	};
	/** Tags for categorization */
	tags?: string[];
}

/** Trigger configuration for when a rule should be evaluated */
export interface RuleTrigger {
	/** Trigger mode */
	mode: "on_change" | "on_query" | "scheduled" | "manual";
	/** Entity types that trigger this rule (references by @id) */
	targetTypes?: string[];
	/** Attribute changes that trigger this rule */
	watchedAttributes?: string[];
	/** Cron expression for scheduled triggers */
	cronExpression?: string;
	/** Priority of the rule (higher = evaluated first) */
	priority?: number;
}

/** Expression used in rule conditions and actions */
export interface RuleExpression {
	/** Expression language */
	language: "typescript" | "sql" | "cypher" | "natural";
	/** The expression body */
	body: string;
	/** Description of what this expression evaluates to */
	description?: LocalizedText;
	/** 结构化表达式（推荐替代 language+body） */
	expr?: Expr;
}

/** Strategy for resolving conflicts between rules */
export interface RuleConflictResolution {
	/** Resolution strategy */
	strategy: "highest_priority" | "first_match" | "all" | "merge";
	/** Merge function when strategy is 'merge' */
	mergeExpression?: RuleExpression;
}

/** LogicRule defines automated reasoning rules on ontology objects */
export interface LogicRule {
	/** Unique identifier in namespace:name format (e.g., 'sc:InventoryAlertRule') */
	"@id": string;
	/** JSON-LD type marker */
	"@type": "LogicRule";
	/** Display label */
	label: LocalizedText;
	/** Description of what this rule does */
	description?: LocalizedText;
	/** Rule category */
	category:
		| "validation"
		| "derivation"
		| "trigger"
		| "constraint"
		| "optimization";
	/** When this rule should be triggered */
	trigger: RuleTrigger;
	/** Condition expression - rule fires when this evaluates to true */
	condition: RuleExpression;
	/** Action expression - what to execute when condition is true */
	action: RuleExpression;
	/** Conflict resolution strategy */
	conflictResolution?: RuleConflictResolution;
	/** Whether this rule is enabled by default */
	enabled?: boolean;
	/** Tags for categorization */
	tags?: string[];
}

export interface OntologyDefinition {
	"@context": OntologyContext;
	"@id": string;
	"@type": "Ontology";
	version: string;
	label: LocalizedText;
	description?: LocalizedText;
	entityTypes: EntityType[];
	eventTypes?: EntityType[];
	roleTypes?: EntityType[];
	relationTypes: RelationType[];
	valueTypes?: ValueType[];
	attributes: AttributeDefinition[];
	constraints: Constraint[];
	views?: ViewDefinition[];
	mappings?: MappingDefinition[];
	/** Action types defined in this ontology */
	actionTypes?: ActionType[];
	/** Logic rules for automated reasoning */
	logicRules?: LogicRule[];
	/** 接口定义 */
	interfaces?: InterfaceDefinition[];
	/** 派生属性定义 */
	derivedAttributes?: DerivedAttribute[];
	/** 数据源定义 */
	datasources?: import("./datasource/types").DatasourceDefinition[];
	/** 对象映射定义 */
	objectMappings?: import("./datasource/types").ObjectMapping[];
	/** 角色定义 */
	roles?: import("./security/types").RoleDefinition[];
}
