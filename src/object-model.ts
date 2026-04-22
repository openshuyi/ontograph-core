/**
 * 对象模型核心定义 (Object Model Core Definitions)
 *
 * 将本体类型 (EntityType / RelationType) 映射到可操作的业务对象实例。
 * ObjectClass 对应 EntityType，ObjectLink 对应 RelationType，
 * ObjectInstance 是具体的业务数据实例。
 *
 * @module object-model
 */

import type { AttributeDefinition, LocalizedText } from "./types";

/**
 * 对象属性 -- 映射到 AttributeDefinition
 *
 * 描述对象实例上一个具体属性的元信息，包括值的类型约束、
 * 是否必填、是否为标识字段等。
 */
export interface ObjectProperty {
	/** 属性唯一标识，格式 namespace:name (如 sc:name) */
	"@id": string;
	/** 属性显示名称（支持多语言） */
	label: LocalizedText;
	/** 属性详细说明（支持多语言） */
	description?: LocalizedText;
	/** 属性数据类型 */
	datatype: AttributeDefinition["datatype"];
	/** 引用的类型标识（当 datatype 为 ref 时必填） */
	datatypeRef?: string;
	/** 是否必填 */
	required?: boolean;
	/** 是否为标识属性（用于唯一标识对象实例） */
	identity?: boolean;
	/** 是否只读 */
	readonly?: boolean;
	/** 默认值 */
	defaultValue?: unknown;
	/** 枚举可选值列表 */
	enum?: Array<string | number>;
}

/**
 * 对象类 -- 业务对象类定义，对应 EntityType
 *
 * ObjectClass 通过 entityTypeRef 引用本体中的 EntityType，
 * 并声明该业务对象类拥有的属性列表。
 */
export interface ObjectClass {
	/** 对象类唯一标识，格式 namespace:name (如 scm:WarehouseClass) */
	"@id": string;
	/** 固定为 "ObjectClass" */
	"@type": "ObjectClass";
	/** 引用的 EntityType @id (如 scm:Warehouse) */
	entityTypeRef: string;
	/** 显示名称（支持多语言） */
	label: LocalizedText;
	/** 详细说明（支持多语言） */
	description?: LocalizedText;
	/** 对象属性定义列表 */
	properties: ObjectProperty[];
	/** 对象所属的包/命名空间引用 */
	packageRef?: string;
}

/**
 * 对象关系链接 -- 对应 RelationType
 *
 * 描述两个对象实例之间的具体关系，包含源/目标对象 ID
 * 和关系类型引用。
 */
export interface ObjectLink {
	/** 链接唯一标识，格式 namespace:name (如 sc:link-001) */
	"@id": string;
	/** 固定为 "ObjectLink" */
	"@type": "ObjectLink";
	/** 引用的 RelationType @id (如 scm:locatedAt) */
	relationTypeRef: string;
	/** 源对象实例 ID */
	fromObjectId: string;
	/** 目标对象实例 ID */
	toObjectId: string;
	/** 链接显示名称（支持多语言） */
	label?: LocalizedText;
	/** 链接附加属性 */
	properties?: Record<string, unknown>;
}

/**
 * 对象实例元数据
 *
 * 记录对象实例的版本和生命周期信息。
 */
export interface ObjectInstanceMetadata {
	/** 实例版本号 */
	version: number;
	/** 创建时间 (ISO 8601 格式) */
	createdAt: string;
	/** 最后更新时间 (ISO 8601 格式) */
	updatedAt: string;
	/** 创建者标识 */
	createdBy: string;
	/** 最后更新者标识 */
	updatedBy?: string;
	/** 自定义标签 */
	tags?: string[];
}

/**
 * 对象实例 -- 具体的业务数据实例
 *
 * 基于 ObjectClass 创建的具体数据实例，包含实际属性值和元数据。
 */
export interface ObjectInstance {
	/** 实例唯一标识，格式 namespace:name (如 sc:warehouse-001) */
	"@id": string;
	/** 固定为 "ObjectInstance" */
	"@type": "ObjectInstance";
	/** 所属对象类引用 (ObjectClass @id) */
	classRef: string;
	/** 实例显示名称（支持多语言） */
	label: LocalizedText;
	/** 实例描述（支持多语言） */
	description?: LocalizedText;
	/** 属性值映射 (属性 @id -> 实际值) */
	propertyValues: Record<string, unknown>;
	/** 实例元数据 */
	metadata: ObjectInstanceMetadata;
	/** 实例所属的包/命名空间引用 */
	packageRef?: string;
}

/**
 * 对象包/命名空间
 *
 * 组织和管理一组相关的 ObjectClass、ObjectInstance 和 ObjectLink，
 * 提供命名空间隔离。
 */
export interface ObjectPackage {
	/** 包唯一标识，格式 namespace:name (如 sc:supply-chain-objects) */
	"@id": string;
	/** 固定为 "ObjectPackage" */
	"@type": "ObjectPackage";
	/** 包显示名称（支持多语言） */
	label: LocalizedText;
	/** 包详细说明（支持多语言） */
	description?: LocalizedText;
	/** 包含的对象类 */
	classes: ObjectClass[];
	/** 包含的对象实例 */
	instances: ObjectInstance[];
	/** 包含的对象关系链接 */
	links: ObjectLink[];
	/** 包版本 */
	version: string;
}

/**
 * 对象模型完整定义
 *
 * 包含对象类、实例、链接和包的完整描述，
 * 可用于校验器校验和序列化传输。
 */
export interface ObjectModelDefinition {
	/** 对象模型唯一标识 */
	"@id": string;
	/** 固定为 "ObjectModel" */
	"@type": "ObjectModel";
	/** 模型显示名称（支持多语言） */
	label: LocalizedText;
	/** 模型描述（支持多语言） */
	description?: LocalizedText;
	/** 模型版本 */
	version: string;
	/** 引用的本体定义 ID */
	ontologyRef: string;
	/** 所有对象类 */
	classes: ObjectClass[];
	/** 所有对象实例 */
	instances: ObjectInstance[];
	/** 所有对象关系链接 */
	links: ObjectLink[];
	/** 所有对象包 */
	packages: ObjectPackage[];
}
