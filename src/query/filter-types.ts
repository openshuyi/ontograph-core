/** 对象过滤操作符 */
export type FilterOp =
	| { $eq: unknown }
	| { $neq: unknown }
	| { $gt: unknown }
	| { $gte: unknown }
	| { $lt: unknown }
	| { $lte: unknown }
	| { $contains: string }
	| { $startsWith: string }
	| { $endsWith: string }
	| { $in: unknown[] }
	| { $notIn: unknown[] }
	| { $isNull: boolean }
	| { $exists: boolean }
	| { $and: Record<string, FilterOp>[] }
	| { $or: Record<string, FilterOp>[] }
	| { $not: Record<string, FilterOp> };

/** 排序方向 */
export type SortDirection = "asc" | "desc";

/** 分页选项 */
export interface PageOptions {
	/** 每页大小，默认 50 */
	$pageSize?: number;
	/** 上一页返回的游标，首次查询不传 */
	$cursor?: string;
}

/** 分页结果 */
export interface PageResult<T> {
	/** 当前页数据 */
	data: T[];
	/** 总记录数 */
	totalCount: number;
	/** 当前页大小 */
	pageSize: number;
	/** 是否有下一页 */
	hasNextPage: boolean;
	/** 下一页游标 */
	nextCursor?: string;
}

/** 聚合函数类型 */
export type AggregateFunction =
	| "$count"
	| "$sum"
	| "$avg"
	| "$max"
	| "$min"
	| "$approximateDistinct";

/** 聚合选项 */
export interface AggregateOptions {
	/** 聚合选择 — 字段名 → 聚合函数 */
	$select: Record<string, AggregateFunction>;
	/** 分组 — 字段名 → 分组策略 */
	$groupBy?: Record<string, AggregateGroupBy>;
	/** 过滤条件（聚合前过滤） */
	$having?: Record<string, FilterOp>;
}

/** 聚合分组策略 */
export type AggregateGroupBy =
	| "exact"
	| { $fixedWidth: number }
	| { $ranges: Array<{ from?: number; to?: number }> }
	| {
			$duration: {
				unit: "second" | "minute" | "hour" | "day" | "week" | "month" | "year";
				step: number;
			};
	  };

/** 聚合结果 */
export interface AggregateResult {
	/** 聚合数据行 */
	rows: Array<Record<string, unknown>>;
}
