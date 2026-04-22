/**
 * JSON Schema Exporter — OntoGraph → JSON Schema Draft 2020-12
 *
 * 映射规则:
 * - EntityType    → $defs 中的对象定义 (type: "object")
 * - AttributeRef  → properties 中的属性定义
 * - DataType      → JSON Schema 类型 (string, integer, number, boolean, array, object)
 * - ValidationRule → minLength, maxLength, pattern 等验证关键字
 * - ValueType     → enum 定义
 * - EntityType.extends → allOf 引用父类型
 * - EntityType.implements → allOf 引用接口类型
 * - InterfaceDefinition → 独立的 $defs 定义
 * - Constraint    → JSON Schema validation keywords
 */
import type {
	AttributeDefinition,
	AttributeRef,
	DataType,
	EntityType,
	InterfaceDefinition,
	OntologyDefinition,
	StructField,
	ValidationRule,
	ValueType,
} from "../types";

export interface JsonSchemaExportOptions {
	/** 是否包含描述性元数据 */
	includeAnnotations?: boolean;
	/** 基础 URI 用于 $id */
	baseURI?: string;
	/** 语言偏好 (用于 label/description 选择) */
	language?: "en" | "zh";
}

/** JSON Schema 属性定义 */
interface JsonSchemaProperty {
	type?: string;
	format?: string;
	description?: string;
	enum?: (string | number)[];
	minLength?: number;
	maxLength?: number;
	pattern?: string;
	minimum?: number;
	maximum?: number;
	exclusiveMinimum?: number;
	exclusiveMaximum?: number;
	items?: JsonSchemaProperty;
	properties?: Record<string, JsonSchemaProperty>;
	required?: string[];
	$ref?: string;
	anyOf?: JsonSchemaProperty[];
	allOf?: JsonSchemaProperty[];
}

/** JSON Schema 定义 */
interface JsonSchemaDefinition {
	$schema: string;
	$id: string;
	title: string;
	description?: string;
	type: string;
	$defs: Record<string, JsonSchemaDefinition | JsonSchemaProperty>;
}

export class JsonSchemaExporter {
	private ontology: OntologyDefinition;
	private options: Required<JsonSchemaExportOptions>;

	constructor(ontology: OntologyDefinition, options?: JsonSchemaExportOptions) {
		this.ontology = ontology;
		this.options = {
			includeAnnotations: options?.includeAnnotations ?? true,
			baseURI: options?.baseURI ?? "https://ontograph.app/schema/",
			language: options?.language ?? "en",
		};
	}

	/**
	 * 导出为 JSON Schema 对象
	 */
	export(): Record<string, unknown> {
		const schema: JsonSchemaDefinition = {
			$schema: "https://json-schema.org/draft/2020-12/schema",
			$id: this.ontology["@id"].startsWith("http")
				? this.ontology["@id"]
				: `${this.options.baseURI}${this.ontology["@id"]}`,
			title: this.getLocalizedText(this.ontology.label) ?? this.ontology["@id"],
			type: "object",
			$defs: {},
		};

		if (this.options.includeAnnotations && this.ontology.description) {
			schema.description = this.getLocalizedText(this.ontology.description);
		}

		// 导出所有实体类型
		const allEntityTypes = this.getAllEntityTypes();
		for (const entityType of allEntityTypes) {
			const defName = this.localName(entityType["@id"]);
			schema.$defs[defName] = this.entityTypeToSchema(entityType);
		}

		// 导出所有接口定义
		if (this.ontology.interfaces) {
			for (const iface of this.ontology.interfaces) {
				const defName = this.localName(iface["@id"]);
				schema.$defs[defName] = this.interfaceToSchema(iface);
			}
		}

		// 导出所有值类型 (枚举)
		if (this.ontology.valueTypes) {
			for (const valueType of this.ontology.valueTypes) {
				const defName = this.localName(valueType["@id"]);
				schema.$defs[defName] = this.valueTypeToSchema(valueType);
			}
		}

		return schema as unknown as Record<string, unknown>;
	}

	/**
	 * 导出为格式化的 JSON 字符串
	 */
	exportString(): string {
		return JSON.stringify(this.export(), null, 2);
	}

	/**
	 * 将 EntityType 转换为 JSON Schema 对象定义
	 */
	private entityTypeToSchema(entityType: EntityType): JsonSchemaProperty {
		const properties: Record<string, JsonSchemaProperty> = {};
		const required: string[] = [];

		// 添加 @id 和 @type 属性
		properties["@id"] = { type: "string", description: "Unique identifier" };
		properties["@type"] = {
			type: "string",
			const: entityType["@id"],
		} as JsonSchemaProperty;

		// 处理属性引用
		for (const attrRef of entityType.attributes) {
			const propSchema = this.attributeRefToSchema(attrRef);
			const attrName = this.localName(attrRef.ref);
			properties[attrName] = propSchema;

			// 检查是否必填
			if (attrRef.required || attrRef.identity) {
				required.push(attrName);
			}
		}

		// 处理关系引用
		for (const relRef of entityType.relations) {
			const relSchema = this.relationRefToSchema(relRef);
			const relName = this.localName(relRef.ref);
			properties[relName] = relSchema;

			// 检查是否必填
			if (relRef.min !== undefined && relRef.min > 0) {
				required.push(relName);
			}
		}

		const schema: JsonSchemaProperty = {
			type: "object",
			properties,
		};

		if (this.options.includeAnnotations) {
			const title = this.getLocalizedText(entityType.label);
			if (title) {
				schema.description = title;
			}
			const desc = this.getLocalizedText(entityType.description);
			if (desc) {
				schema.description = schema.description
					? `${schema.description}: ${desc}`
					: desc;
			}
		}

		if (required.length > 0) {
			schema.required = required;
		}

		// 处理继承 (extends)
		if (entityType.extends && entityType.extends.length > 0) {
			const allOf: JsonSchemaProperty[] = [];
			for (const parentId of entityType.extends) {
				allOf.push({ $ref: `#/$defs/${this.localName(parentId)}` });
			}
			allOf.push(schema);
			return { allOf };
		}

		// 处理接口实现 (implements)
		if (entityType.implements && entityType.implements.length > 0) {
			const allOf: JsonSchemaProperty[] = [];
			for (const ifaceId of entityType.implements) {
				allOf.push({ $ref: `#/$defs/${this.localName(ifaceId)}` });
			}
			allOf.push(schema);
			return { allOf };
		}

		return schema;
	}

	/**
	 * 将 InterfaceDefinition 转换为 JSON Schema
	 */
	private interfaceToSchema(iface: InterfaceDefinition): JsonSchemaProperty {
		const properties: Record<string, JsonSchemaProperty> = {};
		const required: string[] = [];

		for (const attrRef of iface.requiredAttributes) {
			const propSchema = this.attributeRefToSchema(attrRef);
			const attrName = this.localName(attrRef.ref);
			properties[attrName] = propSchema;
			required.push(attrName);
		}

		const schema: JsonSchemaProperty = {
			type: "object",
			properties,
		};

		if (this.options.includeAnnotations) {
			const title = this.getLocalizedText(iface.label);
			if (title) {
				schema.description = title;
			}
			const desc = this.getLocalizedText(iface.description);
			if (desc) {
				schema.description = schema.description
					? `${schema.description}: ${desc}`
					: desc;
			}
		}

		if (required.length > 0) {
			schema.required = required;
		}

		return schema;
	}

	/**
	 * 将 ValueType 转换为 JSON Schema (enum)
	 */
	private valueTypeToSchema(valueType: ValueType): JsonSchemaProperty {
		const schema: JsonSchemaProperty = {
			type: "string",
			enum: valueType.values,
		};

		if (this.options.includeAnnotations) {
			const title = this.getLocalizedText(valueType.label);
			if (title) {
				schema.description = title;
			}
		}

		return schema;
	}

	/**
	 * 将 AttributeRef 转换为 JSON Schema 属性
	 */
	private attributeRefToSchema(attrRef: AttributeRef): JsonSchemaProperty {
		const attr = this.ontology.attributes.find((a) => a["@id"] === attrRef.ref);
		if (!attr) {
			return { type: "string" };
		}

		return this.attributeDefinitionToSchema(attr, attrRef);
	}

	/**
	 * 将 AttributeDefinition 转换为 JSON Schema 属性
	 */
	private attributeDefinitionToSchema(
		attr: AttributeDefinition,
		attrRef?: AttributeRef,
	): JsonSchemaProperty {
		const schema = this.dataTypeToSchema(
			attr.datatype,
			attr.datatypeRef,
			attr.structDefinition,
		);

		// 添加描述
		if (this.options.includeAnnotations) {
			const title = this.getLocalizedText(attr.label);
			if (title) {
				schema.description = title;
			}
			const desc = this.getLocalizedText(attr.description);
			if (desc) {
				schema.description = schema.description
					? `${schema.description}: ${desc}`
					: desc;
			}
			if (attrRef?.identity || attr.identity) {
				schema.description = schema.description
					? `${schema.description} (Identity attribute)`
					: "Identity attribute";
			}
		}

		// 处理枚举
		if (attr.enum && attr.enum.length > 0) {
			schema.enum = attr.enum;
		}

		// 处理验证规则
		if (attr.validation) {
			for (const rule of attr.validation) {
				this.applyValidationRule(schema, rule);
			}
		}

		// 处理默认值
		if (attr.defaultValue !== undefined) {
			(schema as Record<string, unknown>).default = attr.defaultValue;
		}

		// 处理只读
		if (attr.readonly) {
			(schema as Record<string, unknown>).readOnly = true;
		}

		return schema;
	}

	/**
	 * 将 DataType 转换为 JSON Schema 类型
	 */
	private dataTypeToSchema(
		datatype: DataType,
		datatypeRef?: string,
		structDefinition?: StructField[],
	): JsonSchemaProperty {
		switch (datatype) {
			case "string":
				return { type: "string" };
			case "integer":
				return { type: "integer" };
			case "float":
			case "decimal":
				return { type: "number" };
			case "boolean":
				return { type: "boolean" };
			case "datetime":
				return { type: "string", format: "date-time" };
			case "date":
				return { type: "string", format: "date" };
			case "array":
				return { type: "array" };
			case "object":
				return { type: "object" };
			case "ref":
				if (datatypeRef) {
					return { $ref: `#/$defs/${this.localName(datatypeRef)}` };
				}
				return { type: "string", description: "Reference to another entity" };
			case "geopoint": {
				return {
					type: "object",
					properties: {
						latitude: { type: "number" },
						longitude: { type: "number" },
					},
					required: ["latitude", "longitude"],
				};
			}
			case "geopolygon":
				return {
					type: "array",
					items: {
						type: "object",
						properties: {
							latitude: { type: "number" },
							longitude: { type: "number" },
						},
						required: ["latitude", "longitude"],
					},
				};
			case "vector":
				return {
					type: "array",
					items: { type: "number" },
				};
			case "duration":
				return { type: "string", format: "duration" };
			case "currency":
				return {
					type: "object",
					properties: {
						amount: { type: "number" },
						currency: { type: "string" },
					},
					required: ["amount", "currency"],
				};
			case "measurement":
				return {
					type: "object",
					properties: {
						value: { type: "number" },
						unit: { type: "string" },
					},
					required: ["value", "unit"],
				};
			case "struct": {
				if (structDefinition && structDefinition.length > 0) {
					const properties: Record<string, JsonSchemaProperty> = {};
					const required: string[] = [];
					for (const field of structDefinition) {
						properties[field.name] = this.dataTypeToSchema(field.datatype);
						if (field.required) {
							required.push(field.name);
						}
					}
					return {
						type: "object",
						properties,
						...(required.length > 0 && { required }),
					};
				}
				return { type: "object" };
			}
			default:
				return { type: "string" };
		}
	}

	/**
	 * 将 RelationRef 转换为 JSON Schema 属性
	 */
	private relationRefToSchema(relRef: {
		ref: string;
		min?: number;
		max?: number | null;
	}): JsonSchemaProperty {
		const relType = this.ontology.relationTypes?.find(
			(r) => r["@id"] === relRef.ref,
		);

		const schema: JsonSchemaProperty = {
			type: "array",
			items: relType
				? { $ref: `#/$defs/${this.localName(relType.range)}` }
				: { type: "string" },
		};

		// 处理基数约束
		if (relRef.min !== undefined) {
			schema.minLength = relRef.min;
		}
		if (relRef.max !== undefined && relRef.max !== null) {
			schema.maxLength = relRef.max;
		}

		if (this.options.includeAnnotations && relType) {
			const title = this.getLocalizedText(relType.label);
			if (title) {
				schema.description = title;
			}
		}

		return schema;
	}

	/**
	 * 应用验证规则到 JSON Schema
	 */
	private applyValidationRule(
		schema: JsonSchemaProperty,
		rule: ValidationRule,
	): void {
		switch (rule.type) {
			case "min":
				if (schema.type === "string" || schema.type === "array") {
					schema.minLength = Number(rule.value);
				} else if (schema.type === "number" || schema.type === "integer") {
					schema.minimum = Number(rule.value);
				}
				break;
			case "max":
				if (schema.type === "string" || schema.type === "array") {
					schema.maxLength = Number(rule.value);
				} else if (schema.type === "number" || schema.type === "integer") {
					schema.maximum = Number(rule.value);
				}
				break;
			case "pattern":
				if (schema.type === "string") {
					schema.pattern = String(rule.value);
				}
				break;
			case "custom":
				break;
		}
	}

	private localName(id: string): string {
		const parts = id.split(":");
		return parts[parts.length - 1] ?? id;
	}

	private getLocalizedText(
		text: { en?: string; zh?: string } | undefined,
	): string | undefined {
		if (!text) return undefined;
		return (
			text[this.options.language] ??
			text.en ??
			text.zh ??
			Object.values(text)[0]
		);
	}

	private getAllEntityTypes(): EntityType[] {
		return [
			...(this.ontology.entityTypes ?? []),
			...(this.ontology.eventTypes ?? []),
			...(this.ontology.roleTypes ?? []),
		];
	}
}
