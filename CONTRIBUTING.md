# Contributing to @ontograph/core

Thank you for your interest in contributing! We welcome all forms of contribution — from bug reports and documentation improvements to new features.

## Code of Conduct

Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you agree to uphold this code.

## How to Contribute

### Reporting Issues

- Search [existing issues](https://github.com/openshuyi/ontograph-core/issues) to avoid duplicates
- Include reproduction steps, expected behavior, and actual behavior
- Mention your TypeScript/Node.js version if relevant

### Pull Requests

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes following our code style
4. Write tests for new functionality
5. Run `bun run typecheck` and `bun run test` — both must pass
6. Run `bun run lint:fix` before committing
7. Commit using Conventional Commits format (e.g., `feat: add new validator`)
8. Push and open a Pull Request

### Commit Conventions

We follow [Conventional Commits](https://www.conventionalcommits.org/):

| Type | Description |
|---|---|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation changes |
| `test` | Adding or updating tests |
| `refactor` | Code refactoring (no behavior change) |
| `chore` | Maintenance tasks |
| `ci` | CI/CD changes |

### Branch Naming

- `feature/*` — New features
- `bugfix/*` — Bug fixes
- `chore/*` — Maintenance tasks
- `docs/*` — Documentation changes

## Development Setup

```bash
# Clone your fork
git clone https://github.com/your-username/ontograph-core.git
cd ontograph-core

# Install dependencies
bun install

# Run type check
bun run typecheck

# Run tests
bun run test

# Lint and fix
bun run lint:fix
```

## Code Style

- We use [Biome](https://biomejs.dev/) for linting and formatting
- Run `bun run lint:fix` before every commit
- No `as any`, `@ts-ignore`, or `@ts-expect-error` suppressions
- Follow existing patterns — check `src/` for reference
- No unnecessary comments/docstrings; code should be self-explanatory

## Testing Requirements

- Every new feature must have tests
- Use [Vitest](https://vitest.dev/) for unit tests
- Place tests alongside source files as `*.test.ts`
- Run `bun run test` before submitting a PR

## Project Structure

```
src/
├── types.ts          # Core type definitions
├── builder/          # Fluent Builder API
├── expression/       # Expr AST + safe evaluator
├── query/            # Query engine (FilterOp, ObjectSet, Neo4j)
├── security/         # RBAC access control
├── validation/       # SHACL generation and validation
├── datasource/       # Datasource mapping
├── exporters/        # OWL 2 / JSON-LD exporters
├── codegen/          # TypeScript type generation
├── index.ts          # Public API barrel export
└── examples/         # Supply chain ontology example
```

## Getting Help

- Open a [Discussion](https://github.com/openshuyi/ontograph-core/discussions) for questions
- Open an [Issue](https://github.com/openshuyi/ontograph-core/issues) for bugs
