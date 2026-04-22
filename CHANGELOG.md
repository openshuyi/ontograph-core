# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.0.1] - 2026-04-17

### Added
- Core ontology modeling: Entity, Relation, Attribute, Constraint with full TypeScript type safety
- Safe expression evaluation: Expr AST-based evaluator with zero eval/injection risk
- Abstract query engine: FilterOp → ObjectSet → Neo4j Cypher compilation
- RBAC access control: deny-first policy with row-level security conditions
- SHACL validation: W3C standard Shapes generation and validation
- Datasource mapping: field mapping, SyncEngine, NaN-safe conversion
- Fluent Builder API: defineEntity().attr().rel().constraint().build()
- TypeScript code generation from ontology definitions
- OWL 2 / JSON-LD standard format export
- Version management and structural diff
- Data lineage tracking from datasources to entities
- Action engine with approval policies, audit trails, and side effects
- Logic rules with trigger-based automated reasoning
- Complete supply chain ontology example (TMS, WMS, OMS, BMS modules)
