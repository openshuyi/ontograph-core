import type { SourceRecord } from "../sync-engine";

/**
 * 数据源连接器抽象 — 负责从外部数据源拉取原始记录。
 * 具体实现: CSV (csv-connector.ts), REST API (rest-api-connector.ts)。
 */
export interface IDataSourceConnector {
  /** 建立连接 / 加载数据（如读取文件、校验 URL） */
  connect(): Promise<void>;
  /** 拉取全部记录（已解析为 SourceRecord[]） */
  fetchRecords(): Promise<SourceRecord[]>;
  /** 释放连接资源 */
  close(): Promise<void>;
}
