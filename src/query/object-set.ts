import type { EntityType } from "../types";
import type {
	AggregateOptions,
	AggregateResult,
	FilterOp,
	PageOptions,
	PageResult,
} from "./filter-types";

/**
 * 对象实例 — 带 EntityType 类型推导
 *
 * @template T - EntityType 类型
 */
export interface QueryObjectInstance<T extends EntityType = EntityType> {
	/** 对象主键 */
	"@id": string;
	/** 对象类型引用 */
	"@type": T["@id"];
	/** 属性值映射 */
	properties: Record<string, unknown>;
}

/**
 * 对象集合 — 类型安全的查询抽象
 *
 * 参考 Palantir OSDK 的 ObjectSet<T> 模式。
 * ObjectSet 是不可变的：每次 where/orderBy/limit 返回新实例。
 *
 * @template T - EntityType 类型，用于类型推导
 */
export interface ObjectSet<T extends EntityType = EntityType> {
	/** 过滤条件（返回新 ObjectSet，不修改当前实例） */
	where(filter: Record<string, FilterOp>): ObjectSet<T>;

	/** 排序（返回新 ObjectSet） */
	orderBy(field: string, direction: "asc" | "desc"): ObjectSet<T>;

	/** 限制数量（返回新 ObjectSet） */
	limit(n: number): ObjectSet<T>;

	/** 偏移量（返回新 ObjectSet） */
	offset(n: number): ObjectSet<T>;

	/** 获取单页结果 */
	fetchPage(options?: PageOptions): Promise<PageResult<QueryObjectInstance<T>>>;

	/** 获取全部结果（自动分页） */
	fetchAll(): Promise<QueryObjectInstance<T>[]>;

	/** 获取单个对象（按主键） */
	fetchOne(id: string): Promise<QueryObjectInstance<T> | null>;

	/** 聚合查询 */
	aggregate(options: AggregateOptions): Promise<AggregateResult>;

	/** 计数 */
	count(): Promise<number>;
}
