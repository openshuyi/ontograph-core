import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { CsvConnector, csvToRecords, parseCsv } from "./connectors/csv-connector";
import { RestApiConnector } from "./connectors/rest-api-connector";
import { type ISyncTarget, type ObjectMapping, type SourceRecord, SyncEngine, type SyncError } from "./index";

function createMapping(): ObjectMapping {
  return {
    objectTypeRef: "ns:Product",
    datasourceRef: "ns:products-ds",
    primaryKeyMapping: { sourceField: "sku", targetAttribute: "sku" },
    fieldMappings: [
      { sourceField: "sku", targetAttribute: "sku" },
      { sourceField: "name", targetAttribute: "name" },
      { sourceField: "qty", targetAttribute: "quantity", transform: "parseInt" },
    ],
  };
}

describe("CsvConnector", () => {
  it("parses header row and coerces all values to strings", async () => {
    const connector = new CsvConnector({
      content: `name,qty,note\n"Widget, Large",3,plain\n`,
    });
    await connector.connect();
    const records = await connector.fetchRecords();

    expect(records).toEqual([{ name: "Widget, Large", qty: "3", note: "plain" }]);
    expect(typeof records[0]?.qty).toBe("string");
  });

  it("handles quoted fields with embedded commas, escaped quotes and newlines", () => {
    const rows = parseCsv('a,b\n"x,1","say ""hi"""\n"line1\nline2",2');
    expect(rows).toEqual([
      ["a", "b"],
      ["x,1", 'say "hi"'],
      ["line1\nline2", "2"],
    ]);
    const records = csvToRecords('a,b\n"x,1","say ""hi"""');
    expect(records).toEqual([{ a: "x,1", b: 'say "hi"' }]);
  });

  it("handles CRLF line endings, trailing newline and custom delimiter", () => {
    const records = csvToRecords("a;b\r\n1;2\r\n", ";");
    expect(records).toEqual([{ a: "1", b: "2" }]);
  });

  it("reads from a file path", async () => {
    const dir = await mkdtemp(join(tmpdir(), "csv-connector-test-"));
    try {
      const filePath = join(dir, "products.csv");
      await writeFile(filePath, "sku,name\nA,Alpha\nB,Beta\n", "utf8");
      const connector = new CsvConnector({ filePath });
      await connector.connect();
      expect(await connector.fetchRecords()).toEqual([
        { sku: "A", name: "Alpha" },
        { sku: "B", name: "Beta" },
      ]);
      await connector.close();
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("rejects construction without content or filePath", () => {
    expect(() => new CsvConnector({})).toThrow("requires either 'content' or 'filePath'");
  });
});

describe("RestApiConnector", () => {
  it("GETs the endpoint and resolves records via dot path", async () => {
    const fetchImpl = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            data: {
              items: [
                { id: 1, name: "A" },
                { id: 2, name: "B" },
              ],
            },
          }),
          {
            headers: { "Content-Type": "application/json" },
          },
        ),
    );
    const connector = new RestApiConnector({
      url: "https://api.example.com/items",
      recordsPath: "data.items",
      fetchImpl,
    });
    await connector.connect();
    const records = await connector.fetchRecords();

    expect(fetchImpl).toHaveBeenCalledWith("https://api.example.com/items", expect.objectContaining({ method: "GET" }));
    expect(records).toEqual([
      { id: 1, name: "A" },
      { id: 2, name: "B" },
    ]);
  });

  it("returns the root array when no recordsPath is given", async () => {
    const connector = new RestApiConnector({
      url: "https://api.example.com/items",
      fetchImpl: vi.fn(async () => new Response(JSON.stringify([{ id: 1 }]))),
    });
    await connector.connect();
    expect(await connector.fetchRecords()).toEqual([{ id: 1 }]);
  });

  it("throws on non-ok responses", async () => {
    const connector = new RestApiConnector({
      url: "https://api.example.com/items",
      fetchImpl: vi.fn(async () => new Response("boom", { status: 503, statusText: "Unavailable" })),
    });
    await connector.connect();
    await expect(connector.fetchRecords()).rejects.toThrow("REST API request failed: 503 Unavailable");
  });

  it("throws when recordsPath does not resolve to an array", async () => {
    const connector = new RestApiConnector({
      url: "https://api.example.com/items",
      recordsPath: "data.items",
      fetchImpl: vi.fn(async () => new Response(JSON.stringify({ data: {} }))),
    });
    await connector.connect();
    await expect(connector.fetchRecords()).rejects.toThrow("did not resolve to an array");
  });
});

describe("SyncEngine.apply", () => {
  it("executes create/update/delete through the target with accurate counts", async () => {
    const engine = new SyncEngine();
    const mapping = createMapping();
    const existingIds = new Set(["SKU-1", "SKU-GONE"]);

    const createdBatches: SourceRecord[][] = [];
    const updatedBatches: SourceRecord[][] = [];
    const deletedBatches: string[][] = [];
    const target: ISyncTarget = {
      createRecords: async (records) => {
        createdBatches.push(records);
        return [];
      },
      updateRecords: async (records) => {
        updatedBatches.push(records);
        return [];
      },
      deleteRecords: async (keys) => {
        deletedBatches.push(keys);
        return [];
      },
    };

    const result = await engine.apply(
      mapping,
      [
        { sku: "SKU-1", name: "Updated", qty: "9" },
        { sku: "SKU-2", name: "New", qty: "1" },
      ],
      target,
      existingIds,
    );

    expect(result.created).toBe(1);
    expect(result.updated).toBe(1);
    expect(result.deleted).toBe(1);
    expect(result.errors).toBe(0);
    expect(result.errorDetails).toEqual([]);
    expect(createdBatches).toEqual([[{ sku: "SKU-2", name: "New", quantity: 1 }]]);
    expect(updatedBatches).toEqual([[{ sku: "SKU-1", name: "Updated", quantity: 9 }]]);
    expect(deletedBatches).toEqual([["SKU-GONE"]]);
  });

  it("collects per-record errors from the target into errorDetails", async () => {
    const engine = new SyncEngine();
    const mapping = createMapping();
    const existingIds = new Set(["SKU-1", "SKU-GONE"]);

    const target: ISyncTarget = {
      createRecords: async (records) =>
        records
          .filter((r) => r.name === "fail")
          .map((r): SyncError => ({ id: String(r.sku), message: "create failed", operation: "create" })),
      updateRecords: async () => [],
      deleteRecords: async (keys) =>
        keys.map((id): SyncError => ({ id, message: "delete failed", operation: "delete" })),
    };

    const result = await engine.apply(
      mapping,
      [
        { sku: "SKU-1", name: "ok", qty: "1" },
        { sku: "SKU-2", name: "fail", qty: "2" },
      ],
      target,
      existingIds,
    );

    expect(result.created).toBe(0);
    expect(result.updated).toBe(1);
    expect(result.deleted).toBe(0);
    expect(result.errors).toBe(2);
    expect(result.errorDetails).toEqual([
      { id: "SKU-2", message: "create failed", operation: "create" },
      { id: "SKU-GONE", message: "delete failed", operation: "delete" },
    ]);
  });

  it("collects transform errors per record in strict mode", async () => {
    const engine = new SyncEngine(true);
    const mapping = createMapping();
    const target: ISyncTarget = {
      createRecords: async () => [],
      updateRecords: async () => [],
      deleteRecords: async () => [],
    };

    const result = await engine.apply(
      mapping,
      [
        { sku: "SKU-OK", name: "Fine", qty: "1" },
        { sku: "SKU-BAD", qty: "2" },
      ],
      target,
      new Set(),
    );

    expect(result.created).toBe(1);
    expect(result.errors).toBe(1);
    expect(result.skipped).toBe(1);
    expect(result.errorDetails).toEqual([
      {
        id: "SKU-BAD",
        message: "Missing required field: name (mapping to name)",
        operation: "transform",
      },
    ]);
  });

  it("expands a wholesale target failure into per-record errors", async () => {
    const engine = new SyncEngine();
    const mapping = createMapping();

    const target: ISyncTarget = {
      createRecords: async () => {
        throw new Error("connection lost");
      },
      updateRecords: async () => [],
      deleteRecords: async () => [],
    };

    const result = await engine.apply(mapping, [{ sku: "SKU-A", name: "A", qty: "1" }], target, new Set());

    expect(result.created).toBe(0);
    expect(result.errors).toBe(1);
    expect(result.errorDetails).toEqual([{ id: "SKU-A", message: "connection lost", operation: "create" }]);
  });

  it("keeps the pure-delta sync() behavior untouched", () => {
    const engine = new SyncEngine();
    const mapping = createMapping();
    const result = engine.sync(
      mapping,
      [
        { sku: "SKU-1", name: "a", qty: "1" },
        { sku: "SKU-2", name: "b", qty: "2" },
      ],
      new Set(["SKU-1", "SKU-GONE"]),
    );

    expect(result.created).toBe(1);
    expect(result.updated).toBe(1);
    expect(result.deleted).toBe(1);
    expect(result.skipped).toBe(0);
    expect(result.errors).toBe(0);
    expect(result.errorDetails).toBeUndefined();
  });
});
