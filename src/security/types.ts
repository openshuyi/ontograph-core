import type { LocalizedText } from "../types";

/** 权限操作类型 */
export type Permission =
	| "view"
	| "create"
	| "edit"
	| "delete"
	| "execute"
	| "export";

/** 资源类型 */
export type ResourceType =
	| "objectType"
	| "actionType"
	| "relationType"
	| "view"
	| "rule"
	| "interface";

/** 角色定义 */
export interface RoleDefinition {
	"@id": string;
	"@type": "Role";
	label: LocalizedText;
	description?: LocalizedText;
	rules: PermissionRule[];
	extends?: string[];
}

/** 权限规则 */
export interface PermissionRule {
	resource: ResourceType;
	resourceRef: string;
	permissions: Permission[];
	condition?: RowSecurityCondition;
	/** 规则效果，deny 优先于 allow */
	effect?: "allow" | "deny";
}

/** 行级安全条件 */
export interface RowSecurityCondition {
	property: string;
	op: "eq" | "neq" | "in" | "contains";
	valueVar: string;
}

/** 权限检查结果 */
export interface PermissionCheckResult {
	allowed: boolean;
	matchedRule?: string;
	reason?: string;
}
