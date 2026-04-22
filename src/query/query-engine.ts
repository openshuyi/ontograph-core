import type { EntityType } from "../types";
import type {
	AggregateOptions,
	AggregateResult,
	FilterOp,
	PageOptions,
	PageResult,
} from "./filter-types";
import type { QueryObjectInstance } from "./object-set";

/** 已解析的查询参数（从 ObjectSet 链式调用编译而来） */
export interface ResolvedQuery {
	/** 目标 EntityType @id */
	entityTypeRef: string;
	/** 过滤条件列表（AND 关系） */
	filters: Array<{ field: string; op: FilterOp }>;
	/** 排序规则 */
	orderBy?: Array<{ field: string; direction: "asc" | "desc" }>;
	/** 数量限制 */
	limit?: number;
	/** 偏移量 */
	offset?: number;
}

/** 查询引擎接口 — 存储后端抽象 */
export interface IQueryEngine {
	/** 查询对象实例 */
	query<T extends EntityType>(
		query: ResolvedQuery,
		options?: PageOptions,
	): Promise<PageResult<QueryObjectInstance<T>>>;

	/** 聚合查询 */
	aggregate<_T extends EntityType>(
		entityTypeRef: string,
		options: AggregateOptions,
		filters?: Array<{ field: string; op: FilterOp }>,
	): Promise<AggregateResult>;

	/** 计数 */
	count(
		entityTypeRef: string,
		filters?: Array<{ field: string; op: FilterOp }>,
	): Promise<number>;

	/** 获取单个对象 */
	fetchOne<T extends EntityType>(
		entityTypeRef: string,
		id: string,
	): Promise<QueryObjectInstance<T> | null>;
}

/** 查询链操作记录（ObjectSet 内部使用） */
export interface QueryChain {
	filters: Array<{ field: string; op: FilterOp }>;
	orderBy: Array<{ field: string; direction: "asc" | "desc" }>;
	limit?: number;
	offset?: number;
}

/**
 * ObjectSet 编译器 — 将链式调用编译为 ResolvedQuery
 */
export class ObjectSetCompiler {
	/** 从 ObjectSet 的调用链生成 ResolvedQuery */
	compile(entityTypeRef: string, chain: QueryChain): ResolvedQuery {
		return {
			entityTypeRef,
			filters: chain.filters,
			orderBy: chain.orderBy.length > 0 ? chain.orderBy : undefined,
			limit: chain.limit,
			offset: chain.offset,
		};
	}
}
