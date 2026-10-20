/**
 * cytoscape-lasso 未自带类型：模块声明（全局脚本文件，与 cytoscape-fcose.d.ts 同款模式）。
 * 注意：未类型包的模块声明必须在全局脚本 d.ts 中；
 * Core/EdgeSingular 增强见 cytoscape-lasso.d.ts（模块文件）。
 *
 * https://github.com/zakjan/cytoscape-lasso
 * API: cy.lassoSelectionEnabled(bool)；按住 Shift/Ctrl/Cmd + 拖拽画套索，普通拖拽仍为平移。
 */
declare module "cytoscape-lasso" {
  import type { Ext } from "cytoscape";

  const ext: Ext;
  export default ext;
}
