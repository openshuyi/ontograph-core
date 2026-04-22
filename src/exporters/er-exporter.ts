/**
 * ER Diagram Exporter — OntoGraph → Mermaid erDiagram syntax
 *
 * 映射规则:
 * - EntityType    → Mermaid erDiagram entity with attributes
 * - RelationType  → Mermaid relationship line with cardinality
 * - AttributeRef  → Attribute inside entity with data type
 * - ValueType     → Enum entity
 *
 * ER Diagram syntax:
 *   erDiagram
 *     CUSTOMER ||--o{ ORDER : places
 *     CUSTOMER { string name PK }
 *
 * Cardinality mapping (RelationType min/max):
 *   - min:0, max:null → "o{" (zero or more)
 *   - min:1, max:null → "|{" (one or more)
 *   - min:0, max:1    → "|o" (zero or one)
 *   - min:1, max:1    → "||" (exactly one)
 *
 * @see https://mermaid.js.org/syntax/entityRelationshipDiagram.html
 */
import type {
	AttributeDefinition,
	AttributeRef,
	EntityType,
	OntologyDefinition,
	RelationType,
	ValueType,
} from "../types";

export interface ErDiagramExportOptions {
	includeAttributes?: boolean;
	includeValueTypes?: boolean;
	title?: string;
}

export class ErDiagramExporter {
	private ontology: OntologyDefinition;
	private options: Required<ErDiagramExportOptions>;

	constructor(ontology: OntologyDefinition, options?: ErDiagramExportOptions) {
		this.ontology = ontology;
		this.options = {
			includeAttributes: options?.includeAttributes ?? true,
			includeValueTypes: options?.includeValueTypes ?? true,
			title: options?.title ?? "",
		};
	}

	export(): string {
		const lines: string[] = [];

		if (this.options.title) {
			lines.push(`---`);
			lines.push(`title: ${this.options.title}`);
			lines.push(`---`);
		}

		lines.push("erDiagram");
		lines.push("");

		// Add entity definitions with attributes
		const allTypes = this.getAllEntityTypes();
		for (const entityType of allTypes) {
			this.writeEntity(lines, entityType);
		}

		// Add value types as enum entities
		if (this.options.includeValueTypes) {
			for (const valueType of this.ontology.valueTypes ?? []) {
				this.writeValueType(lines, valueType);
			}
		}

		lines.push("");

		// Add relationships
		for (const relationType of this.ontology.relationTypes) {
			this.writeRelationship(lines, relationType);
		}

		return lines.join("\n");
	}

	/** Write an entity definition with attributes */
	private writeEntity(lines: string[], entityType: EntityType): void {
		const entityName = this.localName(entityType["@id"]);

		if (!this.options.includeAttributes) {
			lines.push(`    ${entityName}`);
			return;
		}

		// Check if entity has any attributes
		const attributes = this.getEntityAttributes(entityType);

		if (attributes.length === 0) {
			lines.push(`    ${entityName}`);
			return;
		}

		// Entity with attributes
		lines.push(`    ${entityName} {`);
		for (const attr of attributes) {
			lines.push(`        ${attr.type} ${attr.name} ${attr.keys}`);
		}
		lines.push(`    }`);
	}

	/** Get all attributes for an entity (including relations as references) */
	private getEntityAttributes(
		entityType: EntityType,
	): Array<{ type: string; name: string; keys: string }> {
		const attributes: Array<{ type: string; name: string; keys: string }> = [];

		// Regular attributes
		for (const attrRef of entityType.attributes) {
			const attrDef = this.findAttributeDefinition(attrRef.ref);
			if (attrDef) {
				const name = this.localName(attrDef["@id"]);
				const type = this.mapDataTypeToErType(attrDef.datatype);
				const keys = this.buildAttributeKeys(attrRef, attrDef);
				attributes.push({ type, name, keys });
			}
		}

		// Relations as reference attributes
		for (const relRef of entityType.relations) {
			const relType = this.findRelationType(relRef.ref);
			if (relType) {
				const name = this.localName(relType["@id"]);
				const targetEntity = this.localName(relType.range);
				// Check if relation is required based on min cardinality
				const keys = relRef.min !== undefined && relRef.min > 0 ? "FK" : "";
				attributes.push({ type: targetEntity, name, keys });
			}
		}

		return attributes;
	}

	/** Build attribute key markers (PK, FK, etc.) */
	private buildAttributeKeys(
		attrRef: AttributeRef,
		attrDef: AttributeDefinition,
	): string {
		const keys: string[] = [];

		if (attrRef.identity || attrDef.identity) {
			keys.push("PK");
		}

		if (attrRef.required || attrDef.required) {
			if (!keys.includes("PK")) {
				keys.push("FK");
			}
		}

		return keys.join(", ");
	}

	/** Map internal data type to ER diagram type */
	private mapDataTypeToErType(dataType: string): string {
		const typeMap: Record<string, string> = {
			string: "string",
			integer: "int",
			float: "float",
			decimal: "decimal",
			boolean: "boolean",
			datetime: "datetime",
			date: "date",
			array: "array",
			object: "object",
			ref: "ref",
			geopoint: "geopoint",
			geopolygon: "geopolygon",
			vector: "vector",
			duration: "duration",
			currency: "currency",
			measurement: "measurement",
			struct: "struct",
		};

		return typeMap[dataType] ?? dataType;
	}

	/** Write a value type as enum entity */
	private writeValueType(lines: string[], valueType: ValueType): void {
		const enumName = this.localName(valueType["@id"]);

		lines.push(`    ${enumName} {`);
		for (const value of valueType.values) {
			lines.push(`        string ${value}`);
		}
		lines.push(`    }`);
	}

	/** Write a relationship between entities */
	private writeRelationship(lines: string[], relationType: RelationType): void {
		const domain = this.localName(relationType.domain);
		const range = this.localName(relationType.range);
		const label =
			relationType.label.en ||
			relationType.label.zh ||
			this.localName(relationType["@id"]);

		// Determine cardinality markers
		const domainCardinality = this.getDomainCardinality(relationType);
		const rangeCardinality = this.getRangeCardinality(relationType);

		lines.push(
			`    ${domain} ${domainCardinality}--${rangeCardinality} ${range} : "${label}"`,
		);
	}

	/** Get domain cardinality marker (left side) */
	private getDomainCardinality(_relationType: RelationType): string {
		// Domain side is typically "||" (exactly one)
		return "||";
	}

	/** Get range cardinality marker (right side) based on min/max */
	private getRangeCardinality(relationType: RelationType): string {
		const min = relationType.min ?? 0;
		const max = relationType.max;

		// min:0, max:null → "o{" (zero or more)
		if (min === 0 && max === null) {
			return "o{";
		}

		// min:1, max:null → "|{" (one or more)
		if (min === 1 && max === null) {
			return "|{";
		}

		// min:0, max:1 → "|o" (zero or one)
		if (min === 0 && max === 1) {
			return "|o";
		}

		// min:1, max:1 → "||" (exactly one)
		if (min === 1 && max === 1) {
			return "||";
		}

		// Default fallback: zero or more
		return "o{";
	}

	/** Get local name from ID like "sc:Warehouse" -> "Warehouse" */
	private localName(id: string): string {
		const parts = id.split(":");
		return parts[parts.length - 1] ?? id;
	}

	/** Get all entity types (entity + event + role) */
	private getAllEntityTypes(): EntityType[] {
		return [
			...(this.ontology.entityTypes ?? []),
			...(this.ontology.eventTypes ?? []),
			...(this.ontology.roleTypes ?? []),
		];
	}

	/** Find attribute definition by ID */
	private findAttributeDefinition(id: string): AttributeDefinition | undefined {
		return this.ontology.attributes.find((a) => a["@id"] === id);
	}

	/** Find relation type by ID */
	private findRelationType(id: string): RelationType | undefined {
		return this.ontology.relationTypes.find((r) => r["@id"] === id);
	}
}
