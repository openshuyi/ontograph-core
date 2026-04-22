<div align="center">

<img src="docs/logo.svg" width="120" height="120" alt="@ontograph/core logo" />

# @ontograph/core

**TypeScript Ontology Framework — Define your world in code**

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![npm](https://img.shields.io/npm/v/@ontograph/core.svg)](https://www.npmjs.com/package/@ontograph/core)
[![CI](https://github.com/openshuyi/ontograph-core/actions/workflows/ci.yml/badge.svg)](https://github.com/openshuyi/ontograph-core/actions/workflows/ci.yml)
[![en](https://img.shields.io/badge/lang-en-blue.svg)](README.md)
[![zh](https://img.shields.io/badge/lang-zh-%23ff69b4.svg)](README_ZH.md)

[Quick Start](#quick-start) · [Multi-Format Export](#multi-format-export) · [Architecture](#architecture) · [中文文档](README_ZH.md)

</div>

---

> Define entities, relations, constraints and rules in **pure TypeScript** — no XML, no Turtle, no OWL.
> One definition → **OWL 2, SHACL, Neo4j Cypher, JSON Schema, Mermaid diagrams**.

Inspired by [Palantir Ontology](https://docs.palantir.com/foundry/ontology/), built for the open-source world.
**Single runtime dependency: [`zod`](https://github.com/colinhacks/zod)**

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

**One ontology, multiple outputs:**

| Format | What you get |
|--------|-------------|
| `new MermaidExporter(ontology).export()` | 📊 Mermaid classDiagram — renders in GitHub README |
| `new OWLExporter(ontology).export()` | 🦉 OWL 2 Turtle — W3C standard |
| `new SHACLExporter(ontology).export()` | ✅ SHACL Shapes — W3C validation |
| `new JsonSchemaExporter(ontology).exportString()` | 📋 JSON Schema Draft 2020-12 |
| `new DotExporter(ontology).export()` | 🔵 Graphviz DOT — publication-quality diagrams |
| `new Neo4jSchemaGenerator().generateConstraintCypher(...)` | 🗄️ Neo4j Cypher DDL |

## Why @ontograph/core?

| Traditional approach | @ontograph/core |
|---|---|
| OWL/RDF XML configuration, steep learning curve | TypeScript native, IDE autocompletion |
| Runtime `eval()` evaluation, injection risk | Expr AST safe evaluation, zero eval |
| No type constraints, errors only at runtime | End-to-end type safety, compile-time caught |
| Coupled to specific graph databases | Abstract query layer, pluggable engines |
| Write your own permission logic | Built-in RBAC + row-level security |
| No visualization tooling | Mermaid + DOT + ER diagram export |

## Features

- 🏗️ **Type-safe ontology modeling** — Entity, Relation, Attribute, Constraint with full TypeScript inference
- 🔒 **Expr AST safe evaluation** — Pure function recursion, no `eval` / `new Function`, prototype pollution and injection prevention
- 🔍 **Abstract query engine** — FilterOp → ObjectSet → Neo4j Cypher compilation
- 🛡️ **RBAC access control** — Deny-first policy with row-level security conditions
- ✅ **SHACL validation** — W3C standard Shapes generation and validation
- 🔗 **Datasource mapping** — Field mapping + SyncEngine + NaN-safe conversion
- 🔧 **Fluent Builder API** — `defineEntity().attr().rel().constraint().build()`
- 📦 **Multi-format export** — OWL 2, SHACL, JSON Schema, Mermaid, DOT, ER diagram
- 📊 **Version management & Diff** — Ontology versioning and structural diff
- 🕸️ **Lineage tracking** — Full lineage from datasources to entities
- 🏭 **Supply chain reference** — 350+ pre-built supply chain ontology (TMS/WMS/OMS/BMS)

## Installation

```bash
bun add @ontograph/core
# or
npm install @ontograph/core
```

## Quick Start

### Define a supply chain ontology

```typescript
import {
  defineEntity,
  defineRelation,
  OntologyValidator,
  Neo4jSchemaGenerator,
} from "@ontograph/core";

// 1. Define entities with the Builder API
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

// 2. Define relations
const storedIn = defineRelation(
  "sc:storedIn",
  { label: { en: "stored in" } },
  "sc:Product",
  "sc:Warehouse",
);

// 3. Validate the ontology
const validator = new OntologyValidator();
const result = validator.validate([warehouse, product], [storedIn]);
if (!result.valid) {
  console.error("Validation errors:", result.errors);
}

// 4. Generate Neo4j constraints
const generator = new Neo4jSchemaGenerator();
const cypher = generator.generateConstraintCypher([warehouse, product]);
// → CREATE CONSTRAINT FOR (n:Warehouse) REQUIRE n['@id'] IS UNIQUE ...
```

### Safe expression evaluation

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
// → true  (pure function recursion, no eval, max depth 50)
```

### RBAC access control

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

## Multi-Format Export

### Mermaid (renders in GitHub)

```typescript
import { MermaidExporter } from "@ontograph/core";

const mermaid = new MermaidExporter(ontology).export();
// Paste into GitHub README → instant visual diagram
```

### OWL 2 / SHACL

```typescript
import { OWLExporter, SHACLExporter } from "@ontograph/core";

const owl = new OWLExporter(ontology).export();     // → Turtle format
const shacl = new SHACLExporter(ontology).export();  // → SHACL Turtle
```

### JSON Schema

```typescript
import { JsonSchemaExporter } from "@ontograph/core";

const schema = new JsonSchemaExporter(ontology).exportString();
// → JSON Schema Draft 2020-12 with all entity types in $defs
```

### Graphviz DOT

```typescript
import { DotExporter } from "@ontograph/core";

const dot = new DotExporter(ontology, { layout: "fdp", direction: "LR" }).export();
// → Paste into any Graphviz renderer
```

## API Overview

| Module | Entry | Description |
|---|---|---|
| Core types | `types` | EntityType, RelationType, AttributeDefinition, Constraint |
| Builder API | `builder` | defineEntity, defineRelation, defineAttribute |
| Expression evaluation | `expression` | SafeExpressionEvaluator, DerivedAttributeEvaluator |
| Query engine | `query` | FilterOp, ObjectSet, Neo4jQueryEngine |
| RBAC security | `security` | AccessController, RoleDefinition |
| SHACL validation | `validation` | SHACLShapeGenerator, SHACLValidator |
| Datasource mapping | `datasource` | SyncEngine, DatasourceDefinition |
| OWL export | `exporters/owl-exporter` | OWL 2 / JSON-LD output |
| SHACL export | `exporters/shacl-exporter` | SHACL Shapes JSON-LD |
| Mermaid export | `exporters/mermaid-exporter` | Mermaid classDiagram / graph / flowchart |
| DOT export | `exporters/dot-exporter` | Graphviz DOT format |
| ER diagram | `exporters/er-exporter` | Mermaid erDiagram |
| JSON Schema | `exporters/json-schema-exporter` | JSON Schema Draft 2020-12 |
| Code generation | `codegen` | TypeGenerator |
| Rule engine | `rule-engine` | RuleEngine (Expr-first evaluation) |
| Version management | `versioning` | VersionManager |
| Structural Diff | `diff` | DiffEngine |
| Lineage tracking | `lineage` | LineageTracker |

## Architecture

```
@ontograph/core
│
├── 📐 Modeling Layer
│   ├── types.ts              ── Core type definitions
│   ├── builder/              ── Fluent Builder API
│   └── validator.ts          ── Ontology validation
│
├── ⚡ Execution Layer
│   ├── expression/           ── Expr AST + safe evaluator (LRU cache)
│   ├── rule-engine.ts        ── Rule engine (Expr-first)
│   └── action-engine.ts      ── Action engine
│
├── 🔍 Query Layer
│   ├── query/                ── FilterOp → ObjectSet → Cypher
│   └── datasource/           ── Datasource mapping + SyncEngine
│
├── 🛡️ Security Layer
│   └── security/             ── RBAC AccessController (deny-first)
│
├── ✅ Standards Layer
│   ├── validation/           ── W3C SHACL generation + validation
│   └── exporters/            ── OWL 2 · SHACL · Mermaid · DOT · ER · JSON Schema
│
├── 🔧 Tooling
│   ├── codegen/              ── TypeScript type generation
│   ├── versioning.ts         ── Version management
│   ├── diff.ts               ── Structural diff
│   └── lineage.ts            ── Lineage tracking
│
└── 📦 Examples
    └── examples/supply-chain/ ── 350+ supply chain ontology definitions
```

## Comparison

| Feature | @ontograph/core | Palantir Ontology | OWL API (Java) |
|---|:-:|:-:|:-:|
| Language | TypeScript | TypeScript (closed source) | Java |
| Open source | ✅ MIT | ❌ | ✅ |
| Type safety | ✅ Compile-time | ✅ | ❌ Runtime |
| Safe evaluation | ✅ Expr AST | ✅ | N/A |
| SHACL | ✅ | ❌ | ✅ |
| OWL export | ✅ | ❌ | ✅ |
| JSON Schema export | ✅ | ❌ | ❌ |
| Mermaid visualization | ✅ | ❌ | ❌ |
| Builder API | ✅ | ✅ | ❌ |
| RBAC | ✅ | ✅ | ❌ |
| Neo4j integration | ✅ | ❌ | ❌ |
| Runtime dependencies | zod | Dozens | Heavyweight |

## Development

```bash
bun install           # Install dependencies
bun run typecheck     # Type check (tsc --noEmit)
bun run build         # Build to dist/
bun run test          # Run tests
bun run lint          # Lint with Biome
bun run lint:fix      # Lint and auto-fix
bun run format        # Format code
```

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT © [OntoGraph Contributors](https://github.com/openshuyi/ontograph-core)
