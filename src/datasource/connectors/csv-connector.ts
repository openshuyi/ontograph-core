import { readFile } from "node:fs/promises";
import type { SourceRecord } from "../sync-engine";
import type { IDataSourceConnector } from "./types";

/** CSV 连接器选项（content 与 filePath 二选一） */
export interface CsvConnectorOptions {
  /** 内联 CSV 文本 */
  content?: string;
  /** CSV 文件路径 */
  filePath?: string;
  /** 字段分隔符，默认 "," */
  delimiter?: string;
}

/**
 * RFC4180 风格 CSV 解析器（无外部依赖）。
 * 支持: 表头行、双引号包裹字段、字段内逗号/换行、转义双引号 ("")、CRLF/LF/CR 换行、BOM。
 */
export function parseCsv(input: string, delimiter = ","): string[][] {
  const text = input.replace(/^\uFEFF/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;

  while (i < text.length) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      field += char;
      i += 1;
      continue;
    }
    if (char === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }
    if (char === delimiter) {
      row.push(field);
      field = "";
      i += 1;
      continue;
    }
    if (char === "\r" || char === "\n") {
      row.push(field);
      field = "";
      rows.push(row);
      row = [];
      i += char === "\r" && text[i + 1] === "\n" ? 2 : 1;
      continue;
    }
    field += char;
    i += 1;
  }

  // 末尾无换行时收尾最后一个字段/行；有换行时 row 为 [""] 会被跳过
  row.push(field);
  if (row.length > 1 || row[0] !== "") {
    rows.push(row);
  }
  return rows;
}

/** 将解析后的行（首行为表头）转为记录数组；所有值保持字符串（不做类型推断） */
export function csvToRecords(input: string, delimiter = ","): SourceRecord[] {
  const rows = parseCsv(input, delimiter);
  const header = rows[0];
  if (!header) return [];
  return rows.slice(1).map((cells) => {
    const record: SourceRecord = {};
    for (let col = 0; col < header.length; col += 1) {
      const key = header[col];
      if (key && col < cells.length) {
        record[key] = cells[col];
      }
    }
    return record;
  });
}

/** CSV 数据源连接器 — 把 CSV 文本/文件解析为 SourceRecord[] */
export class CsvConnector implements IDataSourceConnector {
  private readonly options: CsvConnectorOptions;
  private records: SourceRecord[] = [];

  constructor(options: CsvConnectorOptions) {
    if (options.content === undefined && options.filePath === undefined) {
      throw new Error("CsvConnector requires either 'content' or 'filePath'");
    }
    this.options = options;
  }

  async connect(): Promise<void> {
    let csv: string;
    if (this.options.content !== undefined) {
      csv = this.options.content;
    } else if (this.options.filePath !== undefined) {
      csv = await readFile(this.options.filePath, "utf8");
    } else {
      throw new Error("CsvConnector requires either 'content' or 'filePath'");
    }
    this.records = csvToRecords(csv, this.options.delimiter ?? ",");
  }

  async fetchRecords(): Promise<SourceRecord[]> {
    return this.records;
  }

  async close(): Promise<void> {}
}
