# src/datasource -- 数据源映射层

## OVERVIEW

外部数据源到本体的字段映射、同步引擎与连接器。同步引擎为纯逻辑层（不直连数据库），支持 delta 计算与通过可注入目标执行的 apply 阶段；连接器从 CSV / REST API 拉取原始记录。

## STRUCTURE

```
datasource/
├── types.ts                     # DatasourceDefinition, DatasourceFieldMapping, ObjectMapping, ...
├── sync-engine.ts               # SyncEngine, ISyncTarget, SyncResult/SyncError
├── connectors/
│   ├── types.ts                 # IDataSourceConnector
│   ├── csv-connector.ts         # CsvConnector, parseCsv, csvToRecords
│   ├── rest-api-connector.ts    # RestApiConnector, extractRecords
│   └── index.ts                 # barrel
├── index.ts                     # barrel（connectors + sync-engine + types）
├── datasource.test.ts           # 单元测试
└── AGENTS.md                    # 本文件
```

## WHERE TO LOOK

| 任务 | 文件 | 行数 | 说明 |
|------|------|------|------|
| 修改数据源类型 | `types.ts` | 88 | `DatasourceDefinition` / `DatasourceFieldMapping` / `ObjectMapping` 等 |
| 修改同步引擎 | `sync-engine.ts` | 217 | `SyncEngine`（`sync` / `apply` / `transformRecord` / `computeDelta`） |
| 修改 CSV 连接器 | `connectors/csv-connector.ts` | 121 | `CsvConnector` / `parseCsv` / `csvToRecords` |
| 修改 REST 连接器 | `connectors/rest-api-connector.ts` | 70 | `RestApiConnector` / `extractRecords` |
| 修改连接器抽象 | `connectors/types.ts` | 14 | `IDataSourceConnector` |

## DATASOURCE 类型 (types.ts)

```typescript
type DatasourceType = "postgresql" | "mysql" | "neo4j" | "rest-api" | "csv" | "stream";
type SyncMode = "batch" | "streaming" | "manual";
type ConflictStrategy = "datasource_wins" | "user_edit_wins" | "manual";
type FieldTransform =
  | "identity" | "lowercase" | "uppercase" | "trim"
  | "parseInt" | "parseFloat" | "parseDate" | "parseBoolean"
  | "split" | "jsonParse" | "custom";

interface DatasourceFieldMapping {
  sourceField: string;
  targetAttribute: string;
  transform?: FieldTransform;
  transformParams?: Record<string, unknown>;
  defaultValue?: unknown;
}

interface ObjectMapping {
  objectTypeRef: string;
  datasourceRef: string;
  primaryKeyMapping: DatasourceFieldMapping;
  titleMapping?: DatasourceFieldMapping;
  fieldMappings: DatasourceFieldMapping[];
  linkMappings?: LinkMapping[];
  conflictStrategy?: ConflictStrategy;
  enabled?: boolean;
}
```

另含 `DatasourceDefinition`, `DatasourceConnection`, `DatasourceAuth`, `DatasourceSync`, `LinkMapping`。

## SYNC ENGINE (sync-engine.ts)

- 构造：`new SyncEngine(strictMode = false)`（**默认 false**）
- `sync(mapping, sourceData, existingIds)` -- 纯计数阶段：转换记录、计算 delta，返回 `SyncResult`（`created`/`updated`/`deleted`/`skipped`/`errors`/`duration`/`timestamp`），不写入
- `apply(mapping, sourceData, target: ISyncTarget, existingIds)` -- 实际写入阶段：逐条转换（失败收集为 `transform` 错误而不中断），通过注入的 `ISyncTarget.createRecords/updateRecords/deleteRecords` 执行，返回逐条 `errorDetails`
- `transformRecord(record, mappings)` -- 按映射转换；`strictMode` 下缺失字段抛错，否则用 `defaultValue` 或跳过
- `applyTransform(value, transform?, params?)` -- 支持 identity/lowercase/uppercase/trim/parseInt/parseFloat/parseDate/parseBoolean/split/jsonParse；解析失败时返回原值（非抛错）
- `computeDelta(sourceKeys, existingKeys)` -- 返回 `{ toCreate, toUpdate, toDelete }`

## CONNECTORS (connectors/)

- `IDataSourceConnector` -- `connect()` / `fetchRecords()` / `close()` 抽象
- `CsvConnector` -- 从 `content`（内联文本）或 `filePath`（文件）读取；`parseCsv` 为 RFC4180 风格解析器（引号、转义、CRLF/LF/CR、BOM），`csvToRecords` 首行为表头，值保持字符串
- `RestApiConnector` -- GET JSON 端点，`recordsPath` 点路径定位数组（缺省须为根数组），可注入 `fetchImpl` 便于测试；`extractRecords` 抽取记录

## CONVENTIONS

- **strictMode 默认 false:** 缺失字段用 `defaultValue` 或跳过；strictMode=true 时抛错
- **transform 数值解析:** 先 `String(value)` 再 `parseInt/parseFloat`，NaN 时返回原值（不抛错）
- **parseBoolean:** 支持 `true/1/yes/y` 与 `false/0/no/n`
- **apply 与 sync 计数口径一致:** `skipped = 源记录数 - 创建数 - 更新数`
- **连接器无状态:** 拉取与转换解耦，`SourceRecord = Record<string, unknown>`

## ANTI-PATTERNS

- **禁止在 SyncEngine 中直连数据库** -- 写入通过注入的 `ISyncTarget` 完成
- **字段名冲突:** 与 `types.ts` 中已存在的 `FieldMapping` 接口区分，此处用 `DatasourceFieldMapping`

## NOTES

- `SyncResult` 含 `mappingRef`、逐条 `errorDetails`、`duration`、`timestamp` 用于审计
- `connectors/` 目前有 `csv` 与 `rest-api` 两个实现；`DatasourceType` 还声明了 postgresql/mysql/neo4j/stream（未实现连接器）
- 单元测试覆盖：`CsvConnector`（表头/引号/CRLF/文件/构造校验）、`RestApiConnector`（点路径/根数组/非 2xx/非数组）、`SyncEngine.apply`（计数/逐条错误/严格模式/整体失败展开/纯 delta）

## 变更记录 (Changelog)

| 日期 | 操作 | 说明 |
|------|------|------|
| 2026-10-16 | 更新 | 依据当前源码重新生成 |
