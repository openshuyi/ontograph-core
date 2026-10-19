import type { SourceRecord } from "../sync-engine";
import type { IDataSourceConnector } from "./types";

/** 可注入的 fetch 实现（结构化类型，便于测试注入 mock） */
export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

/** REST API 连接器选项 */
export interface RestApiConnectorOptions {
  /** JSON 端点地址 */
  url: string;
  /** 附加请求头（如认证 token） */
  headers?: Record<string, string>;
  /** 响应中记录数组的点路径，如 "data.items"；缺省时响应根须为数组 */
  recordsPath?: string;
  /** 可注入的 fetch 实现（用于测试） */
  fetchImpl?: FetchLike;
}

function getProperty(value: unknown, key: string): unknown {
  if (value === null || typeof value !== "object") return undefined;
  return (value as Record<string, unknown>)[key];
}

/** 沿点路径定位记录数组；路径不存在或非数组时抛错 */
export function extractRecords(payload: unknown, recordsPath?: string): SourceRecord[] {
  const segments = (recordsPath ?? "").split(".").filter(Boolean);
  let current: unknown = payload;
  for (const segment of segments) {
    current = getProperty(current, segment);
  }
  if (!Array.isArray(current)) {
    throw new Error(`recordsPath "${recordsPath ?? ""}" did not resolve to an array`);
  }
  return current.map((item) => {
    if (item !== null && typeof item === "object") {
      return { ...(item as Record<string, unknown>) };
    }
    return { value: item };
  });
}

/** REST API 数据源连接器 — GET 一个 JSON 端点并抽取记录数组 */
export class RestApiConnector implements IDataSourceConnector {
  private readonly options: RestApiConnectorOptions;
  private readonly fetchImpl: FetchLike;

  constructor(options: RestApiConnectorOptions) {
    this.options = options;
    this.fetchImpl = options.fetchImpl ?? ((input, init) => globalThis.fetch(input, init));
  }

  async connect(): Promise<void> {
    // 校验 URL 合法性，失败时抛出 TypeError
    new URL(this.options.url);
  }

  async fetchRecords(): Promise<SourceRecord[]> {
    const response = await this.fetchImpl(this.options.url, {
      method: "GET",
      headers: { Accept: "application/json", ...this.options.headers },
    });
    if (!response.ok) {
      throw new Error(`REST API request failed: ${response.status} ${response.statusText}`);
    }
    const payload: unknown = await response.json();
    return extractRecords(payload, this.options.recordsPath);
  }

  async close(): Promise<void> {}
}
