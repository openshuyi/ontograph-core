# packages/ontology/src/security -- 安全层 (RBAC)

## OVERVIEW

基于角色的访问控制 (RBAC)。资源级 + 行级权限过滤，deny 规则优先。

## STRUCTURE

```
security/
├── types.ts              # Permission, RoleDefinition, PermissionRule
├── access-controller.ts  # AccessController
├── index.ts              # barrel 导出
└── AGENTS.md             # 本文件
```

## WHERE TO LOOK

| 任务 | 文件 | 说明 |
|------|------|------|
| 修改权限类型 | `types.ts` (41行) | Permission, RoleDefinition, PermissionRule(+effect) |
| 修改访问控制 | `access-controller.ts` (160行) | AccessController 核心逻辑 |

## PERMISSION 模型 (types.ts)

```typescript
interface Permission { action: string; resource: string; effect?: 'allow' | 'deny'; rowConditions?: Record<string, unknown>[]; }
interface RoleDefinition { @id: string; label: LocalizedText; permissions: Permission[]; description?: LocalizedText; inheritedFrom?: string; }
interface PermissionRule { action: ActionType; resources: string[]; roles: string[]; effect?: 'allow' | 'deny'; description?: string; }
```

## CONVENTIONS

- **deny 优先:** `getEffectivePermission` 先检查 deny 规则，再 allow
- **行级过滤 AND 语义:** 多 deny 规则的 rowConditions 必须同时满足（非 OR）
- **资源匹配宽松前缀:** `isRoleAllowed(action, resource)` 支持 resource 前缀匹配（`data:warehouse` 匹配 `data:*`）

## ANTI-PATTERNS

- **禁止 `role.permissions.find(r => r.effect === 'deny')`** -- 应收集全部 deny 规则合并
- **禁止 `undefined eq $value`** -- undefined 应转为 `$value IS NULL`，非 `$value = undefined`
- **禁止 `undefined neq $value`** -- undefined 应转为 `$value IS NOT NULL`
- **权限判断不依赖 resource:*** -- 应精确匹配 resource

## NOTES

- `getRowConditionsForResource` 用于生成 SQL/Neo4j WHERE 子句的行级过滤条件
- `hasPermission` 和 `isRoleAllowed` 区分: 前者检查特定角色的具体权限，后者检查角色+action+resource
- 集成: `OntologyDefinition.roles` 数组存储所有角色定义
- 单元测试重点: 行级条件 AND 语义/undefined 字段处理/deny 优先 (当前无测试)
