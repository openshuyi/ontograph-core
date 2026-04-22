"use client";

import React, { createContext, useContext, useReducer, useEffect } from "react";
import {
  type OntologyEditorState,
  type EditorAction,
  INITIAL_STATE,
  editorReducer,
} from "./editor-types";

interface EditorContextType {
  state: OntologyEditorState;
  dispatch: React.Dispatch<EditorAction>;
}

const EditorContext = createContext<EditorContextType | null>(null);

const STORAGE_KEY = "ontograph-editor-state";

function loadState(): OntologyEditorState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.entities?.length || parsed.relations?.length) {
        return { ...INITIAL_STATE, ...parsed };
      }
    }
  } catch {}
  return INITIAL_STATE;
}

function saveState(state: OntologyEditorState) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        entities: state.entities,
        relations: state.relations,
        constraints: state.constraints,
      }),
    );
  } catch {}
}

export function EditorProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(editorReducer, INITIAL_STATE, loadState);

  useEffect(() => {
    saveState(state);
  }, [state]);

  return (
    <EditorContext.Provider value={{ state, dispatch }}>
      {children}
    </EditorContext.Provider>
  );
}

export function useEditor() {
  const ctx = useContext(EditorContext);
  if (!ctx) throw new Error("useEditor must be used within EditorProvider");
  return ctx;
}
