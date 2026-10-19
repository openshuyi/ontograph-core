# src/validation -- SHACL 标准兼容

## OVERVIEW

W3C SHACL 标准兼容层（内存对象模型的务实子集）。从本体定义生成 SHACL Shape，并对实例数据执行 SHACL 验证，**每个属性收集全部失败约束**（非首个失败即返回）。

## STRUCTURE

```
validation/
├── shacl-shapes.ts      # SHACLShapeGenerator + exprToPropertyShape
├── shacl-validator.ts   # SHACLValidator
├── index.ts             # barrel 导出
├── shacl.test.ts        # 单元测试
└── AGENTS.md            # 本文件
```

## WHERE TO LOOK

| 任务 | 文件 | 行数 | 说明 |
|------|------|------|------|
| 修改 Shape 生成 | `shacl-shapes.ts` | 180 | `SHACLShapeGenerator`、`exprToPropertyShape`、`dataTypeToXSD` |
| 修改 SHACL 验证 | `shacl-validator.ts` | 258 | `SHACLValidator` |
| 修改测试 | `shacl.test.ts` | 1566 | Shape 生成 / 约束 / 端到端验证 |

## SHACL SHAPE (shacl-shapes.ts)

- `SHACLShapeGenerator.generate(ontology)` -- 遍历所有实体类型（`entityTypes` + `eventTypes` + `roleTypes`）与 `interfaces`，返回 `SHACLShapes`
- Shape 标识：`@id = `${entityType["@id"]}Shape``，`targetClass = entityType["@id"]`（属性路径 `path = attrRef.ref`）
- 映射规则：

| 本体字段 → SHACL | 映射 |
|------------------|------|
| `AttributeDefinition.datatype` → `datatype` | `dataTypeToXSD`（string/integer/float/decimal/boolean/datetime/date/duration → xsd:*) |
| `AttributeRef.required` / `AttributeDefinition.required` / `identity` → `minCount` | 1 |
| `AttributeDefinition.validation[type=pattern]` → `pattern` | 字符串 |
| `AttributeDefinition.enum` → `in` | 字符串数组 |
| `Constraint`（含 `expr`）→ 结构化约束 | `exprToPropertyShape` 派生 `minInclusive`/`maxInclusive`，并写入 `severity`/`message` |
| `InterfaceDefinition.requiredAttributes` → propertyShapes | `minCount` + `severity: "warning"` |

- `exprToPropertyShape(expr)` -- 将 `compare` 表达式转为属性约束：`gte`→`minInclusive`、`lte`→`maxInclusive`、`gt`→`minInclusive+1`、`lt`→`maxInclusive-1`；其余返回 `null`
- `SHACLPropertyShape` 支持：`datatype`, `minCount`, `maxCount`, `minInclusive`, `maxInclusive`, `pattern`, `in`, `class_`, `nodeKind`, `hasValue`, `minLength`, `maxLength`, `or`, `and`, `xone`, `severity`, `message`
- `SHACLNodeShape` 支持 `closed` + `ignoredProperties`（`@id`/`@type` 始终豁免）

## SHACL 验证 (shacl-validator.ts)

- `new SHACLValidator().validate(shapes, data)` -- 按 `@type` 查找 shape，返回 `SHACLValidationReport { conforms, results, timestamp }`
- 语义：属性值按单值处理（数组按 BlankNode 分类）；IRI 判定为 `scheme:rest` 形式字符串；`class` 约束要求内嵌对象的 `@type`/`type` 匹配
- 支持的约束（每个属性收集**全部**失败项）：`minCount`, `datatype`, `minInclusive`, `maxInclusive`, `pattern`, `in`, `class`, `nodeKind`, `hasValue`, `minLength`, `maxLength`, `or`, `and`, `xone`，以及节点级 `closed`
- `nodeKind` 允许集合：IRI / Literal / BlankNode 及其组合

## CONVENTIONS

- **Validate API:** `validate(shapes, data)` 接收**已生成的 shapes**（非 ontology），返回报告
- **violation 结构:** `{ focusNode, path, constraint, severity, message, value? }`
- **全量收集:** 单属性失败时收集所有违规，不短路
- **severity 透传:** `constraint.severity` → SHACL violation severity（warning/info/violation）

## ANTI-PATTERNS

- **禁止手动创建 SHACL Shape** -- 必须通过 `SHACLShapeGenerator` 从本体自动生成
- **禁止忽略 severity** -- constraint severity 必须映射到 violation severity

## NOTES

- 与 `exporters/shacl-exporter.ts` 的关系：exporter 负责导出 TTL/RDF，本目录负责生成结构化 SHACL 并验证
- 约束内联：本体 `Constraint.expr`（结构化 Expr）经 `exprToPropertyShape` 合并进被引用属性形状
- 单元测试覆盖：Shape 生成（minCount/datatype/enum/pattern/identity/interface）、`exprToPropertyShape`（gte/lte/gt/lt/非 compare/非数值）、各约束验证、多违规收集、`closed`、端到端约束校验

## 变更记录 (Changelog)

| 日期 | 操作 | 说明 |
|------|------|------|
| 2026-10-16 | 更新 | 依据当前源码重新生成 |
