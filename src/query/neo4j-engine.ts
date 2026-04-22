import type { EntityType, OntologyDefinition } from "../types";
import type {
	AggregateOptions,
	AggregateResult,
	FilterOp,
	PageOptions,
	PageResult,
} from "./filter-types";
import type { QueryObjectInstance } from "./object-set";
import type { IQueryEngine, ResolvedQuery } from "./query-engine";

/**
 * Neo4j 查询引擎 — 将 ResolvedQuery 转换为 Cypher
 *
 * 不直接依赖 packages/graph 的 Neo4j driver，
 * 通过构造函数注入 Cypher 执行函数。
 */
export class Neo4jQueryEngine implements IQueryEngine {
	private static readonly VALID_LABEL = /^[A-Za-z_][A-Za-z0-9_]*$/;
	private static readonly VALID_FIELD = /^[A-Za-z_@][A-Za-z0-9_.]*$/;

	constructor(
		_ontology: OntologyDefinition,
		private cypherExecutor: (
			cypher: string,
			params: Record<string, unknown>,
		) => Promise<unknown[]>,
	) {}

	private validateLabel(label: string): string {
		if (!Neo4jQueryEngine.VALID_LABEL.test(label)) {
			throw new Error(`Invalid Neo4j label: ${label}`);
		}
		return label;
	}

	private validateField(field: string): string {
		if (!Neo4jQueryEngine.VALID_FIELD.test(field)) {
			throw new Error(`Invalid field name: ${field}`);
		}
		return field;
	}

	async query<T extends EntityType>(
		query: ResolvedQuery,
		options?: PageOptions,
	): Promise<PageResult<QueryObjectInstance<T>>> {
		// 先获取总数
		const { cypher: countCypher, params: countParams } =
			this.toCountCypher(query);
		const countResults = await this.cypherExecutor(countCypher, countParams);
		const first = countResults[0] as Record<string, unknown> | undefined;
		const totalCount = (first?.total as number) ?? 0;

		// 再获取数据
		const { cypher, params } = this.toCypher(query, options);
		const rawResults = await this.cypherExecutor(cypher, params);
		const data = (rawResults as Array<Record<string, unknown>>).map((row) =>
			this.rowToInstance<T>(row, query.entityTypeRef),
		);
		return {
			data,
			totalCount,
			pageSize: options?.$pageSize ?? 50,
			hasNextPage: data.length === (options?.$pageSize ?? 50),
		};
	}

	async aggregate<_T extends EntityType>(
		entityTypeRef: string,
		options: AggregateOptions,
		filters?: Array<{ field: string; op: FilterOp }>,
	): Promise<AggregateResult> {
		const { cypher, params } = this.aggregateToCypher(
			entityTypeRef,
			options,
			filters,
		);
		const rawResults = await this.cypherExecutor(cypher, params);
		return { rows: rawResults as Array<Record<string, unknown>> };
	}

	async count(
		entityTypeRef: string,
		filters?: Array<{ field: string; op: FilterOp }>,
	): Promise<number> {
		const label = this.toLabel(entityTypeRef);
		let cypher = `MATCH (n:${label})`;
		const params: Record<string, unknown> = {};
		if (filters && filters.length > 0) {
			const whereParts = filters.map((f, i) =>
				this.filterToCypher(f.field, f.op, i, params),
			);
			cypher += ` WHERE ${whereParts.join(" AND ")}`;
		}
		cypher += " RETURN count(n) AS total";
		const results = await this.cypherExecutor(cypher, params);
		const first = results[0] as Record<string, unknown> | undefined;
		return (first?.total as number) ?? 0;
	}

	async fetchOne<T extends EntityType>(
		entityTypeRef: string,
		id: string,
	): Promise<QueryObjectInstance<T> | null> {
		const label = this.toLabel(entityTypeRef);
		const cypher = `MATCH (n:${label} {\`@id\`: $id}) RETURN n LIMIT 1`;
		const results = await this.cypherExecutor(cypher, { id });
		if (results.length === 0) return null;
		return this.rowToInstance<T>(
			results[0] as Record<string, unknown>,
			entityTypeRef,
		);
	}

	/** 将 EntityType @id 转为 Neo4j 标签名 */
	private toLabel(entityTypeRef: string): string {
		const parts = entityTypeRef.split(":");
		const label = parts.at(-1) ?? entityTypeRef;
		return this.validateLabel(label);
	}

	/** 构建仅计数的 Cypher（用于分页 totalCount） */
	private toCountCypher(query: ResolvedQuery): {
		cypher: string;
		params: Record<string, unknown>;
	} {
		const label = this.toLabel(query.entityTypeRef);
		const params: Record<string, unknown> = {};
		let cypher = `MATCH (n:${label})`;
		if (query.filters.length > 0) {
			const whereParts = query.filters.map((f, i) =>
				this.filterToCypher(f.field, f.op, i, params),
			);
			cypher += ` WHERE ${whereParts.join(" AND ")}`;
		}
		cypher += " RETURN count(n) AS total";
		return { cypher, params };
	}

	/** 将 ResolvedQuery 转为 Cypher */
	private toCypher(
		query: ResolvedQuery,
		pageOptions?: PageOptions,
	): { cypher: string; params: Record<string, unknown> } {
		const label = this.toLabel(query.entityTypeRef);
		const params: Record<string, unknown> = {};
		let cypher = `MATCH (n:${label})`;

		if (query.filters.length > 0) {
			const whereParts = query.filters.map((f, i) =>
				this.filterToCypher(f.field, f.op, i, params),
			);
			cypher += ` WHERE ${whereParts.join(" AND ")}`;
		}

		if (query.orderBy && query.orderBy.length > 0) {
			const orderParts = query.orderBy.map((o) => {
				this.validateField(o.field);
				return `n.${o.field} ${o.direction.toUpperCase()}`;
			});
			cypher += ` ORDER BY ${orderParts.join(", ")}`;
		}

		const pageSize = pageOptions?.$pageSize ?? query.limit ?? 50;
		const offset = query.offset ?? 0;
		cypher += " SKIP $skip LIMIT $limit";
		params.skip = offset;
		params.limit = pageSize;

		cypher += " RETURN n";
		return { cypher, params };
	}

	/** 将 FilterOp 转为 Cypher WHERE 子句片段 */
	private filterToCypher(
		field: string,
		op: FilterOp,
		index: number,
		params: Record<string, unknown>,
	): string {
		this.validateField(field);
		const paramName = `p${index}`;

		if ("$eq" in op) {
			params[paramName] = op.$eq;
			return `n.${field} = $${paramName}`;
		}
		if ("$neq" in op) {
			params[paramName] = op.$neq;
			return `n.${field} <> $${paramName}`;
		}
		if ("$gt" in op) {
			params[paramName] = op.$gt;
			return `n.${field} > $${paramName}`;
		}
		if ("$gte" in op) {
			params[paramName] = op.$gte;
			return `n.${field} >= $${paramName}`;
		}
		if ("$lt" in op) {
			params[paramName] = op.$lt;
			return `n.${field} < $${paramName}`;
		}
		if ("$lte" in op) {
			params[paramName] = op.$lte;
			return `n.${field} <= $${paramName}`;
		}
		if ("$contains" in op) {
			params[paramName] = op.$contains;
			return `n.${field} CONTAINS $${paramName}`;
		}
		if ("$startsWith" in op) {
			params[paramName] = op.$startsWith;
			return `n.${field} STARTS WITH $${paramName}`;
		}
		if ("$endsWith" in op) {
			params[paramName] = op.$endsWith;
			return `n.${field} ENDS WITH $${paramName}`;
		}
		if ("$in" in op) {
			params[paramName] = op.$in;
			return `n.${field} IN $${paramName}`;
		}
		if ("$notIn" in op) {
			params[paramName] = op.$notIn;
			return `NOT n.${field} IN $${paramName}`;
		}
		if ("$isNull" in op) {
			return op.$isNull ? `n.${field} IS NULL` : `n.${field} IS NOT NULL`;
		}
		if ("$exists" in op) {
			return op.$exists ? `n.${field} IS NOT NULL` : `n.${field} IS NULL`;
		}
		if ("$and" in op) {
			return op.$and
				.map((sub, i) =>
					Object.entries(sub)
						.map(
							([f, o], j) =>
								`(${this.filterToCypher(f, o, index * 100 + i * 10 + j, params)})`,
						)
						.join(" AND "),
				)
				.join(" AND ");
		}
		if ("$or" in op) {
			return op.$or
				.map((sub, i) =>
					Object.entries(sub)
						.map(
							([f, o], j) =>
								`(${this.filterToCypher(f, o, index * 100 + i * 10 + j, params)})`,
						)
						.join(" AND "),
				)
				.join(" OR ");
		}
		if ("$not" in op) {
			const notParts = Object.entries(op.$not).map(
				([f, o], i) =>
					`(${this.filterToCypher(f, o, index * 100 + i, params)})`,
			);
			return `NOT (${notParts.join(" AND ")})`;
		}
		return "true";
	}

	/** 将聚合选项转为 Cypher */
	private aggregateToCypher(
		entityTypeRef: string,
		options: AggregateOptions,
		filters?: Array<{ field: string; op: FilterOp }>,
	): { cypher: string; params: Record<string, unknown> } {
		const label = this.toLabel(entityTypeRef);
		const params: Record<string, unknown> = {};
		let cypher = `MATCH (n:${label})`;

		if (filters && filters.length > 0) {
			const whereParts = filters.map((f, i) =>
				this.filterToCypher(f.field, f.op, i, params),
			);
			cypher += ` WHERE ${whereParts.join(" AND ")}`;
		}

		const returnParts: string[] = [];
		const aggrMap: Record<string, string> = {
			$count: "count(n)",
			$sum: "sum",
			$avg: "avg",
			$max: "max",
			$min: "min",
			$approximateDistinct: "approxCountDistinct",
		};

		for (const [alias, fn] of Object.entries(options.$select)) {
			this.validateField(alias);
			returnParts.push(`${aggrMap[fn]}(n.${alias}) AS ${alias}`);
		}

		if (options.$groupBy) {
			for (const [field] of Object.entries(options.$groupBy)) {
				this.validateField(field);
				returnParts.unshift(`n.${field} AS ${field}`);
			}
		}

		cypher += ` RETURN ${returnParts.join(", ")}`;
		return { cypher, params };
	}

	/** 将查询结果行转为 QueryObjectInstance */
	private rowToInstance<T extends EntityType>(
		row: Record<string, unknown>,
		_entityTypeRef: string,
	): QueryObjectInstance<T> {
		const node = (row.n ?? row) as Record<string, unknown>;
		return {
			"@id": node["@id"] as string,
			"@type": node["@type"] as T["@id"],
			properties: node,
		};
	}
}
