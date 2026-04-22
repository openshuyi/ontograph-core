import type {
	AttributeDefinition,
	AttributeRef,
	DataType,
	EntityType,
	EntityUIConfig,
	LocalizedText,
	RelationRef,
	RelationType,
} from "../types";

// ═══════════════════════════════════════════
// Entity Builder
// ═══════════════════════════════════════════

/** 实体构建器配置 */
export interface EntityConfig {
	kind: "entity" | "event" | "role" | "value";
	label: LocalizedText;
	description?: LocalizedText;
	extends?: string[];
	implements?: string[];
}

/**
 * 实体类型构建器 — 链式 API
 *
 * @example
 * ```typescript
 * const product = defineEntity("scm:Product", {
 *   kind: "entity",
 *   label: { zh: "产品", en: "Product" },
 * })
 *   .attr("scm:skuCode", { identity: true, required: true })
 *   .attr("scm:name", { required: true })
 *   .rel("scm:suppliedBy", { min: 1, max: null })
 *   .constraint("scm:PositivePrice")
 *   .implements("scm:TraceableItem")
 *   .ui({ color: "#2E7D32", icon: "package" })
 *   .build();
 * ```
 */
export class EntityTypeBuilder {
	private attrs: AttributeRef[] = [];
	private rels: RelationRef[] = [];
	private constraints: string[] = [];
	private interfaces: string[] = [];
	private uiConfig?: EntityUIConfig;
	private parentExtends?: string[];

	constructor(
		private id: string,
		private config: EntityConfig,
	) {}

	attr(ref: string, opts?: Partial<AttributeRef>): this {
		this.attrs.push({ ref, ...opts });
		return this;
	}

	rel(ref: string, opts?: Partial<RelationRef>): this {
		this.rels.push({ ref, ...opts });
		return this;
	}

	constraint(ref: string): this {
		this.constraints.push(ref);
		return this;
	}

	implements(iface: string): this {
		this.interfaces.push(iface);
		return this;
	}

	ui(config: EntityUIConfig): this {
		this.uiConfig = config;
		return this;
	}

	extends(parent: string): this {
		if (!this.parentExtends) this.parentExtends = [];
		this.parentExtends.push(parent);
		return this;
	}

	build(): EntityType {
		const result: EntityType = {
			"@id": this.id,
			"@type": "EntityType",
			label: this.config.label,
			kind: this.config.kind,
			attributes: this.attrs,
			relations: this.rels,
			constraints: this.constraints.map((c) => ({ ref: c })),
		};

		if (this.config.description) result.description = this.config.description;
		if (this.parentExtends ?? this.config.extends) {
			result.extends = [
				...(this.config.extends ?? []),
				...(this.parentExtends ?? []),
			];
		}
		if (this.interfaces.length > 0 || this.config.implements) {
			result.implements = [
				...(this.config.implements ?? []),
				...this.interfaces,
			];
		}
		if (this.uiConfig) result.ui = this.uiConfig;

		return result;
	}
}

/** 创建实体类型构建器 */
export function defineEntity(
	id: string,
	config: EntityConfig,
): EntityTypeBuilder {
	return new EntityTypeBuilder(id, config);
}

// ═══════════════════════════════════════════
// Relation Builder
// ═══════════════════════════════════════════

export interface RelationConfig {
	label: LocalizedText;
	description?: LocalizedText;
	domain: string;
	range: string;
	min?: number;
	max?: number | null;
	inverse?: string;
}

/** 创建关系类型 */
export function defineRelation(
	id: string,
	config: RelationConfig,
): RelationType {
	const result: RelationType = {
		"@id": id,
		"@type": "RelationType",
		label: config.label,
		domain: config.domain,
		range: config.range,
	};

	if (config.description) result.description = config.description;
	if (config.min !== undefined) result.min = config.min;
	if (config.max !== undefined) result.max = config.max;
	if (config.inverse) result.inverse = config.inverse;

	return result;
}

// ═══════════════════════════════════════════
// Attribute Builder
// ═══════════════════════════════════════════

export interface AttributeConfig {
	label: LocalizedText;
	description?: LocalizedText;
	datatype: DataType;
	datatypeRef?: string;
	required?: boolean;
	identity?: boolean;
	readonly?: boolean;
	defaultValue?: unknown;
	enum?: Array<string | number>;
	pattern?: string;
}

/** 创建属性定义 */
export function defineAttribute(
	id: string,
	config: AttributeConfig,
): AttributeDefinition {
	const result: AttributeDefinition = {
		"@id": id,
		"@type": "Attribute",
		label: config.label,
		datatype: config.datatype,
	};

	if (config.description) result.description = config.description;
	if (config.datatypeRef) result.datatypeRef = config.datatypeRef;
	if (config.required) result.required = config.required;
	if (config.identity) result.identity = config.identity;
	if (config.readonly) result.readonly = config.readonly;
	if (config.defaultValue !== undefined)
		result.defaultValue = config.defaultValue;
	if (config.enum) result.enum = config.enum;
	if (config.pattern) {
		result.validation = [{ type: "pattern", value: config.pattern }];
	}

	return result;
}
