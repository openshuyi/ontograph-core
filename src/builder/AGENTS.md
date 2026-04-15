# packages/ontology/src/builder -- Fluent Builder API

## OVERVIEW

类型安全的 Fluent API，用于构建本体定义。替代手动构造 JSON 对象。

## STRUCTURE

```
builder/
├── define.ts   # EntityTypeBuilder, defineEntity/Relation/Attribute
├── index.ts    # barrel 导出
└── AGENTS.md   # 本文件
```

## WHERE TO LOOK

| 任务 | 文件 | 说明 |
|------|------|------|
| 修改 Builder | `define.ts` (186行) | EntityTypeBuilder 类 + defineEntity/Relation/Attribute |

## BUILDER API (define.ts)

```typescript
EntityTypeBuilder
  └── .attribute(name, type, opts?)
  └── .constraint(constraintType, opts?)
  └── .derived(id, expr, opts?)
  └── .build() → EntityType

// 快捷方法
defineEntity(id, label, description?) → EntityTypeBuilder
defineRelation(id, label, domain, range, inverse?) → RelationType
defineAttribute(id, dataType, label) → AttributeDefinition
```

## CONVENTIONS

- **链式调用:** `.attribute().constraint().derived().build()` 模式
- **不可变:** build() 返回完整 EntityType，不修改 builder 内部状态
- **ID 格式:** `namespace:Name` (如 `sc:Warehouse`), builder 自动补全 namespace
- **可选参数:** `.attribute(name, type, { required: true, unique: true })` 可省略 opts

## ANTI-PATTERNS

- **禁止 build 后修改 builder 状态** -- build() 应返回独立副本
- **Builder 不执行校验** -- 校验由 OntologyValidator 负责，builder 只构造数据结构

## NOTES

- 与 `codegen/TypeGenerator` 关系: Builder 用于运行时构建，TypeGenerator 用于代码生成
- 示例: Builder API 配合 supply-chain-ontology.ts 使用，替代 JSON 硬编码
- 单元测试重点: 链式调用完整性/build 结果正确性 (当前无测试)
