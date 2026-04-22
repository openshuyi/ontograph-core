import { describe, expect, it } from "vitest";
import type { LocalizedText } from "./types";
import {
	type LineageNodeType,
	type DataSourceType,
	type TransformationType,
	type UsageType,
	type NodeMetadata,
	type TransformationExecutionLog,
	type LineageQueryOptions,
	type DataSource,
	type Transformation,
	type Usage,
	type LineageNode,
	type LineageEdge,
	type LineageTrace,
} from "./lineage";

// ═══════════════════════════════════════════════════════════
// Helper functions
// ═══════════════════════════════════════════════════════════

function createLocalizedText(en: string, zh?: string): LocalizedText {
	return { en, zh };
}

function createNodeMetadata(createdBy: string, version = 1): NodeMetadata {
	const now = new Date().toISOString();
	return {
		version,
		createdAt: now,
		updatedAt: now,
		createdBy,
		tags: [],
	};
}

function createDataSource(id: string, type: DataSourceType): DataSource {
	return {
		"@id": id,
		"@type": "DataSource",
		type,
		name: createLocalizedText(`Data Source ${id}`),
	};
}

function createTransformation(
	id: string,
	type: TransformationType,
	inputIds: string[],
	outputIds: string[],
): Transformation {
	return {
		"@id": id,
		"@type": "Transformation",
		type,
		name: createLocalizedText(`Transformation ${id}`),
		inputNodeIds: inputIds,
		outputNodeIds: outputIds,
	};
}

function createUsage(id: string, type: UsageType): Usage {
	return {
		"@id": id,
		"@type": "Usage",
		type,
		timestamp: new Date().toISOString(),
	};
}

// ═══════════════════════════════════════════════════════════
// Type union tests
// ═══════════════════════════════════════════════════════════

describe("LineageNodeType", () => {
	it("should accept all valid node types", () => {
		const types: LineageNodeType[] = [
			"dataSource",
			"transformation",
			"object",
			"usage",
		];

		expect(types).toHaveLength(4);
		expect(types).toContain("dataSource");
		expect(types).toContain("transformation");
		expect(types).toContain("object");
		expect(types).toContain("usage");
	});
});

describe("DataSourceType", () => {
	it("should accept all valid data source types", () => {
		const types: DataSourceType[] = [
			"api",
			"database",
			"file",
			"stream",
			"manual",
			"derived",
		];

		expect(types).toHaveLength(6);
		expect(types).toContain("api");
		expect(types).toContain("database");
		expect(types).toContain("file");
		expect(types).toContain("stream");
		expect(types).toContain("manual");
		expect(types).toContain("derived");
	});
});

describe("TransformationType", () => {
	it("should accept all valid transformation types", () => {
		const types: TransformationType[] = [
			"import",
			"export",
			"transform",
			"merge",
			"filter",
			"validate",
			"clean",
		];

		expect(types).toHaveLength(7);
		expect(types).toContain("import");
		expect(types).toContain("export");
		expect(types).toContain("transform");
		expect(types).toContain("merge");
		expect(types).toContain("filter");
		expect(types).toContain("validate");
		expect(types).toContain("clean");
	});
});

describe("UsageType", () => {
	it("should accept all valid usage types", () => {
		const types: UsageType[] = [
			"read",
			"reference",
			"report",
			"export",
			"api_output",
		];

		expect(types).toHaveLength(5);
		expect(types).toContain("read");
		expect(types).toContain("reference");
		expect(types).toContain("report");
		expect(types).toContain("export");
		expect(types).toContain("api_output");
	});
});

// ═══════════════════════════════════════════════════════════
// Interface tests
// ═══════════════════════════════════════════════════════════

describe("NodeMetadata", () => {
	it("should create valid metadata with all required fields", () => {
		const metadata: NodeMetadata = {
			version: 1,
			createdAt: "2024-01-01T00:00:00Z",
			updatedAt: "2024-01-02T00:00:00Z",
			createdBy: "user:alice",
		};

		expect(metadata.version).toBe(1);
		expect(metadata.createdAt).toBe("2024-01-01T00:00:00Z");
		expect(metadata.updatedAt).toBe("2024-01-02T00:00:00Z");
		expect(metadata.createdBy).toBe("user:alice");
		expect(metadata.updatedBy).toBeUndefined();
		expect(metadata.tags).toBeUndefined();
	});

	it("should allow optional updatedBy field", () => {
		const metadata: NodeMetadata = {
			version: 2,
			createdAt: "2024-01-01T00:00:00Z",
			updatedAt: "2024-01-03T00:00:00Z",
			createdBy: "user:alice",
			updatedBy: "user:bob",
		};

		expect(metadata.updatedBy).toBe("user:bob");
	});

	it("should allow optional tags field", () => {
		const metadata: NodeMetadata = {
			version: 1,
			createdAt: "2024-01-01T00:00:00Z",
			updatedAt: "2024-01-01T00:00:00Z",
			createdBy: "user:alice",
			tags: ["important", "production"],
		};

		expect(metadata.tags).toHaveLength(2);
		expect(metadata.tags).toContain("important");
		expect(metadata.tags).toContain("production");
	});
});

describe("TransformationExecutionLog", () => {
	it("should create valid log with required fields", () => {
		const log: TransformationExecutionLog = {
			startedAt: "2024-01-01T10:00:00Z",
			status: "success",
		};

		expect(log.startedAt).toBe("2024-01-01T10:00:00Z");
		expect(log.status).toBe("success");
		expect(log.finishedAt).toBeUndefined();
		expect(log.recordsProcessed).toBeUndefined();
		expect(log.errorMessage).toBeUndefined();
		expect(log.details).toBeUndefined();
	});

	it("should support all status types", () => {
		const statuses: TransformationExecutionLog["status"][] = [
			"success",
			"failed",
			"running",
			"pending",
		];

		expect(statuses).toHaveLength(4);
	});

	it("should allow optional finishedAt field", () => {
		const log: TransformationExecutionLog = {
			startedAt: "2024-01-01T10:00:00Z",
			finishedAt: "2024-01-01T10:30:00Z",
			status: "success",
		};

		expect(log.finishedAt).toBe("2024-01-01T10:30:00Z");
	});

	it("should allow recordsProcessed field", () => {
		const log: TransformationExecutionLog = {
			startedAt: "2024-01-01T10:00:00Z",
			finishedAt: "2024-01-01T10:30:00Z",
			status: "success",
			recordsProcessed: 1000,
		};

		expect(log.recordsProcessed).toBe(1000);
	});

	it("should allow errorMessage for failed status", () => {
		const log: TransformationExecutionLog = {
			startedAt: "2024-01-01T10:00:00Z",
			finishedAt: "2024-01-01T10:05:00Z",
			status: "failed",
			errorMessage: "Connection timeout",
		};

		expect(log.status).toBe("failed");
		expect(log.errorMessage).toBe("Connection timeout");
	});

	it("should allow details field with custom data", () => {
		const log: TransformationExecutionLog = {
			startedAt: "2024-01-01T10:00:00Z",
			status: "success",
			details: {
				source: "erp-api",
				destination: "database",
				durationMs: 30000,
			},
		};

		expect(log.details?.source).toBe("erp-api");
		expect(log.details?.durationMs).toBe(30000);
	});
});

describe("LineageQueryOptions", () => {
	it("should create valid options with required direction", () => {
		const options: LineageQueryOptions = {
			direction: "upstream",
		};

		expect(options.direction).toBe("upstream");
		expect(options.maxDepth).toBeUndefined();
		expect(options.nodeTypeFilter).toBeUndefined();
		expect(options.relationTypeFilter).toBeUndefined();
		expect(options.includeMetadata).toBeUndefined();
	});

	it("should support all direction types", () => {
		const directions: LineageQueryOptions["direction"][] = [
			"upstream",
			"downstream",
			"both",
		];

		expect(directions).toHaveLength(3);
	});

	it("should allow maxDepth parameter", () => {
		const options: LineageQueryOptions = {
			direction: "both",
			maxDepth: 5,
		};

		expect(options.maxDepth).toBe(5);
	});

	it("should allow nodeTypeFilter", () => {
		const options: LineageQueryOptions = {
			direction: "upstream",
			nodeTypeFilter: ["dataSource", "transformation"],
		};

		expect(options.nodeTypeFilter).toHaveLength(2);
		expect(options.nodeTypeFilter).toContain("dataSource");
		expect(options.nodeTypeFilter).toContain("transformation");
	});

	it("should allow relationTypeFilter", () => {
		const options: LineageQueryOptions = {
			direction: "downstream",
			relationTypeFilter: ["flowsTo", "derivedFrom"],
		};

		expect(options.relationTypeFilter).toHaveLength(2);
		expect(options.relationTypeFilter).toContain("flowsTo");
		expect(options.relationTypeFilter).toContain("derivedFrom");
	});

	it("should allow includeMetadata flag", () => {
		const options: LineageQueryOptions = {
			direction: "both",
			includeMetadata: true,
		};

		expect(options.includeMetadata).toBe(true);
	});
});

describe("DataSource", () => {
	it("should create valid DataSource with required fields", () => {
		const dataSource: DataSource = {
			"@id": "lineage:erp-api",
			"@type": "DataSource",
			type: "api",
			name: createLocalizedText("ERP API", "ERP接口"),
		};

		expect(dataSource["@id"]).toBe("lineage:erp-api");
		expect(dataSource["@type"]).toBe("DataSource");
		expect(dataSource.type).toBe("api");
		expect(dataSource.name.en).toBe("ERP API");
		expect(dataSource.name.zh).toBe("ERP接口");
		expect(dataSource.description).toBeUndefined();
		expect(dataSource.connectionInfo).toBeUndefined();
		expect(dataSource.schema).toBeUndefined();
		expect(dataSource.lastSyncAt).toBeUndefined();
		expect(dataSource.syncStatus).toBeUndefined();
	});

	it("should allow optional description", () => {
		const dataSource: DataSource = {
			"@id": "lineage:database",
			"@type": "DataSource",
			type: "database",
			name: createLocalizedText("Main Database"),
			description: createLocalizedText("Primary PostgreSQL database"),
		};

		expect(dataSource.description?.en).toBe("Primary PostgreSQL database");
	});

	it("should allow connectionInfo", () => {
		const dataSource: DataSource = {
			"@id": "lineage:api-source",
			"@type": "DataSource",
			type: "api",
			name: createLocalizedText("API Source"),
			connectionInfo: {
				url: "https://api.example.com",
				authType: "oauth2",
			},
		};

		expect(dataSource.connectionInfo?.url).toBe("https://api.example.com");
		expect(dataSource.connectionInfo?.authType).toBe("oauth2");
	});

	it("should allow schema definition", () => {
		const dataSource: DataSource = {
			"@id": "lineage:file-source",
			"@type": "DataSource",
			type: "file",
			name: createLocalizedText("CSV File"),
			schema: {
				fields: ["id", "name", "price"],
				format: "csv",
			},
		};

		expect(dataSource.schema?.fields).toHaveLength(3);
		expect(dataSource.schema?.format).toBe("csv");
	});

	it("should allow sync status tracking", () => {
		const dataSource: DataSource = {
			"@id": "lineage:stream-source",
			"@type": "DataSource",
			type: "stream",
			name: createLocalizedText("Event Stream"),
			lastSyncAt: "2024-01-15T12:00:00Z",
			syncStatus: "success",
		};

		expect(dataSource.lastSyncAt).toBe("2024-01-15T12:00:00Z");
		expect(dataSource.syncStatus).toBe("success");
	});

	it("should support all syncStatus types", () => {
		const statuses: DataSource["syncStatus"][] = [
			"success",
			"failed",
			"pending",
		];

		expect(statuses).toHaveLength(3);
	});
});

describe("Transformation", () => {
	it("should create valid Transformation with required fields", () => {
		const transformation: Transformation = {
			"@id": "lineage:etl-import",
			"@type": "Transformation",
			type: "import",
			name: createLocalizedText("ETL Import Process"),
			inputNodeIds: ["lineage:source-1"],
			outputNodeIds: ["lineage:output-1"],
		};

		expect(transformation["@id"]).toBe("lineage:etl-import");
		expect(transformation["@type"]).toBe("Transformation");
		expect(transformation.type).toBe("import");
		expect(transformation.name.en).toBe("ETL Import Process");
		expect(transformation.inputNodeIds).toHaveLength(1);
		expect(transformation.inputNodeIds[0]).toBe("lineage:source-1");
		expect(transformation.outputNodeIds).toHaveLength(1);
		expect(transformation.outputNodeIds[0]).toBe("lineage:output-1");
		expect(transformation.description).toBeUndefined();
		expect(transformation.executionLog).toBeUndefined();
	});

	it("should allow multiple input and output nodes", () => {
		const transformation: Transformation = {
			"@id": "lineage:merge-process",
			"@type": "Transformation",
			type: "merge",
			name: createLocalizedText("Merge Data"),
			inputNodeIds: [
				"lineage:source-a",
				"lineage:source-b",
				"lineage:source-c",
			],
			outputNodeIds: ["lineage:output-merged"],
		};

		expect(transformation.inputNodeIds).toHaveLength(3);
		expect(transformation.outputNodeIds).toHaveLength(1);
	});

	it("should allow optional description", () => {
		const transformation: Transformation = {
			"@id": "lineage:filter-process",
			"@type": "Transformation",
			type: "filter",
			name: createLocalizedText("Filter Active Records"),
			description: createLocalizedText("Filters out inactive records"),
			inputNodeIds: ["lineage:input"],
			outputNodeIds: ["lineage:output"],
		};

		expect(transformation.description?.en).toBe("Filters out inactive records");
	});

	it("should allow executionLog", () => {
		const transformation: Transformation = {
			"@id": "lineage:transform-process",
			"@type": "Transformation",
			type: "transform",
			name: createLocalizedText("Data Transformation"),
			inputNodeIds: ["lineage:input"],
			outputNodeIds: ["lineage:output"],
			executionLog: {
				startedAt: "2024-01-01T10:00:00Z",
				finishedAt: "2024-01-01T10:15:00Z",
				status: "success",
				recordsProcessed: 5000,
			},
		};

		expect(transformation.executionLog?.status).toBe("success");
		expect(transformation.executionLog?.recordsProcessed).toBe(5000);
	});
});

describe("Usage", () => {
	it("should create valid Usage with required fields", () => {
		const usage: Usage = {
			"@id": "lineage:read-001",
			"@type": "Usage",
			type: "read",
			timestamp: "2024-01-15T09:30:00Z",
		};

		expect(usage["@id"]).toBe("lineage:read-001");
		expect(usage["@type"]).toBe("Usage");
		expect(usage.type).toBe("read");
		expect(usage.timestamp).toBe("2024-01-15T09:30:00Z");
		expect(usage.userId).toBeUndefined();
		expect(usage.context).toBeUndefined();
	});

	it("should allow optional userId", () => {
		const usage: Usage = {
			"@id": "lineage:report-001",
			"@type": "Usage",
			type: "report",
			timestamp: "2024-01-15T10:00:00Z",
			userId: "user:bob",
		};

		expect(usage.userId).toBe("user:bob");
	});

	it("should allow context field", () => {
		const usage: Usage = {
			"@id": "lineage:api-output-001",
			"@type": "Usage",
			type: "api_output",
			timestamp: "2024-01-15T11:00:00Z",
			context: {
				endpoint: "/api/products",
				method: "GET",
				responseTimeMs: 150,
			},
		};

		expect(usage.context?.endpoint).toBe("/api/products");
		expect(usage.context?.method).toBe("GET");
		expect(usage.context?.responseTimeMs).toBe(150);
	});
});

describe("LineageNode", () => {
	it("should create dataSource node", () => {
		const node: LineageNode = {
			"@id": "lineage:node-source",
			"@type": "LineageNode",
			nodeType: "dataSource",
			dataSource: createDataSource("lineage:erp", "api"),
			metadata: createNodeMetadata("user:admin"),
		};

		expect(node["@id"]).toBe("lineage:node-source");
		expect(node["@type"]).toBe("LineageNode");
		expect(node.nodeType).toBe("dataSource");
		expect(node.dataSource?.type).toBe("api");
		expect(node.objectId).toBeUndefined();
		expect(node.transformation).toBeUndefined();
		expect(node.usage).toBeUndefined();
		expect(node.metadata.version).toBe(1);
	});

	it("should create transformation node", () => {
		const node: LineageNode = {
			"@id": "lineage:node-transform",
			"@type": "LineageNode",
			nodeType: "transformation",
			transformation: createTransformation(
				"lineage:etl",
				"import",
				["lineage:source"],
				["lineage:dest"],
			),
			metadata: createNodeMetadata("user:etl-bot"),
		};

		expect(node.nodeType).toBe("transformation");
		expect(node.transformation?.type).toBe("import");
		expect(node.transformation?.inputNodeIds).toHaveLength(1);
		expect(node.transformation?.outputNodeIds).toHaveLength(1);
	});

	it("should create object node with objectId", () => {
		const node: LineageNode = {
			"@id": "lineage:node-product",
			"@type": "LineageNode",
			nodeType: "object",
			objectId: "obj:product-123",
			metadata: createNodeMetadata("user:alice"),
		};

		expect(node.nodeType).toBe("object");
		expect(node.objectId).toBe("obj:product-123");
		expect(node.dataSource).toBeUndefined();
		expect(node.transformation).toBeUndefined();
		expect(node.usage).toBeUndefined();
	});

	it("should create usage node", () => {
		const node: LineageNode = {
			"@id": "lineage:node-usage",
			"@type": "LineageNode",
			nodeType: "usage",
			usage: createUsage("lineage:read", "read"),
			metadata: createNodeMetadata("user:bob"),
		};

		expect(node.nodeType).toBe("usage");
		expect(node.usage?.type).toBe("read");
		expect(node.usage?.timestamp).toBeDefined();
	});

	it("should support all nodeType values", () => {
		const nodeTypes: LineageNodeType[] = [
			"dataSource",
			"transformation",
			"object",
			"usage",
		];

		for (const nodeType of nodeTypes) {
			const node: LineageNode = {
				"@id": `lineage:node-${nodeType}`,
				"@type": "LineageNode",
				nodeType,
				metadata: createNodeMetadata("user:test"),
			};
			expect(node.nodeType).toBe(nodeType);
		}
	});
});

describe("LineageEdge", () => {
	it("should create valid edge with required fields", () => {
		const edge: LineageEdge = {
			"@id": "lineage:edge-001",
			"@type": "LineageEdge",
			sourceNodeId: "lineage:node-source",
			targetNodeId: "lineage:node-dest",
			relationType: "flowsTo",
		};

		expect(edge["@id"]).toBe("lineage:edge-001");
		expect(edge["@type"]).toBe("LineageEdge");
		expect(edge.sourceNodeId).toBe("lineage:node-source");
		expect(edge.targetNodeId).toBe("lineage:node-dest");
		expect(edge.relationType).toBe("flowsTo");
		expect(edge.weight).toBeUndefined();
		expect(edge.metadata).toBeUndefined();
	});

	it("should support all relationType values", () => {
		const relationTypes: LineageEdge["relationType"][] = [
			"flowsTo",
			"derivedFrom",
			"usedBy",
		];

		expect(relationTypes).toHaveLength(3);

		for (const relationType of relationTypes) {
			const edge: LineageEdge = {
				"@id": `lineage:edge-${relationType}`,
				"@type": "LineageEdge",
				sourceNodeId: "lineage:source",
				targetNodeId: "lineage:target",
				relationType,
			};
			expect(edge.relationType).toBe(relationType);
		}
	});

	it("should allow optional weight", () => {
		const edge: LineageEdge = {
			"@id": "lineage:edge-weighted",
			"@type": "LineageEdge",
			sourceNodeId: "lineage:source",
			targetNodeId: "lineage:target",
			relationType: "flowsTo",
			weight: 0.8,
		};

		expect(edge.weight).toBe(0.8);
	});

	it("should allow metadata field", () => {
		const edge: LineageEdge = {
			"@id": "lineage:edge-meta",
			"@type": "LineageEdge",
			sourceNodeId: "lineage:source",
			targetNodeId: "lineage:target",
			relationType: "derivedFrom",
			metadata: {
				createdAt: "2024-01-01T00:00:00Z",
				description: "Derived from transformation",
			},
		};

		expect(edge.metadata?.createdAt).toBe("2024-01-01T00:00:00Z");
		expect(edge.metadata?.description).toBe("Derived from transformation");
	});
});

describe("LineageTrace", () => {
	it("should create valid trace result", () => {
		const trace: LineageTrace = {
			nodeId: "lineage:node-start",
			direction: "upstream",
			nodes: [],
			edges: [],
			depth: 0,
			timestamp: "2024-01-15T12:00:00Z",
		};

		expect(trace.nodeId).toBe("lineage:node-start");
		expect(trace.direction).toBe("upstream");
		expect(trace.nodes).toHaveLength(0);
		expect(trace.edges).toHaveLength(0);
		expect(trace.depth).toBe(0);
		expect(trace.timestamp).toBe("2024-01-15T12:00:00Z");
	});

	it("should support all direction types", () => {
		const directions: LineageTrace["direction"][] = [
			"upstream",
			"downstream",
			"both",
		];

		expect(directions).toHaveLength(3);
	});

	it("should include traced nodes and edges", () => {
		const sourceNode: LineageNode = {
			"@id": "lineage:node-source",
			"@type": "LineageNode",
			nodeType: "dataSource",
			dataSource: createDataSource("lineage:api", "api"),
			metadata: createNodeMetadata("user:admin"),
		};

		const targetNode: LineageNode = {
			"@id": "lineage:node-target",
			"@type": "LineageNode",
			nodeType: "object",
			objectId: "obj:product",
			metadata: createNodeMetadata("user:admin"),
		};

		const edge: LineageEdge = {
			"@id": "lineage:edge-flow",
			"@type": "LineageEdge",
			sourceNodeId: "lineage:node-source",
			targetNodeId: "lineage:node-target",
			relationType: "flowsTo",
		};

		const trace: LineageTrace = {
			nodeId: "lineage:node-target",
			direction: "upstream",
			nodes: [sourceNode, targetNode],
			edges: [edge],
			depth: 2,
			timestamp: "2024-01-15T12:00:00Z",
		};

		expect(trace.nodes).toHaveLength(2);
		expect(trace.edges).toHaveLength(1);
		expect(trace.depth).toBe(2);
		expect(trace.edges[0]?.sourceNodeId).toBe("lineage:node-source");
		expect(trace.edges[0]?.targetNodeId).toBe("lineage:node-target");
	});
});

// ═══════════════════════════════════════════════════════════
// Integration tests - complex lineage scenarios
// ═══════════════════════════════════════════════════════════

describe("Lineage Integration", () => {
	it("should model a complete data flow pipeline", () => {
		// Create data source
		const apiSource: DataSource = {
			"@id": "lineage:erp-api",
			"@type": "DataSource",
			type: "api",
			name: createLocalizedText("ERP API"),
			connectionInfo: { url: "https://erp.example.com/api" },
		};

		// Create transformation
		const importTransform: Transformation = {
			"@id": "lineage:import-transform",
			"@type": "Transformation",
			type: "import",
			name: createLocalizedText("Import Products"),
			inputNodeIds: ["lineage:erp-api"],
			outputNodeIds: ["lineage:product-obj"],
			executionLog: {
				startedAt: "2024-01-15T08:00:00Z",
				finishedAt: "2024-01-15T08:30:00Z",
				status: "success",
				recordsProcessed: 1000,
			},
		};

		// Create lineage nodes
		const sourceNode: LineageNode = {
			"@id": "lineage:node-api",
			"@type": "LineageNode",
			nodeType: "dataSource",
			dataSource: apiSource,
			metadata: createNodeMetadata("system:etl"),
		};

		const transformNode: LineageNode = {
			"@id": "lineage:node-import",
			"@type": "LineageNode",
			nodeType: "transformation",
			transformation: importTransform,
			metadata: createNodeMetadata("system:etl"),
		};

		const objectNode: LineageNode = {
			"@id": "lineage:node-product",
			"@type": "LineageNode",
			nodeType: "object",
			objectId: "obj:product",
			metadata: createNodeMetadata("user:admin"),
		};

		// Create lineage edges
		const edge1: LineageEdge = {
			"@id": "lineage:edge-api-to-import",
			"@type": "LineageEdge",
			sourceNodeId: "lineage:node-api",
			targetNodeId: "lineage:node-import",
			relationType: "flowsTo",
		};

		const edge2: LineageEdge = {
			"@id": "lineage:edge-import-to-product",
			"@type": "LineageEdge",
			sourceNodeId: "lineage:node-import",
			targetNodeId: "lineage:node-product",
			relationType: "flowsTo",
		};

		// Verify pipeline structure
		expect(sourceNode.dataSource?.type).toBe("api");
		expect(transformNode.transformation?.type).toBe("import");
		expect(transformNode.transformation?.executionLog?.recordsProcessed).toBe(
			1000,
		);
		expect(objectNode.objectId).toBe("obj:product");

		expect(edge1.relationType).toBe("flowsTo");
		expect(edge2.relationType).toBe("flowsTo");
	});

	it("should model downstream usage tracking", () => {
		// Create object node
		const productNode: LineageNode = {
			"@id": "lineage:node-product",
			"@type": "LineageNode",
			nodeType: "object",
			objectId: "obj:product-123",
			metadata: createNodeMetadata("user:admin"),
		};
		expect(productNode.objectId).toBe("obj:product-123");

		// Create usage nodes
		const readUsage: Usage = {
			"@id": "lineage:usage-read",
			"@type": "Usage",
			type: "read",
			timestamp: "2024-01-15T09:00:00Z",
			userId: "user:bob",
		};

		const reportUsage: Usage = {
			"@id": "lineage:usage-report",
			"@type": "Usage",
			type: "report",
			timestamp: "2024-01-15T10:00:00Z",
			context: { reportType: "monthly-sales" },
		};

		const usageNode1: LineageNode = {
			"@id": "lineage:node-usage-read",
			"@type": "LineageNode",
			nodeType: "usage",
			usage: readUsage,
			metadata: createNodeMetadata("user:bob"),
		};

		const usageNode2: LineageNode = {
			"@id": "lineage:node-usage-report",
			"@type": "LineageNode",
			nodeType: "usage",
			usage: reportUsage,
			metadata: createNodeMetadata("user:reporter"),
		};

		// Create usedBy edges
		const edge1: LineageEdge = {
			"@id": "lineage:edge-product-read",
			"@type": "LineageEdge",
			sourceNodeId: "lineage:node-product",
			targetNodeId: "lineage:node-usage-read",
			relationType: "usedBy",
		};

		const edge2: LineageEdge = {
			"@id": "lineage:edge-product-report",
			"@type": "LineageEdge",
			sourceNodeId: "lineage:node-product",
			targetNodeId: "lineage:node-usage-report",
			relationType: "usedBy",
		};

		// Verify usage tracking
		expect(usageNode1.usage?.type).toBe("read");
		expect(usageNode1.usage?.userId).toBe("user:bob");
		expect(usageNode2.usage?.type).toBe("report");
		expect(usageNode2.usage?.context?.reportType).toBe("monthly-sales");

		expect(edge1.relationType).toBe("usedBy");
		expect(edge2.relationType).toBe("usedBy");
	});

	it("should model derived data relationship", () => {
		// Create source object
		const sourceNode: LineageNode = {
			"@id": "lineage:node-order",
			"@type": "LineageNode",
			nodeType: "object",
			objectId: "obj:order",
			metadata: createNodeMetadata("user:admin"),
		};
		expect(sourceNode.objectId).toBe("obj:order");

		// Create derived summary object
		const derivedNode: LineageNode = {
			"@id": "lineage:node-summary",
			"@type": "LineageNode",
			nodeType: "object",
			objectId: "obj:order-summary",
			metadata: createNodeMetadata("user:admin"),
		};

		// Create transformation that derives the summary
		const transform: Transformation = {
			"@id": "lineage:agg-transform",
			"@type": "Transformation",
			type: "transform",
			name: createLocalizedText("Aggregate Orders"),
			inputNodeIds: ["lineage:node-order"],
			outputNodeIds: ["lineage:node-summary"],
		};

		const transformNode: LineageNode = {
			"@id": "lineage:node-agg",
			"@type": "LineageNode",
			nodeType: "transformation",
			transformation: transform,
			metadata: createNodeMetadata("system:etl"),
		};

		// Create derivedFrom edge
		const edge: LineageEdge = {
			"@id": "lineage:edge-derived",
			"@type": "LineageEdge",
			sourceNodeId: "lineage:node-summary",
			targetNodeId: "lineage:node-order",
			relationType: "derivedFrom",
		};

		// Verify derived relationship
		expect(derivedNode.objectId).toBe("obj:order-summary");
		expect(transformNode.transformation?.type).toBe("transform");
		expect(edge.relationType).toBe("derivedFrom");
		expect(edge.sourceNodeId).toBe("lineage:node-summary");
		expect(edge.targetNodeId).toBe("lineage:node-order");
	});

	it("should create complete lineage trace result", () => {
		// Setup nodes
		const nodes: LineageNode[] = [
			{
				"@id": "lineage:node-source",
				"@type": "LineageNode",
				nodeType: "dataSource",
				dataSource: createDataSource("lineage:db", "database"),
				metadata: createNodeMetadata("user:admin"),
			},
			{
				"@id": "lineage:node-transform",
				"@type": "LineageNode",
				nodeType: "transformation",
				transformation: createTransformation(
					"lineage:clean",
					"clean",
					["lineage:node-source"],
					["lineage:node-object"],
				),
				metadata: createNodeMetadata("user:admin"),
			},
			{
				"@id": "lineage:node-object",
				"@type": "LineageNode",
				nodeType: "object",
				objectId: "obj:clean-data",
				metadata: createNodeMetadata("user:admin"),
			},
		];

		// Setup edges
		const edges: LineageEdge[] = [
			{
				"@id": "lineage:edge-1",
				"@type": "LineageEdge",
				sourceNodeId: "lineage:node-source",
				targetNodeId: "lineage:node-transform",
				relationType: "flowsTo",
			},
			{
				"@id": "lineage:edge-2",
				"@type": "LineageEdge",
				sourceNodeId: "lineage:node-transform",
				targetNodeId: "lineage:node-object",
				relationType: "flowsTo",
			},
		];

		// Create trace
		const trace: LineageTrace = {
			nodeId: "lineage:node-object",
			direction: "upstream",
			nodes,
			edges,
			depth: 2,
			timestamp: "2024-01-15T12:00:00Z",
		};

		// Verify trace
		expect(trace.nodeId).toBe("lineage:node-object");
		expect(trace.direction).toBe("upstream");
		expect(trace.nodes).toHaveLength(3);
		expect(trace.edges).toHaveLength(2);
		expect(trace.depth).toBe(2);

		// Verify node order follows upstream direction
		expect(trace.nodes[0]?.nodeType).toBe("dataSource");
		expect(trace.nodes[1]?.nodeType).toBe("transformation");
		expect(trace.nodes[2]?.nodeType).toBe("object");
	});

	it("should handle multi-source merge transformation", () => {
		// Create multiple data sources
		const sources: DataSource[] = [
			createDataSource("lineage:source-a", "api"),
			createDataSource("lineage:source-b", "database"),
			createDataSource("lineage:source-c", "file"),
		];

		// Create merge transformation
		const mergeTransform: Transformation = {
			"@id": "lineage:merge-all",
			"@type": "Transformation",
			type: "merge",
			name: createLocalizedText("Merge All Sources"),
			inputNodeIds: sources.map((s) => s["@id"]),
			outputNodeIds: ["lineage:merged-output"],
		};

		// Verify merge structure
		expect(mergeTransform.type).toBe("merge");
		expect(mergeTransform.inputNodeIds).toHaveLength(3);
		expect(mergeTransform.inputNodeIds).toContain("lineage:source-a");
		expect(mergeTransform.inputNodeIds).toContain("lineage:source-b");
		expect(mergeTransform.inputNodeIds).toContain("lineage:source-c");
		expect(mergeTransform.outputNodeIds).toHaveLength(1);
	});

	it("should support weighted lineage edges for importance analysis", () => {
		const criticalEdge: LineageEdge = {
			"@id": "lineage:edge-critical",
			"@type": "LineageEdge",
			sourceNodeId: "lineage:source",
			targetNodeId: "lineage:target",
			relationType: "flowsTo",
			weight: 1.0,
		};

		const optionalEdge: LineageEdge = {
			"@id": "lineage:edge-optional",
			"@type": "LineageEdge",
			sourceNodeId: "lineage:source",
			targetNodeId: "lineage:target",
			relationType: "flowsTo",
			weight: 0.3,
		};

		expect(criticalEdge.weight).toBe(1.0);
		expect(optionalEdge.weight).toBe(0.3);
		expect(criticalEdge.weight).toBeGreaterThan(optionalEdge.weight!);
	});
});
