# @ontograph/core

Enterprise-grade ontology framework for TypeScript — type-safe semantic modeling with Expr AST evaluation, query abstraction, RBAC security, SHACL validation, datasource mapping, and fluent Builder API.

## Features

- **Type-safe Ontology Modeling** — Define entity types, relation types, attributes, and constraints with full TypeScript inference
- **Expr AST Evaluator** — Safe expression evaluation with LRU caching (no `eval`, no `new Function`)
- **Query Engine** — Filter operations, ObjectSet pattern, Neo4j Cypher compilation
- **RBAC Access Control** — Role-based permissions with deny-first policy
- **SHACL Validation** — W3C SHACL Shapes generation and validation
- **Datasource Mapping** — Field mapping with sync engine, strict mode, and NaN-safe transforms
- **Fluent Builder API** — `defineEntity()`, `defineRelation()`, `defineAttribute()` chainable builders
- **TypeScript Codegen** — Generate type definitions from ontology schemas
- **OWL Export** — Export ontology as OWL 2 / JSON-LD
- **Versioning & Diff** — Ontology version management with structural diff

## Installation

```bash
bun add @ontograph/core
# or
npm install @ontograph/core
```

## Quick Start

```typescript
import {
  OntologyValidator,
  Neo4jSchemaGenerator,
  defineEntity,
  defineRelation,
  defineAttribute,
} from "@ontograph/core";

// Define an entity using the Builder API
const warehouse = defineEntity("sc:Warehouse", {
  label: { zh: "仓库", en: "Warehouse" },
  kind: "entity",
})
  .addAttribute(defineAttribute("sc:capacity", {
    dataType: "number",
    required: true,
    constraints: [{ type: "min", value: 0 }],
  }))
  .build();

// Validate the ontology
const validator = new OntologyValidator();
const result = validator.validate([warehouse]);

// Generate Neo4j schema
const generator = new Neo4jSchemaGenerator();
const cypher = generator.generateConstraintCypher([warehouse]);
```

## Architecture

```
src/
├── types.ts              # Core types (EntityType, RelationType, Attribute, Constraint)
├── validator.ts          # OntologyValidator
├── rule-engine.ts        # RuleEngine (Expr-first evaluation)
├── expression/           # Expr AST + SafeExpressionEvaluator + LRU cache
├── query/                # FilterOp, ObjectSet, Neo4j query compilation
├── datasource/           # Field mapping, SyncEngine, DataTransformError
├── security/             # RBAC AccessController (deny-first)
├── validation/           # SHACL Shape generation + validation
├── builder/              # Fluent Builder API (defineEntity, defineRelation)
├── codegen/              # TypeScript type generation
├── exporters/            # OWL/JSON-LD export
├── examples/             # Supply chain ontology examples
├── versioning.ts         # Version management
├── diff.ts               # Structural diff
└── lineage.ts            # Lineage tracking
```

## Dependencies

- **zod** — Schema validation (the only runtime dependency)

## Development

```bash
bun install
bun run check          # Biome lint + format
bun run check-types    # TypeScript type check
```

## License

MIT
