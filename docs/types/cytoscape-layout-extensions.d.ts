/**
 * cytoscape 布局扩展模块声明（未自带类型，按 cytoscape-fcose.d.ts 同款模式）。
 * cytoscape-dagre 自带类型（index.d.ts），无需声明。
 *
 * https://github.com/cytoscape/cytoscape.js-cola
 * https://github.com/cytoscape/cytoscape.js-klay
 * https://github.com/iVis-at-Bilkent/cytoscape.js-cise
 * https://github.com/cytoscape/cytoscape.js-euler
 * https://github.com/iVis-at-Bilkent/cytoscape.js-avsdf
 */
declare module "cytoscape-cola" {
  import type { Ext } from "cytoscape";

  const ext: Ext;
  export default ext;
}

declare module "cytoscape-klay" {
  import type { Ext } from "cytoscape";

  const ext: Ext;
  export default ext;
}

declare module "cytoscape-cise" {
  import type { Ext } from "cytoscape";

  const ext: Ext;
  export default ext;
}

declare module "cytoscape-euler" {
  import type { Ext } from "cytoscape";

  const ext: Ext;
  export default ext;
}

declare module "cytoscape-avsdf" {
  import type { Ext } from "cytoscape";

  const ext: Ext;
  export default ext;
}
