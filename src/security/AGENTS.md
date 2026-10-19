# src/security -- 安全层 (RBAC)

## OVERVIEW

基于角色的访问控制 (RBAC)。资源级权限检查 + 行级安全过滤，**deny 规则优先于 allow**，支持角色继承（含循环保护）。

## STRUCTURE

```
security/
├── types.ts                    # Permission, ResourceType, RoleDefinition, PermissionRule, ...
├── access-controller.ts        # AccessController
├── index.ts                    # barrel 导出
├── access-controller.test.ts   # 单元测试
└── AGENTS.md                   # 本文件
```

## WHERE TO LOOK

| 任务 | 文件 | 行数 | 说明 |
|------|------|------|------|
| 修改权限类型 | `types.ts` | 41 | 权限/资源/规则/行级条件类型 |
| 修改访问控制 | `access-controller.ts` | 163 | `AccessController` 核心逻辑 |
| 修改测试 | `access-controller.test.ts` | 842 | 覆盖 allow/deny/继承/行级过滤 |

## PERMISSION 模型 (types.ts)

```typescript
type Permission = "view" | "create" | "edit" | "delete" | "execute" | "export";
type ResourceType = "objectType" | "actionType" | "relationType" | "view" | "rule" | "interface";

interface RoleDefinition {
  "@id": string;
  "@type": "Role";
  label: LocalizedText;
  description?: LocalizedText;
  rules: PermissionRule[];
  extends?: string[];        // 父角色（递归继承）
}

interface PermissionRule {
  resource: ResourceType;
  resourceRef: string;       // "*" 通配，或具体引用
  permissions: Permission[];
  condition?: RowSecurityCondition;
  effect?: "allow" | "deny"; // deny 优先
}

interface RowSecurityCondition { property: string; op: "eq" | "neq" | "in" | "contains"; valueVar: string; }
interface PermissionCheckResult { allowed: boolean; matchedRule?: string; reason?: string; }
```

## ACCESS CONTROLLER (access-controller.ts)

- 构造：`new AccessController({ defaultPolicy })`，`defaultPolicy` 默认 `"allow"`
- 注册：`registerRole(role)` / `registerRoles(roles)` / `unregisterRole(roleId)`
- `check(userId, userRoleIds, action, resourceType, resourceRef)` -- 遍历所有角色（含继承）的匹配规则，**deny 优先**；无匹配规则时按 `defaultPolicy` 处理
- `filter(objects, userId, userRoleIds, resourceRef)` -- 行级过滤：收集所有 `objectType` 规则的条件，**AND 语义**（对象须满足所有条件）；`$currentUser` 注入上下文
- `getPermissions(userRoleIds, resourceType, resourceRef)` -- 返回权限集合
- 私有：`getRowConditionsForResource`、`resolveRole`（`extends` 递归，`visited` 集合防循环）、`evaluateRowCondition`

## CONVENTIONS

- **deny 优先:** `check` 收集全部匹配规则，任一 deny 命中即拒绝
- **行级过滤 AND 语义:** 多角色/多规则的条件必须同时满足（非 OR）
- **通配匹配:** `resourceRef === "*"` 或精确匹配
- **undefined 处理:** `eq`/`neq` 在双方均 undefined 时返回 false（不视为相等/不等）

## ANTI-PATTERNS

- **禁止短路匹配** -- 必须遍历所有角色收集 deny，不能首个匹配即返回
- **禁止遗漏循环保护** -- `resolveRole` 必须用 `visited` 防止继承环无限递归

## NOTES

- `filter` 仅在存在 `objectType` 行级条件时生效；无条件时原样返回
- 集成：`OntologyDefinition.roles` 数组存储角色定义（由调用方注册到 controller）
- 单元测试覆盖：基本 allow/deny、deny-first、default allow/deny、通配/精确资源匹配、角色继承（含多级与环）、多角色、行级过滤（eq/neq/in/contains/AND 语义）

## 变更记录 (Changelog)

| 日期 | 操作 | 说明 |
|------|------|------|
| 2026-10-16 | 更新 | 依据当前源码重新生成 |
