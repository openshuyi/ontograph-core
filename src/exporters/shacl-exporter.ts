/**
 * SHACL Shapes Exporter — OntoGraph → W3C SHACL Turtle
 *
 * 映射规则:
 * - EntityType    → sh:NodeShape
 * - Constraints   → sh:PropertyShape
 * - ValueType     → sh:NodeShape + sh:in
 * - Attribute     → sh:property with sh:datatype / sh:minCount / sh:maxCount / sh:pattern
 * - Relation      → sh:property with sh:class / sh:minCount / sh:maxCount
 */
import type {
	AttributeDefinition,
	AttributeRef,
	Constraint,
	EntityType,
	OntologyDefinition,
} from "../types";

export interface SHACLExportOptions {
	includeAnnotations?: boolean;
	baseIRI?: string;
	targetClassPrefix?: string;
}

const SHACL_PREFIXES: Record<string, string> = {
	rdf: "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
	rdfs: "http://www.w3.org/2000/01/rdf-schema#",
	owl: "http://www.w3.org/2002/07/owl#",
	xsd: "http://www.w3.org/2001/XMLSchema#",
	sh: "http://www.w3.org/ns/shacl#",
	ex: "http://example.org/",
};

const DATATYPE_XSD_MAP: Record<string, string> = {
	string: "xsd:string",
	integer: "xsd:integer",
	float: "xsd:float",
	boolean: "xsd:boolean",
	datetime: "xsd:dateTime",
	date: "xsd:date",
	array: "rdf:List",
	object: "rdf:Resource",
};

export class SHACLExporter {
	private ontology: OntologyDefinition;
	private options: Required<SHACLExportOptions>;

	constructor(ontology: OntologyDefinition, options?: SHACLExportOptions) {
		this.ontology = ontology;
		this.options = {
			includeAnnotations: options?.includeAnnotations ?? true,
			baseIRI: options?.baseIRI ?? "https://ontograph.app/shacl/",
			targetClassPrefix: options?.targetClassPrefix ?? "",
		};
	}

	export(): string {
		const lines: string[] = [];
		this.writePrefixes(lines);
		this.writeEntityTypeShapes(lines);
		this.writeValueTypeShapes(lines);
		this.writeConstraintShapes(lines);
		return lines.join("\n");
	}

	private writePrefixes(lines: string[]): void {
		const context = this.ontology["@context"];
		for (const [prefix, iri] of Object.entries(SHACL_PREFIXES)) {
			lines.push(`@prefix ${prefix}: <${iri}> .`);
		}
		for (const [prefix, iri] of Object.entries(context)) {
			if (iri && !SHACL_PREFIXES[prefix]) {
				lines.push(`@prefix ${prefix}: <${iri}> .`);
			}
		}
		lines.push(`@prefix : <${this.options.baseIRI}> .`);
		lines.push("");
	}

	private writeEntityTypeShapes(lines: string[]): void {
		const allTypes = this.getAllEntityTypes();
		for (const entityType of allTypes) {
			const shapeId = this.shapeIRI(entityType["@id"]);
			const targetClass = this.options.targetClassPrefix
				? `${this.options.targetClassPrefix}:${this.localName(entityType["@id"])}`
				: this.expandIRI(entityType["@id"]);
			const block: string[] = [];

			block.push(`${shapeId} a sh:NodeShape ;`);
			block.push(`    sh:targetClass ${targetClass} ;`);

			if (this.options.includeAnnotations && entityType.label) {
				if (entityType.label.en)
					block.push(`    rdfs:label "${this.esc(entityType.label.en)}"@en ;`);
				if (entityType.label.zh)
					block.push(`    rdfs:label "${this.esc(entityType.label.zh)}"@zh ;`);
			}
			if (this.options.includeAnnotations && entityType.description) {
				if (entityType.description.en)
					block.push(
						`    rdfs:comment "${this.esc(entityType.description.en)}"@en ;`,
					);
				if (entityType.description.zh)
					block.push(
						`    rdfs:comment "${this.esc(entityType.description.zh)}"@zh ;`,
					);
			}

			for (const attrRef of entityType.attributes) {
				const propShape = this.attributeToPropertyShape(attrRef);
				if (propShape) block.push(`    sh:property ${propShape} ;`);
			}

			for (const relRef of entityType.relations) {
				const propShape = this.relationToPropertyShape(relRef);
				if (propShape) block.push(`    sh:property ${propShape} ;`);
			}

			if (entityType.extends && entityType.extends.length > 0) {
				for (const parent of entityType.extends) {
					block.push(`    sh:and ( ${this.shapeIRI(parent)} ) ;`);
				}
			}

			this.terminateLast(block);
			lines.push(...block, "");
		}
	}

	private writeValueTypeShapes(lines: string[]): void {
		for (const vt of this.ontology.valueTypes ?? []) {
			const shapeId = this.shapeIRI(vt["@id"]);
			const block: string[] = [];

			block.push(`${shapeId} a sh:NodeShape ;`);
			block.push(`    sh:targetClass ${this.expandIRI(vt["@id"])} ;`);

			if (this.options.includeAnnotations && vt.label.en) {
				block.push(`    rdfs:label "${this.esc(vt.label.en)}"@en ;`);
			}
			if (this.options.includeAnnotations && vt.label.zh) {
				block.push(`    rdfs:label "${this.esc(vt.label.zh)}"@zh ;`);
			}

			const valuesStr = vt.values.map((v) => `"${this.esc(v)}"`).join(" , ");
			block.push(`    sh:in ( ${valuesStr} ) ;`);

			this.terminateLast(block);
			lines.push(...block, "");
		}
	}

	private writeConstraintShapes(lines: string[]): void {
		const attrMap = new Map<string, AttributeDefinition>();
		for (const attr of this.ontology.attributes) {
			attrMap.set(attr["@id"], attr);
		}

		for (const constraint of this.ontology.constraints ?? []) {
			const shapeId = this.shapeIRI(constraint["@id"]);
			const block: string[] = [];

			block.push(`${shapeId} a sh:NodeShape ;`);
			block.push(`    sh:targetClass ${this.expandIRI(constraint.on)} ;`);

			const propShape = this.constraintToPropertyShape(constraint, attrMap);
			if (propShape) {
				block.push("    sh:property [");
				block.push(`        sh:path :${this.localName(constraint.on)} ;`);
				block.push(`        ${propShape} ;`);
				block.push("    ] ;");
			}

			if (this.options.includeAnnotations && constraint.message) {
				if (constraint.message.en) {
					block.push(
						`    sh:message "${this.esc(constraint.message.en)}"@en ;`,
					);
				}
				if (constraint.message.zh) {
					block.push(
						`    sh:message "${this.esc(constraint.message.zh)}"@zh ;`,
					);
				}
			}

			if (constraint.severity) {
				const severityMap: Record<string, string> = {
					error: "sh:Violation",
					warning: "sh:Warning",
					info: "sh:Info",
				};
				const severity = severityMap[constraint.severity];
				if (severity) block.push(`    sh:severity ${severity} ;`);
			}

			this.terminateLast(block);
			lines.push(...block, "");
		}
	}

	private attributeToPropertyShape(attrRef: AttributeRef): string | null {
		const attr = this.ontology.attributes.find((a) => a["@id"] === attrRef.ref);
		if (!attr) return null;

		const path = this.expandIRI(attr["@id"]);
		const parts: string[] = [];

		parts.push(`[ sh:path ${path} ;`);

		const xsdType = DATATYPE_XSD_MAP[attr.datatype];
		if (xsdType && attr.datatype !== "ref") {
			parts.push(`      sh:datatype ${xsdType} ;`);
		}
		if (attr.datatype === "ref" && attr.datatypeRef) {
			parts.push(`      sh:class ${this.expandIRI(attr.datatypeRef)} ;`);
		}

		if (attrRef.required || attr.required) {
			parts.push("      sh:minCount 1 ;");
		}

		if (attrRef.identity) {
			parts.push("      sh:uniqueLang true ;");
		}

		if (attr.validation) {
			for (const rule of attr.validation) {
				const shaclConstraint = this.validationRuleToSHACL(rule);
				if (shaclConstraint) parts.push(`      ${shaclConstraint} ;`);
			}
		}

		if (attr.enum && attr.enum.length > 0) {
			const values = attr.enum
				.map((v) =>
					typeof v === "string" ? `"${this.esc(v)}"` : `"${v}"^^xsd:integer`,
				)
				.join(" , ");
			parts.push(`      sh:in ( ${values} ) ;`);
		}

		const lastPart = parts[parts.length - 1];
		if (lastPart?.endsWith(" ;")) {
			parts[parts.length - 1] = lastPart.replace(/ ;$/, "");
		}
		parts.push("]");

		return parts.join("\n        ");
	}

	private relationToPropertyShape(relRef: {
		ref: string;
		min?: number;
		max?: number | null;
	}): string | null {
		const relType = this.ontology.relationTypes?.find(
			(r) => r["@id"] === relRef.ref,
		);
		if (!relType) return null;

		const path = this.expandIRI(relType["@id"]);
		const parts: string[] = [];

		parts.push(`[ sh:path ${path} ;`);
		parts.push(`      sh:class ${this.expandIRI(relType.range)} ;`);

		if (relRef.min !== undefined && relRef.min > 0) {
			parts.push(`      sh:minCount ${relRef.min} ;`);
		}
		if (relRef.max !== undefined && relRef.max !== null) {
			parts.push(`      sh:maxCount ${relRef.max} ;`);
		}

		const lastPart = parts[parts.length - 1];
		if (lastPart?.endsWith(" ;")) {
			parts[parts.length - 1] = lastPart.replace(/ ;$/, "");
		}
		parts.push("]");

		return parts.join("\n        ");
	}

	private constraintToPropertyShape(
		constraint: Constraint,
		_attrMap: Map<string, AttributeDefinition>,
	): string | null {
		const rule = constraint.rule;

		const comparison = rule.match(/^(\w+)\s*(>=|<=|>|<|=|!=)\s*(.+)$/);
		if (!comparison) return null;
		const [, field, operator, value] = comparison;
		if (!field || !operator || !value) return null;

		switch (operator) {
			case ">=":
				return `sh:minInclusive "${value.trim()}"^^xsd:decimal`;
			case "<=":
				return `sh:maxInclusive "${value.trim()}"^^xsd:decimal`;
			case ">":
				return `sh:minExclusive "${value.trim()}"^^xsd:decimal`;
			case "<":
				return `sh:maxExclusive "${value.trim()}"^^xsd:decimal`;
			case "=": {
				const trimmed = value.trim();
				if (field === "pattern") return `sh:pattern "${this.esc(trimmed)}"`;
				return `sh:hasValue "${trimmed}"`;
			}
			default:
				return null;
		}
	}

	private validationRuleToSHACL(rule: {
		type: string;
		value?: unknown;
		message?: { en?: string; zh?: string };
	}): string | null {
		switch (rule.type) {
			case "min":
				return rule.value !== undefined ? `sh:minLength ${rule.value}` : null;
			case "max":
				return rule.value !== undefined ? `sh:maxLength ${rule.value}` : null;
			case "pattern":
				return rule.value
					? `sh:pattern "${this.esc(String(rule.value))}"`
					: null;
			default:
				return null;
		}
	}

	private getAllEntityTypes(): EntityType[] {
		return [
			...(this.ontology.entityTypes ?? []),
			...(this.ontology.eventTypes ?? []),
			...(this.ontology.roleTypes ?? []),
		];
	}

	private shapeIRI(id: string): string {
		return `:${this.localName(id)}Shape`;
	}

	private expandIRI(id: string): string {
		if (id.startsWith("http://") || id.startsWith("https://")) return `<${id}>`;
		if (id.includes(":")) return id;
		return `:${id}`;
	}

	private localName(id: string): string {
		const parts = id.split(":");
		return parts[parts.length - 1] ?? id;
	}

	private terminateLast(block: string[]): void {
		const last = block[block.length - 1];
		if (last?.endsWith(" ;")) {
			block[block.length - 1] = last.replace(/ ;$/, " .");
		}
	}

	private esc(str: string): string {
		return str
			.replace(/\\/g, "\\\\")
			.replace(/"/g, '\\"')
			.replace(/\n/g, "\\n");
	}
}
