import type { DatasourceFieldMapping, FieldTransform, ObjectMapping } from "./types";

/** 同步结果 */
export interface SyncResult {
  mappingRef: string;
  created: number;
  updated: number;
  deleted: number;
  skipped: number;
  errors: number;
  errorDetails?: SyncError[];
  duration: number;
  timestamp: string;
}

/** 数据源记录 */
export type SourceRecord = Record<string, unknown>;

/** 出错的同步操作类别 */
export type SyncOperation = "transform" | "create" | "update" | "delete";

/** 单条记录级同步错误 */
export interface SyncError {
  id: string;
  message: string;
  operation: SyncOperation;
}

/**
 * 同步目标抽象 — apply 阶段的实际执行方（如图数据库写入层）。
 * 返回未能成功应用的记录级错误；整体抛错由 SyncEngine 捕获并展开为逐条错误。
 */
export interface ISyncTarget {
  createRecords(records: SourceRecord[]): Promise<SyncError[]>;
  updateRecords(records: SourceRecord[]): Promise<SyncError[]>;
  deleteRecords(keys: string[]): Promise<SyncError[]>;
}

/**
 * 同步引擎 — 纯逻辑层
 * 不直接连接数据库，由外部调用者注入数据。
 */
export class SyncEngine {
  constructor(private readonly strictMode: boolean = false) {}

  sync(mapping: ObjectMapping, sourceData: SourceRecord[], existingIds: Set<string>): SyncResult {
    const startTime = Date.now();
    const transformed = sourceData.map((record) => this.transformRecord(record, mapping.fieldMappings));
    const sourceKeys = transformed.map((r) => String(r[mapping.primaryKeyMapping.targetAttribute] ?? ""));
    const delta = this.computeDelta(sourceKeys, existingIds);

    return {
      mappingRef: mapping.objectTypeRef,
      created: delta.toCreate.length,
      updated: delta.toUpdate.length,
      deleted: delta.toDelete.length,
      skipped: sourceData.length - delta.toCreate.length - delta.toUpdate.length,
      errors: 0,
      duration: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * apply 阶段 — 在 sync 纯计数的基础上实际执行写入。
   * 通过 ISyncTarget 执行 create/update/delete，收集逐条错误到 errorDetails，
   * 返回成功应用的准确计数。不修改 existingIds，调用方按需更新。
   */
  async apply(
    mapping: ObjectMapping,
    sourceData: SourceRecord[],
    target: ISyncTarget,
    existingIds: Set<string>,
  ): Promise<SyncResult> {
    const startTime = Date.now();
    const transformErrors: SyncError[] = [];

    // 转换阶段：逐条转换，失败记录收集为 transform 错误而不中断整体
    const recordsByKey = new Map<string, SourceRecord>();
    sourceData.forEach((record, index) => {
      const rawKey = String(record[mapping.primaryKeyMapping.sourceField] ?? `row-${index}`);
      try {
        const transformed = this.transformRecord(record, mapping.fieldMappings);
        const key = String(transformed[mapping.primaryKeyMapping.targetAttribute] ?? rawKey);
        recordsByKey.set(key, transformed);
      } catch (error) {
        transformErrors.push({
          id: rawKey,
          message: error instanceof Error ? error.message : String(error),
          operation: "transform",
        });
      }
    });

    const delta = this.computeDelta([...recordsByKey.keys()], existingIds);
    const recordsFor = (keys: string[]): SourceRecord[] =>
      keys.flatMap((key) => {
        const record = recordsByKey.get(key);
        return record ? [record] : [];
      });

    const createRecords = recordsFor(delta.toCreate);
    const updateRecords = recordsFor(delta.toUpdate);

    const createErrors = await this.executeBatch("create", delta.toCreate, () => target.createRecords(createRecords));
    const updateErrors = await this.executeBatch("update", delta.toUpdate, () => target.updateRecords(updateRecords));
    const deleteErrors = await this.executeBatch("delete", delta.toDelete, (keys) => target.deleteRecords(keys));
    const errors = [...transformErrors, ...createErrors, ...updateErrors, ...deleteErrors];

    return {
      mappingRef: mapping.objectTypeRef,
      created: createRecords.length - createErrors.length,
      updated: updateRecords.length - updateErrors.length,
      deleted: delta.toDelete.length - deleteErrors.length,
      // skipped = 未参与应用的记录（重复键 + 转换失败），与 sync() 的 total - created - updated 口径一致
      skipped: sourceData.length - createRecords.length - updateRecords.length,
      errors: errors.length,
      errorDetails: errors,
      duration: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    };
  }

  /** 执行一批目标操作；目标整体抛错时展开为该批所有记录的错误 */
  private async executeBatch(
    operation: Exclude<SyncOperation, "transform">,
    keys: string[],
    run: (keys: string[]) => Promise<SyncError[]>,
  ): Promise<SyncError[]> {
    try {
      return await run(keys);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return keys.map((id) => ({ id, message, operation }));
    }
  }

  transformRecord(record: SourceRecord, mappings: DatasourceFieldMapping[]): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const mapping of mappings) {
      const rawValue = record[mapping.sourceField];
      if (rawValue === undefined) {
        if (mapping.defaultValue !== undefined) {
          result[mapping.targetAttribute] = mapping.defaultValue;
        } else if (this.strictMode) {
          throw new Error(`Missing required field: ${mapping.sourceField} (mapping to ${mapping.targetAttribute})`);
        }
        // 非 strictMode: 跳过
        continue;
      }
      result[mapping.targetAttribute] = this.applyTransform(rawValue, mapping.transform, mapping.transformParams);
    }
    return result;
  }

  applyTransform(value: unknown, transform?: FieldTransform, _params?: Record<string, unknown>): unknown {
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
