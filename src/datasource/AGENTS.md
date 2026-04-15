# packages/ontology/src/datasource -- 数据源映射层

## OVERVIEW

外部数据源到本体的字段映射与同步引擎。支持 PostgreSQL/REST/CSV/Neo4j 数据源。

## STRUCTURE

```
datasource/
├── types.ts           # DatasourceDefinition, DatasourceFieldMapping
├── sync-engine.ts     # SyncEngine
├── index.ts           # barrel 导出
└── AGENTS.md          # 本文件
```

## WHERE TO LOOK

| 任务 | 文件 | 说明 |
|------|------|------|
| 修改数据源类型 | `types.ts` (88行) | DatasourceDefinition, DatasourceFieldMapping |
| 修改同步引擎 | `sync-engine.ts` (123行) | SyncEngine, strictMode, transform |

## DATASOURCE 类型 (types.ts)

```typescript
type DatasourceType = 'postgresql' | 'mysql' | 'rest' | 'csv' | 'neo4j';

interface DatasourceFieldMapping {
  datasourceField: string;
  ontologyAttribute: string;
  transform?: 'string' | 'number' | 'boolean' | 'date' | 'json' | 'uppercase' | 'lowercase' | 'trim';
  defaultValue?: unknown;
  required?: boolean;
}
```

## CONVENTIONS

- **strictMode:** transform 失败时抛 DataTransformError，非静默跳过 (默认 true)
- **transform 字符串:** 先用 `String(value)` 统一为字符串，再 `parseInt/parseFloat`
- **parseBoolean:** 支持 `'1'/'0'/'yes'/'no'/'true'/'false'`，非仅 `Boolean()`
- **sync 方法:** 返回 `{ processed: number, errors: SyncError[], duration: number }` 用于审计

## ANTI-PATTERNS

- **禁止 `transform(value)` 直接传入非字符串** -- 需先 `String(value)` 再处理
- **禁止 `parseInt/parseFloat` 不处理 NaN** -- 结果 NaN 时抛 DataTransformError
- **禁止静默跳过严格模式失败** -- strictMode=true 时必须抛错
- **字段名冲突:** 不与 `types.ts` 中已存在的 `FieldMapping` 接口冲突，使用 `DatasourceFieldMapping`

## NOTES

- SyncEngine 构造函数接收 DatasourceDefinition[]，`sync(datasourceId, objects)` 执行单个数据源同步
- `transformField` 是私有方法，处理 7 种转换类型 + NaN validation
- 集成: `OntologyDefinition.datasources` 数组存储数据源定义，`OntologyDefinition.objectMappings` 定义映射规则
- 单元测试重点: transform 边界值 (NaN、空字符串、null)、strictMode 失败处理 (当前无测试)
