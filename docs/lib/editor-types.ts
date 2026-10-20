import { supplyChainOntology } from "@ontograph/core/examples/supply-chain-ontology";
import type { EntityType, LocalizedText } from "@ontograph/core/types";

export interface EditorEntity {
  id: string;
  label: string;
  kind: "entity" | "event" | "role" | "value";
  color: string;
  icon?: string;
  description?: string;
  /** 继承的父类型 @id 列表（is-a 层级） */
  extends?: string[];
  attributes: EditorAttribute[];
}

export interface EditorAttribute {
  ref: string;
  required?: boolean;
  identity?: boolean;
}

export interface EditorRelation {
  id: string;
  label: string;
  source: string;
  target: string;
  inverse?: string;
  description?: string;
}

export interface EditorConstraint {
  id: string;
  label: string;
  entityType: string;
  expression: string;
  description?: string;
}

export interface OntologyEditorState {
  entities: EditorEntity[];
  relations: EditorRelation[];
  constraints: EditorConstraint[];
  selectedEntityId: string | null;
  activeTab: string;
}

export type EditorAction =
  | { type: "ADD_ENTITY"; entity: EditorEntity }
  | { type: "UPDATE_ENTITY"; id: string; entity: Partial<EditorEntity> }
  | { type: "DELETE_ENTITY"; id: string }
  | { type: "ADD_ATTRIBUTE"; entityId: string; attribute: EditorAttribute }
  | { type: "DELETE_ATTRIBUTE"; entityId: string; attributeRef: string }
  | { type: "ADD_RELATION"; relation: EditorRelation }
  | { type: "UPDATE_RELATION"; id: string; relation: Partial<EditorRelation> }
  | { type: "DELETE_RELATION"; id: string }
  | { type: "ADD_CONSTRAINT"; constraint: EditorConstraint }
  | { type: "DELETE_CONSTRAINT"; id: string }
  | { type: "SELECT_ENTITY"; id: string | null }
  | { type: "SET_ACTIVE_TAB"; tab: string }
  | { type: "LOAD_STATE"; state: OntologyEditorState }
  | { type: "RESET_STATE" };

const KIND_FALLBACK_COLOR: Record<EditorEntity["kind"], string> = {
  entity: "#B93A2E",
  event: "#1F6E93",
  role: "#3E8C7A",
  value: "#E0B84D",
};

function pickText(text: LocalizedText | undefined, fallback: string): string {
  return text?.en ?? text?.zh ?? fallback;
}

function toEditorEntity(type: EntityType): EditorEntity {
  return {
    id: type["@id"],
    label: pickText(type.label, type["@id"]),
    kind: type.kind,
    color: type.ui?.color ?? KIND_FALLBACK_COLOR[type.kind],
    icon: type.ui?.icon,
    description: type.description ? pickText(type.description, "") : undefined,
    extends: type.extends,
    attributes: type.attributes.map((a) => ({
      ref: a.ref,
      required: a.required,
      identity: a.identity,
    })),
  };
}

/**
 * Initial editor state, derived directly from the supply chain example
 * ontology (packages/core/src/examples/): all entity/event/role types,
 * relation types and constraints. Value types are omitted — their
 * enum shape does not fit the entity/attribute editor model.
 */
export const INITIAL_STATE: OntologyEditorState = {
  entities: [
    ...supplyChainOntology.entityTypes,
    ...(supplyChainOntology.eventTypes ?? []),
    ...(supplyChainOntology.roleTypes ?? []),
  ].map(toEditorEntity),
  relations: supplyChainOntology.relationTypes.map((r) => ({
    id: r["@id"],
    label: pickText(r.label, r["@id"]),
    source: r.domain,
    target: r.range,
    inverse: r.inverse,
    description: r.description ? pickText(r.description, "") : undefined,
  })),
  constraints: supplyChainOntology.constraints.map((c) => ({
    id: c["@id"],
    label: c.label ? pickText(c.label, c["@id"]) : c["@id"],
    entityType: c.on,
    expression: c.rule,
    description: c.message ? pickText(c.message, "") : undefined,
  })),
  selectedEntityId: null,
  activeTab: "entities",
};

export function editorReducer(
  state: OntologyEditorState,
  action: EditorAction,
): OntologyEditorState {
  switch (action.type) {
    case "ADD_ENTITY":
      return { ...state, entities: [...state.entities, action.entity] };
    case "UPDATE_ENTITY":
      return {
        ...state,
        entities: state.entities.map((e) =>
          e.id === action.id ? { ...e, ...action.entity } : e,
        ),
      };
    case "DELETE_ENTITY": {
      return {
        ...state,
        entities: state.entities.filter((e) => e.id !== action.id),
        relations: state.relations.filter(
          (r) => r.source !== action.id && r.target !== action.id,
        ),
        constraints: state.constraints.filter(
          (c) => c.entityType !== action.id,
        ),
        selectedEntityId:
          state.selectedEntityId === action.id ? null : state.selectedEntityId,
      };
    }
    case "ADD_ATTRIBUTE":
      return {
        ...state,
        entities: state.entities.map((e) =>
          e.id === action.entityId
            ? { ...e, attributes: [...e.attributes, action.attribute] }
            : e,
        ),
      };
    case "DELETE_ATTRIBUTE":
      return {
        ...state,
        entities: state.entities.map((e) =>
          e.id === action.entityId
            ? {
                ...e,
                attributes: e.attributes.filter(
                  (a) => a.ref !== action.attributeRef,
                ),
              }
            : e,
        ),
      };
    case "ADD_RELATION":
      return { ...state, relations: [...state.relations, action.relation] };
    case "UPDATE_RELATION":
      return {
        ...state,
        relations: state.relations.map((r) =>
          r.id === action.id ? { ...r, ...action.relation } : r,
        ),
      };
    case "DELETE_RELATION":
      return {
        ...state,
        relations: state.relations.filter((r) => r.id !== action.id),
      };
    case "ADD_CONSTRAINT":
      return {
        ...state,
        constraints: [...state.constraints, action.constraint],
      };
    case "DELETE_CONSTRAINT":
      return {
        ...state,
        constraints: state.constraints.filter((c) => c.id !== action.id),
      };
    case "SELECT_ENTITY":
      return { ...state, selectedEntityId: action.id };
    case "SET_ACTIVE_TAB":
      return { ...state, activeTab: action.tab };
    case "LOAD_STATE":
      return { ...action.state };
    case "RESET_STATE":
      return { ...INITIAL_STATE };
    default:
      return state;
  }
}
