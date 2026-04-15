# packages/ontology/src/query -- 查询抽象层

## OVERVIEW

领域无关查询引擎。FilterOp 类型安全过滤 + ObjectSet 不可变链式操作 + Neo4j 编译引擎。

## STRUCTURE

```
query/
├── filter-types.ts     # FilterOp, PageOptions, AggregateOptions
├── object-set.ts       # ObjectSet<T> 接口, QueryObjectInstance<T>
├── query-engine.ts     # IQueryEngine, ResolvedQuery, ObjectSetCompiler
├── object-set-impl.ts  # ObjectSetImpl<T> 不可变链式实现
├── neo4j-engine.ts     # Neo4jQueryEngine
├── index.ts            # barrel 导出
├── AGENTS.md           # 本文件
```

## WHERE TO LOOK

| 任务 | 文件 | 说明 |
|------|------|------|
| 修改过滤类型 | `filter-types.ts` (69行) | FilterOp 递归联合类型, 分页/聚合选项 |
| 修改 ObjectSet | `object-set.ts` (53行) + `object-set-impl.ts` (93行) | 接口 + 不可变实现 |
| 修改查询引擎 | `query-engine.ts` (60行) | IQueryEngine 接口 |
| 修改 Neo4j 编译 | `neo4j-engine.ts` (278行) | FilterOp→Cypher 编译引擎 |

## FILTEROP 运算符 (filter-types.ts)

| 操作符 | 含义 | 值类型 |
|--------|------|--------|
| `$eq` / `$neq` | 等于/不等于 | any |
| `$gt` / `$gte` / `$lt` / `$lte` | 数值比较 | number |
| `$in` / `$nin` | 包含/不包含 | any[] |
| `$contains` / `$startsWith` / `$endsWith` | 字符串匹配 | string |
| `$exists` | 字段存在 | boolean |
| `$and` / `$or` | 逻辑复合 | FilterOp[] / Record<string, FilterOp> |

## CONVENTIONS

- **FilterOp:** `$and/$or` 递归时 sub 是 `Record<string, FilterOp>` 非 `FilterOp`，需 `Object.entries()` 遍历
- **ObjectSet 接口:** 纯接口，不依赖 Neo4j，可注入任意查询后端
- **QueryObjectInstance vs ObjectInstance:** ObjectInstance 在 `object-model.ts`，query 包中用 `QueryObjectInstance` 避免冲突

## ANTI-PATTERNS

- **禁止 `as FilterOp` 转换 `$and/$or`** -- sub 类型是 `Record<string, FilterOp>`
- **禁止 Cypher 白名单外的 label** -- VALID_LABEL regex: `^[a-zA-Z_][a-zA-Z0-9_]*$`
- **禁止 Cypher 白名单外的 field** -- VALID_FIELD regex: `^[a-zA-Z_][a-zA-Z0-9_.]*$`
- **禁止 `Object.values()` 用于 `$and/$or/sub`** -- 应 `Object.entries()` 获取键值对
- **totalCount=0 时禁止返回空数据** -- totalCount=0 应 skip 查询，直接返回空结果

## NEO4J 注入防御

- **Label 白名单:** `/^[a-zA-Z_][a-zA-Z0-9_]*$/`
- **Field 白名单:** `/^[a-zA-Z_][a-zA-Z0-9_.]*$/`
- **参数化:** 全部值通过 `$paramN` 传参，禁止字符串拼接
- **分页 bug:** `toCountCypher` 必须从查询 Cypher 中删除 ORDER BY（否则 count 返回 0）

## NOTES

- Neo4jQueryEngine 是 IQueryEngine 的 Neo4j 实现，通过 CypherBuilder 构建查询
- 查询编译分两阶段: FilterOp→Cypher (compileQuery) + ObjectSet→Cypher (compileObjectSet)
- 单元测试重点: 注入攻击/分页边界/复合过滤 (当前无测试)
