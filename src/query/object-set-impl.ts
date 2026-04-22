import type { EntityType, OntologyDefinition } from "../types";
import type {
	AggregateOptions,
	AggregateResult,
	FilterOp,
	PageOptions,
	PageResult,
} from "./filter-types";
import type { ObjectSet, QueryObjectInstance } from "./object-set";
import type { IQueryEngine, QueryChain } from "./query-engine";

/**
 * ObjectSet 实现 — 不可变链式调用
 *
 * 每次 where/orderBy/limit 返回新实例，不修改原实例。
 */
export class ObjectSetImpl<T extends EntityType = EntityType>
	implements ObjectSet<T>
{
	private constructor(
		private ontology: OntologyDefinition,
		private engine: IQueryEngine,
		private entityTypeRef: string,
		private chain: QueryChain,
	) {}

	/** 工厂方法 — 创建初始 ObjectSet */
	static create<T extends EntityType>(
		ontology: OntologyDefinition,
		engine: IQueryEngine,
		entityTypeRef: string,
	): ObjectSetImpl<T> {
		return new ObjectSetImpl<T>(ontology, engine, entityTypeRef, {
			filters: [],
			orderBy: [],
		});
	}

	where(filter: Record<string, FilterOp>): ObjectSetImpl<T> {
		const newFilters = Object.entries(filter).map(([field, op]) => ({
			field,
			op,
		}));
		return this.clone({ filters: [...this.chain.filters, ...newFilters] });
	}

	orderBy(field: string, direction: "asc" | "desc"): ObjectSetImpl<T> {
		return this.clone({
			orderBy: [...this.chain.orderBy, { field, direction }],
		});
	}

	limit(n: number): ObjectSetImpl<T> {
		return this.clone({ limit: n });
	}

	offset(n: number): ObjectSetImpl<T> {
		return this.clone({ offset: n });
	}

	async fetchPage(
		options?: PageOptions,
	): Promise<PageResult<QueryObjectInstance<T>>> {
		const resolvedQuery = {
			entityTypeRef: this.entityTypeRef,
			filters: this.chain.filters,
			orderBy: this.chain.orderBy.length > 0 ? this.chain.orderBy : undefined,
			limit: this.chain.limit,
			offset: this.chain.offset,
		};
		return this.engine.query<T>(resolvedQuery, options);
	}

	async fetchAll(): Promise<QueryObjectInstance<T>[]> {
		const all: QueryObjectInstance<T>[] = [];
		let cursor: string | undefined;
		let hasMore = true;

		while (hasMore) {
			const page = await this.fetchPage(
				cursor ? { $cursor: cursor } : undefined,
			);
			all.push(...page.data);
			hasMore = page.hasNextPage;
			cursor = page.nextCursor;
		}

		return all;
	}

	async fetchOne(id: string): Promise<QueryObjectInstance<T> | null> {
		return this.engine.fetchOne<T>(this.entityTypeRef, id);
	}

	async aggregate(options: AggregateOptions): Promise<AggregateResult> {
		return this.engine.aggregate<T>(
			this.entityTypeRef,
			options,
			this.chain.filters,
		);
	}

	async count(): Promise<number> {
		return this.engine.count(this.entityTypeRef, this.chain.filters);
	}

	/** 返回新实例（不可变） */
	private clone(overrides: Partial<QueryChain>): ObjectSetImpl<T> {
		return new ObjectSetImpl<T>(
			this.ontology,
			this.engine,
			this.entityTypeRef,
			{
				...this.chain,
				...overrides,
			},
		);
	}
}
