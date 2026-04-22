/**
 * 数据血缘追踪模型 (Data Lineage Model)
 *
 * 定义数据从源头到最终使用之间的完整血缘关系。
 * 涵盖数据源、转换步骤、业务对象引用和使用记录四大节点类型，
 * 以及节点之间的流向、派生和引用关系边。
 *
 * @module lineage
 */

import type { LocalizedText } from "./types";

// ─── 节点类型枚举 ───────────────────────────────────────────────

/** 血缘节点类型 -- 区分数据血缘中的四大节点类别 */
export type LineageNodeType =
	| "dataSource"
	| "transformation"
	| "object"
	| "usage";

/** 数据源类型 -- 描述数据的原始来源渠道 */
export type DataSourceType =
	| "api"
	| "database"
	| "file"
	| "stream"
	| "manual"
	| "derived";

/** 转换类型 -- 描述数据处理/变换的操作类别 */
export type TransformationType =
	| "import"
	| "export"
	| "transform"
	| "merge"
	| "filter"
	| "validate"
	| "clean";

/** 使用类型 -- 描述数据被消费的方式 */
export type UsageType =
	| "read"
	| "reference"
	| "report"
	| "export"
	| "api_output";

// ─── 辅助接口 ───────────────────────────────────────────────────

/**
 * 节点元数据
 *
 * 记录血缘节点的版本和生命周期信息。
 */
export interface NodeMetadata {
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
 * 转换执行日志
 *
 * 记录一次转换操作的执行细节，包括耗时、状态和输出。
 */
export interface TransformationExecutionLog {
	/** 执行开始时间 (ISO 8601 格式) */
	startedAt: string;
	/** 执行结束时间 (ISO 8601 格式) */
	finishedAt?: string;
	/** 执行状态 */
	status: "success" | "failed" | "running" | "pending";
	/** 影响的记录数 */
	recordsProcessed?: number;
	/** 执行错误信息 */
	errorMessage?: string;
	/** 附加执行详情 */
	details?: Record<string, unknown>;
}

/**
 * 血缘查询选项
 *
 * 控制血缘追踪查询的范围和过滤条件。
 */
export interface LineageQueryOptions {
	/** 追踪方向: 上游、下游或双向 */
	direction: "upstream" | "downstream" | "both";
	/** 最大追踪深度 (0 表示不限制) */
	maxDepth?: number;
	/** 按节点类型过滤 */
	nodeTypeFilter?: LineageNodeType[];
	/** 按关系类型过滤 */
	relationTypeFilter?: LineageEdge["relationType"][];
	/** 是否包含元数据 */
	includeMetadata?: boolean;
}

// ─── 核心接口 ───────────────────────────────────────────────────

/**
 * 数据源
 *
 * 描述数据的原始来源，包括来源类型、连接信息和同步状态。
 */
export interface DataSource {
	/** 数据源唯一标识，格式 namespace:name (如 lineage:erp-api) */
	"@id": string;
	/** 固定为 "DataSource" */
	"@type": "DataSource";
	/** 数据源类型 */
	type: DataSourceType;
	/** 数据源显示名称（支持多语言） */
	name: LocalizedText;
	/** 数据源详细说明（支持多语言） */
	description?: LocalizedText;
	/** 连接信息（如 URL、认证配置等，敏感字段应脱敏） */
	connectionInfo?: Record<string, unknown>;
	/** 数据源 Schema 描述 */
	schema?: Record<string, unknown>;
	/** 最后同步时间 (ISO 8601 格式) */
	lastSyncAt?: string;
	/** 同步状态 */
	syncStatus?: "success" | "failed" | "pending";
}

/**
 * 转换步骤
 *
 * 描述对数据执行的一次转换操作，包含输入/输出节点引用和执行日志。
 */
export interface Transformation {
	/** 转换步骤唯一标识，格式 namespace:name (如 lineage:etl-import-01) */
	"@id": string;
	/** 固定为 "Transformation" */
	"@type": "Transformation";
	/** 转换类型 */
	type: TransformationType;
	/** 转换步骤显示名称（支持多语言） */
	name: LocalizedText;
	/** 转换步骤详细说明（支持多语言） */
	description?: LocalizedText;
	/** 输入节点 ID 列表 */
	inputNodeIds: string[];
	/** 输出节点 ID 列表 */
	outputNodeIds: string[];
	/** 执行日志 */
	executionLog?: TransformationExecutionLog;
}

/**
 * 使用记录
 *
 * 描述数据被消费/访问的一次记录，包括使用方式、用户和时间。
 */
export interface Usage {
	/** 使用记录唯一标识，格式 namespace:name (如 lineage:read-001) */
	"@id": string;
	/** 固定为 "Usage" */
	"@type": "Usage";
	/** 使用类型 */
	type: UsageType;
	/** 使用者标识 */
	userId?: string;
	/** 使用时间 (ISO 8601 格式) */
	timestamp: string;
	/** 使用上下文附加信息 */
	context?: Record<string, unknown>;
}

/**
 * 血缘节点
 *
 * 数据血缘图中的基本节点，根据 nodeType 携带不同类型的详细信息：
 * - dataSource: 携带 dataSource 字段
 * - transformation: 携带 transformation 字段
 * - object: 通过 objectId 引用业务对象
 * - usage: 携带 usage 字段
 */
export interface LineageNode {
	/** 节点唯一标识，格式 namespace:name (如 lineage:source-erp) */
	"@id": string;
	/** 固定为 "LineageNode" */
	"@type": "LineageNode";
	/** 节点类型 */
	nodeType: LineageNodeType;
	/** 引用的业务对象 ID (当 nodeType 为 object 时必填) */
	objectId?: string;
	/** 数据源详情 (当 nodeType 为 dataSource 时存在) */
	dataSource?: DataSource;
	/** 转换步骤详情 (当 nodeType 为 transformation 时存在) */
	transformation?: Transformation;
	/** 使用记录详情 (当 nodeType 为 usage 时存在) */
	usage?: Usage;
	/** 节点元数据 */
	metadata: NodeMetadata;
}

/**
 * 血缘边
 *
 * 描述两个血缘节点之间的关系，支持流向、派生和引用三种关系类型。
 */
export interface LineageEdge {
	/** 边唯一标识，格式 namespace:name (如 lineage:edge-001) */
	"@id": string;
	/** 固定为 "LineageEdge" */
	"@type": "LineageEdge";
	/** 源节点 ID */
	sourceNodeId: string;
	/** 目标节点 ID */
	targetNodeId: string;
	/** 关系类型 */
	relationType: "flowsTo" | "derivedFrom" | "usedBy";
	/** 关系权重 (用于影响分析和重要性评估) */
	weight?: number;
	/** 关系附加属性 */
	metadata?: Record<string, unknown>;
}

/**
 * 血缘追踪结果
 *
 * 从指定节点出发，沿上游/下游方向追踪后返回的子图结果，
 * 包含匹配的节点、边以及追踪深度信息。
 */
export interface LineageTrace {
	/** 起始节点 ID */
	nodeId: string;
	/** 追踪方向 */
	direction: "upstream" | "downstream" | "both";
	/** 追踪到的血缘节点列表 */
	nodes: LineageNode[];
	/** 追踪到的血缘边列表 */
	edges: LineageEdge[];
	/** 实际追踪深度 */
	depth: number;
	/** 追踪执行时间 (ISO 8601 格式) */
	timestamp: string;
}
