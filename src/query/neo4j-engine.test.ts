import { describe, expect, it, vi } from "vitest";
import type { OntologyDefinition } from "../types";
import type { AggregateOptions, FilterOp } from "./filter-types";
import { Neo4jQueryEngine } from "./neo4j-engine";
import type { ResolvedQuery } from "./query-engine";

// ═══════════════════════════════════════════════════════════════════════════════
// Mock Factory — 创建可捕获 Cypher 的 mock executor
// ═══════════════════════════════════════════════════════════════════════════════

interface MockCypherExecutor {
	/** 捕获到的 Cypher 查询字符串 */
	capturedCypher: string;
	/** 捕获到的参数对象 */
	capturedParams: Record<string, unknown>;
	/** 要返回的模拟数据 */
	mockData: unknown[];
	/** 实际的 mock 函数 */
	fn: (cypher: string, params: Record<string, unknown>) => Promise<unknown[]>;
}

function createMockCypherExecutor(
	mockData: unknown[] = [],
): MockCypherExecutor {
	const executor: MockCypherExecutor = {
		capturedCypher: "",
		capturedParams: {},
		mockData,
		fn: vi.fn((cypher: string, params: Record<string, unknown>) => {
			executor.capturedCypher = cypher;
			executor.capturedParams = params;
			return Promise.resolve(mockData);
		}),
	};
	return executor;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Test Fixtures
// ═══════════════════════════════════════════════════════════════════════════════

const mockOntology: OntologyDefinition = {
	"@context": { ontograph: "https://ontograph.io/" },
	"@id": "test:Ontology",
	"@type": "Ontology",
	version: "1.0.0",
	label: { en: "Test Ontology" },
	entityTypes: [],
	relationTypes: [],
	attributes: [],
	constraints: [],
};

// ═══════════════════════════════════════════════════════════════════════════════
// FilterOp → Cypher Compilation Tests
// ═══════════════════════════════════════════════════════════════════════════════

describe("Neo4jQueryEngine - FilterOp to Cypher compilation", () => {
	describe("basic comparison operators", () => {
		it("compiles $eq (equal) operator", async () => {
			const mock = createMockCypherExecutor([{ total: 5 }]);
			const engine = new Neo4jQueryEngine(mockOntology, mock.fn);

			const query: ResolvedQuery = {
				entityTypeRef: "sc:Product",
				filters: [{ field: "name", op: { $eq: "Widget" } }],
			};

			await engine.query(query);

			expect(mock.capturedCypher).toContain("MATCH (n:Product)");
			expect(mock.capturedCypher).toContain("WHERE");
			expect(mock.capturedCypher).toContain("n.name = $p0");
			expect(mock.capturedParams.p0).toBe("Widget");
		});

		it("compiles $neq (not equal) operator", async () => {
			const mock = createMockCypherExecutor([{ total: 5 }]);
			const engine = new Neo4jQueryEngine(mockOntology, mock.fn);

			const query: ResolvedQuery = {
				entityTypeRef: "sc:Product",
				filters: [{ field: "status", op: { $neq: "deleted" } }],
			};

			await engine.query(query);

			expect(mock.capturedCypher).toContain("n.status <> $p0");
			expect(mock.capturedParams.p0).toBe("deleted");
		});

		it("compiles $gt (greater than) operator", async () => {
			const mock = createMockCypherExecutor([{ total: 5 }]);
			const engine = new Neo4jQueryEngine(mockOntology, mock.fn);

			const query: ResolvedQuery = {
				entityTypeRef: "sc:Product",
				filters: [{ field: "price", op: { $gt: 100 } }],
			};

			await engine.query(query);

			expect(mock.capturedCypher).toContain("n.price > $p0");
			expect(mock.capturedParams.p0).toBe(100);
		});

		it("compiles $gte (greater than or equal) operator", async () => {
			const mock = createMockCypherExecutor([{ total: 5 }]);
			const engine = new Neo4jQueryEngine(mockOntology, mock.fn);

			const query: ResolvedQuery = {
				entityTypeRef: "sc:Product",
				filters: [{ field: "quantity", op: { $gte: 10 } }],
			};

			await engine.query(query);

			expect(mock.capturedCypher).toContain("n.quantity >= $p0");
			expect(mock.capturedParams.p0).toBe(10);
		});

		it("compiles $lt (less than) operator", async () => {
			const mock = createMockCypherExecutor([{ total: 5 }]);
			const engine = new Neo4jQueryEngine(mockOntology, mock.fn);

			const query: ResolvedQuery = {
				entityTypeRef: "sc:Product",
				filters: [{ field: "stock", op: { $lt: 50 } }],
			};

			await engine.query(query);

			expect(mock.capturedCypher).toContain("n.stock < $p0");
			expect(mock.capturedParams.p0).toBe(50);
		});

		it("compiles $lte (less than or equal) operator", async () => {
			const mock = createMockCypherExecutor([{ total: 5 }]);
			const engine = new Neo4jQueryEngine(mockOntology, mock.fn);

			const query: ResolvedQuery = {
				entityTypeRef: "sc:Product",
				filters: [{ field: "discount", op: { $lte: 0.5 } }],
			};

			await engine.query(query);

			expect(mock.capturedCypher).toContain("n.discount <= $p0");
			expect(mock.capturedParams.p0).toBe(0.5);
		});
	});

	describe("string matching operators", () => {
		it("compiles $contains operator", async () => {
			const mock = createMockCypherExecutor([{ total: 5 }]);
			const engine = new Neo4jQueryEngine(mockOntology, mock.fn);

			const query: ResolvedQuery = {
				entityTypeRef: "sc:Product",
				filters: [{ field: "description", op: { $contains: "premium" } }],
			};

			await engine.query(query);

			expect(mock.capturedCypher).toContain("n.description CONTAINS $p0");
			expect(mock.capturedParams.p0).toBe("premium");
		});

		it("compiles $startsWith operator", async () => {
			const mock = createMockCypherExecutor([{ total: 5 }]);
			const engine = new Neo4jQueryEngine(mockOntology, mock.fn);

			const query: ResolvedQuery = {
				entityTypeRef: "sc:Product",
				filters: [{ field: "sku", op: { $startsWith: "PRD-" } }],
			};

			await engine.query(query);

			expect(mock.capturedCypher).toContain("n.sku STARTS WITH $p0");
			expect(mock.capturedParams.p0).toBe("PRD-");
		});

		it("compiles $endsWith operator", async () => {
			const mock = createMockCypherExecutor([{ total: 5 }]);
			const engine = new Neo4jQueryEngine(mockOntology, mock.fn);

			const query: ResolvedQuery = {
				entityTypeRef: "sc:Product",
				filters: [{ field: "email", op: { $endsWith: "@example.com" } }],
			};

			await engine.query(query);

			expect(mock.capturedCypher).toContain("n.email ENDS WITH $p0");
			expect(mock.capturedParams.p0).toBe("@example.com");
		});
	});

	describe("membership operators", () => {
		it("compiles $in operator", async () => {
			const mock = createMockCypherExecutor([{ total: 5 }]);
			const engine = new Neo4jQueryEngine(mockOntology, mock.fn);

			const query: ResolvedQuery = {
				entityTypeRef: "sc:Product",
				filters: [{ field: "category", op: { $in: ["A", "B", "C"] } }],
			};

			await engine.query(query);

			expect(mock.capturedCypher).toContain("n.category IN $p0");
			expect(mock.capturedParams.p0).toEqual(["A", "B", "C"]);
		});

		it("compiles $notIn operator", async () => {
			const mock = createMockCypherExecutor([{ total: 5 }]);
			const engine = new Neo4jQueryEngine(mockOntology, mock.fn);

			const query: ResolvedQuery = {
				entityTypeRef: "sc:Product",
				filters: [{ field: "status", op: { $notIn: ["archived", "deleted"] } }],
			};

			await engine.query(query);

			expect(mock.capturedCypher).toContain("NOT n.status IN $p0");
			expect(mock.capturedParams.p0).toEqual(["archived", "deleted"]);
		});
	});

	describe("null checking operators", () => {
		it("compiles $isNull: true", async () => {
			const mock = createMockCypherExecutor([{ total: 5 }]);
			const engine = new Neo4jQueryEngine(mockOntology, mock.fn);

			const query: ResolvedQuery = {
				entityTypeRef: "sc:Product",
				filters: [{ field: "deletedAt", op: { $isNull: true } }],
			};

			await engine.query(query);

			expect(mock.capturedCypher).toContain("n.deletedAt IS NULL");
			// Should not add params for IS NULL
			expect(mock.capturedParams.p0).toBeUndefined();
		});

		it("compiles $isNull: false", async () => {
			const mock = createMockCypherExecutor([{ total: 5 }]);
			const engine = new Neo4jQueryEngine(mockOntology, mock.fn);

			const query: ResolvedQuery = {
				entityTypeRef: "sc:Product",
				filters: [{ field: "updatedAt", op: { $isNull: false } }],
			};

			await engine.query(query);

			expect(mock.capturedCypher).toContain("n.updatedAt IS NOT NULL");
		});

		it("compiles $exists: true", async () => {
			const mock = createMockCypherExecutor([{ total: 5 }]);
			const engine = new Neo4jQueryEngine(mockOntology, mock.fn);

			const query: ResolvedQuery = {
				entityTypeRef: "sc:Product",
				filters: [{ field: "optionalField", op: { $exists: true } }],
			};

			await engine.query(query);

			expect(mock.capturedCypher).toContain("n.optionalField IS NOT NULL");
		});

		it("compiles $exists: false", async () => {
			const mock = createMockCypherExecutor([{ total: 5 }]);
			const engine = new Neo4jQueryEngine(mockOntology, mock.fn);

			const query: ResolvedQuery = {
				entityTypeRef: "sc:Product",
				filters: [{ field: "optionalField", op: { $exists: false } }],
			};

			await engine.query(query);

			expect(mock.capturedCypher).toContain("n.optionalField IS NULL");
		});
	});

	describe("compound logical operators", () => {
		it("compiles $and with multiple conditions", async () => {
			const mock = createMockCypherExecutor([{ total: 5 }]);
			const engine = new Neo4jQueryEngine(mockOntology, mock.fn);

			const query: ResolvedQuery = {
				entityTypeRef: "sc:Product",
				filters: [
					{
						field: "__compound__",
						op: {
							$and: [{ price: { $gt: 10 } }, { price: { $lt: 100 } }],
						},
					},
				],
			};

			await engine.query(query);

			expect(mock.capturedCypher).toContain("(n.price > $p0)");
			expect(mock.capturedCypher).toContain("(n.price < $p10)");
			expect(mock.capturedCypher).toContain(" AND ");
			expect(mock.capturedParams.p0).toBe(10);
			expect(mock.capturedParams.p10).toBe(100);
		});

		it("compiles $or with multiple conditions", async () => {
			const mock = createMockCypherExecutor([{ total: 5 }]);
			const engine = new Neo4jQueryEngine(mockOntology, mock.fn);

			const query: ResolvedQuery = {
				entityTypeRef: "sc:Product",
				filters: [
					{
						field: "__compound__",
						op: {
							$or: [
								{ status: { $eq: "active" } },
								{ status: { $eq: "pending" } },
							],
						},
					},
				],
			};

			await engine.query(query);

			expect(mock.capturedCypher).toContain("(n.status = $p0)");
			expect(mock.capturedCypher).toContain("(n.status = $p10)");
			expect(mock.capturedCypher).toContain(" OR ");
			expect(mock.capturedParams.p0).toBe("active");
			expect(mock.capturedParams.p10).toBe("pending");
		});

		it("compiles $not operator", async () => {
			const mock = createMockCypherExecutor([{ total: 5 }]);
			const engine = new Neo4jQueryEngine(mockOntology, mock.fn);

			const query: ResolvedQuery = {
				entityTypeRef: "sc:Product",
				filters: [
					{
						field: "__compound__",
						op: {
							$not: {
								status: { $eq: "deleted" },
							},
						},
					},
				],
			};

			await engine.query(query);

			expect(mock.capturedCypher).toContain("NOT ((n.status = $p0))");
			expect(mock.capturedParams.p0).toBe("deleted");
		});

		it("compiles $not with multiple conditions", async () => {
			const mock = createMockCypherExecutor([{ total: 5 }]);
			const engine = new Neo4jQueryEngine(mockOntology, mock.fn);

			const query: ResolvedQuery = {
				entityTypeRef: "sc:Product",
				filters: [
					{
						field: "__compound__",
						op: {
							$not: {
								status: { $eq: "deleted" },
								name: { $eq: "test" },
							},
						},
					},
				],
			};

			await engine.query(query);

			expect(mock.capturedCypher).toContain(
				"NOT ((n.status = $p0) AND (n.name = $p1))",
			);
			expect(mock.capturedParams.p0).toBe("deleted");
			expect(mock.capturedParams.p1).toBe("test");
		});
	});
});

// ═══════════════════════════════════════════════════════════════════════════════
// Label Validation Tests
// ═══════════════════════════════════════════════════════════════════════════════

describe("Neo4jQueryEngine - Label validation", () => {
	it("accepts valid labels", async () => {
		const mock = createMockCypherExecutor([{ total: 5 }]);
		const engine = new Neo4jQueryEngine(mockOntology, mock.fn);

		const validLabels = [
			"Product",
			"Warehouse",
			"_internal",
			"UserRole",
			"type_123",
			"CamelCase",
			"snake_case",
		];

		for (const label of validLabels) {
			mock.capturedCypher = "";
			const query: ResolvedQuery = {
				entityTypeRef: `sc:${label}`,
				filters: [],
			};

			await engine.query(query);
			expect(mock.capturedCypher).toContain(`(n:${label})`);
		}
	});

	it("rejects labels with special characters", async () => {
		const mock = createMockCypherExecutor([{ total: 5 }]);
		const engine = new Neo4jQueryEngine(mockOntology, mock.fn);

		const invalidLabels = [
			"Product;DROP",
			"Warehouse--",
			"type/*comment*/",
			"Label WITH SPACE",
			"Label\tTab",
			"Label\nNewline",
			"123Number",
			"-dash",
		];

		for (const label of invalidLabels) {
			const query: ResolvedQuery = {
				entityTypeRef: `sc:${label}`,
				filters: [],
			};

			await expect(engine.query(query)).rejects.toThrow(
				`Invalid Neo4j label: ${label}`,
			);
		}
	});

	it("rejects empty label", async () => {
		const mock = createMockCypherExecutor([{ total: 5 }]);
		const engine = new Neo4jQueryEngine(mockOntology, mock.fn);

		const query: ResolvedQuery = {
			entityTypeRef: "sc:",
			filters: [],
		};

		await expect(engine.query(query)).rejects.toThrow("Invalid Neo4j label");
	});
});

// ═══════════════════════════════════════════════════════════════════════════════
// Field Validation Tests
// ═══════════════════════════════════════════════════════════════════════════════

describe("Neo4jQueryEngine - Field validation", () => {
	it("accepts valid field names", async () => {
		const mock = createMockCypherExecutor([{ total: 5 }]);
		const engine = new Neo4jQueryEngine(mockOntology, mock.fn);

		const validFields = [
			"name",
			"firstName",
			"_internal",
			"user_id",
			"@id",
			"nested.field",
			"a.b.c",
		];

		for (const field of validFields) {
			mock.capturedCypher = "";
			const query: ResolvedQuery = {
				entityTypeRef: "sc:Product",
				filters: [{ field, op: { $eq: "test" } }],
			};

			await engine.query(query);
			expect(mock.capturedCypher).toContain(`n.${field}`);
		}
	});

	it("rejects field names with injection attempts", async () => {
		const mock = createMockCypherExecutor([{ total: 5 }]);
		const engine = new Neo4jQueryEngine(mockOntology, mock.fn);

		const injectionFields = [
			"n.name; DROP DATABASE",
			"name`--",
			"name/*comment*/",
			"name; MATCH",
			"name DROP",
			"name DELETE",
		];

		for (const field of injectionFields) {
			const query: ResolvedQuery = {
				entityTypeRef: "sc:Product",
				filters: [{ field, op: { $eq: "test" } }],
			};

			await expect(engine.query(query)).rejects.toThrow("Invalid field name");
		}
	});

	it("rejects field names with spaces", async () => {
		const mock = createMockCypherExecutor([{ total: 5 }]);
		const engine = new Neo4jQueryEngine(mockOntology, mock.fn);

		const query: ResolvedQuery = {
			entityTypeRef: "sc:Product",
			filters: [{ field: "name field", op: { $eq: "test" } }],
		};

		await expect(engine.query(query)).rejects.toThrow("Invalid field name");
	});

	it("rejects field names starting with numbers", async () => {
		const mock = createMockCypherExecutor([{ total: 5 }]);
		const engine = new Neo4jQueryEngine(mockOntology, mock.fn);

		const query: ResolvedQuery = {
			entityTypeRef: "sc:Product",
			filters: [{ field: "123field", op: { $eq: "test" } }],
		};

		await expect(engine.query(query)).rejects.toThrow("Invalid field name");
	});
});

// ═══════════════════════════════════════════════════════════════════════════════
// Pagination Tests
// ═══════════════════════════════════════════════════════════════════════════════

describe("Neo4jQueryEngine - Pagination", () => {
	it("includes SKIP and LIMIT clauses", async () => {
		const mock = createMockCypherExecutor([{ total: 100 }]);
		const engine = new Neo4jQueryEngine(mockOntology, mock.fn);

		const query: ResolvedQuery = {
			entityTypeRef: "sc:Product",
			filters: [],
		};

		await engine.query(query, { $pageSize: 25 });

		expect(mock.capturedCypher).toContain("SKIP $skip");
		expect(mock.capturedCypher).toContain("LIMIT $limit");
		expect(mock.capturedParams.skip).toBe(0);
		expect(mock.capturedParams.limit).toBe(25);
	});

	it("uses default page size of 50 when not specified", async () => {
		const mock = createMockCypherExecutor([{ total: 100 }]);
		const engine = new Neo4jQueryEngine(mockOntology, mock.fn);

		const query: ResolvedQuery = {
			entityTypeRef: "sc:Product",
			filters: [],
		};

		await engine.query(query);

		expect(mock.capturedParams.limit).toBe(50);
	});

	it("respects query offset", async () => {
		const mock = createMockCypherExecutor([{ total: 100 }]);
		const engine = new Neo4jQueryEngine(mockOntology, mock.fn);

		const query: ResolvedQuery = {
			entityTypeRef: "sc:Product",
			filters: [],
			offset: 100,
		};

		await engine.query(query, { $pageSize: 25 });

		expect(mock.capturedParams.skip).toBe(100);
		expect(mock.capturedParams.limit).toBe(25);
	});

	it("uses query limit when pageOptions not provided", async () => {
		const mock = createMockCypherExecutor([{ total: 100 }]);
		const engine = new Neo4jQueryEngine(mockOntology, mock.fn);

		const query: ResolvedQuery = {
			entityTypeRef: "sc:Product",
			filters: [],
			limit: 10,
		};

		await engine.query(query);

		expect(mock.capturedParams.limit).toBe(10);
	});
});

// ═══════════════════════════════════════════════════════════════════════════════
// Count Query Tests
// ═══════════════════════════════════════════════════════════════════════════════

describe("Neo4jQueryEngine - Count query", () => {
	it("generates count query with filters", async () => {
		const mock = createMockCypherExecutor([{ total: 42 }]);
		const engine = new Neo4jQueryEngine(mockOntology, mock.fn);

		const count = await engine.count("sc:Product", [
			{ field: "status", op: { $eq: "active" } },
		]);

		expect(mock.capturedCypher).toContain("MATCH (n:Product)");
		expect(mock.capturedCypher).toContain("WHERE");
		expect(mock.capturedCypher).toContain("n.status = $p0");
		expect(mock.capturedCypher).toContain("RETURN count(n) AS total");
		expect(mock.capturedParams.p0).toBe("active");
		expect(count).toBe(42);
	});

	it("generates count query without filters", async () => {
		const mock = createMockCypherExecutor([{ total: 100 }]);
		const engine = new Neo4jQueryEngine(mockOntology, mock.fn);

		const count = await engine.count("sc:Product");

		expect(mock.capturedCypher).toContain("MATCH (n:Product)");
		expect(mock.capturedCypher).not.toContain("WHERE");
		expect(mock.capturedCypher).toContain("RETURN count(n) AS total");
		expect(count).toBe(100);
	});

	it("handles empty results", async () => {
		const mock = createMockCypherExecutor([]);
		const engine = new Neo4jQueryEngine(mockOntology, mock.fn);

		const count = await engine.count("sc:Product");

		expect(count).toBe(0);
	});
});

// ═══════════════════════════════════════════════════════════════════════════════
// Aggregate Query Tests
// ═══════════════════════════════════════════════════════════════════════════════

describe("Neo4jQueryEngine - Aggregate query", () => {
	it("compiles $count aggregate", async () => {
		const mock = createMockCypherExecutor([{ total: 100 }]);
		const engine = new Neo4jQueryEngine(mockOntology, mock.fn);

		const options: AggregateOptions = {
			$select: { total: "$count" },
		};

		await engine.aggregate("sc:Product", options);

		expect(mock.capturedCypher).toContain("RETURN count(n)(n.total) AS total");
	});

	it("compiles $sum aggregate", async () => {
		const mock = createMockCypherExecutor([{ price: 1000 }]);
		const engine = new Neo4jQueryEngine(mockOntology, mock.fn);

		const options: AggregateOptions = {
			$select: { price: "$sum" },
		};

		await engine.aggregate("sc:Product", options);

		expect(mock.capturedCypher).toContain("RETURN sum(n.price) AS price");
	});

	it("compiles $avg aggregate", async () => {
		const mock = createMockCypherExecutor([{ avgPrice: 50.5 }]);
		const engine = new Neo4jQueryEngine(mockOntology, mock.fn);

		const options: AggregateOptions = {
			$select: { avgPrice: "$avg" },
		};

		await engine.aggregate("sc:Product", options);

		expect(mock.capturedCypher).toContain("RETURN avg(n.avgPrice) AS avgPrice");
	});

	it("compiles $max aggregate", async () => {
		const mock = createMockCypherExecutor([{ maxPrice: 999 }]);
		const engine = new Neo4jQueryEngine(mockOntology, mock.fn);

		const options: AggregateOptions = {
			$select: { maxPrice: "$max" },
		};

		await engine.aggregate("sc:Product", options);

		expect(mock.capturedCypher).toContain("RETURN max(n.maxPrice) AS maxPrice");
	});

	it("compiles $min aggregate", async () => {
		const mock = createMockCypherExecutor([{ minPrice: 10 }]);
		const engine = new Neo4jQueryEngine(mockOntology, mock.fn);

		const options: AggregateOptions = {
			$select: { minPrice: "$min" },
		};

		await engine.aggregate("sc:Product", options);

		expect(mock.capturedCypher).toContain("RETURN min(n.minPrice) AS minPrice");
	});

	it("compiles multiple aggregates", async () => {
		const mock = createMockCypherExecutor([
			{ total: 100, sumPrice: 5000, avgPrice: 50 },
		]);
		const engine = new Neo4jQueryEngine(mockOntology, mock.fn);

		const options: AggregateOptions = {
			$select: {
				total: "$count",
				sumPrice: "$sum",
				avgPrice: "$avg",
			},
		};

		await engine.aggregate("sc:Product", options);

		expect(mock.capturedCypher).toContain("count(n)(n.total) AS total");
		expect(mock.capturedCypher).toContain("sum(n.sumPrice) AS sumPrice");
		expect(mock.capturedCypher).toContain("avg(n.avgPrice) AS avgPrice");
	});

	it("compiles $groupBy", async () => {
		const mock = createMockCypherExecutor([
			{ category: "A", total: 50 },
			{ category: "B", total: 50 },
		]);
		const engine = new Neo4jQueryEngine(mockOntology, mock.fn);

		const options: AggregateOptions = {
			$select: { total: "$count" },
			$groupBy: { category: "exact" },
		};

		await engine.aggregate("sc:Product", options);

		expect(mock.capturedCypher).toContain("n.category AS category");
		expect(mock.capturedCypher).toContain("count(n)(n.total) AS total");
		expect(mock.capturedParams).toEqual({});
	});

	it("applies filters to aggregate", async () => {
		const mock = createMockCypherExecutor([{ total: 30 }]);
		const engine = new Neo4jQueryEngine(mockOntology, mock.fn);

		const options: AggregateOptions = {
			$select: { total: "$count" },
		};
		const filters: Array<{ field: string; op: FilterOp }> = [
			{ field: "status", op: { $eq: "active" } },
		];

		await engine.aggregate("sc:Product", options, filters);

		expect(mock.capturedCypher).toContain("WHERE");
		expect(mock.capturedCypher).toContain("n.status = $p0");
		expect(mock.capturedParams.p0).toBe("active");
	});
});

// ═══════════════════════════════════════════════════════════════════════════════
// fetchOne Query Tests
// ═══════════════════════════════════════════════════════════════════════════════

describe("Neo4jQueryEngine - fetchOne", () => {
	it("queries by @id", async () => {
		const mock = createMockCypherExecutor([
			{ n: { "@id": "prod:123", "@type": "sc:Product", name: "Widget" } },
		]);
		const engine = new Neo4jQueryEngine(mockOntology, mock.fn);

		const result = await engine.fetchOne("sc:Product", "prod:123");

		expect(mock.capturedCypher).toContain("MATCH (n:Product");
		expect(mock.capturedCypher).toContain("@id`: $id");
		expect(mock.capturedCypher).toContain("RETURN n LIMIT 1");
		expect(mock.capturedParams.id).toBe("prod:123");
		expect(result).not.toBeNull();
		expect(result?.["@id"]).toBe("prod:123");
	});

	it("returns null when not found", async () => {
		const mock = createMockCypherExecutor([]);
		const engine = new Neo4jQueryEngine(mockOntology, mock.fn);

		const result = await engine.fetchOne("sc:Product", "prod:999");

		expect(result).toBeNull();
	});
});

// ═══════════════════════════════════════════════════════════════════════════════
// Complex Compound Filter Tests
// ═══════════════════════════════════════════════════════════════════════════════

describe("Neo4jQueryEngine - Complex compound filters", () => {
	it("handles nested $and and $or", async () => {
		const mock = createMockCypherExecutor([{ total: 5 }]);
		const engine = new Neo4jQueryEngine(mockOntology, mock.fn);

		const query: ResolvedQuery = {
			entityTypeRef: "sc:Product",
			filters: [
				{
					field: "category",
					op: { $eq: "electronics" },
				},
				{
					field: "__compound__",
					op: {
						$or: [{ price: { $lt: 50 } }, { price: { $gt: 500 } }],
					},
				},
			],
		};

		await engine.query(query);

		expect(mock.capturedCypher).toContain("n.category = $p0");
		expect(mock.capturedCypher).toContain("(n.price < $p100)");
		expect(mock.capturedCypher).toContain("(n.price > $p110)");
		expect(mock.capturedParams.p0).toBe("electronics");
		expect(mock.capturedParams.p100).toBe(50);
		expect(mock.capturedParams.p110).toBe(500);
	});

	it("handles $not with nested $and", async () => {
		const mock = createMockCypherExecutor([{ total: 5 }]);
		const engine = new Neo4jQueryEngine(mockOntology, mock.fn);

		const query: ResolvedQuery = {
			entityTypeRef: "sc:Product",
			filters: [
				{
					field: "__compound__",
					op: {
						$not: {
							status: { $eq: "inactive" },
							stock: { $eq: 0 },
						},
					},
				},
			],
		};

		await engine.query(query);

		expect(mock.capturedCypher).toContain("NOT");
		expect(mock.capturedParams.p0).toBe("inactive");
		expect(mock.capturedParams.p1).toBe(0);
	});

	it("handles multiple filters with AND relationship", async () => {
		const mock = createMockCypherExecutor([{ total: 5 }]);
		const engine = new Neo4jQueryEngine(mockOntology, mock.fn);

		const query: ResolvedQuery = {
			entityTypeRef: "sc:Product",
			filters: [
				{ field: "status", op: { $eq: "active" } },
				{ field: "price", op: { $gte: 10 } },
				{ field: "price", op: { $lte: 100 } },
			],
		};

		await engine.query(query);

		expect(mock.capturedCypher).toContain("n.status = $p0");
		expect(mock.capturedCypher).toContain("n.price >= $p1");
		expect(mock.capturedCypher).toContain("n.price <= $p2");
		expect(mock.capturedCypher).toContain(" WHERE ");
		// Multiple filters are joined with AND
		const whereMatch = mock.capturedCypher.match(/WHERE\s+(.+?)\s+RETURN/);
		expect(whereMatch).not.toBeNull();
		expect(whereMatch).toBeDefined();
		if (whereMatch?.[1]) {
			const whereClause = whereMatch[1];
			const andCount = (whereClause.match(/AND/g) || []).length;
			expect(andCount).toBe(2);
		}
	});
});

// ═══════════════════════════════════════════════════════════════════════════════
// Parameter Binding Tests
// ═══════════════════════════════════════════════════════════════════════════════

describe("Neo4jQueryEngine - Parameter binding", () => {
	it("binds all values through $paramN placeholders", async () => {
		const mock = createMockCypherExecutor([{ total: 5 }]);
		const engine = new Neo4jQueryEngine(mockOntology, mock.fn);

		const query: ResolvedQuery = {
			entityTypeRef: "sc:Product",
			filters: [
				{ field: "name", op: { $eq: "Widget" } },
				{ field: "price", op: { $gt: 100 } },
				{ field: "category", op: { $in: ["A", "B", "C"] } },
			],
		};

		await engine.query(query);

		// Verify params object contains all values
		expect(mock.capturedParams.p0).toBe("Widget");
		expect(mock.capturedParams.p1).toBe(100);
		expect(mock.capturedParams.p2).toEqual(["A", "B", "C"]);

		// Verify Cypher uses placeholders, not literal values
		expect(mock.capturedCypher).toContain("$p0");
		expect(mock.capturedCypher).toContain("$p1");
		expect(mock.capturedCypher).toContain("$p2");
		expect(mock.capturedCypher).not.toContain("'Widget'");
		expect(mock.capturedCypher).not.toContain("100");
	});

	it("never string-concatenates values into Cypher", async () => {
		const mock = createMockCypherExecutor([{ total: 5 }]);
		const engine = new Neo4jQueryEngine(mockOntology, mock.fn);

		// Test with potentially dangerous string values
		const maliciousValue = "'; MATCH (n) DETACH DELETE n; //";

		const query: ResolvedQuery = {
			entityTypeRef: "sc:Product",
			filters: [{ field: "name", op: { $eq: maliciousValue } }],
		};

		await engine.query(query);

		// The value should be in params, not in the Cypher string
		expect(mock.capturedCypher).toContain("$p0");
		expect(mock.capturedParams.p0).toBe(maliciousValue);
		expect(mock.capturedCypher).not.toContain(maliciousValue);
		expect(mock.capturedCypher).not.toContain("DETACH DELETE");
	});

	it("handles special characters in parameter values safely", async () => {
		const mock = createMockCypherExecutor([{ total: 5 }]);
		const engine = new Neo4jQueryEngine(mockOntology, mock.fn);

		const specialValues = [
			'value with "quotes"',
			"value with 'apostrophes'",
			"value with \\ backslash",
			"value with \n newline",
			"value with \t tab",
			"${template.literal}",
			"${process.env.SECRET}",
		];

		for (const value of specialValues) {
			mock.capturedCypher = "";
			mock.capturedParams = {};

			const query: ResolvedQuery = {
				entityTypeRef: "sc:Product",
				filters: [{ field: "name", op: { $eq: value } }],
			};

			await engine.query(query);

			expect(mock.capturedCypher).toContain("$p0");
			expect(mock.capturedParams.p0).toBe(value);
			expect(mock.capturedCypher).not.toContain(value);
		}
	});

	it("binds pagination parameters", async () => {
		const mock = createMockCypherExecutor([{ total: 100 }]);
		const engine = new Neo4jQueryEngine(mockOntology, mock.fn);

		const query: ResolvedQuery = {
			entityTypeRef: "sc:Product",
			filters: [],
			offset: 50,
		};

		await engine.query(query, { $pageSize: 25 });

		expect(mock.capturedCypher).toContain("SKIP $skip");
		expect(mock.capturedCypher).toContain("LIMIT $limit");
		expect(mock.capturedParams.skip).toBe(50);
		expect(mock.capturedParams.limit).toBe(25);
		expect(mock.capturedCypher).not.toContain("SKIP 50");
		expect(mock.capturedCypher).not.toContain("LIMIT 25");
	});

	it("binds fetchOne id parameter", async () => {
		const mock = createMockCypherExecutor([
			{ n: { "@id": "prod:123", "@type": "sc:Product" } },
		]);
		const engine = new Neo4jQueryEngine(mockOntology, mock.fn);

		await engine.fetchOne("sc:Product", "prod:123");

		expect(mock.capturedCypher).toContain("$id");
		expect(mock.capturedParams.id).toBe("prod:123");
		expect(mock.capturedCypher).not.toContain("'prod:123'");
	});
});

// ═══════════════════════════════════════════════════════════════════════════════
// Complete Query Tests
// ═══════════════════════════════════════════════════════════════════════════════

describe("Neo4jQueryEngine - Complete query scenarios", () => {
	it("builds complete query with filters, orderBy, and pagination", async () => {
		let callCount = 0;
		const countResult = [{ total: 2 }];
		const dataResult = [
			{
				n: {
					"@id": "product-1",
					"@type": "sc:Product",
					name: "Widget",
					price: 50,
				},
			},
			{
				n: {
					"@id": "product-2",
					"@type": "sc:Product",
					name: "Gadget",
					price: 100,
				},
			},
		];
		const fn = (cypher: string, _params: Record<string, unknown>) => {
			callCount++;
			if (cypher.includes("count(n)")) return Promise.resolve(countResult);
			return Promise.resolve(dataResult);
		};
		const engine = new Neo4jQueryEngine(mockOntology, fn);

		const query: ResolvedQuery = {
			entityTypeRef: "sc:Product",
			filters: [
				{ field: "status", op: { $eq: "active" } },
				{ field: "price", op: { $gte: 10 } },
			],
			orderBy: [{ field: "price", direction: "asc" }],
			limit: 20,
			offset: 40,
		};

		const result = await engine.query(query, { $pageSize: 20 });

		expect(result.data).toHaveLength(2);
		expect(result.totalCount).toBe(2);
		expect(result.pageSize).toBe(20);
		expect(result.hasNextPage).toBe(false);
		expect(callCount).toBe(2);
	});

	it("extracts label from simple entity type ref", async () => {
		const mock = createMockCypherExecutor([{ total: 5 }]);
		const engine = new Neo4jQueryEngine(mockOntology, mock.fn);

		const query: ResolvedQuery = {
			entityTypeRef: "schema:Product",
			filters: [],
		};

		await engine.query(query);

		expect(mock.capturedCypher).toContain("(n:Product)");
	});

	it("preserves order of multiple orderBy fields", async () => {
		const mock = createMockCypherExecutor([{ total: 5 }]);
		const engine = new Neo4jQueryEngine(mockOntology, mock.fn);

		const query: ResolvedQuery = {
			entityTypeRef: "sc:Product",
			filters: [],
			orderBy: [
				{ field: "category", direction: "asc" },
				{ field: "price", direction: "desc" },
				{ field: "name", direction: "asc" },
			],
		};

		await engine.query(query);

		expect(mock.capturedCypher).toContain(
			"ORDER BY n.category ASC, n.price DESC, n.name ASC",
		);
	});
});

// ═══════════════════════════════════════════════════════════════════════════════
// PageResult Tests
// ═══════════════════════════════════════════════════════════════════════════════

describe("Neo4jQueryEngine - PageResult", () => {
	it("sets hasNextPage to false when data length < pageSize", async () => {
		const mockData = [{ n: { "@id": "prod:1", "@type": "sc:Product" } }];
		const mock = createMockCypherExecutor(mockData);
		const engine = new Neo4jQueryEngine(mockOntology, mock.fn);

		const query: ResolvedQuery = {
			entityTypeRef: "sc:Product",
			filters: [],
		};

		const result = await engine.query(query, { $pageSize: 10 });

		expect(result.data).toHaveLength(1);
		expect(result.hasNextPage).toBe(false);
	});

	it("sets hasNextPage to true when data length === pageSize", async () => {
		const mockData = [
			{ n: { "@id": "prod:1", "@type": "sc:Product" } },
			{ n: { "@id": "prod:2", "@type": "sc:Product" } },
		];
		const mock = createMockCypherExecutor(mockData);
		const engine = new Neo4jQueryEngine(mockOntology, mock.fn);

		const query: ResolvedQuery = {
			entityTypeRef: "sc:Product",
			filters: [],
		};

		const result = await engine.query(query, { $pageSize: 2 });

		expect(result.data).toHaveLength(2);
		expect(result.hasNextPage).toBe(true);
	});

	it("transforms row to QueryObjectInstance correctly", async () => {
		const mockData = [
			{
				n: {
					"@id": "prod:123",
					"@type": "sc:Product",
					name: "Widget",
					price: 50,
				},
			},
		];
		const mock = createMockCypherExecutor(mockData);
		const engine = new Neo4jQueryEngine(mockOntology, mock.fn);

		const query: ResolvedQuery = {
			entityTypeRef: "sc:Product",
			filters: [],
		};

		const result = await engine.query(query);

		expect(result.data[0]).toEqual({
			"@id": "prod:123",
			"@type": "sc:Product",
			properties: {
				"@id": "prod:123",
				"@type": "sc:Product",
				name: "Widget",
				price: 50,
			},
		});
	});
});
