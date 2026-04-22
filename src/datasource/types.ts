import type { LocalizedText } from "../types";

/** 数据源类型 */
export type DatasourceType =
	| "postgresql"
	| "mysql"
	| "neo4j"
	| "rest-api"
	| "csv"
	| "stream";

/** 同步模式 */
export type SyncMode = "batch" | "streaming" | "manual";

/** 冲突解决策略 */
export type ConflictStrategy = "datasource_wins" | "user_edit_wins" | "manual";

/** 数据源定义 */
export interface DatasourceDefinition {
	"@id": string;
	"@type": "Datasource";
	label: LocalizedText;
	description?: LocalizedText;
	type: DatasourceType;
	connection: DatasourceConnection;
	sync: DatasourceSync;
}

export interface DatasourceConnection {
	urlEnvVar?: string;
	table?: string;
	method?: "GET" | "POST";
	bodyTemplate?: string;
	auth?: DatasourceAuth;
	options?: Record<string, unknown>;
}

export interface DatasourceAuth {
	type: "none" | "basic" | "oauth2" | "api-key";
	credentialsEnvVar?: string;
	tokenUrl?: string;
}

export interface DatasourceSync {
	mode: SyncMode;
	interval?: string;
	fullSync?: boolean;
	incrementalField?: string;
	batchSize?: number;
}

/** 字段映射转换函数 */
export type FieldTransform =
	| "identity"
	| "lowercase"
	| "uppercase"
	| "trim"
	| "parseInt"
	| "parseFloat"
	| "parseDate"
	| "parseBoolean"
	| "split"
	| "jsonParse"
	| "custom";

/** 数据源字段映射（与 types.ts 中 FieldMapping 不同，包含转换与默认值） */
export interface DatasourceFieldMapping {
	sourceField: string;
	targetAttribute: string;
	transform?: FieldTransform;
	transformParams?: Record<string, unknown>;
	defaultValue?: unknown;
}

/** 关系映射 */
export interface LinkMapping {
	relationTypeRef: string;
	sourceField: string;
	targetTable?: string;
	targetField: string;
	joinType?: "inner" | "left" | "cross";
}

/** 对象类型到数据源的完整映射 */
export interface ObjectMapping {
	objectTypeRef: string;
	datasourceRef: string;
	primaryKeyMapping: DatasourceFieldMapping;
	titleMapping?: DatasourceFieldMapping;
	fieldMappings: DatasourceFieldMapping[];
	linkMappings?: LinkMapping[];
	conflictStrategy?: ConflictStrategy;
	enabled?: boolean;
}
