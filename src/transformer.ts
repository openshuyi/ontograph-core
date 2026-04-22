import type { EntityType, OntologyDefinition } from "./types";

export interface NodeLabelMapping {
	entityId: string;
	labels: string[];
}

export interface RelationshipTypeMapping {
	relationId: string;
	neo4jType: string;
	domain: string;
	range: string;
}

export interface Neo4jSchemaResult {
	constraints: string[];
	indexes: string[];
	nodeLabels: NodeLabelMapping[];
	relationshipTypes: RelationshipTypeMapping[];
}

export class Neo4jSchemaGenerator {
	private ontology: OntologyDefinition;

	constructor(ontology: OntologyDefinition) {
		this.ontology = ontology;
	}

	generate(): string[] {
		const result = this.generateFull();
		return [...result.indexes, ...result.constraints];
	}

	generateFull(): Neo4jSchemaResult {
		return {
			constraints: this.generateConstraints(),
			indexes: this.generateIndexes(),
			nodeLabels: this.generateNodeLabels(),
			relationshipTypes: this.generateRelationshipTypes(),
		};
	}

	generateIndexes(): string[] {
		const indexes: string[] = [];
		const allTypes = this.getAllEntityTypes();

		for (const entityType of allTypes) {
			for (const attrRef of entityType.attributes ?? []) {
				if (!attrRef.identity) continue;

				const attr = this.ontology.attributes.find(
					(a) => a["@id"] === attrRef.ref,
				);
				if (!attr) continue;

				const label = entityType["@id"].split(":")[1] || entityType["@id"];
				const propName = attr["@id"].split(":")[1] || attr["@id"];

				if (attrRef.required || attr.required) {
					indexes.push(
						`CREATE CONSTRAINT ${label}_${propName}_unique IF NOT EXISTS FOR (n:${label}) REQUIRE n.${propName} IS UNIQUE`,
					);
				} else {
					indexes.push(
						`CREATE INDEX ${label}_${propName}_index IF NOT EXISTS FOR (n:${label}) ON (n.${propName})`,
					);
				}
			}
		}

		return indexes;
	}

	generateNodeLabels(): NodeLabelMapping[] {
		const mappings: NodeLabelMapping[] = [];
		const allTypes = this.getAllEntityTypes();

		for (const entityType of allTypes) {
			const name = entityType["@id"].split(":")[1] || entityType["@id"];
			const labels = this.getLabelsForKind(name, entityType.kind);
			mappings.push({ entityId: entityType["@id"], labels });
		}

		return mappings;
	}

	generateRelationshipTypes(): RelationshipTypeMapping[] {
		const mappings: RelationshipTypeMapping[] = [];

		for (const relation of this.ontology.relationTypes ?? []) {
			const name = relation["@id"].split(":")[1] || relation["@id"];
			const neo4jType = this.toUpperSnakeCase(name);
			mappings.push({
				relationId: relation["@id"],
				neo4jType,
				domain: relation.domain,
				range: relation.range,
			});
		}

		return mappings;
	}

	generateConstraints(): string[] {
		const constraints: string[] = [];
		const allTypes = this.getAllEntityTypes();

		for (const entityType of allTypes) {
			const label = entityType["@id"].split(":")[1] || entityType["@id"];

			for (const attrRef of entityType.attributes ?? []) {
				if (!attrRef.identity) continue;
				if (!attrRef.required) continue;

				const attr = this.ontology.attributes.find(
					(a) => a["@id"] === attrRef.ref,
				);
				if (!attr) continue;

				const propName = attr["@id"].split(":")[1] || attr["@id"];
				constraints.push(
					`CREATE CONSTRAINT ${label}_${propName}_required IF NOT EXISTS FOR (n:${label}) REQUIRE n.${propName} IS NOT NULL`,
				);
			}
		}

		return constraints;
	}

	generateCypherStatements(): string[] {
		const statements: string[] = [];
		const result = this.generateFull();

		for (const index of result.indexes) {
			statements.push(index);
		}
		for (const constraint of result.constraints) {
			statements.push(constraint);
		}

		for (const rel of result.relationshipTypes) {
			statements.push(
				`// Relation: ${rel.relationId} (${rel.domain})-[${rel.neo4jType}]->(${rel.range})`,
			);
		}

		return statements;
	}

	private getLabelsForKind(name: string, kind: string): string[] {
		switch (kind) {
			case "event":
				return [name, "Event"];
			case "role":
				return [name, "Role"];
			case "value":
				return ["ValueType"];
			default:
				return [name];
		}
	}

	private toUpperSnakeCase(input: string): string {
		return input
			.replace(/([a-z])([A-Z])/g, "$1_$2")
			.replace(/[-\s]/g, "_")
			.toUpperCase();
	}

	private getAllEntityTypes(): EntityType[] {
		return [
			...(this.ontology.entityTypes ?? []),
			...(this.ontology.eventTypes ?? []),
			...(this.ontology.roleTypes ?? []),
		];
	}
}
