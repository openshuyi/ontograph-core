"use client";

import { useEditor } from "@/lib/editor-context";
import type { EditorRelation } from "@/lib/editor-types";

export function RelationPanel() {
  const { state, dispatch } = useEditor();

  function addRelation() {
    if (state.entities.length < 2) {
      alert("Need at least 2 entities to create a relation.");
      return;
    }
    const id = `sc:${prompt("Relation ID (e.g. supplies)", "newRelation")}`;
    if (!id || state.relations.some((r) => r.id === id)) {
      alert("Relation ID is required or already exists.");
      return;
    }
    const relation: EditorRelation = {
      id,
      label: prompt("Relation label", id.split(":")[1] ?? id) ?? id.split(":")[1] ?? id,
      source: state.entities[0].id,
      target: state.entities[1]?.id ?? state.entities[0].id,
    };
    dispatch({ type: "ADD_RELATION", relation });
  }

  function deleteRelation(id: string) {
    dispatch({ type: "DELETE_RELATION", id });
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-3 border-b border-gray-700/50">
        <h3 className="text-sm font-semibold text-white">Relations</h3>
        <button
          type="button"
          onClick={addRelation}
          className="px-2.5 py-1 text-xs font-medium rounded bg-blue-600 text-white hover:bg-blue-500 transition-colors"
        >
          + Add
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {state.relations.length === 0 && (
          <p className="text-xs text-gray-500 text-center py-8">No relations yet. Click "+ Add" to create one.</p>
        )}
        {state.relations.map((rel) => (
          <div key={rel.id} className="rounded-lg border border-gray-700/50 bg-gray-800/30 p-2.5">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate">{rel.label}</div>
                <div className="text-xs text-gray-500 font-mono truncate">{rel.id}</div>
              </div>
              <button
                type="button"
                onClick={() => deleteRelation(rel.id)}
                className="p-1 rounded hover:bg-red-500/20 text-gray-400 hover:text-red-400"
                title="Delete"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-label="Delete">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-gray-300 font-mono truncate max-w-[45%]" title={rel.source}>
                {rel.source.split(":")[1] ?? rel.source}
              </span>
              <span className="text-blue-400 flex-shrink-0">→</span>
              <span className="text-gray-300 font-mono truncate max-w-[45%]" title={rel.target}>
                {rel.target.split(":")[1] ?? rel.target}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
