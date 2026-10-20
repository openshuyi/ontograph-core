import type { BaseLayoutOptions } from "cytoscape";

/**
 * 为 cytoscape 补充 fcose 布局参数类型（模块增强）
 * https://github.com/iVis-at-Bilkent/cytoscape.js-fcose#options
 */
declare module "cytoscape" {
  export interface FcoseLayoutOptions extends BaseLayoutOptions {
    name: "fcose";
    quality?: "default" | "proof";
    nodeSeparation?: number;
    idealEdgeLength?:
      | number
      | Array<{ nodeSeparation?: number; edgeLength?: number }>;
    nodeRepulsion?: number;
    edgeElasticity?: number | Array<{ edgeElasticity?: number }>;
    nestingFactor?: number;
    gravity?: number;
    numIter?: number;
    fit?: boolean;
    padding?: number;
    animate?: boolean;
    animationDuration?: number;
    randomize?: boolean;
    nodeDimensionsIncludeLabels?: boolean;
    tilingPaddingVertical?: number;
    tilingPaddingHorizontal?: number;
    initialEnergyOnIncremental?: number;
  }
}
