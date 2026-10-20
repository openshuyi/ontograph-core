"use client";

import type { Nodes as HastNodes } from "hast";
import { toJsxRuntime } from "hast-util-to-jsx-runtime";
import type { ReactNode } from "react";
import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import * as JsxRuntime from "react/jsx-runtime";
import { Mermaid } from "@/components/mermaid";
import { INITIAL_STATE } from "@/lib/editor-types";
import {
  generateDot,
  generateJsonSchema,
  generateMermaid,
  generateNeo4jCypher,
  generateOWL,
  generateSHACL,
} from "@/lib/export-formats";

type ExportFormat =
  | "owl"
  | "shacl"
  | "jsonschema"
  | "mermaid"
  | "dot"
  | "neo4j";

interface FormatInfo {
  id: ExportFormat;
  name: string;
  description: string;
  extension: string;
  mimeType: string;
  /** 洛书九宫数（1–9）。 */
  luoshu: number;
  /** 后天八卦卦名与卦象。 */
  trigram: string;
}

/*
 * 洛书九宫（后天八卦）↔ 导出格式映射
 *
 *   4 巽 ☴   9 离 ☲   2 坤 ☷      东南 · 发布    南 · 明察    西南 · 承载
 *   3 震 ☳   5 中  ·   7 兑 ☱      东   · 生发    中宫（本体）  西   · 呈现
 *   8 艮 ☶   1 坎 ☵   6 乾 ☰      东北 · 边界    北   · 数据流  西北 · 规则
 *
 *   OWL          → 4 巽（东南，木）：对外发布、传播的本体定义
 *   SHACL        → 9 离（南，火）  ：明察照见，形状校验
 *   JSON Schema  → 6 乾（西北，金）：规则与权威，数据契约
 *   Mermaid      → 7 兑（西，金）  ：言语呈现，图示
 *   Graphviz DOT → 3 震（东，木）  ：生发展开，图结构
 *   Neo4j Cypher → 1 坎（北，水）  ：深流数据，数据库查询
 */
const FORMATS: FormatInfo[] = [
  {
    id: "owl",
    name: "OWL 2 Turtle",
    description: "W3C OWL 2 ontology in Turtle format",
    extension: "ttl",
    mimeType: "text/turtle",
    luoshu: 4,
    trigram: "巽 ☴",
  },
  {
    id: "shacl",
    name: "SHACL",
    description: "W3C SHACL shapes for validation",
    extension: "ttl",
    mimeType: "text/turtle",
    luoshu: 9,
    trigram: "离 ☲",
  },
  {
    id: "jsonschema",
    name: "JSON Schema",
    description: "JSON Schema Draft 2020-12",
    extension: "json",
    mimeType: "application/json",
    luoshu: 6,
    trigram: "乾 ☰",
  },
  {
    id: "mermaid",
    name: "Mermaid",
    description: "Mermaid class diagram syntax",
    extension: "mmd",
    mimeType: "text/plain",
    luoshu: 7,
    trigram: "兑 ☱",
  },
  {
    id: "dot",
    name: "Graphviz DOT",
    description: "Graphviz DOT format for diagrams",
    extension: "dot",
    mimeType: "text/plain",
    luoshu: 3,
    trigram: "震 ☳",
  },
  {
    id: "neo4j",
    name: "Neo4j Cypher",
    description: "Neo4j Cypher DDL statements",
    extension: "cypher",
    mimeType: "text/plain",
    luoshu: 1,
    trigram: "坎 ☵",
  },
];

function getGeneratedOutput(format: ExportFormat): string {
  switch (format) {
    case "owl":
      return generateOWL(INITIAL_STATE);
    case "shacl":
      return generateSHACL(INITIAL_STATE);
    case "jsonschema":
      return generateJsonSchema(INITIAL_STATE);
    case "mermaid":
      return generateMermaid(INITIAL_STATE);
    case "dot":
      return generateDot(INITIAL_STATE);
    case "neo4j":
      return generateNeo4jCypher(INITIAL_STATE);
    default:
      return "";
  }
}

function CodeBlock({ code, language }: { code: string; language: string }) {
  const [tree, setTree] = useState<HastNodes | null>(null);

  useEffect(() => {
    const highlight = async () => {
      try {
        const { codeToHast } = await import("shiki");
        const hast = await codeToHast(code, {
          lang: language,
          themes: { light: "github-light", dark: "github-dark" },
        });
        setTree(hast);
      } catch {
        setTree(null);
      }
    };
    highlight();
  }, [code, language]);

  if (!tree) {
    return (
      <div className="h-full overflow-auto">
        <pre className="shiki">
          <code>{code}</code>
        </pre>
      </div>
    );
  }

  const highlighted = toJsxRuntime(tree, {
    Fragment,
    jsx: JsxRuntime.jsx,
    jsxs: JsxRuntime.jsxs,
    development: false,
  }) as ReactNode;

  return <div className="h-full overflow-auto">{highlighted}</div>;
}

export default function ExportsDemoPage() {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>("mermaid");
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"code" | "preview">("code");

  const currentFormat = useMemo(
    () => FORMATS.find((f) => f.id === selectedFormat)!,
    [selectedFormat],
  );

  const output = useMemo(
    () => getGeneratedOutput(selectedFormat),
    [selectedFormat],
  );

  const language = useMemo(() => {
    switch (selectedFormat) {
      case "owl":
      case "shacl":
        return "turtle";
      case "jsonschema":
        return "json";
      case "mermaid":
        return "mermaid";
      case "dot":
        return "dot";
      case "neo4j":
        return "cypher";
      default:
        return "text";
    }
  }, [selectedFormat]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [output]);

  const handleDownload = useCallback(() => {
    const blob = new Blob([output], { type: currentFormat.mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ontology.${currentFormat.extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [output, currentFormat]);

  return (
    <div className="flex h-screen flex-col bg-fd-background font-sans text-fd-foreground">
      {/* Top bar */}
      <header className="flex flex-shrink-0 items-center justify-between border-b border-fd-border bg-fd-card px-4 py-3">
        <div className="flex items-center gap-3">
          <div
            className="seal h-9 w-9 text-[12px]"
            role="img"
            aria-label="本体"
          >
            本体
          </div>
          <div>
            <h1 className="font-serif text-sm font-semibold tracking-wide">
              导出演示
            </h1>
            <p className="text-[10px] tracking-[0.12em] text-fd-muted-foreground">
              六种格式 · 本体导出预览
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-fd-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 flex-shrink-0 bg-[var(--zh-success)]" />
            {INITIAL_STATE.entities.length} 实体
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 flex-shrink-0 bg-[var(--zh-qing-600)]" />
            {INITIAL_STATE.relations.length} 关系
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 flex-shrink-0 bg-[var(--zh-warning)]" />
            {INITIAL_STATE.constraints.length} 约束
          </span>
        </div>
      </header>

      {/* Main content */}
      <div className="flex min-h-0 flex-1">
        {/* Left panel: Format selector */}
        <aside className="flex w-72 flex-shrink-0 flex-col border-r border-fd-border bg-fd-muted">
          <div className="border-b border-fd-border px-4 py-3">
            <h2 className="font-serif text-xs tracking-[0.24em] text-fd-muted-foreground">
              导出格式
            </h2>
          </div>

          <div className="space-y-px overflow-y-auto p-3">
            {FORMATS.map((format) => {
              const selected = selectedFormat === format.id;
              return (
                <button
                  key={format.id}
                  type="button"
                  onClick={() => setSelectedFormat(format.id)}
                  className={`flex w-full items-center gap-3 border-l-2 px-3 py-3 text-left transition-colors ${
                    selected
                      ? "border-fd-primary"
                      : "border-transparent hover:bg-fd-card"
                  }`}
                >
                  <span
                    className={`w-4 flex-shrink-0 text-center font-serif text-lg leading-none ${
                      selected ? "text-fd-primary" : "text-fd-muted-foreground"
                    }`}
                  >
                    {format.luoshu}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-1.5">
                      <span
                        className={`truncate text-xs font-medium ${
                          selected
                            ? "text-fd-foreground"
                            : "text-fd-muted-foreground"
                        }`}
                      >
                        {format.name}
                      </span>
                      <span className="flex-shrink-0 font-serif text-[10px] text-fd-muted-foreground">
                        {format.trigram}
                      </span>
                    </div>
                    <div className="mt-0.5 truncate text-[10px] text-fd-muted-foreground">
                      {format.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Format info card */}
          <div className="mt-auto border-t border-fd-border p-4">
            <div className="rounded-sm border border-fd-border bg-fd-card p-3">
              <div className="mb-2 font-serif text-[10px] tracking-[0.2em] text-fd-muted-foreground">
                当前格式
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <span className="truncate font-serif text-sm text-fd-foreground">
                  {currentFormat.name}
                </span>
                <span className="flex-shrink-0 font-serif text-xs text-fd-primary">
                  {currentFormat.trigram}
                </span>
              </div>
              <div className="mt-1 text-[10px] leading-relaxed text-fd-muted-foreground">
                {currentFormat.description}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className="rounded-sm border border-fd-border px-1.5 py-0.5 font-mono text-[10px] text-fd-muted-foreground">
                  .{currentFormat.extension}
                </span>
                <span className="font-serif text-[10px] text-fd-muted-foreground">
                  洛书 {currentFormat.luoshu}
                </span>
              </div>
            </div>
          </div>
        </aside>

        {/* Right panel: Output preview */}
        <main className="flex min-w-0 flex-1 flex-col bg-fd-background">
          {/* Top action bar */}
          <div className="flex items-center justify-between border-b border-fd-border bg-fd-card px-4 py-3">
            <div className="flex items-center gap-4">
              <h2 className="font-serif text-xs tracking-[0.1em] text-fd-foreground">
                {currentFormat.name} · 输出
              </h2>

              {/* Tab switcher for Mermaid */}
              {selectedFormat === "mermaid" && (
                <div className="flex items-center rounded-sm border border-fd-border p-px">
                  <button
                    type="button"
                    onClick={() => setActiveTab("code")}
                    className={`rounded-sm px-2 py-1 text-[10px] font-medium transition-colors ${
                      activeTab === "code"
                        ? "bg-fd-muted text-fd-foreground"
                        : "text-fd-muted-foreground hover:text-fd-foreground"
                    }`}
                  >
                    代码
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("preview")}
                    className={`rounded-sm px-2 py-1 text-[10px] font-medium transition-colors ${
                      activeTab === "preview"
                        ? "bg-fd-muted text-fd-foreground"
                        : "text-fd-muted-foreground hover:text-fd-foreground"
                    }`}
                  >
                    预览
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className={`flex items-center gap-1.5 rounded-sm border px-3 py-1.5 text-xs font-medium transition-colors ${
                  copied
                    ? "border-[var(--zh-success)] text-[var(--zh-success)]"
                    : "border-fd-border text-fd-muted-foreground hover:bg-fd-muted hover:text-fd-foreground"
                }`}
              >
                {copied ? (
                  <>
                    <svg
                      className="h-3.5 w-3.5"
                      focusable="false"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <title>Copied</title>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    已复制
                  </>
                ) : (
                  <>
                    <svg
                      className="h-3.5 w-3.5"
                      focusable="false"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <title>Copy</title>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                    复制
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleDownload}
                className="flex items-center gap-1.5 rounded-sm bg-fd-primary px-3 py-1.5 text-xs font-medium text-fd-primary-foreground transition-colors hover:bg-fd-primary/90"
              >
                <svg
                  className="h-3.5 w-3.5"
                  focusable="false"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <title>Download</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                下载
              </button>
            </div>
          </div>

          {/* Output content */}
          <div className="min-h-0 flex-1 overflow-hidden bg-fd-muted p-4">
            {selectedFormat === "mermaid" && activeTab === "preview" ? (
              <div className="h-full overflow-auto rounded-sm border border-fd-border bg-fd-card p-4">
                <Mermaid code={output} theme="auto" />
              </div>
            ) : (
              <div className="h-full overflow-hidden rounded-sm border border-fd-border bg-fd-card">
                <CodeBlock code={output} language={language} />
              </div>
            )}
          </div>

          {/* Bottom status bar */}
          <footer className="flex items-center justify-between border-t border-fd-border bg-fd-card px-4 py-2 text-[10px] text-fd-muted-foreground">
            <div className="flex items-center gap-3">
              <span>{output.split("\n").length} 行</span>
              <span>{output.length} 字符</span>
              <span className="font-mono">.{currentFormat.extension}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 bg-[var(--zh-success)]" />
              <span>就绪</span>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
