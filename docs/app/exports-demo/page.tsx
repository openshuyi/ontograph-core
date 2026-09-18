"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { INITIAL_STATE } from "@/lib/editor-types";
import {
  generateOWL,
  generateSHACL,
  generateMermaid,
  generateTypeScript,
  generateDot,
  generateJsonSchema,
  generateNeo4jCypher,
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
}

const FORMATS: FormatInfo[] = [
  {
    id: "owl",
    name: "OWL 2 Turtle",
    description: "W3C OWL 2 ontology in Turtle format",
    extension: "ttl",
    mimeType: "text/turtle",
  },
  {
    id: "shacl",
    name: "SHACL",
    description: "W3C SHACL shapes for validation",
    extension: "ttl",
    mimeType: "text/turtle",
  },
  {
    id: "jsonschema",
    name: "JSON Schema",
    description: "JSON Schema Draft 2020-12",
    extension: "json",
    mimeType: "application/json",
  },
  {
    id: "mermaid",
    name: "Mermaid",
    description: "Mermaid class diagram syntax",
    extension: "mmd",
    mimeType: "text/plain",
  },
  {
    id: "dot",
    name: "Graphviz DOT",
    description: "Graphviz DOT format for diagrams",
    extension: "dot",
    mimeType: "text/plain",
  },
  {
    id: "neo4j",
    name: "Neo4j Cypher",
    description: "Neo4j Cypher DDL statements",
    extension: "cypher",
    mimeType: "text/plain",
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

function MermaidPreview({ code }: { code: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const renderMermaid = async () => {
      setLoading(true);
      setError(null);
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: "dark",
          securityLevel: "strict",
          class: {
            useMaxWidth: true,
          },
        });
        const id = `mermaid-${Date.now()}`;
        const { svg } = await mermaid.render(id, code);
        if (containerRef.current) {
          containerRef.current.innerHTML = svg;
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to render diagram");
      } finally {
        setLoading(false);
      }
    };
    renderMermaid();
  }, [code]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2 text-gray-400">
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-sm">Rendering diagram...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <svg className="w-8 h-8 text-red-500 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-red-400">Failed to render diagram</p>
          <p className="text-xs text-gray-500 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="mermaid-preview flex items-center justify-center p-4"
    />
  );
}

function CodeBlock({ code, language }: { code: string; language: string }) {
  const [highlighted, setHighlighted] = useState<string>(code);

  useEffect(() => {
    const highlight = async () => {
      try {
        const { codeToHtml } = await import("shiki");
        const html = await codeToHtml(code, {
          lang: language,
          theme: "github-dark",
        });
        setHighlighted(html);
      } catch {
        setHighlighted(`<pre class="shiki"><code>${code}</code></pre>`);
      }
    };
    highlight();
  }, [code, language]);

  return (
    <div
      className="h-full overflow-auto"
      dangerouslySetInnerHTML={{ __html: highlighted }}
    />
  );
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
    <div className="h-screen flex flex-col bg-gray-950 text-white">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight">Export Demo</h1>
            <p className="text-[10px] text-gray-500">Multi-format ontology export preview</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-purple-500" />
              {INITIAL_STATE.entities.length} entities
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              {INITIAL_STATE.relations.length} relations
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              {INITIAL_STATE.constraints.length} constraints
            </span>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 min-h-0">
        {/* Left panel: Format selector */}
        <div className="w-72 border-r border-gray-800 bg-gray-900/30 flex flex-col flex-shrink-0">
          <div className="px-4 py-3 border-b border-gray-800">
            <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              Export Formats
            </h2>
          </div>

          <div className="p-3 space-y-2 overflow-y-auto">
            {FORMATS.map((format) => (
              <button
                key={format.id}
                type="button"
                onClick={() => setSelectedFormat(format.id)}
                className={`w-full px-3 py-3 rounded-lg text-left transition-all ${
                  selectedFormat === format.id
                    ? "bg-blue-500/15 border border-blue-500/30"
                    : "border border-transparent hover:bg-gray-800/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      selectedFormat === format.id ? "bg-blue-400" : "bg-gray-600"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div
                      className={`text-xs font-medium truncate ${
                        selectedFormat === format.id ? "text-blue-400" : "text-gray-300"
                      }`}
                    >
                      {format.name}
                    </div>
                    <div className="text-[10px] text-gray-500 truncate mt-0.5">
                      {format.description}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Format info card */}
          <div className="mt-auto p-4 border-t border-gray-800">
            <div className="rounded-lg bg-gray-800/50 border border-gray-700/50 p-3">
              <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">
                Selected Format
              </div>
              <div className="text-xs font-medium text-gray-200">{currentFormat.name}</div>
              <div className="text-[10px] text-gray-500 mt-1">{currentFormat.description}</div>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-700 text-gray-400">
                  .{currentFormat.extension}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right panel: Output preview */}
        <div className="flex-1 flex flex-col min-w-0 bg-gray-950">
          {/* Top action bar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-gray-900/30">
            <div className="flex items-center gap-4">
              <h2 className="text-xs font-medium text-gray-400">
                {currentFormat.name} Output
              </h2>

              {/* Tab switcher for Mermaid */}
              {selectedFormat === "mermaid" && (
                <div className="flex items-center gap-1 bg-gray-800/50 rounded-md p-0.5">
                  <button
                    type="button"
                    onClick={() => setActiveTab("code")}
                    className={`px-2 py-1 text-[10px] font-medium rounded transition-colors ${
                      activeTab === "code"
                        ? "bg-gray-700 text-white"
                        : "text-gray-500 hover:text-gray-300"
                    }`}
                  >
                    Code
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("preview")}
                    className={`px-2 py-1 text-[10px] font-medium rounded transition-colors ${
                      activeTab === "preview"
                        ? "bg-gray-700 text-white"
                        : "text-gray-500 hover:text-gray-300"
                    }`}
                  >
                    Preview
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  copied
                    ? "bg-green-600/20 text-green-400"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white"
                }`}
              >
                {copied ? (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Copied
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-blue-600 text-white hover:bg-blue-500 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download
              </button>
            </div>
          </div>

          {/* Output content */}
          <div className="flex-1 overflow-hidden">
            {selectedFormat === "mermaid" && activeTab === "preview" ? (
              <div className="h-full overflow-auto bg-gray-900/20">
                <MermaidPreview code={output} />
              </div>
            ) : (
              <div className="h-full overflow-auto bg-gray-900/50 p-4">
                <CodeBlock code={output} language={language} />
              </div>
            )}
          </div>

          {/* Bottom status bar */}
          <div className="flex items-center justify-between px-4 py-2 border-t border-gray-800 bg-gray-900/30 text-[10px] text-gray-500">
            <div className="flex items-center gap-3">
              <span>{output.split("\n").length} lines</span>
              <span>{output.length} characters</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <span>Ready to export</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
