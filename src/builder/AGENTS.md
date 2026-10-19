# src/builder -- Fluent Builder API

## OVERVIEW

类型安全的 Fluent API，用于构建本体定义（EntityType / RelationType / AttributeDefinition）。替代手动构造 JSON 对象。

## STRUCTURE

```
builder/
├── define.ts        # EntityTypeBuilder + defineEntity/defineRelation/defineAttribute
├── index.ts         # barrel 导出（export * from "./define"）
├── builder.test.ts  # 单元测试
└── AGENTS.md        # 本文件
```

## WHERE TO LOOK

| 任务 | 文件 | 行数 | 说明 |
|------|------|------|------|
| 修改 Builder | `define.ts` | 186 | `EntityTypeBuilder` 类 + 三个 define* 工厂 |
| 修改导出 | `index.ts` | 1 | barrel |
| 修改测试 | `builder.test.ts` | 279 | 链式调用与结果断言 |

## BUILDER API (define.ts)

```typescript
// 实体：链式构建
defineEntity(id, { kind, label, description?, extends?, implements? }): EntityTypeBuilder
  .attr(ref, opts?)        // opts: Partial<AttributeRef>（required/identity/...）
  .rel(ref, opts?)         // opts: Partial<RelationRef>（min/max/properties/...）
  .constraint(ref)         // 约束引用（字符串 @id）
  .implements(iface)       // 接口引用
  .ui(config)              // EntityUIConfig（color/icon/visible/group）
  .extends(parent)         // 父实体引用
  .build(): EntityType

// 关系：直接返回 RelationType
defineRelation(id, { label, description?, domain, range, min?, max?, inverse? }): RelationType

// 属性：直接返回 AttributeDefinition
defineAttribute(id, { label, description?, datatype, datatypeRef?, required?, identity?, readonly?, defaultValue?, enum?, pattern? }): AttributeDefinition
```

- `EntityConfig` / `RelationConfig` / `AttributeConfig` 为对应工厂的配置类型
- `AttributeConfig.pattern` 会被转换为 `validation: [{ type: "pattern", value }]`

## CONVENTIONS

- **链式调用:** `.attr().rel().constraint().implements().ui().extends().build()` 模式（每次调用返回 `this`）
- **build() 产出完整对象:** 返回带 `@id`/`@type` 的完整结构；`extends`/`implements` 会合并构造参数与链式调用结果
- **ID 格式:** `namespace:Name` (如 `sc:Warehouse`)
- **可选参数:** `.attr(ref, { identity: true, required: true })` 可省略 opts

## ANTI-PATTERNS

- **Builder 不执行校验** -- 校验由 `OntologyValidator` 负责，builder 只构造数据结构
- **`defineRelation`/`defineAttribute` 非链式** -- 它们直接返回构建结果，而非 builder 实例

## NOTES

- 与 `codegen/TypeGenerator` 关系: Builder 用于运行时构建，TypeGenerator 用于代码生成
- 单元测试覆盖：`defineEntity`（4 种 kind + description + 初始空集合）、`EntityTypeBuilder.chain`（attr/rel/constraint/implements/extends/ui + 全链）、`defineRelation`、`defineAttribute`（含 pattern 校验）

## 变更记录 (Changelog)

| 日期 | 操作 | 说明 |
|------|------|------|
| 2026-10-16 | 更新 | 依据当前源码重新生成 |
