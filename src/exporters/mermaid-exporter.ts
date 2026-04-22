/**
 * Mermaid Diagram Exporter — OntoGraph → Mermaid syntax
 *
 * 映射规则:
 * - EntityType    → Mermaid class nodes (attributes as properties)
 * - RelationType  → Mermaid edges (domain → range with label)
 * - ValueType     → Mermaid enum nodes
 * - EntityType.kind → different node shapes
 *   - entity → rect
 *   - event → diamond
 *   - role → rounded
 *   - value → hexagon
 * - EntityType.extends → inheritance arrows
 * - Required attributes marked with *
 * - Identity attributes marked with 🔑
 *
 * Supports:
 * - classDiagram (default) — UML-style class diagram
 * - graph — simple entity-relationship graph
 * - flowchart — flowchart with styled nodes
 */
import type {
	AttributeDefinition,
	AttributeRef,
	EntityType,
	OntologyDefinition,
	RelationType,
	ValueType,
} from "../types";

export interface MermaidExportOptions {
	diagramType?: "classDiagram" | "graph" | "flowchart";
	includeAttributes?: boolean;
	includeRelations?: boolean;
	includeValueTypes?: boolean;
	showKind?: boolean;
	colorPalette?: string[];
	title?: string;
	direction?: "TB" | "BT" | "LR" | "RL";
}

const DEFAULT_COLOR_PALETTE = [
	"#E1F5FE",
	"#F3E5F5",
	"#E8F5E9",
	"#FFF3E0",
	"#E0F2F1",
	"#FCE4EC",
	"#FFF8E1",
	"#E8EAF6",
];

const KIND_SHAPES: Record<string, { start: string; end: string }> = {
	entity: { start: "[", end: "]" },
	event: { start: "{", end: "}" },
	role: { start: "([", end: "])" },
	value: { start: "{{", end: "}}" },
};

export class MermaidExporter {
	private ontology: OntologyDefinition;
	private options: Required<MermaidExportOptions>;
	private moduleColors: Map<string, string>;

	constructor(ontology: OntologyDefinition, options?: MermaidExportOptions) {
		this.ontology = ontology;
		this.options = {
			diagramType: options?.diagramType ?? "classDiagram",
			includeAttributes: options?.includeAttributes ?? true,
			includeRelations: options?.includeRelations ?? true,
			includeValueTypes: options?.includeValueTypes ?? true,
			showKind: options?.showKind ?? false,
			colorPalette: options?.colorPalette ?? DEFAULT_COLOR_PALETTE,
			title: options?.title ?? "",
			direction: options?.direction ?? "TB",
		};
		this.moduleColors = new Map();
		this.assignModuleColors();
	}

	export(): string {
		switch (this.options.diagramType) {
			case "graph":
				return this.exportGraph();
			case "flowchart":
				return this.exportFlowchart();
			default:
				return this.exportClassDiagram();
		}
	}

	/** Export as UML-style class diagram (default) */
	private exportClassDiagram(): string {
		const lines: string[] = [];

		if (this.options.title) {
			lines.push(`---`);
			lines.push(`title: ${this.options.title}`);
			lines.push(`---`);
		}

		lines.push("classDiagram");
		lines.push("");

		// Define direction
		lines.push(`direction ${this.options.direction}`);
		lines.push("");

		// Add entity types as classes
		const allTypes = this.getAllEntityTypes();
		for (const entityType of allTypes) {
			this.writeEntityTypeAsClass(lines, entityType);
		}

		lines.push("");

		// Add value types as enums
		if (this.options.includeValueTypes) {
			for (const valueType of this.ontology.valueTypes ?? []) {
				this.writeValueTypeAsEnum(lines, valueType);
			}
			lines.push("");
		}

		// Add inheritance relationships
		for (const entityType of allTypes) {
			if (entityType.extends && entityType.extends.length > 0) {
				for (const parentId of entityType.extends) {
					const childName = this.localName(entityType["@id"]);
					const parentName = this.localName(parentId);
					lines.push(`${parentName} <|-- ${childName}`);
				}
			}
		}

		lines.push("");

		// Add relations as associations
		if (this.options.includeRelations) {
			for (const relationType of this.ontology.relationTypes) {
				this.writeRelationAsAssociation(lines, relationType);
			}
		}

		// Add styles for modules
		this.writeClassStyles(lines, allTypes);

		return lines.join("\n");
	}

	/** Export as simple entity-relationship graph */
	private exportGraph(): string {
		const lines: string[] = [];

		if (this.options.title) {
			lines.push(`---`);
			lines.push(`title: ${this.options.title}`);
			lines.push(`---`);
		}

		lines.push("graph");
		lines.push(`    direction ${this.options.direction}`);
		lines.push("");

		const allTypes = this.getAllEntityTypes();

		// Add nodes with labels
		for (const entityType of allTypes) {
			const nodeId = this.localName(entityType["@id"]);
			const label = entityType.label.en || entityType.label.zh || nodeId;
			const kind = this.options.showKind ? ` (${entityType.kind})` : "";
			lines.push(`    ${nodeId}["${label}${kind}"]`);
		}

		// Add value types
		if (this.options.includeValueTypes) {
			for (const valueType of this.ontology.valueTypes ?? []) {
				const nodeId = this.localName(valueType["@id"]);
				const label = valueType.label.en || valueType.label.zh || nodeId;
				lines.push(`    ${nodeId}["${label} (enum)"]`);
			}
		}

		lines.push("");

		// Add inheritance edges
		for (const entityType of allTypes) {
			if (entityType.extends && entityType.extends.length > 0) {
				for (const parentId of entityType.extends) {
					const childName = this.localName(entityType["@id"]);
					const parentName = this.localName(parentId);
					lines.push(`    ${parentName} -->|extends| ${childName}`);
				}
			}
		}

		// Add relation edges
		if (this.options.includeRelations) {
			for (const relationType of this.ontology.relationTypes) {
				const domain = this.localName(relationType.domain);
				const range = this.localName(relationType.range);
				const label =
					relationType.label.en ||
					relationType.label.zh ||
					this.localName(relationType["@id"]);
				lines.push(`    ${domain} -->|"${label}"| ${range}`);
			}
		}

		return lines.join("\n");
	}

	/** Export as flowchart with styled nodes */
	private exportFlowchart(): string {
		const lines: string[] = [];

		if (this.options.title) {
			lines.push(`---`);
			lines.push(`title: ${this.options.title}`);
			lines.push(`---`);
		}

		lines.push("flowchart");
		lines.push(`    direction ${this.options.direction}`);
		lines.push("");

		const allTypes = this.getAllEntityTypes();

		// Add nodes with appropriate shapes based on kind
		for (const entityType of allTypes) {
			const nodeId = this.localName(entityType["@id"]);
			const label = entityType.label.en || entityType.label.zh || nodeId;
			const shape = KIND_SHAPES[entityType.kind] ?? KIND_SHAPES.entity;
			const color = this.getEntityColor(entityType);
			const safeShape = shape ?? { start: "[", end: "]" };

			lines.push(`    ${nodeId}${safeShape.start}"${label}"${safeShape.end}`);

			// Add styling for color
			if (color) {
				lines.push(`    style ${nodeId} fill:${color}`);
			}
		}

		// Add value types as hexagon nodes
		if (this.options.includeValueTypes) {
			for (const valueType of this.ontology.valueTypes ?? []) {
				const nodeId = this.localName(valueType["@id"]);
				const label = valueType.label.en || valueType.label.zh || nodeId;
				lines.push(`    ${nodeId}{{"${label}"}}`);
			}
		}

		lines.push("");

		// Add inheritance relationships
		for (const entityType of allTypes) {
			if (entityType.extends && entityType.extends.length > 0) {
				for (const parentId of entityType.extends) {
					const childName = this.localName(entityType["@id"]);
					const parentName = this.localName(parentId);
					lines.push(`    ${parentName} -.->|extends| ${childName}`);
				}
			}
		}

		// Add relation relationships
		if (this.options.includeRelations) {
			for (const relationType of this.ontology.relationTypes) {
				const domain = this.localName(relationType.domain);
				const range = this.localName(relationType.range);
				const label =
					relationType.label.en ||
					relationType.label.zh ||
					this.localName(relationType["@id"]);
				lines.push(`    ${domain} -->|"${label}"| ${range}`);
			}
		}

		return lines.join("\n");
	}

	/** Write an entity type as a Mermaid class */
	private writeEntityTypeAsClass(
		lines: string[],
		entityType: EntityType,
	): void {
		const className = this.localName(entityType["@id"]);
		const annotations: string[] = [];

		if (entityType.kind !== "entity") {
			annotations.push(`<<${entityType.kind}>>`);
		}

		if (annotations.length > 0) {
			lines.push(`class ${className}${annotations.join("")}`);
		}

		if (!this.options.includeAttributes) {
			return;
		}

		// Class body with attributes
		const classBody: string[] = [];

		// Add attributes
		for (const attrRef of entityType.attributes) {
			const attrDef = this.findAttributeDefinition(attrRef.ref);
			if (attrDef) {
				const attrLine = this.formatAttributeForClass(attrDef, attrRef);
				classBody.push(attrLine);
			}
		}

		// Add relations as reference properties
		for (const relRef of entityType.relations) {
			const relType = this.findRelationType(relRef.ref);
			if (relType) {
				const relLine = this.formatRelationForClass(relType, relRef);
				classBody.push(relLine);
			}
		}

		if (classBody.length > 0) {
			lines.push(`class ${className} {`);
			for (const line of classBody) {
				lines.push(`  ${line}`);
			}
			lines.push("}");
		}
	}

	/** Write a value type as a Mermaid enum */
	private writeValueTypeAsEnum(lines: string[], valueType: ValueType): void {
		const enumName = this.localName(valueType["@id"]);

		lines.push(`class ${enumName} {`);
		lines.push(`  <<enumeration>>`);
		for (const value of valueType.values) {
			lines.push(`  ${value}`);
		}
		lines.push("}");
	}

	/** Write a relation as a class diagram association */
	private writeRelationAsAssociation(
		lines: string[],
		relationType: RelationType,
	): void {
		const domain = this.localName(relationType.domain);
		const range = this.localName(relationType.range);
		const label =
			relationType.label.en ||
			relationType.label.zh ||
			this.localName(relationType["@id"]);

		// Determine cardinality
		let rangeCard = "";

		if (relationType.min !== undefined || relationType.max !== undefined) {
			const min = relationType.min ?? 0;
			const max = relationType.max === null ? "*" : relationType.max;
			rangeCard = `"${min}..${max}"`;
		}

		// Association: Domain "card" --> "label" Range
		if (rangeCard) {
			lines.push(`${domain} ${rangeCard} --> "${label}" ${range}`);
		} else {
			lines.push(`${domain} --> "${label}" ${range}`);
		}

		// Add inverse relation if present
		if (relationType.inverse) {
			const inverseRel = this.findRelationType(relationType.inverse);
			if (inverseRel) {
				const inverseLabel =
					inverseRel.label.en ||
					inverseRel.label.zh ||
					this.localName(inverseRel["@id"]);
				lines.push(`${range} --> "${inverseLabel}" ${domain}`);
			}
		}
	}

	/** Format an attribute for class diagram */
	private formatAttributeForClass(
		attrDef: AttributeDefinition,
		attrRef: AttributeRef,
	): string {
		const name = this.localName(attrDef["@id"]);
		const type = attrDef.datatype;
		const markers: string[] = [];

		if (attrRef.required || attrDef.required) {
			markers.push("*");
		}
		if (attrRef.identity || attrDef.identity) {
			markers.push("🔑");
		}

		const markerPrefix = markers.join("");
		return `${markerPrefix}${name}: ${type}`;
	}

	/** Format a relation for class diagram */
	private formatRelationForClass(
		relType: RelationType,
		relRef: { ref: string; min?: number; max?: number | null },
	): string {
		const name = this.localName(relType["@id"]);
		const target = this.localName(relType.range);
		const markers: string[] = [];

		if (relRef.min !== undefined && relRef.min > 0) {
			markers.push("*");
		}

		const markerPrefix = markers.join("");
		return `${markerPrefix}${name}: ${target}`;
	}

	/** Write class styling for modules */
	private writeClassStyles(lines: string[], entityTypes: EntityType[]): void {
		const styledModules = new Set<string>();

		for (const entityType of entityTypes) {
			const module = this.getModuleFromId(entityType["@id"]);
			if (module && !styledModules.has(module)) {
				const color = this.moduleColors.get(module);
				if (color) {
					lines.push(
						`style ${this.localName(entityType["@id"])} fill:${color}`,
					);
					styledModules.add(module);
				}
			}
		}
	}

	/** Get color for an entity based on its module or UI config */
	private getEntityColor(entityType: EntityType): string | undefined {
		// First check UI config
		if (entityType.ui?.color) {
			return entityType.ui.color;
		}

		// Otherwise use module-based coloring
		const module = this.getModuleFromId(entityType["@id"]);
		if (module) {
			return this.moduleColors.get(module);
		}

		return undefined;
	}

	/** Assign colors to modules */
	private assignModuleColors(): void {
		const modules = new Set<string>();

		// Collect all modules
		const allTypes = this.getAllEntityTypes();
		for (const entityType of allTypes) {
			const module = this.getModuleFromId(entityType["@id"]);
			if (module) {
				modules.add(module);
			}
		}

		// Assign colors
		let colorIndex = 0;
		for (const module of modules) {
			const color =
				this.options.colorPalette[
					colorIndex % this.options.colorPalette.length
				];
			if (color) {
				this.moduleColors.set(module, color);
			}
			colorIndex++;
		}
	}

	/** Extract module/namespace from ID like "sc:Warehouse" -> "sc" */
	private getModuleFromId(id: string): string | undefined {
		const parts = id.split(":");
		if (parts.length > 1) {
			return parts[0];
		}
		return undefined;
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
