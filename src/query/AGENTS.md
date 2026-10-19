# src/query -- 查询抽象层

## OVERVIEW

领域无关查询引擎。FilterOp 类型安全过滤 + ObjectSet 不可变链式操作 + Neo4j Cypher 编译引擎（通过注入的执行函数，不直连 driver）。

## STRUCTURE

```
query/
├── filter-types.ts     # FilterOp, PageOptions/PageResult, AggregateOptions/Result
├── object-set.ts       # ObjectSet<T> 接口, QueryObjectInstance<T>
├── query-engine.ts     # IQueryEngine, ResolvedQuery, QueryChain, ObjectSetCompiler
├── object-set-impl.ts  # ObjectSetImpl<T> 不可变链式实现
├── neo4j-engine.ts     # Neo4jQueryEngine
├── index.ts            # barrel 导出
├── neo4j-engine.test.ts# 单元测试
└── AGENTS.md           # 本文件
```

## WHERE TO LOOK

| 任务 | 文件 | 行数 | 说明 |
|------|------|------|------|
| 修改过滤类型 | `filter-types.ts` | 74 | `FilterOp` 联合类型、分页/聚合选项 |
| 修改 ObjectSet | `object-set.ts` | 53 | `ObjectSet<T>` 接口 + `QueryObjectInstance<T>` |
| 修改 ObjectSet 实现 | `object-set-impl.ts` | 98 | `ObjectSetImpl<T>` |
| 修改查询引擎 | `query-engine.ts` | 60 | `IQueryEngine` / `ResolvedQuery` / `ObjectSetCompiler` |
| 修改 Neo4j 编译 | `neo4j-engine.ts` | 281 | `Neo4jQueryEngine`（FilterOp→Cypher） |
| 修改测试 | `neo4j-engine.test.ts` | 1156 | 编译/校验/分页/聚合测试 |

## FILTEROP 运算符 (filter-types.ts)

| 操作符 | 含义 | 值类型 |
|--------|------|--------|
| `$eq` / `$neq` | 等于/不等于 | any |
| `$gt` / `$gte` / `$lt` / `$lte` | 数值比较 | number |
| `$contains` / `$startsWith` / `$endsWith` | 字符串匹配 | string |
| `$in` / `$notIn` | 包含/不包含 | unknown[] |
| `$isNull` | 空值判定 | boolean |
| `$exists` | 字段存在 | boolean |
| `$and` / `$or` | 逻辑复合 | `Record<string, FilterOp>[]` |
| `$not` | 逻辑取反 | `Record<string, FilterOp>` |

另含 `SortDirection`, `PageOptions`（`$pageSize`/`$cursor`）, `PageResult<T>`, `AggregateFunction`（`$count`/`$sum`/`$avg`/`$max`/`$min`/`$approximateDistinct`）, `AggregateOptions`（`$select`/`$groupBy`/`$having`）, `AggregateGroupBy`, `AggregateResult`。

## 引擎接口 (query-engine.ts)

```typescript
interface ResolvedQuery {
  entityTypeRef: string;
  filters: Array<{ field: string; op: FilterOp }>;
  orderBy?: Array<{ field: string; direction: "asc" | "desc" }>;
  limit?: number;
  offset?: number;
}

interface IQueryEngine {
  query<T>(query: ResolvedQuery, options?: PageOptions): Promise<PageResult<QueryObjectInstance<T>>>;
  aggregate<_T>(entityTypeRef, options: AggregateOptions, filters?): Promise<AggregateResult>;
  count(entityTypeRef, filters?): Promise<number>;
  fetchOne<T>(entityTypeRef, id): Promise<QueryObjectInstance<T> | null>;
}
```

- `ObjectSetCompiler.compile(entityTypeRef, chain)` -- 把 `QueryChain` 编译为 `ResolvedQuery`

## CONVENTIONS

- **FilterOp 复合:** `$and`/`$or`/`$not` 的子值是 `Record<string, FilterOp>`，需 `Object.entries()` 遍历
- **ObjectSet 不可变:** 每次 `where`/`orderBy`/`limit`/`offset` 返回新实例（`ObjectSetImpl.clone`）
- **引擎注入:** `Neo4jQueryEngine` 构造接收 `cypherExecutor: (cypher, params) => Promise<unknown[]>`，不依赖 `packages/graph`
- **类型区分:** query 包用 `QueryObjectInstance`，与 `object-model.ts` 的 `ObjectInstance` 区分

## NEO4J 注入防御

- **Label 白名单:** `/^[A-Za-z_][A-Za-z0-9_]*$/`
- **Field 白名单:** `/^[A-Za-z_@][A-Za-z0-9_.]*$/`
- **参数化:** 全部值通过参数传参，禁止字符串拼接

## NOTES

- `Neo4jQueryEngine.query` 先执行 count 查询取 `totalCount`，再执行数据查询；分页 `pageSize` 默认 50，`hasNextPage` 按返回条数判断
- `ObjectSetImpl.fetchAll` 自动按游标分页；`aggregate`/`count` 委托引擎
- 单元测试覆盖：全部 FilterOp 编译、Label/Field 校验与注入拒绝、分页（SKIP/LIMIT/默认页大小/offset）、count、聚合

## 变更记录 (Changelog)

| 日期 | 操作 | 说明 |
|------|------|------|
| 2026-10-16 | 更新 | 依据当前源码重新生成 |
