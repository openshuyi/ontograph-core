import type { OntologyEditorState } from "./editor-types";

function escapeTurtle(id: string): string {
  return id.includes(":") ? id : `sc:${id}`;
}

export function generateOWL(state: OntologyEditorState): string {
  const prefix = "@prefix owl: <http://www.w3.org/2002/07/owl#> .\n@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .\n@prefix sc: <https://ontograph.example/sc#> .\n\n";

  const entities = state.entities
    .map((e) => {
      const label = `\n  rdfs:label "${e.label}"`;
      return `${escapeTurtle(e.id)} a owl:Class${label} .`;
    })
    .join("\n\n");

  const relations = state.relations
    .map((r) => {
      const domain = `  rdfs:domain ${escapeTurtle(r.source)}`;
      const range = `  rdfs:range ${escapeTurtle(r.target)}`;
      return `${escapeTurtle(r.id)} a owl:ObjectProperty ;\n${domain} ;\n${range} .`;
    })
    .join("\n\n");

  return `${prefix}# Entities\n\n${entities}\n\n# Relations\n\n${relations}`;
}

export function generateSHACL(state: OntologyEditorState): string {
  const prefix = "@prefix sh: <http://www.w3.org/ns/shacl#> .\n@prefix sc: <https://ontograph.example/sc#> .\n\n";

  const shapes = state.entities
    .map((e) => {
      const props = e.attributes
        .map((a) => {
          const req = a.required ? "\n    sh:minCount 1" : "";
          return `  sc:PropertyShape [\n    sh:path ${escapeTurtle(a.ref)}${req}\n  ] ;`;
        })
        .join("\n");
      return `${escapeTurtle(e.id)}Shape a sh:NodeShape ;\n  sh:targetClass ${escapeTurtle(e.id)} ;\n${props || "  # no properties"}`;
    })
    .join("\n\n");

  return `${prefix}${shapes}`;
}

export function generateMermaid(state: OntologyEditorState): string {
  const lines = ["classDiagram"];

  for (const entity of state.entities) {
    const attrs = entity.attributes.map((a) => {
      const req = a.required ? "*" : "";
      return `    ${a.ref}${req}`;
    });
    lines.push(`  class ${entity.id.split(":")[1] ?? entity.id} {`);
    lines.push(...attrs);
    lines.push(`  }`);
  }

  for (const rel of state.relations) {
    const source = rel.source.split(":")[1] ?? rel.source;
    const target = rel.target.split(":")[1] ?? rel.target;
    const label = rel.label || "";
    lines.push(`  ${source} --> ${target} : ${label}`);
  }

  return lines.join("\n");
}

export function generateTypeScript(state: OntologyEditorState): string {
  const entityDefs = state.entities
    .map((e) => {
      let code = `defineEntity("${e.id}", { label: { en: "${e.label}" }, kind: "${e.kind}" })`;
      for (const a of e.attributes) {
        const req = a.required ? "true" : "false";
        const identity = a.identity ? ", identity: true" : "";
        code += `\n  .attr("${a.ref}", { required: ${req}${identity} })`;
      }
      code += "\n  .build()";
      return code;
    })
    .join("\n\n");

  const relationDefs = state.relations
    .map((r) => {
      return `defineRelation("${r.id}", { label: { en: "${r.label}" } }, "${r.source}", "${r.target}")`;
    })
    .join("\n\n");

  const lines = [
    'import { defineEntity, defineRelation } from "@ontograph/core";',
    "",
    "// Entities",
    "",
    entityDefs,
    "",
    "// Relations",
    "",
    relationDefs,
  ];

  return lines.join("\n");
}
