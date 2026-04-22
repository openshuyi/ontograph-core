"use client";

import { useEditor } from "@/lib/editor-context";
import type { EditorEntity } from "@/lib/editor-types";

const PRESET_COLORS = [
  "#7B1FA2", "#C62828", "#AD1457", "#6A1B9A", "#1565C0",
  "#00695C", "#2E7D32", "#FF9800", "#F57C00", "#E65100",
  "#4CAF50", "#66BB6A", "#0277BD", "#607D8B", "#78909C",
];

const ENTITY_ICONS = ["cube", "users", "file-text", "map", "database", "package", "truck", "factory", "warehouse", "shield", "tag", "credit-card", "activity", "settings", "user", "briefcase"];

export function EntityPanel() {
  const { state, dispatch } = useEditor();

  function addEntity() {
    const rawId = prompt("Entity ID (e.g. Product)", "NewEntity");
    if (!rawId) return;
    const id = `sc:${rawId}`;
    if (!id) return;
    const exists = state.entities.some((e) => e.id === id);
    if (exists) {
      alert("Entity already exists");
      return;
    }
    const rawLabel = prompt("Entity label", id.split(":")[1] ?? id);
    const entity: EditorEntity = {
      id,
      label: rawLabel ?? id.split(":")[1] ?? id,
      kind: "entity",
      color: PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)],
      attributes: [],
    };
    dispatch({ type: "ADD_ENTITY", entity });
    dispatch({ type: "SELECT_ENTITY", id });
  }

  function updateEntity(id: string, updates: Partial<EditorEntity>) {
    dispatch({ type: "UPDATE_ENTITY", id, entity: updates });
  }

  function deleteEntity(id: string) {
    if (confirm("Delete this entity and all related relations/constraints?")) {
      dispatch({ type: "DELETE_ENTITY", id });
    }
  }

  function addAttribute(entityId: string) {
    const ref = prompt("Attribute name (e.g. scm:name)", "scm:newAttr");
    if (!ref) return;
    dispatch({
      type: "ADD_ATTRIBUTE",
      entityId,
      attribute: { ref, required: false, identity: false },
    });
  }

  function deleteAttribute(entityId: string, attrRef: string) {
    dispatch({ type: "DELETE_ATTRIBUTE", entityId, attributeRef: attrRef });
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-3 border-b border-gray-700/50">
        <h3 className="text-sm font-semibold text-white">Entities</h3>
        <button
          type="button"
          onClick={addEntity}
          className="px-2.5 py-1 text-xs font-medium rounded bg-blue-600 text-white hover:bg-blue-500 transition-colors"
        >
          + Add
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {state.entities.length === 0 && (
          <p className="text-xs text-gray-500 text-center py-8">No entities yet. Click "+ Add" to create one.</p>
        )}
        {state.entities.map((entity) => (
          <div
            key={entity.id}
            className={`rounded-lg border transition-colors ${state.selectedEntityId === entity.id ? "border-blue-500 bg-blue-500/10" : "border-gray-700/50 bg-gray-800/30 hover:bg-gray-800/50"}`}
          >
            <div className="flex items-center gap-2 p-2.5">
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: entity.color }} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate">{entity.label}</div>
                <div className="text-xs text-gray-500 font-mono truncate">{entity.id}</div>
              </div>
              <button
                type="button"
                onClick={() => updateEntity(entity.id, { label: prompt("New label", entity.label) ?? entity.label })}
                className="p-1 rounded hover:bg-gray-700/50 text-gray-400 hover:text-gray-200"
                title="Rename"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-label="Edit">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => deleteEntity(entity.id)}
                className="p-1 rounded hover:bg-red-500/20 text-gray-400 hover:text-red-400"
                title="Delete"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-label="Delete">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
            <div className="px-3 pb-2.5 flex items-center gap-2">
              <label htmlFor={`kind-${entity.id}`} className="text-xs text-gray-500 flex-shrink-0">Kind:</label>
              <select
                id={`kind-${entity.id}`}
                value={entity.kind}
                onChange={(e) => updateEntity(entity.id, { kind: e.target.value as EditorEntity["kind"] })}
                className="text-xs bg-gray-800 border border-gray-700 rounded px-2 py-1 text-gray-300"
              >
                <option value="entity">entity</option>
                <option value="event">event</option>
                <option value="role">role</option>
                <option value="value">value</option>
              </select>
            </div>
            <div className="px-3 pb-2.5 border-t border-gray-700/30 pt-2">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-gray-400">Attributes ({entity.attributes.length})</span>
                <button
                  type="button"
                  onClick={() => addAttribute(entity.id)}
                  className="text-xs text-blue-400 hover:text-blue-300"
                >
                  + Add
                </button>
              </div>
              <div className="space-y-1">
                {entity.attributes.map((attr) => (
                  <div key={attr.ref} className="flex items-center gap-1.5">
                    <span className="text-xs text-gray-400 font-mono truncate flex-1">{attr.ref}</span>
                    {attr.identity && <span className="text-[10px] px-1 py-0.5 rounded bg-yellow-500/20 text-yellow-400">ID</span>}
                    {attr.required && <span className="text-[10px] px-1 py-0.5 rounded bg-red-500/20 text-red-400">Req</span>}
                    <button
                      type="button"
                      onClick={() => {
                        const newAttr = prompt("Rename attribute", attr.ref);
                        if (newAttr && newAttr !== attr.ref) {
                          deleteAttribute(entity.id, attr.ref);
                          dispatch({
                            type: "ADD_ATTRIBUTE",
                            entityId: entity.id,
                            attribute: { ref: newAttr, required: attr.required, identity: attr.identity },
                          });
                        }
                      }}
                      className="text-[10px] text-gray-500 hover:text-gray-300"
                    >
                      ✏️
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteAttribute(entity.id, attr.ref)}
                      className="text-[10px] text-gray-500 hover:text-red-400"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
