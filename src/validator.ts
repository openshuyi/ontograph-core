import type { EntityType, OntologyDefinition } from "./types";

export interface ValidationResult {
	valid: boolean;
	errors: string[];
	warnings: string[];
	orphans?: OrphanReference[];
	cycles?: CycleInfo[];
	missingAttributes?: MissingAttributeRef[];
	missingRelations?: MissingRelationRef[];
}

export interface OrphanReference {
	relationId: string;
	field: "domain" | "range";
	missingEntity: string;
}

export interface CycleInfo {
	entityId: string;
	cyclePath: string[];
}

export interface MissingAttributeRef {
	entityId: string;
	missingAttribute: string;
}

export interface MissingRelationRef {
	entityId: string;
	missingRelation: string;
}

export class OntologyValidator {
	validate(ontology: OntologyDefinition): ValidationResult {
		const errors: string[] = [];
		const warnings: string[] = [];

		// 基本校验
		if (!ontology["@id"]) {
			errors.push("Ontology must have an @id");
		}

		if (!ontology.version) {
			errors.push("Ontology must have a version");
		}

		if (!ontology.entityTypes || ontology.entityTypes.length === 0) {
			warnings.push("Ontology has no entity types");
		}

		// 校验实体类型引用
		for (const entityType of ontology.entityTypes ?? []) {
			// 校验属性引用
			for (const attrRef of entityType.attributes ?? []) {
				const attrExists = ontology.attributes?.some(
					(a) => a["@id"] === attrRef.ref,
				);
				if (!attrExists) {
					errors.push(
						`EntityType ${entityType["@id"]} references unknown attribute: ${attrRef.ref}`,
					);
				}
			}

			// 校验关系引用
			for (const relRef of entityType.relations ?? []) {
				const relExists = ontology.relationTypes?.some(
					(r) => r["@id"] === relRef.ref,
				);
				if (!relExists) {
					errors.push(
						`EntityType ${entityType["@id"]} references unknown relation: ${relRef.ref}`,
					);
				}
			}
		}

		const orphans = this.detectOrphans(ontology);
		for (const orphan of orphans) {
			errors.push(
				`Relation ${orphan.relationId} references non-existent ${orphan.field}: ${orphan.missingEntity}`,
			);
		}

		const cycles = this.detectCycles(ontology);
		for (const cycle of cycles) {
			errors.push(
				`Cycle detected in inheritance hierarchy: ${cycle.cyclePath.join(" -> ")}`,
			);
		}

		const missingAttributes = this.detectMissingAttributes(ontology);
		for (const miss of missingAttributes) {
			errors.push(
				`${miss.entityId} references undefined attribute: ${miss.missingAttribute}`,
			);
		}

		const missingRelations = this.detectMissingRelations(ontology);
		for (const miss of missingRelations) {
			errors.push(
				`${miss.entityId} references undefined relation: ${miss.missingRelation}`,
			);
		}

		return {
			valid: errors.length === 0,
			errors,
			warnings,
			orphans,
			cycles,
			missingAttributes,
			missingRelations,
		};
	}

	detectOrphans(definition: OntologyDefinition): OrphanReference[] {
		const orphans: OrphanReference[] = [];
		const entityIds = new Set<string>();

		for (const entity of definition.entityTypes ?? []) {
			entityIds.add(entity["@id"]);
		}
		for (const event of definition.eventTypes ?? []) {
			entityIds.add(event["@id"]);
		}
		for (const role of definition.roleTypes ?? []) {
			entityIds.add(role["@id"]);
		}
		for (const value of definition.valueTypes ?? []) {
			entityIds.add(value["@id"]);
		}

		for (const relation of definition.relationTypes ?? []) {
			if (!entityIds.has(relation.domain)) {
				orphans.push({
					relationId: relation["@id"],
					field: "domain",
					missingEntity: relation.domain,
				});
			}
			if (!entityIds.has(relation.range)) {
				orphans.push({
					relationId: relation["@id"],
					field: "range",
					missingEntity: relation.range,
				});
			}
		}

		return orphans;
	}

	detectCycles(definition: OntologyDefinition): CycleInfo[] {
		const cycles: CycleInfo[] = [];
		const allTypes = this.getAllEntityTypes(definition);
		const typeMap = new Map<string, EntityType>();
		for (const t of allTypes) {
			typeMap.set(t["@id"], t);
		}

		// DFS three-coloring: 0=unvisited, 1=in-progress, 2=done
		const state = new Map<string, number>();
		const path: string[] = [];

		const dfs = (id: string): boolean => {
			if (state.get(id) === 1) {
				const cycleStart = path.indexOf(id);
				const cyclePath = [...path.slice(cycleStart), id];
				cycles.push({ entityId: id, cyclePath });
				return true;
			}
			if (state.get(id) === 2) {
				return false;
			}

			state.set(id, 1);
			path.push(id);

			const entity = typeMap.get(id);
			if (entity?.extends) {
				for (const parentId of entity.extends) {
					if (typeMap.has(parentId)) {
						dfs(parentId);
					}
				}
			}

			path.pop();
			state.set(id, 2);
			return false;
		};

		for (const t of allTypes) {
			if (state.get(t["@id"]) === undefined) {
				dfs(t["@id"]);
			}
		}

		return cycles;
	}

	detectMissingAttributes(
		definition: OntologyDefinition,
	): MissingAttributeRef[] {
		const result: MissingAttributeRef[] = [];
		const attributeIds = new Set<string>();
		for (const attr of definition.attributes ?? []) {
			attributeIds.add(attr["@id"]);
		}

		const allTypes = this.getAllEntityTypes(definition);
		for (const entity of allTypes) {
			for (const attrRef of entity.attributes ?? []) {
				if (!attributeIds.has(attrRef.ref)) {
					result.push({
						entityId: entity["@id"],
						missingAttribute: attrRef.ref,
					});
				}
			}
		}

		return result;
	}

	detectMissingRelations(definition: OntologyDefinition): MissingRelationRef[] {
		const result: MissingRelationRef[] = [];
		const relationIds = new Set<string>();
		for (const rel of definition.relationTypes ?? []) {
			relationIds.add(rel["@id"]);
		}

		const allTypes = this.getAllEntityTypes(definition);
		for (const entity of allTypes) {
			for (const relRef of entity.relations ?? []) {
				if (!relationIds.has(relRef.ref)) {
					result.push({
						entityId: entity["@id"],
						missingRelation: relRef.ref,
					});
				}
			}
		}

		return result;
	}

	/**
	 * 校验接口实现完整性
	 *
	 * 检查声明 implements 某接口的 EntityType 是否满足接口要求的属性和关系。
	 * 实现不完整时返回 warning（不是 error，保持向后兼容）。
	 */
	validateInterfaceImplementations(
		definition: OntologyDefinition,
	): ValidationResult {
		const warnings: string[] = [];

		// 没有接口定义则直接通过
		if (!definition.interfaces || definition.interfaces.length === 0) {
			return { valid: true, errors: [], warnings: [] };
		}

		// 构建接口定义映射
		const interfaceMap = new Map(
			definition.interfaces.map((iface) => [iface["@id"], iface]),
		);

		// 获取所有 EntityType（包括 entityTypes, eventTypes, roleTypes）
		const allTypes = this.getAllEntityTypes(definition);

		for (const entityType of allTypes) {
			if (!entityType.implements || entityType.implements.length === 0)
				continue;

			for (const interfaceRef of entityType.implements) {
				const iface = interfaceMap.get(interfaceRef);
				if (!iface) {
					warnings.push(
						`EntityType ${entityType["@id"]} declares interface '${interfaceRef}' but it was not found in ontology`,
					);
					continue;
				}

				// 检查必需属性
				for (const reqAttr of iface.requiredAttributes) {
					const hasAttr = entityType.attributes.some(
						(attr) => attr.ref === reqAttr.ref,
					);
					if (!hasAttr) {
						warnings.push(
							`EntityType ${entityType["@id"]} is missing required attribute '${reqAttr.ref}' from interface '${interfaceRef}'`,
						);
					}
				}

				// 检查必需关系
				if (iface.requiredRelations) {
					for (const reqRel of iface.requiredRelations) {
						const hasRel = entityType.relations.some(
							(rel) => rel.ref === reqRel.ref,
						);
						if (!hasRel) {
							warnings.push(
								`EntityType ${entityType["@id"]} is missing required relation '${reqRel.ref}' from interface '${interfaceRef}'`,
							);
						}
					}
				}
			}
		}

		return {
			valid: true,
			errors: [],
			warnings,
		};
	}

	private getAllEntityTypes(definition: OntologyDefinition): EntityType[] {
		return [
			...(definition.entityTypes ?? []),
			...(definition.eventTypes ?? []),
			...(definition.roleTypes ?? []),
		];
	}
}
