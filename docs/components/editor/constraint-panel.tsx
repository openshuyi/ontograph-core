"use client";

import { useEditor } from "@/lib/editor-context";
import type { EditorConstraint } from "@/lib/editor-types";

export function ConstraintPanel() {
  const { state, dispatch } = useEditor();

  function addConstraint() {
    if (state.entities.length === 0) {
      alert("Need at least one entity to create a constraint.");
      return;
    }
    const id = `sc:${prompt("Constraint ID (e.g. PositiveCapacity)", "NewConstraint")}`;
    if (!id) return;
    const constraint: EditorConstraint = {
      id,
      label: prompt("Constraint label", id.split(":")[1] ?? id) ?? id,
      entityType: state.entities[0].id,
      expression: prompt("Expression (e.g. gt(scm:capacity, 0))", "") ?? "",
    };
    dispatch({ type: "ADD_CONSTRAINT", constraint });
  }

  function deleteConstraint(id: string) {
    dispatch({ type: "DELETE_CONSTRAINT", id });
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-3 border-b border-gray-700/50">
        <h3 className="text-sm font-semibold text-white">Constraints</h3>
        <button
          type="button"
          onClick={addConstraint}
          className="px-2.5 py-1 text-xs font-medium rounded bg-blue-600 text-white hover:bg-blue-500 transition-colors"
        >
          + Add
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {state.constraints.length === 0 && (
          <p className="text-xs text-gray-500 text-center py-8">No constraints yet.</p>
        )}
        {state.constraints.map((c) => {
          const entityType = state.entities.find((e) => e.id === c.entityType);
          return (
            <div key={c.id} className="rounded-lg border border-gray-700/50 bg-gray-800/30 p-2.5">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate">{c.label}</div>
                  <div className="text-xs text-gray-500 font-mono truncate">{c.id}</div>
                </div>
                <button
                  type="button"
                  onClick={() => deleteConstraint(c.id)}
                  className="p-1 rounded hover:bg-red-500/20 text-gray-400 hover:text-red-400"
                  title="Delete"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-label="Delete">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
              <div className="text-xs text-gray-400">
                Entity: <span className="text-gray-300 font-mono">{entityType?.label ?? c.entityType}</span>
              </div>
              <div className="text-xs text-gray-400 mt-1 font-mono truncate" title={c.expression}>
                {c.expression || <span className="text-gray-600 italic">no expression</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
