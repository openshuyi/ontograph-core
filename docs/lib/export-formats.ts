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

export function generateDot(state: OntologyEditorState): string {
  const lines = ["digraph Ontology {"];
  lines.push('  rankdir="LR";');
  lines.push('  node [style=filled, fillcolor="#f5f5f5", fontname="Helvetica"];');
  lines.push('  edge [fontname="Helvetica", fontsize=10];');
  lines.push("");

  // Generate nodes for entities
  for (const entity of state.entities) {
    const label = entity.label.replace(/"/g, '\\"');
    const attrs = entity.attributes
      .map((a) => {
        const req = a.required ? " *" : "";
        const iden = a.identity ? " 🔑" : "";
        return `${a.ref.replace(entity.id.split(":")[0] + ":", "")}${req}${iden}`;
      })
      .join("\\n");
    const nodeLabel = attrs ? `${label}\\n\\n${attrs}` : label;
    const safeColor = entity.color.replace("#", "");
    lines.push(`  "${entity.id}" [label="${nodeLabel}", fillcolor="${entity.color}20", color="${entity.color}"];`);
  }

  lines.push("");

  // Generate edges for relations
  for (const rel of state.relations) {
    const label = rel.label.replace(/"/g, '\\"');
    lines.push(`  "${rel.source}" -> "${rel.target}" [label="${label}"];`);
  }

  lines.push("}");
  return lines.join("\n");
}

export function generateJsonSchema(state: OntologyEditorState): string {
  const schema: Record<string, unknown> = {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: "https://ontograph.example/ontology-schema.json",
    title: "Ontology Schema",
    description: "JSON Schema for the supply chain ontology",
    $defs: {},
  };

  for (const entity of state.entities) {
    const entityName = entity.id.split(":")[1] ?? entity.id;
    const properties: Record<string, unknown> = {};
    const required: string[] = [];

    for (const attr of entity.attributes) {
      const attrName = attr.ref.split(":")[1] ?? attr.ref;
      properties[attrName] = {
        type: "string",
        description: `${entity.label} ${attrName}`,
      };
      if (attr.required) {
        required.push(attrName);
      }
    }

    (schema.$defs as Record<string, unknown>)[entityName] = {
      type: "object",
      title: entity.label,
      description: `${entity.label} entity type`,
      properties,
      required: required.length > 0 ? required : undefined,
    };
  }

  return JSON.stringify(schema, null, 2);
}

export function generateNeo4jCypher(state: OntologyEditorState): string {
  const lines: string[] = [];
  lines.push("// Neo4j Cypher DDL for Ontology");
  lines.push("// Generated from ontograph-core");
  lines.push("");

  // Generate constraints for identity attributes
  lines.push("// Constraints for identity attributes");
  for (const entity of state.entities) {
    const entityLabel = entity.id.split(":")[1] ?? entity.id;
    for (const attr of entity.attributes) {
      if (attr.identity) {
        const attrName = attr.ref.split(":")[1] ?? attr.ref;
        lines.push(`CREATE CONSTRAINT ${entityLabel}_${attrName}_unique IF NOT EXISTS`);
        lines.push(`FOR (n:${entityLabel}) REQUIRE n.${attrName} IS UNIQUE;`);
        lines.push("");
      }
    }
  }

  // Generate indexes for other attributes
  lines.push("// Indexes for frequently queried attributes");
  for (const entity of state.entities) {
    const entityLabel = entity.id.split(":")[1] ?? entity.id;
    for (const attr of entity.attributes) {
      if (!attr.identity && attr.required) {
        const attrName = attr.ref.split(":")[1] ?? attr.ref;
        lines.push(`CREATE INDEX ${entityLabel}_${attrName}_idx IF NOT EXISTS`);
        lines.push(`FOR (n:${entityLabel}) ON (n.${attrName});`);
        lines.push("");
      }
    }
  }

  // Generate sample node creation statements
  lines.push("// Sample node creation (uncomment to use)");
  for (const entity of state.entities) {
    const entityLabel = entity.id.split(":")[1] ?? entity.id;
    const props = entity.attributes
      .map((a) => {
        const attrName = a.ref.split(":")[1] ?? a.ref;
        return `  ${attrName}: $${attrName}`;
      })
      .join(",\n");
    lines.push(`// CREATE (n:${entityLabel} {`);
    lines.push(`// ${props}`);
    lines.push(`// });`);
    lines.push("");
  }

  // Generate relationship creation statements
  lines.push("// Relationship types");
  for (const rel of state.relations) {
    const relName = rel.id.split(":")[1] ?? rel.id;
    const sourceLabel = rel.source.split(":")[1] ?? rel.source;
    const targetLabel = rel.target.split(":")[1] ?? rel.target;
    lines.push(`// MATCH (s:${sourceLabel}), (t:${targetLabel})`);
    lines.push(`// WHERE s.id = $sourceId AND t.id = $targetId`);
    lines.push(`// CREATE (s)-[:${relName.toUpperCase().replace(/_/g, "_")} {label: "${rel.label}"}]->(t);`);
    lines.push("");
  }

  return lines.join("\n");
}
