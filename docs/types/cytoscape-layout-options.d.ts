import type {
  AnimatedLayoutOptions,
  BaseLayoutOptions,
  EdgeSingular,
} from "cytoscape";

/**
 * 为 cytoscape 补充第三方布局参数类型（模块增强）。
 * 本文件必须是模块（含顶层 import），否则 declare module 会变成环境声明而非增强，
 * 导致 cytoscape 自带类型被遮蔽（与 cytoscape-fcose-layout.d.ts 同理）。
 *
 * https://github.com/cytoscape/cytoscape.js-cola#api
 * https://github.com/cytoscape/cytoscape.js-klay
 * https://github.com/iVis-at-Bilkent/cytoscape.js-cise
 * https://github.com/cytoscape/cytoscape.js-euler
 * https://github.com/iVis-at-Bilkent/cytoscape.js-avsdf
 */
declare module "cytoscape" {
  export interface ColaLayoutOptions
    extends BaseLayoutOptions,
      AnimatedLayoutOptions {
    name: "cola";
    padding?: number;
    randomize?: boolean;
    avoidOverlap?: boolean;
    handleDisconnected?: boolean;
    nodeDimensionsIncludeLabels?: boolean;
    infinite?: boolean;
    edgeLength?: number | ((edge: EdgeSingular) => number);
  }

  export interface KlayLayoutOptions
    extends BaseLayoutOptions,
      AnimatedLayoutOptions {
    name: "klay";
    padding?: number;
    klay?: Record<string, unknown>;
  }

  export interface CiseLayoutOptions
    extends BaseLayoutOptions,
      AnimatedLayoutOptions {
    name: "cise";
    /** 节点 id 的分组（簇）；cise 将簇内排成圆形、簇间弹簧拉开 */
    clusters: string[][];
    padding?: number;
    nodeSeparation?: number;
    allowNodesInsideCircle?: boolean;
  }

  export interface EulerLayoutOptions
    extends BaseLayoutOptions,
      AnimatedLayoutOptions {
    name: "euler";
    padding?: number;
    springLength?: number;
    gravity?: number;
  }

  export interface AvsdfLayoutOptions
    extends BaseLayoutOptions,
      AnimatedLayoutOptions {
    name: "avsdf";
    padding?: number;
    nodeSeparation?: number;
  }
}
