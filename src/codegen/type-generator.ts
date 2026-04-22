import type {
	AttributeDefinition,
	DataType,
	EntityType,
	InterfaceDefinition,
	OntologyDefinition,
	RelationType,
} from "../types";

/** 类型生成配置 */
export interface TypeGeneratorConfig {
	includeRelations?: boolean;
	includeInterfaces?: boolean;
	typeSuffix?: string;
	namespaceFilter?: string[];
}

/** TypeScript 类型生成器 */
export class TypeGenerator {
	private config: Required<TypeGeneratorConfig>;

	constructor(
		private ontology: OntologyDefinition,
		config?: TypeGeneratorConfig,
	) {
		this.config = {
			includeRelations: config?.includeRelations ?? false,
			includeInterfaces: config?.includeInterfaces ?? false,
			typeSuffix: config?.typeSuffix ?? "Object",
			namespaceFilter: config?.namespaceFilter ?? [],
		};
	}

	generate(): string {
		const lines: string[] = [];
		lines.push(this.generateHeader());
		lines.push("");

		const attrMap = new Map(this.ontology.attributes.map((a) => [a["@id"], a]));
		const relMap = new Map(
			this.ontology.relationTypes.map((r) => [r["@id"], r]),
		);

		for (const et of this.getAllEntityTypes()) {
			if (!this.matchesFilter(et["@id"])) continue;
			lines.push(this.entityTypeToInterface(et, attrMap, relMap));
			lines.push("");
		}

		if (this.config.includeInterfaces && this.ontology.interfaces) {
			for (const iface of this.ontology.interfaces) {
				if (!this.matchesFilter(iface["@id"])) continue;
				lines.push(this.interfaceToTS(iface));
				lines.push("");
			}
		}

		return `${lines.join("\n").trimEnd()}\n`;
	}

	private entityTypeToInterface(
		entityType: EntityType,
		attributes: Map<string, AttributeDefinition>,
		relations: Map<string, RelationType>,
	): string {
		const typeName = this.toTypeName(entityType["@id"]);
		const lines: string[] = [`export interface ${typeName} {`];

		lines.push(`  "@id": string;`);
		lines.push(`  "@type": "${entityType["@id"]}";`);

		for (const attrRef of entityType.attributes) {
			const attr = attributes.get(attrRef.ref);
			const fieldName = this.toFieldName(attrRef.ref);
			const isRequired = attrRef.required || (attr?.required ?? false);
			const tsType = attr ? this.dataTypeToTS(attr.datatype) : "unknown";
			const suffix = isRequired ? "" : "?";
			const identityComment = attrRef.identity ? "  /** @identity */\n" : "";
			lines.push(`${identityComment}  ${fieldName}${suffix}: ${tsType};`);
		}

		if (this.config.includeRelations) {
			for (const relRef of entityType.relations) {
				const rel = relations.get(relRef.ref);
				if (rel) {
					const fieldName = this.toFieldName(relRef.ref);
					const targetTypeName = this.toTypeName(rel.range);
					const isMultiple = relRef.max === null || (relRef.max ?? 1) > 1;
					const tsType = isMultiple ? `${targetTypeName}[]` : targetTypeName;
					const suffix = relRef.min ? "" : "?";
					lines.push(`  ${fieldName}${suffix}: ${tsType};`);
				}
			}
		}

		lines.push("}");
		return lines.join("\n");
	}

	private interfaceToTS(iface: InterfaceDefinition): string {
		const typeName = this.toTypeName(iface["@id"]);
		const lines: string[] = [`export interface ${typeName} {`];

		for (const reqAttr of iface.requiredAttributes) {
			const fieldName = this.toFieldName(reqAttr.ref);
			const suffix = reqAttr.required ? "" : "?";
			lines.push(`  ${fieldName}${suffix}: unknown;`);
		}

		lines.push("}");
		return lines.join("\n");
	}

	private dataTypeToTS(dt: DataType): string {
		const map: Record<DataType, string> = {
			string: "string",
			integer: "number",
			float: "number",
			decimal: "number",
			boolean: "boolean",
			datetime: "string",
			date: "string",
			array: "unknown[]",
			object: "Record<string, unknown>",
			ref: "string",
			geopoint: "{ latitude: number; longitude: number }",
			geopolygon: "Array<{ latitude: number; longitude: number }>",
			vector: "number[]",
			duration: "string",
			currency: "{ amount: number; currency: string }",
			measurement: "{ value: number; unit: string }",
			struct: "Record<string, unknown>",
		};
		return map[dt];
	}

	private toTypeName(id: string): string {
		const localName = id.split(":").pop() ?? id;
		return localName + this.config.typeSuffix;
	}

	private toFieldName(ref: string): string {
		return ref.split(":").pop() ?? ref;
	}

	private matchesFilter(id: string): boolean {
		if (this.config.namespaceFilter.length === 0) return true;
		return this.config.namespaceFilter.some((ns) => id.startsWith(`${ns}:`));
	}

	private getAllEntityTypes(): EntityType[] {
		return [
			...(this.ontology.entityTypes ?? []),
			...(this.ontology.eventTypes ?? []),
			...(this.ontology.roleTypes ?? []),
		];
	}

	private generateHeader(): string {
		return `// Auto-generated from Ontology ${this.ontology["@id"]} v${this.ontology.version}`;
	}
}
