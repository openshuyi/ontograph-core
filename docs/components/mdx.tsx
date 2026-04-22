import defaultMdxComponents from 'fumadocs-ui/mdx';
import type { MDXComponents } from 'mdx/types';
import { ForceGraphDemo } from './force-graph';

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    ForceGraphDemo,
    ...components,
  } satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
