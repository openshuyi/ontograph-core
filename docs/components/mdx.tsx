import defaultMdxComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";
import { ForceGraphDemo } from "./force-graph";
import { Mermaid } from "./mermaid";
import { OntologyGraph } from "./ontology-graph";

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    ForceGraphDemo,
    Mermaid,
    OntologyGraph,
    ...components,
  } satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
