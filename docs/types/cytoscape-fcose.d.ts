/**
 * cytoscape-fcose 未自带类型声明（全局模块声明，script 文件）
 * https://github.com/iVis-at-Bilkent/cytoscape.js-fcose
 */
declare module "cytoscape-fcose" {
  import type { Ext } from "cytoscape";

  const fcose: Ext;
  export default fcose;
}
