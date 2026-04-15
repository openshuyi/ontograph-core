# packages/ontology/src/validation -- SHACL 标准兼容

## OVERVIEW

W3C SHACL 标准兼容层。从本体定义生成 SHACL Shape + SHACL 验证 + SHACL 导出。

## STRUCTURE

```
validation/
├── shacl-shapes.ts      # SHACLShapeGenerator
├── shacl-validator.ts   # SHACLValidator
├── index.ts             # barrel 导出
└── AGENTS.md            # 本文件
```

## WHERE TO LOOK

| 任务 | 文件 | 说明 |
|------|------|------|
| 修改 Shape 生成 | `shacl-shapes.ts` (139行) | SHACLShapeGenerator |
| 修改 SHACL 验证 | `shacl-validator.ts` (159行) | SHACLValidator |

## SHACL SHAPE (shacl-shapes.ts)

SHACLShapeGenerator 从 OntologyDefinition 提取 SHACL 三元组：

| 本体字段 → SHACL | 映射 |
|------------------|------|
| `EntityType.attributes` → shacl:property | 每属性一个 PropertyShape |
| `AttributeDefinition.required` → shacl:minCount | 1 (required) / 0 (optional) |
| `AttributeDefinition.dataType` → sh:datatype | string/number/boolean/date 映射 |
| `AttributeDefinition.unique` → sh:uniqueLang | true |
| `RelationType` → sh:nodeKind/sh:class | 目标实体类型 |
| `Constraint` → sh:pattern/sh:minInclusive 等 | 根据 constraintType 映射 |

## CONVENTIONS

- **Shape URI:** `{ontologyId}Shape-{entityTypeId}` 稳定格式
- **Property URI:** `{ontologyId}Shape-{entityTypeId}-{attributeName}`
- **Validate API:** `SHACLValidator.validate(ontology, objects)` 返回 `{ valid, violations, duration }`
- **violation:** `{ subject, propertyPath, message, severity, constraintId }`

## ANTI-PATTERNS

- **禁止 SHACL Shape 手动创建** -- 必须通过 SHACLShapeGenerator 从本体自动生成
- **禁止忽略 severity** -- constraint.severity 映射到 SHACL violation severity

## NOTES

- 与 `exporters/shacl-exporter.ts` 的关系: exporter 负责导出 TTL/RDF 格式，shapes.ts 负责生成结构化 SHACL
- SHACL 约束可内联到本体 Constraint 定义 (待优化 W9)
- SHACLValidator 用 Map 查找 shape (O(1))，非数组遍历 (O(n))
- 集成: `OntologyDefinition.constraints` 转换为 SHACL 约束形状
- 单元测试重点: shape 生成完整性/violation 准确度 (当前无测试)
