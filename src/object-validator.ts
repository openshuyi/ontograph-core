/**
 * 对象模型校验器 (Object Model Validator)
 *
 * 校验 ObjectClass、ObjectInstance 和 ObjectLink 的合法性，
 * 包括结构完整性、引用完整性和循环依赖检测。
 *
 * @module object-validator
 */

import type {
	ObjectClass,
	ObjectInstance,
	ObjectLink,
	ObjectModelDefinition,
} from "./object-model";

/** 校验结果 */
export interface ObjectValidationResult {
	valid: boolean;
	errors: string[];
	warnings: string[];
}

/** 引用完整性问题 */
export interface ReferentialIntegrityIssue {
	linkId: string;
	field: "fromObjectId" | "toObjectId" | "classRef" | "relationTypeRef";
	missingRef: string;
}

/** 循环依赖信息 */
export interface ObjectCycleInfo {
	startObjectId: string;
	cyclePath: string[];
}

/**
 * 对象模型校验器
 *
 * 校验对象类定义、实例合规性、关系链接合法性、
 * 引用完整性和循环依赖。
 */
export class ObjectValidator {
	/** 校验对象类定义是否合法 */
	validateObjectClass(cls: ObjectClass): ObjectValidationResult {
		const errors: string[] = [];
		const warnings: string[] = [];

		if (!cls["@id"]) {
			errors.push("ObjectClass must have an @id");
		} else if (!this.isValidId(cls["@id"])) {
			errors.push(
				`ObjectClass @id must follow namespace:name format, got: ${cls["@id"]}`,
			);
		}

		if (cls["@type"] !== "ObjectClass") {
			errors.push(
				`ObjectClass @type must be "ObjectClass", got: ${cls["@type"]}`,
			);
		}

		if (!cls.entityTypeRef) {
			errors.push(
				`ObjectClass ${cls["@id"]} must reference an EntityType via entityTypeRef`,
			);
		}

		if (!cls.label?.zh && !cls.label?.en) {
			warnings.push(
				`ObjectClass ${cls["@id"]} should have at least one label language`,
			);
		}

		if (!cls.properties || cls.properties.length === 0) {
			warnings.push(`ObjectClass ${cls["@id"]} has no properties defined`);
		} else {
			const propertyIds = new Set<string>();
			for (const prop of cls.properties) {
				if (!prop["@id"]) {
					errors.push(`ObjectClass ${cls["@id"]} has a property without @id`);
					continue;
				}
				if (propertyIds.has(prop["@id"])) {
					errors.push(
						`ObjectClass ${cls["@id"]} has duplicate property @id: ${prop["@id"]}`,
					);
				}
				propertyIds.add(prop["@id"]);

				if (!prop.label?.zh && !prop.label?.en) {
					warnings.push(
						`Property ${prop["@id"]} in ${cls["@id"]} should have at least one label language`,
					);
				}
			}
		}

		return { valid: errors.length === 0, errors, warnings };
	}

	/** 校验对象实例是否符合类定义 */
	validateObjectInstance(
		obj: ObjectInstance,
		objectClass: ObjectClass,
	): ObjectValidationResult {
		const errors: string[] = [];
		const warnings: string[] = [];

		if (!obj["@id"]) {
			errors.push("ObjectInstance must have an @id");
		} else if (!this.isValidId(obj["@id"])) {
			errors.push(
				`ObjectInstance @id must follow namespace:name format, got: ${obj["@id"]}`,
			);
		}

		if (obj["@type"] !== "ObjectInstance") {
			errors.push(
				`ObjectInstance @type must be "ObjectInstance", got: ${obj["@type"]}`,
			);
		}

		if (obj.classRef !== objectClass["@id"]) {
			errors.push(
				`ObjectInstance ${obj["@id"]} classRef (${obj.classRef}) does not match provided ObjectClass (${objectClass["@id"]})`,
			);
		}

		if (!obj.metadata) {
			errors.push(`ObjectInstance ${obj["@id"]} must have metadata`);
		} else {
			if (!obj.metadata.createdAt) {
				errors.push(
					`ObjectInstance ${obj["@id"]} metadata must have createdAt`,
				);
			}
			if (!obj.metadata.updatedAt) {
				errors.push(
					`ObjectInstance ${obj["@id"]} metadata must have updatedAt`,
				);
			}
			if (!obj.metadata.createdBy) {
				errors.push(
					`ObjectInstance ${obj["@id"]} metadata must have createdBy`,
				);
			}
			if (obj.metadata.version !== undefined && obj.metadata.version < 0) {
				errors.push(
					`ObjectInstance ${obj["@id"]} metadata.version must be non-negative`,
				);
			}
		}

		const classPropertyIds = new Set(
			objectClass.properties.map((p) => p["@id"]),
		);

		for (const prop of objectClass.properties) {
			if (
				prop.required &&
				(obj.propertyValues[prop["@id"]] === undefined ||
					obj.propertyValues[prop["@id"]] === null)
			) {
				errors.push(
					`ObjectInstance ${obj["@id"]} missing required property: ${prop["@id"]}`,
				);
			}

			if (prop.identity && obj.propertyValues[prop["@id"]] !== undefined) {
				const value = obj.propertyValues[prop["@id"]];
				if (value === "" || value === null) {
					errors.push(
						`ObjectInstance ${obj["@id"]} identity property ${prop["@id"]} must have a non-empty value`,
					);
				}
			}

			if (
				prop.enum &&
				prop.enum.length > 0 &&
				obj.propertyValues[prop["@id"]] !== undefined
			) {
				const value = obj.propertyValues[prop["@id"]];
				if (!prop.enum.includes(value as string | number)) {
					errors.push(
						`ObjectInstance ${obj["@id"]} property ${prop["@id"]} value "${value}" not in enum: [${prop.enum.join(", ")}]`,
					);
				}
			}
		}

		for (const key of Object.keys(obj.propertyValues ?? {})) {
			if (!classPropertyIds.has(key)) {
				warnings.push(
					`ObjectInstance ${obj["@id"]} has unknown property: ${key}`,
				);
			}
		}

		return { valid: errors.length === 0, errors, warnings };
	}

	/** 校验关系链接是否合法 */
	validateLink(link: ObjectLink): ObjectValidationResult {
		const errors: string[] = [];
		const warnings: string[] = [];

		if (!link["@id"]) {
			errors.push("ObjectLink must have an @id");
		} else if (!this.isValidId(link["@id"])) {
			errors.push(
				`ObjectLink @id must follow namespace:name format, got: ${link["@id"]}`,
			);
		}

		if (link["@type"] !== "ObjectLink") {
			errors.push(
				`ObjectLink @type must be "ObjectLink", got: ${link["@type"]}`,
			);
		}

		if (!link.relationTypeRef) {
			errors.push(
				`ObjectLink ${link["@id"]} must reference a RelationType via relationTypeRef`,
			);
		}

		if (!link.fromObjectId) {
			errors.push(`ObjectLink ${link["@id"]} must have a fromObjectId`);
		}

		if (!link.toObjectId) {
			errors.push(`ObjectLink ${link["@id"]} must have a toObjectId`);
		}

		if (
			link.fromObjectId &&
			link.toObjectId &&
			link.fromObjectId === link.toObjectId
		) {
			warnings.push(
				`ObjectLink ${link["@id"]} has same fromObjectId and toObjectId: ${link.fromObjectId}`,
			);
		}

		return { valid: errors.length === 0, errors, warnings };
	}

	/** 校验完整的对象模型定义 */
	validateModel(model: ObjectModelDefinition): ObjectValidationResult {
		const errors: string[] = [];
		const warnings: string[] = [];

		if (!model["@id"]) {
			errors.push("ObjectModel must have an @id");
		}

		if (model["@type"] !== "ObjectModel") {
			errors.push(
				`ObjectModel @type must be "ObjectModel", got: ${model["@type"]}`,
			);
		}

		if (!model.version) {
			errors.push("ObjectModel must have a version");
		}

		if (!model.ontologyRef) {
			errors.push(
				"ObjectModel must reference an OntologyDefinition via ontologyRef",
			);
		}

		for (const cls of model.classes ?? []) {
			const result = this.validateObjectClass(cls);
			errors.push(...result.errors);
			warnings.push(...result.warnings);
		}

		const classMap = new Map(model.classes?.map((c) => [c["@id"], c]) ?? []);

		for (const inst of model.instances ?? []) {
			const cls = classMap.get(inst.classRef);
			if (!cls) {
				errors.push(
					`ObjectInstance ${inst["@id"]} references unknown ObjectClass: ${inst.classRef}`,
				);
				continue;
			}
			const result = this.validateObjectInstance(inst, cls);
			errors.push(...result.errors);
			warnings.push(...result.warnings);
		}

		for (const link of model.links ?? []) {
			const result = this.validateLink(link);
			errors.push(...result.errors);
			warnings.push(...result.warnings);
		}

		const integrityIssues = this.checkReferentialIntegrity(
			model.instances ?? [],
			model.links ?? [],
		);
		for (const issue of integrityIssues) {
			errors.push(
				`ObjectLink ${issue.linkId} references non-existent ${issue.field}: ${issue.missingRef}`,
			);
		}

		const cycles = this.detectCycles(model.links ?? []);
		for (const cycle of cycles) {
			errors.push(
				`Cycle detected in object links: ${cycle.cyclePath.join(" -> ")}`,
			);
		}

		return { valid: errors.length === 0, errors, warnings };
	}

	/** 检查引用完整性 -- 链接中引用的对象实例必须存在 */
	checkReferentialIntegrity(
		instances: ObjectInstance[],
		links: ObjectLink[],
	): ReferentialIntegrityIssue[] {
		const issues: ReferentialIntegrityIssue[] = [];
		const instanceIds = new Set(instances.map((i) => i["@id"]));

		for (const link of links) {
			if (!instanceIds.has(link.fromObjectId)) {
				issues.push({
					linkId: link["@id"],
					field: "fromObjectId",
					missingRef: link.fromObjectId,
				});
			}
			if (!instanceIds.has(link.toObjectId)) {
				issues.push({
					linkId: link["@id"],
					field: "toObjectId",
					missingRef: link.toObjectId,
				});
			}
		}

		return issues;
	}

	/** 检测循环依赖 -- 使用 DFS 三色标记法 */
	detectCycles(links: ObjectLink[]): ObjectCycleInfo[] {
		const cycles: ObjectCycleInfo[] = [];
		const adjacency = new Map<string, string[]>();

		for (const link of links) {
			const neighbors = adjacency.get(link.fromObjectId) ?? [];
			neighbors.push(link.toObjectId);
			adjacency.set(link.fromObjectId, neighbors);
		}

		const state = new Map<string, number>();
		const path: string[] = [];

		const dfs = (nodeId: string): void => {
			if (state.get(nodeId) === 1) {
				const cycleStart = path.indexOf(nodeId);
				if (cycleStart >= 0) {
					const cyclePath = [...path.slice(cycleStart), nodeId];
					cycles.push({ startObjectId: nodeId, cyclePath });
				}
				return;
			}
			if (state.get(nodeId) === 2) {
				return;
			}

			state.set(nodeId, 1);
			path.push(nodeId);

			const neighbors = adjacency.get(nodeId) ?? [];
			for (const neighbor of neighbors) {
				dfs(neighbor);
			}

			path.pop();
			state.set(nodeId, 2);
		};

		const allNodes = new Set<string>();
		for (const link of links) {
			allNodes.add(link.fromObjectId);
			allNodes.add(link.toObjectId);
		}

		for (const nodeId of allNodes) {
			if (state.get(nodeId) === undefined) {
				dfs(nodeId);
			}
		}

		return cycles;
	}

	/** 校验 @id 是否符合 namespace:name 格式 */
	private isValidId(id: string): boolean {
		return /^[a-zA-Z][a-zA-Z0-9_-]*:[a-zA-Z0-9_-]+$/.test(id);
	}
}
