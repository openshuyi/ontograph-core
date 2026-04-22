/**
 * OWL 2.0 DL Exporter — OntoGraph → Turtle
 *
 * 映射规则:
 * - EntityType    → owl:Class
 * - RelationType  → owl:ObjectProperty
 * - AttributeType → owl:DatatypeProperty
 * - Constraint    → owl:Restriction
 * - ValueType     → owl:Class + owl:oneOf
 */
import type { Expr } from "../expression/types";
import type {
	AttributeRef,
	Constraint,
	EntityType,
	OntologyDefinition,
} from "../types";

const OWL_PREFIXES: Record<string, string> = {
	rdf: "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
	rdfs: "http://www.w3.org/2000/01/rdf-schema#",
	owl: "http://www.w3.org/2002/07/owl#",
	xsd: "http://www.w3.org/2001/XMLSchema#",
	skos: "http://www.w3.org/2004/02/skos/core#",
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

export interface OWLExportOptions {
	includeImports?: boolean;
	includeAnnotations?: boolean;
	baseIRI?: string;
}

export class OWLExporter {
	private ontology: OntologyDefinition;
	private options: Required<OWLExportOptions>;

	constructor(ontology: OntologyDefinition, options?: OWLExportOptions) {
		this.ontology = ontology;
		this.options = {
			includeImports: options?.includeImports ?? false,
			includeAnnotations: options?.includeAnnotations ?? true,
			baseIRI: options?.baseIRI ?? "https://ontograph.app/ontology/",
		};
	}

	export(): string {
		const lines: string[] = [];
		this.writePrefixes(lines);
		this.writeOntologyHeader(lines);
		this.writeEntityTypes(lines);
		this.writeRelationTypes(lines);
		this.writeAttributeTypes(lines);
		this.writeValueTypes(lines);
		this.writeConstraints(lines);
		this.writeInterfaces(lines);
		return lines.join("\n");
	}

	private writePrefixes(lines: string[]): void {
		const context = this.ontology["@context"];
		for (const [prefix, iri] of Object.entries(OWL_PREFIXES)) {
			lines.push(`@prefix ${prefix}: <${iri}> .`);
		}
		for (const [prefix, iri] of Object.entries(context)) {
			if (iri && !OWL_PREFIXES[prefix]) {
				lines.push(`@prefix ${prefix}: <${iri}> .`);
			}
		}
		lines.push(`@prefix : <${this.options.baseIRI}> .`);
		lines.push("");
	}

	private writeOntologyHeader(lines: string[]): void {
		const ontologyId = this.expandIRI(this.ontology["@id"]);
		lines.push("<> a owl:Ontology ;");
		lines.push(`    owl:versionIRI <${ontologyId}> ;`);
		lines.push(`    owl:versionInfo "${this.ontology.version}" ;`);

		if (this.options.includeAnnotations && this.ontology.label) {
			const label = this.ontology.label;
			if (label.en)
				lines.push(`    rdfs:label "${this.escapeTurtle(label.en)}"@en ;`);
			if (label.zh)
				lines.push(`    rdfs:label "${this.escapeTurtle(label.zh)}"@zh ;`);
		}
		if (this.options.includeAnnotations && this.ontology.description) {
			const desc = this.ontology.description;
			if (desc.en)
				lines.push(`    rdfs:comment "${this.escapeTurtle(desc.en)}"@en ;`);
			if (desc.zh)
				lines.push(`    rdfs:comment "${this.escapeTurtle(desc.zh)}"@zh ;`);
		}
		if (this.options.includeImports) {
			lines.push("    owl:imports <http://www.w3.org/2002/07/owl#> ;");
			lines.push("    owl:imports <http://www.w3.org/2000/01/rdf-schema#> ;");
		}

		this.terminateLastLine(lines);
		lines.push("");
	}

	private writeEntityTypes(lines: string[]): void {
		const allTypes = this.getAllEntityTypes();
		for (const entityType of allTypes) {
			const iri = this.expandIRI(entityType["@id"]);
			const block: string[] = [`${iri} a owl:Class ;`];

			this.appendLocalized(block, entityType.label, "rdfs:label");
			this.appendLocalized(block, entityType.description, "rdfs:comment");

			const kindClass = this.kindToOWLClass(entityType.kind);
			if (kindClass) block.push(`    rdfs:subClassOf ${kindClass} ;`);

			for (const attrRef of entityType.attributes) {
				const r = this.attributeToRestriction(attrRef);
				if (r) block.push(`    rdfs:subClassOf ${r} ;`);
			}
			for (const relRef of entityType.relations) {
				const r = this.relationToRestriction(relRef);
				if (r) block.push(`    rdfs:subClassOf ${r} ;`);
			}
			if (entityType.extends) {
				for (const parent of entityType.extends) {
					block.push(`    rdfs:subClassOf ${this.expandIRI(parent)} ;`);
				}
			}

			this.terminateLastLine(block);
			lines.push(...block, "");
		}
	}

	private writeRelationTypes(lines: string[]): void {
		for (const relType of this.ontology.relationTypes ?? []) {
			const iri = this.expandIRI(relType["@id"]);
			const block: string[] = [`${iri} a owl:ObjectProperty ;`];

			block.push(`    rdfs:domain ${this.expandIRI(relType.domain)} ;`);
			block.push(`    rdfs:range ${this.expandIRI(relType.range)} ;`);

			if (this.options.includeAnnotations) {
				this.appendLocalized(block, relType.label, "rdfs:label");
				this.appendLocalized(block, relType.description, "rdfs:comment");
			}
			if (relType.inverse) {
				block.push(`    owl:inverseOf ${this.expandIRI(relType.inverse)} ;`);
			}

			this.terminateLastLine(block);
			lines.push(...block, "");
		}
	}

	private writeAttributeTypes(lines: string[]): void {
		for (const attr of this.ontology.attributes) {
			const iri = this.expandIRI(attr["@id"]);
			const block: string[] = [];

			const isRef = attr.datatype === "ref" && attr.datatypeRef;
			block.push(
				`${iri} a ${isRef ? "owl:ObjectProperty" : "owl:DatatypeProperty"} ;`,
			);

			if (this.options.includeAnnotations) {
				if (attr.label.en)
					block.push(
						`    rdfs:label "${this.escapeTurtle(attr.label.en)}"@en ;`,
					);
				if (attr.label.zh)
					block.push(
						`    rdfs:label "${this.escapeTurtle(attr.label.zh)}"@zh ;`,
					);
				if (attr.description?.en)
					block.push(
						`    rdfs:comment "${this.escapeTurtle(attr.description.en)}"@en ;`,
					);
				if (attr.description?.zh)
					block.push(
						`    rdfs:comment "${this.escapeTurtle(attr.description.zh)}"@zh ;`,
					);
			}

			if (isRef) {
				block.push(`    rdfs:range ${this.expandIRI(attr.datatypeRef!)} ;`);
			} else {
				const xsdType = DATATYPE_XSD_MAP[attr.datatype] ?? "xsd:string";
				block.push(`    rdfs:range ${xsdType} ;`);
			}

			this.terminateLastLine(block);
			lines.push(...block, "");
		}
	}

	private writeValueTypes(lines: string[]): void {
		for (const vt of this.ontology.valueTypes ?? []) {
			const iri = this.expandIRI(vt["@id"]);
			const individuals = vt.values
				.map((v) => `:${this.localName(vt["@id"])}_${this.localName(v)}`)
				.join(" , ");

			const block: string[] = [`${iri} a owl:Class ;`];
			if (this.options.includeAnnotations) {
				if (vt.label.en)
					block.push(`    rdfs:label "${this.escapeTurtle(vt.label.en)}"@en ;`);
				if (vt.label.zh)
					block.push(`    rdfs:label "${this.escapeTurtle(vt.label.zh)}"@zh ;`);
			}
			block.push("    owl:equivalentClass [");
			block.push("        a owl:Class ;");
			block.push(`        owl:oneOf ( ${individuals} )`);
			block.push("    ] .");

			lines.push(...block);

			for (const value of vt.values) {
				lines.push("");
				lines.push(
					`:${this.localName(vt["@id"])}_${this.localName(value)} a owl:NamedIndividual , ${iri} ;`,
				);
				lines.push(`    rdfs:label "${this.escapeTurtle(value)}" .`);
			}
			lines.push("");
		}
	}

	private writeConstraints(lines: string[]): void {
		for (const constraint of this.ontology.constraints ?? []) {
			const iri = this.expandIRI(constraint["@id"]);
			const block: string[] = [
				`${iri} a owl:Class ;`,
				"    owl:equivalentClass [",
			];

			// 优先使用结构化表达式
			let restriction: string | null = null;
			if (constraint.expr) {
				restriction = this.exprToOWLRestriction(constraint.expr);
			}
			if (!restriction) {
				restriction = this.constraintToRestriction(constraint);
			}
			if (restriction) {
				block.push("        a owl:Restriction ;");
				block.push(`        ${restriction}`);
			} else {
				block.push("        a owl:Class ;");
				block.push(
					`        rdfs:comment "Constraint: ${this.escapeTurtle(constraint.rule)}"`,
				);
			}
			block.push("    ] ;");

			if (this.options.includeAnnotations) {
				if (constraint.label?.en)
					block.push(
						`    rdfs:label "${this.escapeTurtle(constraint.label.en)}"@en ;`,
					);
				if (constraint.label?.zh)
					block.push(
						`    rdfs:label "${this.escapeTurtle(constraint.label.zh)}"@zh ;`,
					);
				if (constraint.message?.en)
					block.push(
						`    rdfs:comment "${this.escapeTurtle(constraint.message.en)}"@en ;`,
					);
				if (constraint.message?.zh)
					block.push(
						`    rdfs:comment "${this.escapeTurtle(constraint.message.zh)}"@zh ;`,
					);
			}

			this.terminateLastLine(block);
			lines.push(...block, "");
		}
	}

	/** 导出 InterfaceDefinition 为 OWL */
	private writeInterfaces(lines: string[]): void {
		if (!this.ontology.interfaces || this.ontology.interfaces.length === 0)
			return;

		for (const iface of this.ontology.interfaces) {
			const iri = this.expandIRI(iface["@id"]);
			const block: string[] = [`${iri} a owl:Class ;`];

			this.appendLocalized(block, iface.label, "rdfs:label");
			this.appendLocalized(block, iface.description, "rdfs:comment");

			// 必需属性 → owl:intersectionOf restrictions
			if (iface.requiredAttributes.length > 0) {
				const restrictions = iface.requiredAttributes
					.map((attr) => {
						const propIRI = this.expandIRI(attr.ref);
						return `[ a owl:Restriction ; owl:onProperty ${propIRI} ; owl:minCardinality "1"^^xsd:nonNegativeInteger ]`;
					})
					.join(" , ");
				block.push(
					`    owl:equivalentClass [ a owl:Class ; owl:intersectionOf ( ${restrictions} ) ] ;`,
				);
			}

			this.terminateLastLine(block);
			lines.push(...block, "");
		}
	}

	private getAllEntityTypes(): EntityType[] {
		return [
			...(this.ontology.entityTypes ?? []),
			...(this.ontology.eventTypes ?? []),
			...(this.ontology.roleTypes ?? []),
		];
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

	private kindToOWLClass(kind: string): string | null {
		switch (kind) {
			case "event":
				return ":EventType";
			case "role":
				return ":RoleType";
			case "value":
				return ":ValueType";
			default:
				return null;
		}
	}

	private appendLocalized(
		block: string[],
		text:
			| { en?: string; zh?: string; [k: string]: string | undefined }
			| undefined,
		predicate: string,
	): void {
		if (!this.options.includeAnnotations || !text) return;
		if (text.en)
			block.push(`    ${predicate} "${this.escapeTurtle(text.en)}"@en ;`);
		if (text.zh)
			block.push(`    ${predicate} "${this.escapeTurtle(text.zh)}"@zh ;`);
	}

	private attributeToRestriction(attrRef: AttributeRef): string | null {
		if (!attrRef.required) return null;
		const propIRI = this.expandIRI(attrRef.ref);
		return `[ a owl:Restriction ; owl:onProperty ${propIRI} ; owl:minCardinality "1"^^xsd:nonNegativeInteger ]`;
	}

	private relationToRestriction(relRef: {
		ref: string;
		min?: number;
		max?: number | null;
	}): string | null {
		const propIRI = this.expandIRI(relRef.ref);
		const parts: string[] = [];
		if (relRef.min !== undefined && relRef.min > 0) {
			parts.push(`owl:minCardinality "${relRef.min}"^^xsd:nonNegativeInteger`);
		}
		if (relRef.max !== undefined && relRef.max !== null) {
			parts.push(`owl:maxCardinality "${relRef.max}"^^xsd:nonNegativeInteger`);
		}
		if (parts.length === 0) return null;
		return `[ a owl:Restriction ; owl:onProperty ${propIRI} ; ${parts.join(" ; ")} ]`;
	}

	private constraintToRestriction(constraint: Constraint): string | null {
		const match = constraint.rule.match(/^(\w+)\s*(>=|<=|>|<|=|!=)\s*(.+)$/);
		if (!match) return null;
		const [, field, operator, value] = match;
		if (!field || !operator || !value) return null;
		switch (operator) {
			case ">=":
				return `owl:onProperty :${field} ; owl:withRestrictions ( [ xsd:minInclusive "${value}"^^xsd:decimal ] )`;
			case "<=":
				return `owl:onProperty :${field} ; owl:withRestrictions ( [ xsd:maxInclusive "${value}"^^xsd:decimal ] )`;
			case ">":
				return `owl:onProperty :${field} ; owl:withRestrictions ( [ xsd:minExclusive "${value}"^^xsd:decimal ] )`;
			case "<":
				return `owl:onProperty :${field} ; owl:withRestrictions ( [ xsd:maxExclusive "${value}"^^xsd:decimal ] )`;
			default:
				return null;
		}
	}

	/** 将结构化 Expr 转换为 OWL Restriction */
	private exprToOWLRestriction(expr: Expr): string | null {
		switch (expr.type) {
			case "compare":
				switch (expr.op) {
					case "gte": {
						if (expr.left.type !== "property") return null;
						if (expr.right.type !== "literal") return null;
						const rightVal = String(expr.right.value);
						const leftProp = expr.left.path;
						return `owl:onProperty :${leftProp} ; owl:withRestrictions ( [ xsd:minInclusive "${rightVal}"^^xsd:decimal ] )`;
					}
					case "lte": {
						if (expr.left.type !== "property") return null;
						if (expr.right.type !== "literal") return null;
						const rightVal = String(expr.right.value);
						const leftProp = expr.left.path;
						return `owl:onProperty :${leftProp} ; owl:withRestrictions ( [ xsd:maxInclusive "${rightVal}"^^xsd:decimal ] )`;
					}
					case "gt": {
						if (expr.left.type !== "property") return null;
						if (expr.right.type !== "literal") return null;
						const rightVal = String(expr.right.value);
						const leftProp = expr.left.path;
						return `owl:onProperty :${leftProp} ; owl:withRestrictions ( [ xsd:minExclusive "${rightVal}"^^xsd:decimal ] )`;
					}
					case "lt": {
						if (expr.left.type !== "property") return null;
						if (expr.right.type !== "literal") return null;
						const rightVal = String(expr.right.value);
						const leftProp = expr.left.path;
						return `owl:onProperty :${leftProp} ; owl:withRestrictions ( [ xsd:maxExclusive "${rightVal}"^^xsd:decimal ] )`;
					}
					default:
						return null;
				}
			case "logical":
				if (expr.op === "and") {
					const parts = expr.operands
						.map((o) => this.exprToOWLRestriction(o))
						.filter((p): p is string => p !== null);
					if (parts.length === 0) return null;
					return parts.join(" ; ");
				}
				return null;
			default:
				return null;
		}
	}

	private terminateLastLine(block: string[]): void {
		const last = block[block.length - 1];
		if (last?.endsWith(" ;")) {
			block[block.length - 1] = last.replace(/ ;$/, " .");
		}
	}

	private escapeTurtle(str: string): string {
		return str
			.replace(/\\/g, "\\\\")
			.replace(/"/g, '\\"')
			.replace(/\n/g, "\\n");
	}
}
