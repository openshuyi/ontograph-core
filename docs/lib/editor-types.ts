export interface EditorEntity {
  id: string;
  label: string;
  kind: "entity" | "event" | "role" | "value";
  color: string;
  icon?: string;
  description?: string;
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

export const INITIAL_STATE: OntologyEditorState = {
  entities: [
    {
      id: "scm:Supplier",
      label: "Supplier",
      kind: "entity",
      color: "#7B1FA2",
      attributes: [
        { ref: "scm:organizationCode", required: true, identity: true },
        { ref: "scm:name", required: true },
        { ref: "scm:country" },
        { ref: "scm:region" },
        { ref: "scm:supplierTier" },
        { ref: "scm:riskLevel" },
        { ref: "scm:certification" },
        { ref: "scm:complianceStatus" },
      ],
    },
    {
      id: "scm:Manufacturer",
      label: "Manufacturer",
      kind: "entity",
      color: "#C62828",
      attributes: [
        { ref: "scm:organizationCode", required: true, identity: true },
        { ref: "scm:name", required: true },
        { ref: "scm:country" },
        { ref: "scm:region" },
        { ref: "scm:certification" },
      ],
    },
    {
      id: "scm:Distributor",
      label: "Distributor",
      kind: "entity",
      color: "#AD1457",
      attributes: [
        { ref: "scm:organizationCode", required: true, identity: true },
        { ref: "scm:name", required: true },
        { ref: "scm:country" },
        { ref: "scm:region" },
      ],
    },
    {
      id: "scm:Retailer",
      label: "Retailer",
      kind: "entity",
      color: "#6A1B9A",
      attributes: [
        { ref: "scm:organizationCode", required: true, identity: true },
        { ref: "scm:name", required: true },
        { ref: "scm:country" },
      ],
    },
    {
      id: "scm:Product",
      label: "Product",
      kind: "entity",
      color: "#2E7D32",
      attributes: [
        { ref: "scm:skuCode", required: true, identity: true },
        { ref: "scm:gtin" },
        { ref: "scm:name", required: true },
        { ref: "scm:description" },
        { ref: "scm:unitPrice" },
        { ref: "scm:currency" },
        { ref: "scm:uom" },
        { ref: "scm:weight" },
      ],
    },
    {
      id: "scm:Warehouse",
      label: "Warehouse",
      kind: "entity",
      color: "#FF9800",
      attributes: [
        { ref: "scm:facilityCode", required: true, identity: true },
        { ref: "scm:name", required: true },
        { ref: "scm:address" },
        { ref: "scm:latitude" },
        { ref: "scm:longitude" },
        { ref: "scm:capacity" },
      ],
    },
    {
      id: "scm:Shipment",
      label: "Shipment",
      kind: "entity",
      color: "#0277BD",
      attributes: [
        { ref: "scm:shipmentNo", required: true, identity: true },
        { ref: "scm:transportMode" },
        { ref: "scm:quantity" },
        { ref: "scm:weight" },
        { ref: "scm:status" },
      ],
    },
    {
      id: "scm:Order",
      label: "Sales Order",
      kind: "entity",
      color: "#4CAF50",
      attributes: [
        { ref: "scm:orderNo", required: true, identity: true },
        { ref: "scm:orderDate" },
        { ref: "scm:totalAmount" },
        { ref: "scm:currency" },
        { ref: "scm:paymentStatus" },
      ],
    },
    {
      id: "scm:Carrier",
      label: "Carrier",
      kind: "entity",
      color: "#1565C0",
      attributes: [
        { ref: "scm:organizationCode", required: true, identity: true },
        { ref: "scm:name", required: true },
        { ref: "scm:country" },
        { ref: "scm:transportMode" },
      ],
    },
    {
      id: "scm:Invoice",
      label: "Invoice",
      kind: "entity",
      color: "#81C784",
      attributes: [
        { ref: "scm:invoiceNo", required: true, identity: true },
        { ref: "scm:totalAmount" },
        { ref: "scm:taxAmount" },
        { ref: "scm:currency" },
        { ref: "scm:paymentStatus" },
      ],
    },
  ],
  relations: [
    {
      id: "scm:supplies",
      label: "Supplies",
      source: "scm:Supplier",
      target: "scm:Product",
      inverse: "scm:suppliedBy",
    },
    {
      id: "scm:manufactures",
      label: "Manufactures",
      source: "scm:Manufacturer",
      target: "scm:Product",
      inverse: "scm:manufacturedBy",
    },
    {
      id: "scm:distributes",
      label: "Distributes",
      source: "scm:Distributor",
      target: "scm:Product",
    },
    {
      id: "scm:retails",
      label: "Retails",
      source: "scm:Retailer",
      target: "scm:Product",
    },
    {
      id: "scm:storedIn",
      label: "Stored In",
      source: "scm:Product",
      target: "scm:Warehouse",
      inverse: "scm:storesProduct",
    },
    {
      id: "scm:containsItem",
      label: "Contains Item",
      source: "scm:Order",
      target: "scm:Product",
    },
    {
      id: "scm:fulfillsOrder",
      label: "Fulfills Order",
      source: "scm:Shipment",
      target: "scm:Order",
    },
    {
      id: "scm:shippedBy",
      label: "Shipped By",
      source: "scm:Shipment",
      target: "scm:Carrier",
      inverse: "scm:hasCarrier",
    },
    {
      id: "scm:generatesInvoice",
      label: "Generates Invoice",
      source: "scm:Order",
      target: "scm:Invoice",
    },
  ],
  constraints: [
    {
      id: "scm:PositiveCapacity",
      label: "Positive Capacity",
      entityType: "scm:Warehouse",
      expression: "gt(scm:capacity, 0)",
    },
    {
      id: "scm:PositiveOrderAmount",
      label: "Positive Order Amount",
      entityType: "scm:Order",
      expression: "gt(scm:totalAmount, 0)",
    },
    {
      id: "scm:ValidCurrency",
      label: "Valid Currency",
      entityType: "scm:Order",
      expression: "or(eq(scm:currency, 'USD'), eq(scm:currency, 'CNY'), eq(scm:currency, 'EUR'))",
    },
    {
      id: "scm:NonNegativeWeight",
      label: "Non-negative Shipment Weight",
      entityType: "scm:Shipment",
      expression: "gte(scm:weight, 0)",
    },
  ],
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
          state.selectedEntityId === action.id
            ? null
            : state.selectedEntityId,
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
