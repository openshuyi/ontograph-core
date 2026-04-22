"use client";

import { useEditor, EditorProvider } from "@/lib/editor-context";
import type { GraphNode, GraphEdge } from "@/components/cytoscape-graph";
import { CytoscapeGraph } from "@/components/cytoscape-graph";
import { generateTypeScript, generateMermaid, generateOWL, generateSHACL } from "@/lib/export-formats";
import type { OntologyEditorState, EditorRelation, EditorConstraint } from "@/lib/editor-types";
import { useState, useCallback, useMemo } from "react";

function EditorInner() {
  const { state, dispatch } = useEditor();
  const [sidebarTab, setSidebarTab] = useState<"entities" | "relations" | "constraints" | "code" | "export">("entities");
  const [detailTab, setDetailTab] = useState<"entity" | "relation">("entity");
  const [exportFormat, setExportFormat] = useState<"typescript" | "mermaid" | "owl" | "shacl">("typescript");
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const graphNodes: GraphNode[] = state.entities.map((e) => ({
    id: e.id,
    label: e.label,
    group: e.kind,
    color: e.color,
    properties: { id: e.id, kind: e.kind, attributes: e.attributes.length },
  }));

  const graphEdges: GraphEdge[] = state.relations.map((r: EditorRelation, i: number) => ({
    id: `edge-${i}`,
    source: r.source,
    target: r.target,
    label: r.label,
  }));

  const handleNodeClick = useCallback(
    (nodeId: string) => {
      dispatch({ type: "SELECT_ENTITY", id: nodeId });
      setDetailTab("entity");
    },
    [dispatch],
  );

  const selectedEntity = useMemo(
    () => state.entities.find((e) => e.id === state.selectedEntityId),
    [state.entities, state.selectedEntityId],
  );

  const entityRelations = useMemo(
    () => state.relations.filter((r: EditorRelation) => r.source === state.selectedEntityId || r.target === state.selectedEntityId),
    [state.relations, state.selectedEntityId],
  );

  const entityConstraints = useMemo(
    () => state.constraints.filter((c: EditorConstraint) => c.entityType === state.selectedEntityId),
    [state.constraints, state.selectedEntityId],
  );

  const filteredEntities = state.entities.filter(
    (e) =>
      e.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.id.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleExport = () => {
    const content = getGeneratedCode();
    const ext = exportFormat === "typescript" ? "ts" : "ttl";
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ontology.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getGeneratedCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getGeneratedCode = () => {
    switch (exportFormat) {
      case "typescript":
        return generateTypeScript(state);
      case "mermaid":
        return generateMermaid(state);
      case "owl":
        return generateOWL(state);
      case "shacl":
        return generateSHACL(state);
    }
  };

  const handleReset = () => {
    if (confirm("Reset all data? This cannot be undone.")) {
      dispatch({ type: "RESET_STATE" });
      setDetailTab("entity");
    }
  };

  const sidebarItems = [
    { key: "entities" as const, label: "Entities", count: state.entities.length },
    { key: "relations" as const, label: "Relations", count: state.relations.length },
    { key: "constraints" as const, label: "Constraints", count: state.constraints.length },
    { key: "code" as const, label: "Code", count: 0 },
    { key: "export" as const, label: "Export", count: 0 },
  ];

  return (
    <div className="h-screen flex flex-col bg-gray-950 text-white">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-label="Ontograph">
              <circle cx="12" cy="12" r="10" strokeWidth={2} />
              <circle cx="8" cy="10" r="1.5" fill="currentColor" />
              <circle cx="16" cy="10" r="1.5" fill="currentColor" />
              <circle cx="12" cy="16" r="1.5" fill="currentColor" />
              <line x1="8" y1="10" x2="16" y2="10" strokeWidth={1.5} />
              <line x1="8" y1="10" x2="12" y2="16" strokeWidth={1.5} />
              <line x1="16" y1="10" x2="12" y2="16" strokeWidth={1.5} />
            </svg>
          </div>
          <h1 className="text-sm font-bold tracking-tight">Ontograph Editor</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-purple-500" />
              {state.entities.length} entities
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              {state.relations.length} relations
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              {state.constraints.length} constraints
            </span>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-1.5 text-xs font-medium rounded-md bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Main three-column layout */}
      <div className="flex flex-1 min-h-0">
        {/* Left sidebar */}
        <div className="w-72 border-r border-gray-800 bg-gray-900/30 flex flex-col flex-shrink-0">
          {/* Sidebar tab switcher */}
          <div className="flex border-b border-gray-800">
            {sidebarItems.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setSidebarTab(item.key)}
                className={`flex-1 px-2 py-2.5 text-xs font-medium transition-colors border-b-2 ${sidebarTab === item.key ? "text-blue-400 border-blue-400" : "text-gray-500 border-transparent hover:text-gray-300"}`}
              >
                {item.label}
                {item.count > 0 && (
                  <span className={`ml-1 px-1.5 py-0.5 rounded text-[10px] ${sidebarTab === item.key ? "bg-blue-500/20 text-blue-400" : "bg-gray-800 text-gray-500"}`}>
                    {item.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Sidebar content */}
          <div className="flex-1 overflow-y-auto">
            {sidebarTab === "entities" && <LeftSidebarEntities filtered={filteredEntities} searchQuery={searchQuery} setSearchQuery={setSearchQuery} />}
            {sidebarTab === "relations" && <LeftSidebarRelations />}
            {sidebarTab === "constraints" && <LeftSidebarConstraints />}
            {sidebarTab === "code" && <LeftSidebarCode getCode={getGeneratedCode} onCopy={handleCopy} copied={copied} />}
            {sidebarTab === "export" && <LeftSidebarExport exportFormat={exportFormat} setExportFormat={setExportFormat} getCode={getGeneratedCode} onCopy={handleCopy} onDownload={handleExport} copied={copied} />}
          </div>
        </div>

        {/* Center: Graph canvas */}
        <div className="flex-1 min-w-0 relative">
          <CytoscapeGraph nodes={graphNodes} edges={graphEdges} onNodeClick={handleNodeClick} />
          {state.entities.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-gray-800 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-label="No data">
                    <circle cx="12" cy="12" r="10" strokeWidth={1.5} />
                    <line x1="8" y1="12" x2="16" y2="12" strokeWidth={1.5} />
                  </svg>
                </div>
                <p className="text-gray-500 text-sm mb-1">No ontology defined yet</p>
                <p className="text-gray-600 text-xs">Use the left panel to add entities and relations</p>
              </div>
            </div>
          )}
        </div>

        {/* Right detail panel */}
        <div className="w-80 border-l border-gray-800 bg-gray-900/30 flex flex-col flex-shrink-0">
          {selectedEntity ? (
            <RightDetailPanel
              entity={selectedEntity}
              relations={entityRelations}
              constraints={entityConstraints}
              detailTab={detailTab}
              setDetailTab={setDetailTab}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center px-6">
                <div className="w-12 h-12 rounded-xl bg-gray-800 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-label="Select node">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                  </svg>
                </div>
                <p className="text-gray-500 text-sm mb-1">No selection</p>
                <p className="text-gray-600 text-xs">Click a node in the graph to view details, or select from the entities list</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Left Sidebar sub-components ─── */

function LeftSidebarEntities({ filtered, searchQuery, setSearchQuery }: { filtered: import("@/lib/editor-types").EditorEntity[]; searchQuery: string; setSearchQuery: (v: string) => void }) {
  const { state, dispatch } = useEditor();
  return (
    <div className="p-3 space-y-2">
      <div className="flex items-center gap-2 mb-2">
        <div className="flex-1 relative">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-label="Search">
            <circle cx="11" cy="11" r="8" strokeWidth={2} />
            <path d="M21 21l-4.35-4.35" strokeWidth={2} strokeLinecap="round" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search entities..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-800/50 border border-gray-700/50 rounded-md text-gray-300 placeholder-gray-600 focus:outline-none focus:border-blue-500/50"
          />
        </div>
        <button
          type="button"
          onClick={() => {
            const rawId = prompt("Entity ID (e.g. ProductCategory)", "");
            if (!rawId) return;
            const id = `scm:${rawId}`;
            if (state.entities.some((e) => e.id === id)) return;
            const rawLabel = prompt("Entity label", rawId) ?? rawId;
            const colors = ["#7B1FA2", "#C62828", "#0277BD", "#2E7D32", "#FF9800", "#607D8B", "#AD1457", "#1565C0"];
            dispatch({
              type: "ADD_ENTITY",
              entity: { id, label: rawLabel, kind: "entity", color: colors[Math.floor(Math.random() * colors.length)], attributes: [] },
            });
          }}
          className="px-2 py-1.5 text-xs font-medium rounded-md bg-blue-600/80 text-white hover:bg-blue-500 transition-colors"
        >
          +
        </button>
      </div>
      {filtered.length === 0 && <p className="text-xs text-gray-600 text-center py-6">No entities found</p>}
      {filtered.map((e) => (
        <button
          key={e.id}
          type="button"
          onClick={() => dispatch({ type: "SELECT_ENTITY", id: e.id })}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all ${state.selectedEntityId === e.id ? "bg-blue-500/15 border border-blue-500/30" : "hover:bg-gray-800/50 border border-transparent"}`}
        >
          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: e.color }} />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-gray-200 truncate">{e.label}</div>
            <div className="text-[10px] text-gray-600 font-mono truncate">{e.id}</div>
          </div>
          <span className="text-[10px] text-gray-600">{e.attributes.length}</span>
        </button>
      ))}
    </div>
  );
}

function LeftSidebarRelations() {
  const { state, dispatch } = useEditor();
  return (
    <div className="p-3 space-y-2">
      <div className="flex items-center justify-between mb-2">
        {null}<span className="text-xs text-gray-500">{state.relations.length} relations</span>
        <button
          type="button"
          onClick={() => {
            if (state.entities.length < 2) return;
            const rawId = prompt("Relation ID (e.g. transports)", "");
            if (!rawId) return;
            const id = `scm:${rawId}`;
            if (state.relations.some((r) => r.id === id)) return;
            dispatch({
              type: "ADD_RELATION",
              relation: { id, label: prompt("Label", rawId) ?? rawId, source: state.entities[0].id, target: state.entities[1].id },
            });
          }}
          className="px-2 py-1.5 text-xs font-medium rounded-md bg-blue-600/80 text-white hover:bg-blue-500 transition-colors"
        >
          +
        </button>
      </div>
      {state.relations.length === 0 && <p className="text-xs text-gray-600 text-center py-6">No relations</p>}
      {state.relations.map((r) => (
        <div key={r.id} className="px-3 py-2 rounded-lg border border-gray-800 bg-gray-800/20">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-gray-200">{r.label}</span>
            <button
              type="button"
              onClick={() => dispatch({ type: "DELETE_RELATION", id: r.id })}
              className="text-gray-600 hover:text-red-400 transition-colors"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-label="Delete">
                <path d="M6 18L18 6M6 6l12 12" strokeWidth={2} strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-gray-500 font-mono">
            <span className="truncate flex-1" title={r.source}>{r.source.split(":")[1] ?? r.source}</span>
            <span className="text-blue-500 flex-shrink-0">→</span>
            <span className="truncate flex-1 text-right" title={r.target}>{r.target.split(":")[1] ?? r.target}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function LeftSidebarConstraints() {
  const { state, dispatch } = useEditor();
  return (
    <div className="p-3 space-y-2">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-500">{state.constraints.length} constraints</span>
        <button
          type="button"
          onClick={() => {
            if (state.entities.length === 0) return;
            const rawId = prompt("Constraint ID (e.g. MaxQuantity)", "");
            if (!rawId) return;
            const id = `scm:${rawId}`;
            dispatch({
              type: "ADD_CONSTRAINT",
              constraint: { id, label: rawId, entityType: state.entities[0].id, expression: prompt("Expression", "") ?? "" },
            });
          }}
          className="px-2 py-1.5 text-xs font-medium rounded-md bg-blue-600/80 text-white hover:bg-blue-500 transition-colors"
        >
          +
        </button>
      </div>
      {state.constraints.length === 0 && <p className="text-xs text-gray-600 text-center py-6">No constraints</p>}
      {state.constraints.map((c) => {
        const entityType = state.entities.find((e) => e.id === c.entityType);
        return (
          <div key={c.id} className="px-3 py-2 rounded-lg border border-gray-800 bg-gray-800/20">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-gray-200">{c.label}</span>
              <button
                type="button"
                onClick={() => dispatch({ type: "DELETE_CONSTRAINT", id: c.id })}
                className="text-gray-600 hover:text-red-400 transition-colors"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-label="Delete">
                  <path d="M6 18L18 6M6 6l12 12" strokeWidth={2} strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <div className="text-[10px] text-gray-600 font-mono truncate" title={c.expression}>{c.expression}</div>
            <div className="text-[10px] text-gray-600 mt-1">on <span className="text-gray-500">{entityType?.label ?? c.entityType}</span></div>
          </div>
        );
      })}
    </div>
  );
}

function LeftSidebarCode({ getCode, onCopy, copied }: { getCode: () => string; onCopy: () => void; copied: boolean }) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-3 border-b border-gray-800">
        <span className="text-xs text-gray-500">Generated TypeScript</span>
        <button type="button" onClick={onCopy} className="px-2 py-1 text-[10px] font-medium rounded bg-gray-800 text-gray-400 hover:text-white transition-colors">
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="flex-1 overflow-auto p-3 text-[10px] text-gray-400 font-mono leading-relaxed">
        {getCode() || "// Add entities and relations first"}
      </pre>
    </div>
  );
}

function LeftSidebarExport({ exportFormat, setExportFormat, getCode, onCopy, onDownload, copied }: {
  exportFormat: "typescript" | "mermaid" | "owl" | "shacl"; setExportFormat: (v: "typescript" | "mermaid" | "owl" | "shacl") => void; getCode: () => string; onCopy: () => void; onDownload: () => void; copied: boolean;
}) {
  return (
    <div className="p-3 space-y-3">
      <div className="space-y-2">
        {(["typescript", "mermaid", "owl", "shacl"] as const).map((fmt) => (
          <button
            key={fmt}
            type="button"
            onClick={() => setExportFormat(fmt)}
            className={`w-full px-3 py-2 rounded-lg text-xs font-medium text-left transition-colors ${exportFormat === fmt ? "bg-blue-500/15 border border-blue-500/30 text-blue-400" : "border border-gray-800 text-gray-400 hover:text-gray-200"}`}
          >
            {fmt === "typescript" && "TypeScript Code"}
            {fmt === "mermaid" && "Mermaid Diagram"}
            {fmt === "owl" && "OWL 2 Turtle"}
            {fmt === "shacl" && "SHACL Shapes"}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={onDownload} className="flex-1 px-3 py-2 text-xs font-medium rounded-md bg-blue-600 text-white hover:bg-blue-500 transition-colors">
          Download
        </button>
        <button type="button" onClick={onCopy} className="px-3 py-2 text-xs font-medium rounded-md bg-gray-800 text-gray-300 hover:text-white transition-colors">
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}

/* ─── Right Detail Panel ─── */

function RightDetailPanel({ entity, relations, constraints, detailTab, setDetailTab }: {
  entity: import("@/lib/editor-types").EditorEntity;
  relations: import("@/lib/editor-types").EditorRelation[];
  constraints: import("@/lib/editor-types").EditorConstraint[];
  detailTab: "entity" | "relation";
  setDetailTab: (t: "entity" | "relation") => void;
}) {
  const { state, dispatch } = useEditor();
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="flex flex-col h-full">
      {/* Detail header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-800">
        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: entity.color }} />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-white truncate">{entity.label}</div>
          <div className="text-[10px] text-gray-600 font-mono truncate">{entity.id}</div>
        </div>
        <button
          type="button"
          onClick={() => dispatch({ type: "DELETE_ENTITY", id: entity.id })}
          className="p-1.5 rounded-md hover:bg-red-500/20 text-gray-600 hover:text-red-400 transition-colors"
          title="Delete entity"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-label="Delete">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      {/* Detail tabs */}
      <div className="flex border-b border-gray-800">
        <button
          type="button"
          onClick={() => { setDetailTab("entity"); setIsEditing(false); }}
          className={`flex-1 px-3 py-2 text-xs font-medium transition-colors border-b-2 ${detailTab === "entity" ? "text-blue-400 border-blue-400" : "text-gray-600 border-transparent hover:text-gray-300"}`}
        >
          Details
        </button>
        <button
          type="button"
          onClick={() => setDetailTab("relation")}
          className={`flex-1 px-3 py-2 text-xs font-medium transition-colors border-b-2 ${detailTab === "relation" ? "text-blue-400 border-blue-400" : "text-gray-600 border-transparent hover:text-gray-300"}`}
        >
          Relations ({relations.length})
        </button>
      </div>

      {/* Detail content */}
      <div className="flex-1 overflow-y-auto">
        {detailTab === "entity" && (
          <div className="p-4 space-y-4">
            {/* Kind select */}
            <div>
              <label htmlFor="entity-kind" className="text-[10px] uppercase tracking-wider text-gray-600 font-medium mb-1.5 block">Kind</label>
              <select
                id="entity-kind"
                value={entity.kind}
                onChange={(e) => dispatch({ type: "UPDATE_ENTITY", id: entity.id, entity: { kind: e.target.value as typeof entity.kind } })}
                className="w-full px-3 py-2 text-xs bg-gray-800/50 border border-gray-700/50 rounded-md text-gray-300 focus:outline-none focus:border-blue-500/50"
              >
                <option value="entity">entity</option>
                <option value="event">event</option>
                <option value="role">role</option>
                <option value="value">value</option>
              </select>
            </div>

            <div>
              <span className="text-[10px] uppercase tracking-wider text-gray-600 font-medium mb-1.5 block">Color</span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  "#7B1FA2", "#C62828", "#AD1457", "#6A1B9A", "#1565C0",
                  "#00695C", "#2E7D32", "#4CAF50", "#FF9800", "#F57C00",
                  "#E65100", "#0277BD", "#607D8B", "#5C6BC0", "#81C784",
                ].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => dispatch({ type: "UPDATE_ENTITY", id: entity.id, entity: { color: c } })}
                    className={`w-5 h-5 rounded-full transition-transform ${entity.color === c ? "scale-125 ring-2 ring-white/30" : "hover:scale-110"}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            {/* Rename */}
            <div>
              <label htmlFor="entity-label" className="text-[10px] uppercase tracking-wider text-gray-600 font-medium mb-1.5 block">Label</label>
              <input
                id="entity-label"
                type="text"
                value={entity.label}
                onChange={(e) => dispatch({ type: "UPDATE_ENTITY", id: entity.id, entity: { label: e.target.value } })}
                className="w-full px-3 py-2 text-xs bg-gray-800/50 border border-gray-700/50 rounded-md text-gray-300 focus:outline-none focus:border-blue-500/50"
              />
            </div>

            {/* Attributes */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase tracking-wider text-gray-600 font-medium">
                  Attributes ({entity.attributes.length})
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const ref = prompt("Attribute name (e.g. scm:maxCapacity)", "");
                    if (!ref) return;
                    if (entity.attributes.some((a) => a.ref === ref)) return;
                    dispatch({
                      type: "ADD_ATTRIBUTE",
                      entityId: entity.id,
                      attribute: { ref, required: false, identity: false },
                    });
                  }}
                  className="px-2 py-1 text-[10px] font-medium rounded bg-blue-600/60 text-white hover:bg-blue-500 transition-colors"
                >
                  + Add
                </button>
              </div>
              {entity.attributes.length === 0 && (
                <p className="text-[10px] text-gray-700 italic">No attributes defined</p>
              )}
              <div className="space-y-1.5">
                {entity.attributes.map((attr) => (
                  <div key={attr.ref} className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-gray-800/30 border border-gray-700/30">
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] text-gray-300 font-mono truncate">{attr.ref}</div>
                      <div className="flex items-center gap-1 mt-0.5">
                        {attr.identity && <span className="text-[9px] px-1 py-px rounded bg-yellow-500/20 text-yellow-400">ID</span>}
                        {attr.required && <span className="text-[9px] px-1 py-px rounded bg-red-500/20 text-red-400">Required</span>}
                      </div>
                    </div>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={attr.required}
                        onChange={() => {
                          dispatch({
                            type: "DELETE_ATTRIBUTE",
                            entityId: entity.id,
                            attributeRef: attr.ref,
                          });
                          dispatch({
                            type: "ADD_ATTRIBUTE",
                            entityId: entity.id,
                            attribute: { ...attr, required: !attr.required },
                          });
                        }}
                        className="w-3 h-3 rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-blue-500/30"
                      />
                      <span className="text-[9px] text-gray-600">Req</span>
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={attr.identity}
                        onChange={() => {
                          dispatch({ type: "DELETE_ATTRIBUTE", entityId: entity.id, attributeRef: attr.ref });
                          dispatch({ type: "ADD_ATTRIBUTE", entityId: entity.id, attribute: { ...attr, identity: !attr.identity } });
                        }}
                        className="w-3 h-3 rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-blue-500/30"
                      />
                      <span className="text-[9px] text-gray-600">ID</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => dispatch({ type: "DELETE_ATTRIBUTE", entityId: entity.id, attributeRef: attr.ref })}
                      className="text-gray-700 hover:text-red-400 transition-colors p-0.5"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-label="Delete">
                        <path d="M6 18L18 6M6 6l12 12" strokeWidth={2} strokeLinecap="round" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Constraints section */}
            {state.constraints.filter((c) => c.entityType === entity.id).length > 0 && (
              <div>
                 <span className="text-[10px] uppercase tracking-wider text-gray-600 font-medium mb-2 block">
                  Constraints ({state.constraints.filter((c: EditorConstraint) => c.entityType === entity.id).length})
                </span>
                <div className="space-y-1.5">
                  {state.constraints.filter((c) => c.entityType === entity.id).map((c) => (
                    <div key={c.id} className="px-3 py-2 rounded-md bg-gray-800/30 border border-gray-700/30">
                      <div className="text-[11px] text-gray-300 font-medium">{c.label}</div>
                      <div className="text-[10px] text-gray-600 font-mono mt-0.5">{c.expression}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {detailTab === "relation" && (
          <div className="p-4 space-y-3">
            {relations.length === 0 && (
              <div className="text-center py-8">
                <svg className="w-8 h-8 text-gray-800 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-label="No relations">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a7.99 7.99 0 01-4.2-1.18M3 12c0-4.418 3.582-8 8-8a7.99 7.99 0 014.2 1.18" />
                </svg>
                <p className="text-xs text-gray-700">No relations connected to this entity</p>
              </div>
            )}
            {relations.map((r) => {
              const isSource = r.source === entity.id;
              const otherId = isSource ? r.target : r.source;
              const other = state.entities.find((e) => e.id === otherId);
              return (
                <div key={r.id} className="px-3 py-2.5 rounded-lg border border-gray-800 bg-gray-800/20">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isSource ? "bg-blue-500" : "bg-green-500"}`} />
                    <span className="text-[10px] text-gray-600">{isSource ? "from" : "to"}</span>
                    <span className="text-xs font-medium text-gray-200">{r.label}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-2 ml-4">
                    {other && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: other.color }} />}
                    <span className="text-[10px] text-gray-500 font-mono truncate" title={otherId}>{other?.label ?? otherId}</span>
                  </div>
                  {r.inverse && <div className="text-[10px] text-gray-700 mt-1 ml-4">inverse: {r.inverse}</div>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function OntologyEditorPage() {
  return (
    <EditorProvider>
      <EditorInner />
    </EditorProvider>
  );
}
