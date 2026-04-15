# packages/ontology/src/expression -- 表达式 AST 与安全求值器

## OVERVIEW

表达式抽象语法树 (Expr AST) + 安全求值引擎。替代生产环境 `new Function()`，防 ReDoS/原型污染/注入。

## STRUCTURE

```
expression/
├── types.ts            # Expr 联合类型 (8 种节点)
├── evaluator.ts        # SafeExpressionEvaluator
├── derived-evaluator.ts # DerivedAttributeEvaluator (LRU 缓存)
└── index.ts            # barrel 导出
```

## WHERE TO LOOK

| 任务 | 文件 | 说明 |
|------|------|------|
| 修改 Expr 类型 | `types.ts` (107行) | BinaryExpr, UnaryExpr, Literal 等 8 种节点 |
| 修改求值逻辑 | `evaluator.ts` (398行) | SafeExpressionEvaluator 单例求值 |
| 修改派生属性 | `derived-evaluator.ts` (82行) | LRU(100) 缓存键稳定化 |

## EXPR AST 节点 (types.ts)

| 节点 | 字段 | 示例 |
|------|------|------|
| `LiteralExpr` | kind='literal', value | `42`, `"hello"` |
| `AttributeExpr` | kind='attribute', path | `obj.name` |
| `BinaryExpr` | kind='binary', op, left, right | `a + b`, `x > 5` |
| `UnaryExpr` | kind='unary', op, operand | `-x`, `!flag` |
| `MemberExpr` | kind='member', object, property | `user.profile.age` |
| `FuncCallExpr` | kind='funcCall', name, args | `Math.max(a, b)` |
| `TernaryExpr` | kind='ternary', cond, then, else | `x ? y : z` |
| `ArrayExpr` | kind='array', elements | `[1, 2, 3]` |

## CONVENTIONS

- **递归深度:** MAX_EXPRESSION_DEPTH=50，超过抛 ExpressionDepthError
- **白名单:** 仅 Math.pow/sqrt/ceil/floor/round/min/max 和 Math.PI
- **Math.max 实现:** 不创建数组，用 reduce 逐个比较 (--max-stack-size 安全)

## ANTI-PATTERNS

- **禁止 eval/new Function** -- 生产环境使用 expr.evaluate()，非 eval() 回退
- **禁止 Object/Array/Function 构造器** -- 黑名单拦截
- **禁止 RegExp.exec 长输入** -- 输入 >10000 抛 MaximumLoopError
- **禁止 __proto__/constructor/prototype 属性访问** -- 原型污染拦截
- **MAX_RECURSION_DEPTH** -- 求值器和派生属性共享常量=50，不要各自定义

## NOTES

- safeEval 单例模式，每次 OntologyDefinition 变更用 `evaluator.setContext(newCtx)` 更新上下文
- 派生属性缓存键用 JSON.stringify 稳定化，非 object 引用
- RuleEngine 中 expr 优先求值 (rule.expr?.evaluate() > rule.expression)
- 单元测试重点: 注入攻击/ReDoS/原型污染 (当前无测试)
