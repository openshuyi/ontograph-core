/**
 * Graphviz DOT Exporter — OntoGraph → DOT format
 *
 * Converts ontology definitions into Graphviz DOT format for
 * visualization of entity-relationship diagrams.
 *
 * @module exporters/dot-exporter
 */

import type { EntityType, OntologyDefinition, RelationType } from "../types";

export interface DotExportOptions {
	/** Graph layout engine: "dot" | "neato" | "fdp" | "sfdp" | "circo" | "twopi" */
	layout?: "dot" | "neato" | "fdp" | "sfdp" | "circo" | "twopi";
	/** Graph direction: "TB" | "LR" | "BT" | "RL" */
	direction?: "TB" | "LR" | "BT" | "RL";
	/** Max label length before truncation */
	maxLabelLength?: number;
	/** Show attributes inside nodes */
	showAttributes?: boolean;
	/** Color scheme for auto-assignment */
	colorScheme?: string[];
}

const DEFAULT_COLORS = [
	"#E3F2FD",
	"#E8F5E9",
	"#FFF3E0",
	"#F3E5F5",
	"#E0F7FA",
	"#FBE9E7",
	"#F1F8E9",
	"#FFF8E1",
];

const KIND_SHAPES: Record<string, string> = {
	entity: "box",
	event: "diamond",
	role: "ellipse",
	value: "hexagon",
};

const KIND_STYLES: Record<string, string> = {
	entity: "filled,rounded",
	event: "filled",
	role: "filled",
	value: "filled",
};

export class DotExporter {
	private ontology: OntologyDefinition;
	private options: Required<DotExportOptions>;
	private colorIndex = 0;

	constructor(ontology: OntologyDefinition, options?: DotExportOptions) {
		this.ontology = ontology;
		this.options = {
			layout: options?.layout ?? "dot",
			direction: options?.direction ?? "TB",
			maxLabelLength: options?.maxLabelLength ?? 30,
			showAttributes: options?.showAttributes ?? true,
			colorScheme: options?.colorScheme ?? DEFAULT_COLORS,
		};
	}

	export(): string {
		const lines: string[] = [];
		this.writeHeader(lines);
		this.writeNodes(lines);
		this.writeEdges(lines);
		lines.push("}");
		return lines.join("\n");
	}

	private writeHeader(lines: string[]): void {
		lines.push(
			`digraph "${this.escape(this.localName(this.ontology["@id"]))}" {`,
		);
		lines.push(
			`  graph [layout=${this.options.layout} rankdir=${this.options.direction} bgcolor="white" fontname="Helvetica" fontsize=12];`,
		);
		lines.push(`  node [fontname="Helvetica" fontsize=11 penwidth=1.5];`);
		lines.push(`  edge [fontname="Helvetica" fontsize=9 color="#666666"];`);
		lines.push("");
	}

	private writeNodes(lines: string[]): void {
		const allTypes = this.getAllEntityTypes();
		for (const entityType of allTypes) {
			this.writeEntityNode(lines, entityType);
		}

		for (const vt of this.ontology.valueTypes ?? []) {
			this.writeValueNode(lines, vt);
		}
	}

	private writeEntityNode(lines: string[], entityType: EntityType): void {
		const nodeId = this.nodeId(entityType["@id"]);
		const label = this.truncateLabel(this.getLocalizedLabel(entityType.label));
		const shape = KIND_SHAPES[entityType.kind] ?? "box";
		const style = KIND_STYLES[entityType.kind] ?? "filled";
		const color = entityType.ui?.color ?? this.nextColor();

		if (this.options.showAttributes && entityType.attributes.length > 0) {
			const htmlLabel = this.buildHtmlLabel(label, entityType);
			lines.push(
				`  ${nodeId} [shape=${shape} style="${style}" fillcolor="${color}" label=<${htmlLabel}>];`,
			);
		} else {
			lines.push(
				`  ${nodeId} [shape=${shape} style="${style}" fillcolor="${color}" label="${this.escape(label)}"];`,
			);
		}
	}

	private writeValueNode(
		lines: string[],
		vt: {
			"@id": string;
			label: { en?: string; zh?: string; [k: string]: string | undefined };
			values: string[];
		},
	): void {
		const nodeId = this.nodeId(vt["@id"]);
		const label = this.truncateLabel(this.getLocalizedLabel(vt.label));
		const valuesStr = vt.values.map((v) => this.escape(v)).join(" | ");
		lines.push(
			`  ${nodeId} [shape=record style=filled fillcolor="#FFF9C4" label="{${this.escape(label)}|${valuesStr}}"];`,
		);
	}

	private writeEdges(lines: string[]): void {
		for (const relType of this.ontology.relationTypes ?? []) {
			this.writeRelationEdge(lines, relType);
		}

		const allTypes = this.getAllEntityTypes();
		for (const entityType of allTypes) {
			if (entityType.extends) {
				for (const parentId of entityType.extends) {
					const from = this.nodeId(entityType["@id"]);
					const to = this.nodeId(parentId);
					lines.push(
						`  ${from} -> ${to} [style=dashed label="extends" arrowhead=empty color="#999999"];`,
					);
				}
			}
		}
	}

	private writeRelationEdge(lines: string[], relType: RelationType): void {
		const from = this.nodeId(relType.domain);
		const to = this.nodeId(relType.range);
		const label = this.truncateLabel(this.getLocalizedLabel(relType.label));
		lines.push(
			`  ${from} -> ${to} [label="${this.escape(label)}" arrowhead=vee];`,
		);
	}

	private buildHtmlLabel(label: string, entityType: EntityType): string {
		const attrs = entityType.attributes.slice(0, 8).map((attrRef) => {
			const attr = this.ontology.attributes.find(
				(a) => a["@id"] === attrRef.ref,
			);
			const name = attr
				? this.localName(attr["@id"])
				: this.localName(attrRef.ref);
			const prefix = attrRef.identity
				? "&#128273; "
				: attrRef.required || attr?.required
					? "* "
					: "";
			const datatype = attr?.datatype ? `: ${attr.datatype}` : "";
			return `<tr><td align="left">${prefix}${this.escapeHtml(name)}${datatype}</td></tr>`;
		});

		const moreAttrs =
			entityType.attributes.length > 8
				? `<tr><td align="left" fontsize="9">... +${entityType.attributes.length - 8} more</td></tr>`
				: "";

		return `<table border="0" cellborder="0" cellspacing="0" cellpadding="2"><tr><td align="center"><b>${this.escapeHtml(label)}</b></td></tr><hr/><tr><td align="left" fontsize="9">${attrs.join("")}${moreAttrs}</td></tr></table>`;
	}

	private getAllEntityTypes(): EntityType[] {
		return [
			...(this.ontology.entityTypes ?? []),
			...(this.ontology.eventTypes ?? []),
			...(this.ontology.roleTypes ?? []),
		];
	}

	private nodeId(id: string): string {
		return `node_${this.localName(id).replace(/[^a-zA-Z0-9_]/g, "_")}`;
	}

	private localName(id: string): string {
		const parts = id.split(":");
		return parts[parts.length - 1] ?? id;
	}

	private getLocalizedLabel(label: {
		en?: string;
		zh?: string;
		[k: string]: string | undefined;
	}): string {
		return (
			label.en ??
			label.zh ??
			Object.values(label).find((v): v is string => v !== undefined) ??
			""
		);
	}

	private truncateLabel(label: string): string {
		if (label.length <= this.options.maxLabelLength) return label;
		return `${label.slice(0, this.options.maxLabelLength - 3)}...`;
	}

	private nextColor(): string {
		const idx = this.colorIndex % this.options.colorScheme.length;
		this.colorIndex++;
		return this.options.colorScheme[idx] ?? "#F5F5F5";
	}

	private escape(str: string): string {
		return str
			.replace(/\\/g, "\\\\")
			.replace(/"/g, '\\"')
			.replace(/\n/g, "\\n");
	}

	private escapeHtml(str: string): string {
		return str
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;");
	}
}
