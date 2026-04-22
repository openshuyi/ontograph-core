import type {
	Permission,
	PermissionCheckResult,
	ResourceType,
	RoleDefinition,
	RowSecurityCondition,
} from "./types";

export class AccessController {
	private roles: Map<string, RoleDefinition>;
	private defaultPolicy: "allow" | "deny";

	constructor(options?: { defaultPolicy?: "allow" | "deny" }) {
		this.roles = new Map();
		this.defaultPolicy = options?.defaultPolicy ?? "allow";
	}

	registerRole(role: RoleDefinition): void {
		this.roles.set(role["@id"], role);
	}

	registerRoles(roles: RoleDefinition[]): void {
		for (const r of roles) this.registerRole(r);
	}

	unregisterRole(roleId: string): void {
		this.roles.delete(roleId);
	}

	check(
		_userId: string,
		userRoleIds: string[],
		action: Permission,
		resourceType: ResourceType,
		resourceRef: string,
	): PermissionCheckResult {
		// 收集所有匹配规则（含继承），deny 优先于 allow
		let hasDeny = false;
		let allowRule: string | null = null;

		for (const roleId of userRoleIds) {
			const resolvedRoles = this.resolveRole(roleId);
			for (const role of resolvedRoles) {
				for (const rule of role.rules) {
					if (rule.resource !== resourceType) continue;
					if (rule.resourceRef !== "*" && rule.resourceRef !== resourceRef)
						continue;
					if (!rule.permissions.includes(action)) continue;

					const effect = rule.effect ?? "allow";
					if (effect === "deny") {
						hasDeny = true;
						break;
					}
					if (!allowRule) allowRule = role["@id"];
				}
				if (hasDeny) break;
			}
			if (hasDeny) break;
		}

		if (hasDeny) {
			return { allowed: false, reason: "Explicitly denied by rule" };
		}
		if (allowRule) {
			return { allowed: true, matchedRule: allowRule };
		}

		// 无匹配规则，按默认策略处理
		if (this.defaultPolicy === "deny") {
			return {
				allowed: false,
				reason: `No matching rule for ${action} on ${resourceType}:${resourceRef}`,
			};
		}
		return { allowed: true, reason: "Default allow policy" };
	}

	filter<T extends Record<string, unknown>>(
		objects: T[],
		userId: string,
		userRoleIds: string[],
		resourceRef: string,
	): T[] {
		const allConditions = this.getRowConditionsForResource(
			userRoleIds,
			resourceRef,
		);
		if (allConditions.length === 0) return objects;

		// AND 语义：对象必须满足所有角色的条件（无条件限制的角色自动通过）
		const context: Record<string, unknown> = { $currentUser: userId };
		return objects.filter((obj) =>
			allConditions.every((c) =>
				this.evaluateRowCondition(c.condition, obj, context),
			),
		);
	}

	getPermissions(
		userRoleIds: string[],
		resourceType: ResourceType,
		resourceRef: string,
	): Set<Permission> {
		const perms = new Set<Permission>();
		for (const roleId of userRoleIds) {
			const resolvedRoles = this.resolveRole(roleId);
			for (const role of resolvedRoles) {
				for (const rule of role.rules) {
					if (
						rule.resource === resourceType &&
						(rule.resourceRef === "*" || rule.resourceRef === resourceRef)
					) {
						for (const p of rule.permissions) perms.add(p);
					}
				}
			}
		}
		return perms;
	}

	private getRowConditionsForResource(
		userRoleIds: string[],
		resourceRef: string,
	): Array<{ roleId: string; condition: RowSecurityCondition }> {
		const conditions: Array<{
			roleId: string;
			condition: RowSecurityCondition;
		}> = [];
		for (const roleId of userRoleIds) {
			const resolvedRoles = this.resolveRole(roleId);
			for (const role of resolvedRoles) {
				for (const rule of role.rules) {
					if (
						rule.resource === "objectType" &&
						(rule.resourceRef === "*" || rule.resourceRef === resourceRef) &&
						rule.condition
					) {
						conditions.push({ roleId: role["@id"], condition: rule.condition });
					}
				}
			}
		}
		return conditions;
	}

	private resolveRole(roleId: string, visited?: Set<string>): RoleDefinition[] {
		const v = visited ?? new Set<string>();
		if (v.has(roleId)) return [];
		v.add(roleId);
		const role = this.roles.get(roleId);
		if (!role) return [];
		const result: RoleDefinition[] = [role];
		if (role.extends) {
			for (const parentId of role.extends) {
				result.push(...this.resolveRole(parentId, v));
			}
		}
		return result;
	}

	private evaluateRowCondition(
		condition: RowSecurityCondition,
		obj: Record<string, unknown>,
		context: Record<string, unknown>,
	): boolean {
		const propVal = obj[condition.property];
		const ctxVal = context[condition.valueVar];
		switch (condition.op) {
			case "eq":
				if (propVal === undefined && ctxVal === undefined) return false;
				return propVal === ctxVal;
			case "neq":
				if (propVal === undefined && ctxVal === undefined) return false;
				return propVal !== ctxVal;
			case "in":
				return Array.isArray(ctxVal) && ctxVal.includes(propVal);
			case "contains":
				return (
					typeof propVal === "string" &&
					typeof ctxVal === "string" &&
					propVal.includes(ctxVal)
				);
			default:
				return false;
		}
	}
}
