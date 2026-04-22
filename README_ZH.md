<div align="center">

<img src="docs/logo.svg" width="120" height="120" alt="@ontograph/core logo" />

# @ontograph/core

**TypeScript 本体论框架 — 用代码定义你的世界**

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![npm](https://img.shields.io/npm/v/@ontograph/core.svg)](https://www.npmjs.com/package/@ontograph/core)
[![CI](https://github.com/openshuyi/ontograph-core/actions/workflows/ci.yml/badge.svg)](https://github.com/openshuyi/ontograph-core/actions/workflows/ci.yml)
[![en](https://img.shields.io/badge/lang-en-blue.svg)](README.md)
[![zh](https://img.shields.io/badge/lang-zh-%23ff69b4.svg)](README_ZH.md)

[快速开始](#quick-start) · [多格式导出](#multi-format-export) · [架构](#architecture) · [English](README.md)

</div>

---

> 用**纯 TypeScript**定义实体、关系、约束和规则——无需 XML，无需 Turtle，无需学习 OWL。
> 一份定义 → **OWL 2、SHACL、Neo4j Cypher、JSON Schema、Mermaid 图表**。

灵感源自 [Palantir Ontology](https://docs.palantir.com/foundry/ontology/)，为开源世界而生。
**唯一运行时依赖：[zod](https://github.com/colinhacks/zod)**

---

## ✨ 10-Second Wow

```typescript
import { defineEntity, defineRelation, MermaidExporter, OWLExporter, JsonSchemaExporter } from "@ontograph/core";

const warehouse = defineEntity("sc:Warehouse", { label: { en: "Warehouse" }, kind: "entity" })
  .attr("sc:capacity", { required: true })
  .build();

const product = defineEntity("sc:Product", { label: { en: "Product" }, kind: "entity" })
  .attr("sc:sku", { identity: true, required: true })
  .build();

const storedIn = defineRelation("sc:storedIn", { label: { en: "stored in" } }, "sc:Product", "sc:Warehouse");
```

**一份本体，多种输出：**

| 格式 | 输出结果 |
|------|----------|
| `new MermaidExporter(ontology).export()` | 📊 Mermaid classDiagram — 可在 GitHub README 中渲染 |
| `new OWLExporter(ontology).export()` | 🦉 OWL 2 Turtle — W3C 标准 |
| `new SHACLExporter(ontology).export()` | ✅ SHACL Shapes — W3C 校验 |
| `new JsonSchemaExporter(ontology).exportString()` | 📋 JSON Schema Draft 2020-12 |
| `new DotExporter(ontology).export()` | 🔵 Graphviz DOT — 出版级图表 |
| `new Neo4jSchemaGenerator().generateConstraintCypher(...)` | 🗄️ Neo4j Cypher DDL |

## 为什么选择 @ontograph/core?

| 传统方式 | @ontograph/core |
|----------|----------------|
| OWL/RDF XML 配置，学习曲线陡峭 | TypeScript 原生，IDE 自动补全 |
| 运行时 `eval()` 求值，有注入风险 | Expr AST 安全求值，零 eval |
| 无类型约束，运行时才报错 | 端到端类型安全，编译期捕获错误 |
| 耦合特定图数据库 | 抽象查询层，可插拔引擎 |
| 自己写权限逻辑 | 内置 RBAC + 行级安全 |
| 无可视化工具 | 支持 Mermaid + DOT + ER 图导出 |

## 特性

- 🏗️ **类型安全本体建模** — Entity、Relation、Attribute、Constraint，完整的 TypeScript 推断
- 🔒 **Expr AST 安全求值** — 纯函数递归，无 `eval` / `new Function`，防止原型污染和注入
- 🔍 **抽象查询引擎** — FilterOp → ObjectSet → Neo4j Cypher 编译
- 🛡️ **RBAC 访问控制** — Deny-first 策略 + 行级安全条件
- ✅ **SHACL 校验** — W3C 标准 Shapes 生成与验证
- 🔗 **数据源映射** — 字段映射 + SyncEngine + NaN 安全转换
- 🔧 **Fluent Builder API** — `defineEntity().attr().rel().constraint().build()`
- 📦 **多格式导出** — OWL 2、SHACL、JSON Schema、Mermaid、DOT、ER 图
- 📊 **版本管理与 Diff** — 本体版本化与结构化差异比较
- 🕸️ **血缘追踪** — 从数据源到实体的完整血缘图谱
- 🏭 **供应链参考** — 350+ 预构建供应链本体（TMS/WMS/OMS/BMS）

## 安装

```bash
bun add @ontograph/core
# 或
npm install @ontograph/core
```

## 快速开始

### 定义供应链本体

```typescript
import {
  defineEntity,
  defineRelation,
  OntologyValidator,
  Neo4jSchemaGenerator,
} from "@ontograph/core";

// 1. 使用 Builder API 定义实体
const warehouse = defineEntity("sc:Warehouse", {
  label: { en: "Warehouse", zh: "仓库" },
  kind: "entity",
})
  .attr("sc:capacity", { identity: false, required: true })
  .attr("sc:location", { required: true })
  .rel("sc:stores", { min: 0, max: null })
  .constraint("sc:PositiveCapacity")
  .build();

const product = defineEntity("sc:Product", {
  label: { en: "Product", zh: "产品" },
  kind: "entity",
})
  .attr("sc:sku", { identity: true, required: true })
  .attr("sc:weight", { required: false })
  .build();

// 2. 定义关系
const storedIn = defineRelation(
  "sc:storedIn",
  { label: { en: "stored in" } },
  "sc:Product",
  "sc:Warehouse",
);

// 3. 校验本体
const validator = new OntologyValidator();
const result = validator.validate([warehouse, product], [storedIn]);
if (!result.valid) {
  console.error("Validation errors:", result.errors);
}

// 4. 生成 Neo4j 约束
const generator = new Neo4jSchemaGenerator();
const cypher = generator.generateConstraintCypher([warehouse, product]);
// → CREATE CONSTRAINT FOR (n:Warehouse) REQUIRE n['@id'] IS UNIQUE ...
```

### 安全表达式求值

```typescript
import { SafeExpressionEvaluator } from "@ontograph/core";

const evaluator = new SafeExpressionEvaluator();

const expr = {
  type: "compare",
  op: "gt",
  left: { type: "property", path: "quantity" },
  right: { type: "literal", value: 100 },
};

const result = evaluator.evaluate(expr, { quantity: 150 });
// → true  (纯函数递归，无 eval，最大深度 50)
```

### RBAC 访问控制

```typescript
import { AccessController } from "@ontograph/core";

const ac = new AccessController({ defaultPolicy: "deny" });

ac.registerRoles([
  {
    "@id": "role:warehouse-manager",
    label: { en: "Warehouse Manager" },
    rules: [
      { resource: "objectType", resourceRef: "*", permissions: ["view", "create", "edit"], effect: "allow" },
      { resource: "objectType", resourceRef: "sc:Warehouse", permissions: ["delete"], effect: "deny" },
    ],
  },
]);

const check = ac.check("user:1", ["role:warehouse-manager"], "edit", "objectType", "sc:Warehouse");
// → { allowed: true, matchedRule: "role:warehouse-manager" }

const deny = ac.check("user:1", ["role:warehouse-manager"], "delete", "objectType", "sc:Warehouse");
// → { allowed: false, reason: "Explicitly denied by rule" }
```

## 多格式导出

### Mermaid（可在 GitHub 渲染）

```typescript
import { MermaidExporter } from "@ontograph/core";

const mermaid = new MermaidExporter(ontology).export();
// 粘贴到 GitHub README → 即时可视化图表
```

### OWL 2 / SHACL

```typescript
import { OWLExporter, SHACLExporter } from "@ontograph/core";

const owl = new OWLExporter(ontology).export();     // → Turtle 格式
const shacl = new SHACLExporter(ontology).export();  // → SHACL Turtle
```

### JSON Schema

```typescript
import { JsonSchemaExporter } from "@ontograph/core";

const schema = new JsonSchemaExporter(ontology).exportString();
// → JSON Schema Draft 2020-12，所有实体类型在 $defs 中
```

### Graphviz DOT

```typescript
import { DotExporter } from "@ontograph/core";

const dot = new DotExporter(ontology, { layout: "fdp", direction: "LR" }).export();
// → 粘贴到任意 Graphviz 渲染器
```

## API 概览

| 模块 | 入口 | 说明 |
|------|------|------|
| 核心类型 | `types` | EntityType, RelationType, AttributeDefinition, Constraint |
| Builder API | `builder` | defineEntity, defineRelation, defineAttribute |
| 表达式求值 | `expression` | SafeExpressionEvaluator, DerivedAttributeEvaluator |
| 查询引擎 | `query` | FilterOp, ObjectSet, Neo4jQueryEngine |
| RBAC 安全 | `security` | AccessController, RoleDefinition |
| SHACL 校验 | `validation` | SHACLShapeGenerator, SHACLValidator |
| 数据源映射 | `datasource` | SyncEngine, DatasourceDefinition |
| OWL 导出 | `exporters/owl-exporter` | OWL 2 / JSON-LD 输出 |
| SHACL 导出 | `exporters/shacl-exporter` | SHACL Shapes JSON-LD |
| Mermaid 导出 | `exporters/mermaid-exporter` | Mermaid classDiagram / graph / flowchart |
| DOT 导出 | `exporters/dot-exporter` | Graphviz DOT 格式 |
| ER 图 | `exporters/er-exporter` | Mermaid erDiagram |
| JSON Schema | `exporters/json-schema-exporter` | JSON Schema Draft 2020-12 |
| 代码生成 | `codegen` | TypeGenerator |
| 规则引擎 | `rule-engine` | RuleEngine（Expr 优先求值） |
| 版本管理 | `versioning` | VersionManager |
| 结构 Diff | `diff` | DiffEngine |
| 血缘追踪 | `lineage` | LineageTracker |

## 架构

```
@ontograph/core
│
├── 📐 Modeling Layer
│   ├── types.ts              ── 核心类型定义
│   ├── builder/              ── Fluent Builder API
│   └── validator.ts          ── 本体校验
│
├── ⚡ Execution Layer
│   ├── expression/           ── Expr AST + 安全求值器 (LRU 缓存)
│   ├── rule-engine.ts        ── 规则引擎 (Expr 优先)
│   └── action-engine.ts      ── 动作引擎
│
├── 🔍 Query Layer
│   ├── query/                ── FilterOp → ObjectSet → Cypher
│   └── datasource/           ── 数据源映射 + SyncEngine
│
├── 🛡️ Security Layer
│   └── security/             ── RBAC AccessController (deny-first)
│
├── ✅ Standards Layer
│   ├── validation/           ── W3C SHACL 生成 + 校验
│   └── exporters/            ── OWL 2 · SHACL · Mermaid · DOT · ER · JSON Schema
│
├── 🔧 Tooling
│   ├── codegen/              ── TypeScript 类型生成
│   ├── versioning.ts         ── 版本管理
│   ├── diff.ts               ── 结构化 Diff
│   └── lineage.ts            ── 血缘追踪
│
└── 📦 Examples
    └── examples/supply-chain/ ── 350+ 供应链本体定义
```

## 对比

| 特性 | @ontograph/core | Palantir Ontology | OWL API (Java) |
|------|:-:|:-:|:-:|
| 语言 | TypeScript | TypeScript (闭源) | Java |
| 开源 | ✅ MIT | ❌ | ✅ |
| 类型安全 | ✅ 编译期 | ✅ | ❌ 运行时 |
| 安全求值 | ✅ Expr AST | ✅ | N/A |
| SHACL | ✅ | ❌ | ✅ |
| OWL 导出 | ✅ | ❌ | ✅ |
| JSON Schema 导出 | ✅ | ❌ | ❌ |
| Mermaid 可视化 | ✅ | ❌ | ❌ |
| Builder API | ✅ | ✅ | ❌ |
| RBAC | ✅ | ✅ | ❌ |
| Neo4j 集成 | ✅ | ❌ | ❌ |
| 运行时依赖 | zod | 数十个 | 重量级 |

## 开发

```bash
bun install           # 安装依赖
bun run typecheck     # 类型检查 (tsc --noEmit)
bun run build         # 构建到 dist/
bun run test          # 运行测试
bun run lint          # 使用 Biome 检查代码
bun run lint:fix      # 自动修复代码问题
bun run format        # 格式化代码
```

## 贡献

我们欢迎贡献！请查看 [CONTRIBUTING.md](CONTRIBUTING.md) 了解指南。

## 许可证

MIT © [OntoGraph 贡献者](https://github.com/openshuyi/ontograph-core)