/**
 * Transform the supply chain object model into D3 force graph format.
 *
 * Data is imported directly from `@ontograph/core` (packages/core/src/examples/)
 * so the docs site always reflects the real example data — no inline copies.
 */

import { supplyChainObjectModel } from "@ontograph/core/examples/objects";
import { supplyChainOntology } from "@ontograph/core/examples/supply-chain-ontology";
import type { LocalizedText } from "@ontograph/core/types";
import type { GraphLink, GraphNode } from "../components/force-graph";

const FALLBACK_COLOR = "#999";

function pickText(text: LocalizedText | undefined, fallback: string): string {
  return text?.en ?? text?.zh ?? fallback;
}

// entityTypeRef → color from EntityType.ui.color in the ontology
const colorByEntityType = new Map<string, string>();
for (const type of supplyChainOntology.entityTypes) {
  if (type.ui?.color) {
    colorByEntityType.set(type["@id"], type.ui.color);
  }
}

const classById = new Map(
  supplyChainObjectModel.classes.map((cls) => [cls["@id"], cls]),
);

// "Warehouse Object Class" → "Warehouse" for legend/readability
const OBJECT_CLASS_SUFFIX = / (Object Class|对象类)$/;

export function getSupplyChainGraphData(): {
  nodes: GraphNode[];
  links: GraphLink[];
} {
  const nodes: GraphNode[] = supplyChainObjectModel.instances.map((inst) => {
    const cls = classById.get(inst.classRef);
    return {
      id: inst["@id"],
      label: pickText(inst.label, inst["@id"]),
      group: pickText(cls?.label, inst.classRef).replace(
        OBJECT_CLASS_SUFFIX,
        "",
      ),
      color:
        (cls && colorByEntityType.get(cls.entityTypeRef)) || FALLBACK_COLOR,
      properties: inst.propertyValues,
    };
  });

  const links: GraphLink[] = supplyChainObjectModel.links.map((link) => ({
    source: link.fromObjectId,
    target: link.toObjectId,
    type: link.relationTypeRef,
    label: link.label ? pickText(link.label, link.relationTypeRef) : undefined,
    properties: link.properties,
  }));

  return { nodes, links };
}
