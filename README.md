<div align="center">

# @ontograph/core

**TypeScript 本体论框架 — 用代码定义你的世界**

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![npm](https://img.shields.io/npm/v/@ontograph/core.svg)](https://www.npmjs.com/package/@ontograph/core)

[English](#features) · [快速开始](#quick-start) · [API 文档](#api-overview) · [架构](#architecture)

</div>

---

本体（Ontology）是知识图谱的灵魂。**@ontograph/core** 让你用纯 TypeScript 定义实体、关系、约束和规则——不用 XML，不用 Turtle，不用学 OWL。

Inspired by [Palantir Ontology](https://docs.palantir.com/foundry/ontology/)，为开源世界而生。

## Why @ontograph/core?

| 传统方式 | @ontograph/core |
|---------|----------------|
| OWL/RDF XML 配置，学习曲线陡峭 | TypeScript 原生，IDE 自动补全 |
| 运行时 `eval()` 求值，有注入风险 | Expr AST 安全求值，零 eval |
| 无类型约束，运行时才报错 | 端到端类型安全，编译期捕获错误 |
| 耦合特定图数据库 | 抽象查询层，支持 Neo4j / 自定义引擎 |
| 自己写权限逻辑 | 内置 RBAC + 行级安全 |

## Features

- 🏗️ **类型安全本体建模** — Entity、Relation、Attribute、Constraint，完整 TypeScript 推断
- 🔒 **Expr AST 安全求值** — 纯函数递归，无 `eval` / `new Function`，防原型污染和注入
- 🔍 **抽象查询引擎** — FilterOp → ObjectSet → Neo4j Cypher 编译
- 🛡️ **RBAC 访问控制** — Deny-first 策略 + 行级安全条件
- ✅ **SHACL 校验** — W3C 标准 Shapes 生成与验证
- 🔗 **数据源映射** — 字段映射 + SyncEngine + NaN 安全转换
- 🔧 **Fluent Builder API** — `defineEntity().attr().rel().constraint().build()`
- 📦 **TypeScript Codegen** — 从本体定义生成类型文件
- 🦉 **OWL 导出** — OWL 2 / JSON-LD 标准格式输出
- 📊 **版本管理 & Diff** — 本体版本化与结构化差异比较
- 🕸️ **血缘追踪** — 数据源到实体的完整血缘图谱

**唯一运行时依赖：`zod`**

## Installation

```bash
bun add @ontograph/core
# or
npm install @ontograph/core
```

## Quick Start

### 定义一个供应链本体

```typescript
import {
  defineEntity,
  defineRelation,
  defineAttribute,
  OntologyValidator,
  Neo4jSchemaGenerator,
} from "@ontograph/core";

// 1. 用 Builder API 定义实体
const warehouse = defineEntity("sc:Warehouse", {
  label: { zh: "仓库", en: "Warehouse" },
  kind: "entity",
})
  .attr("sc:capacity", { identity: false, required: true })
  .attr("sc:location", { required: true })
  .rel("sc:stores", { min: 0, max: null })
  .constraint("sc:PositiveCapacity")
  .build();

const product = defineEntity("sc:Product", {
  label: { zh: "产品", en: "Product" },
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

// 构造 AST（或从 JSON 加载）
const expr = {
  kind: "binary",
  op: ">",
  left: { kind: "attribute", path: "quantity" },
  right: { kind: "literal", value: 100 },
};

const result = evaluator.evaluate(expr, { quantity: 150 });
// → true  (纯函数递归，无 eval，最大深度 50 层)
```

### RBAC 权限控制

```typescript
import { AccessController } from "@ontograph/core";

const ac = new AccessController({ defaultPolicy: "deny" });

ac.registerRoles([
  {
    "@id": "role:warehouse-manager",
    label: { en: "Warehouse Manager" },
    rules: [
      { action: "read", resource: "entity", resourceRef: "*", effect: "allow" },
      { action: "write", resource: "entity", resourceRef: "sc:Warehouse", effect: "allow" },
      { action: "delete", resource: "entity", resourceRef: "*", effect: "deny" },
    ],
  },
]);

const check = ac.check("user:1", ["role:warehouse-manager"], "write", "entity", "sc:Warehouse");
// → { allowed: true, reason: "..." }

const deny = ac.check("user:1", ["role:warehouse-manager"], "delete", "entity", "sc:Product");
// → { allowed: false, reason: "deny rule matched" }
```

## API Overview

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
| 代码生成 | `codegen` | TypeGenerator |
| 规则引擎 | `rule-engine` | RuleEngine (Expr 优先求值) |
| 版本管理 | `versioning` | VersionManager |
| 结构 Diff | `diff` | OntologyDiffer |
| 血缘追踪 | `lineage` | LineageTracker |

## Architecture

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
│   └── exporters/            ── OWL 2 / JSON-LD 导出
│
├── 🔧 Tooling
│   ├── codegen/              ── TypeScript 类型生成
│   ├── versioning.ts         ── 版本管理
│   ├── diff.ts               ── 结构化 Diff
│   └── lineage.ts            ── 血缘追踪
│
└── 📦 Examples
    └── examples/supply-chain/ ── 供应链本体示例
```

## Comparison

| 特性 | @ontograph/core | Palantir Ontology | OWL API (Java) |
|------|:-:|:-:|:-:|
| 语言 | TypeScript | TypeScript (闭源) | Java |
| 开源 | ✅ MIT | ❌ | ✅ |
| 类型安全 | ✅ 编译期 | ✅ | ❌ 运行时 |
| 安全求值 | ✅ Expr AST | ✅ | N/A |
| SHACL | ✅ | ❌ | ✅ |
| OWL 导出 | ✅ | ❌ | ✅ |
| Builder API | ✅ | ✅ | ❌ |
| RBAC | ✅ | ✅ | ❌ |
| Neo4j 集成 | ✅ | ❌ | ❌ |
| 运行时依赖 | zod | 数十个 | 重量级 |

## Development

```bash
bun install
npx tsc --noEmit     # 类型检查
```

## License

MIT © [OntoGraph Contributors](https://github.com/openshuyi/ontograph-core)
