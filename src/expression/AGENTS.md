# src/expression -- 表达式 AST 与安全求值器

## OVERVIEW

表达式抽象语法树 (Expr AST) + 安全求值引擎。纯 TypeScript 递归求值，**不使用 `eval`/`new Function`**，防原型污染与注入。

## STRUCTURE

```
expression/
├── types.ts              # Expr 联合类型（8 种节点，type 判别式）
├── evaluator.ts          # SafeExpressionEvaluator
├── derived-evaluator.ts  # DerivedAttributeEvaluator（LRU 缓存）
├── index.ts              # barrel 导出
├── evaluator.test.ts     # 单元测试
├── evaluator.bench.ts    # 基准测试
└── AGENTS.md             # 本文件
```

## WHERE TO LOOK

| 任务 | 文件 | 行数 | 说明 |
|------|------|------|------|
| 修改 Expr 类型 | `types.ts` | 107 | 8 种节点 |
| 修改求值逻辑 | `evaluator.ts` | 401 | `SafeExpressionEvaluator` |
| 修改派生属性 | `derived-evaluator.ts` | 90 | `DerivedAttributeEvaluator` |
| 修改测试 | `evaluator.test.ts` | 533 | 覆盖各节点与安全场景 |

## EXPR AST 节点 (types.ts)

AST 使用 **`type` 判别式**（非 `kind`）：

| 节点 | `type` | 关键字段 |
|------|--------|----------|
| `LiteralExpr` | `"literal"` | `value: string \| number \| boolean \| null` |
| `PropertyExpr` | `"property"` | `path`（点号分隔，如 `address.city`） |
| `CompareExpr` | `"compare"` | `op`（eq/neq/gt/gte/lt/lte/contains/startsWith/endsWith/matches/in）, `left`, `right` |
| `LogicalExpr` | `"logical"` | `op`（and/or/not）, `operands: Expr[]` |
| `CallExpr` | `"call"` | `fn`（now/today/count/sum/avg/max/min/abs/round/len/toUpperCase/toLowerCase/trim）, `args` |
| `ConditionalExpr` | `"conditional"` | `condition`, `thenExpr`, `elseExpr` |
| `ArithmeticExpr` | `"arithmetic"` | `op`（add/subtract/multiply/divide/modulo）, `left`, `right` |
| `ArrayExpr` | `"array"` | `op`（map/filter/some/every/includes）, `source`, `itemExpr` |

## CONVENTIONS

- **递归深度:** `SafeExpressionEvaluator.MAX_DEPTH = 50`，超限返回 `undefined`
- **原型污染防护:** `UNSAFE_KEYS = { __proto__, constructor, prototype }`，属性路径命中即返回 `undefined`
- **null/undefined 安全:** 无法求值的表达式返回 `undefined`；比较/有序比较遇 null/undefined 返回 `false`
- **正则防 ReDoS:** `matches` 要求 pattern 字符串长度 ≤ 200，且对被测字符串截断至 10000
- **数组操作:** `$item`（及别名 `item`）注入当前元素上下文
- **算术:** 非数值操作数或除/模 0 返回 `NaN`

## ANTI-PATTERNS

- **禁止 eval/new Function** -- 生产环境使用 `SafeExpressionEvaluator.evaluate(expr, context)`
- **禁止 `__proto__`/`constructor`/`prototype` 属性访问** -- 原型污染拦截
- **MAX_DEPTH 单一来源** -- 求值器与派生属性共享常量语义，不要各自定义

## NOTES

- `SafeExpressionEvaluator` 是**无状态类**（`evaluate(expr, context)` 显式传入上下文），非单例；每次求值传入新的 context
- `DerivedAttributeEvaluator`（`maxCacheSize` 默认 1000）对 `attr.cache.enabled` 的派生属性做 LRU + TTL（`ttlSeconds` 默认 60）缓存；缓存键按 context key 排序 + `JSON.stringify` 稳定化
- 与 `RuleEngine` 集成：结构化 Expr 求值优先于旧 `expression` 字符串
- 单元测试覆盖：literal/property（含 `__proto__` 拦截）/compare/logical/arithmetic（除零）/内置函数/conditional/security

## 变更记录 (Changelog)

| 日期 | 操作 | 说明 |
|------|------|------|
| 2026-10-16 | 更新 | 依据当前源码重新生成 |
