import type {
	DatasourceFieldMapping,
	FieldTransform,
	ObjectMapping,
} from "./types";

/** 同步结果 */
export interface SyncResult {
	mappingRef: string;
	created: number;
	updated: number;
	deleted: number;
	skipped: number;
	errors: number;
	errorDetails?: Array<{ id: string; message: string }>;
	duration: number;
	timestamp: string;
}

/** 数据源记录 */
export type SourceRecord = Record<string, unknown>;

/**
 * 同步引擎 — 纯逻辑层
 * 不直接连接数据库，由外部调用者注入数据。
 */
export class SyncEngine {
	constructor(private readonly strictMode: boolean = false) {}

	sync(
		mapping: ObjectMapping,
		sourceData: SourceRecord[],
		existingIds: Set<string>,
	): SyncResult {
		const startTime = Date.now();
		const transformed = sourceData.map((record) =>
			this.transformRecord(record, mapping.fieldMappings),
		);
		const sourceKeys = transformed.map((r) =>
			String(r[mapping.primaryKeyMapping.targetAttribute] ?? ""),
		);
		const delta = this.computeDelta(sourceKeys, existingIds);

		return {
			mappingRef: mapping.objectTypeRef,
			created: delta.toCreate.length,
			updated: delta.toUpdate.length,
			deleted: delta.toDelete.length,
			skipped:
				sourceData.length - delta.toCreate.length - delta.toUpdate.length,
			errors: 0,
			duration: Date.now() - startTime,
			timestamp: new Date().toISOString(),
		};
	}

	transformRecord(
		record: SourceRecord,
		mappings: DatasourceFieldMapping[],
	): Record<string, unknown> {
		const result: Record<string, unknown> = {};
		for (const mapping of mappings) {
			const rawValue = record[mapping.sourceField];
			if (rawValue === undefined) {
				if (mapping.defaultValue !== undefined) {
					result[mapping.targetAttribute] = mapping.defaultValue;
				} else if (this.strictMode) {
					throw new Error(
						`Missing required field: ${mapping.sourceField} (mapping to ${mapping.targetAttribute})`,
					);
				}
				// 非 strictMode: 跳过
				continue;
			}
			result[mapping.targetAttribute] = this.applyTransform(
				rawValue,
				mapping.transform,
				mapping.transformParams,
			);
		}
		return result;
	}

	applyTransform(
		value: unknown,
		transform?: FieldTransform,
		_params?: Record<string, unknown>,
	): unknown {
		if (!transform || transform === "identity") return value;

		switch (transform) {
			case "lowercase":
				return typeof value === "string" ? value.toLowerCase() : value;
			case "uppercase":
				return typeof value === "string" ? value.toUpperCase() : value;
			case "trim":
				return typeof value === "string" ? value.trim() : value;
			case "parseInt": {
				const str = String(value);
				const parsed = Number.parseInt(str, 10);
				return Number.isNaN(parsed) ? value : parsed;
			}
			case "parseFloat": {
				const str = String(value);
				const parsed = Number.parseFloat(str);
				return Number.isNaN(parsed) ? value : parsed;
			}
			case "parseDate": {
				const str = String(value);
				const d = new Date(str);
				return Number.isNaN(d.getTime()) ? value : d.toISOString();
			}
			case "parseBoolean": {
				if (typeof value === "boolean") return value;
				const str = String(value).toLowerCase();
				if (["true", "1", "yes", "y"].includes(str)) return true;
				if (["false", "0", "no", "n"].includes(str)) return false;
				return value;
			}
			case "split": {
				const str = String(value);
				const sep = _params?.separator ?? ",";
				return str.split(String(sep));
			}
			case "jsonParse": {
				if (typeof value !== "string") return value;
				try {
					return JSON.parse(value);
				} catch {
					return value;
				}
			}
			default:
				return value;
		}
	}

	computeDelta(
		sourceKeys: string[],
		existingKeys: Set<string>,
	): { toCreate: string[]; toUpdate: string[]; toDelete: string[] } {
		const sourceSet = new Set(sourceKeys);
		return {
			toCreate: sourceKeys.filter((k) => !existingKeys.has(k)),
			toUpdate: sourceKeys.filter((k) => existingKeys.has(k)),
			toDelete: [...existingKeys].filter((k) => !sourceSet.has(k)),
		};
	}
}
