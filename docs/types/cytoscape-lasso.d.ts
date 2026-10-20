/**
 * cytoscape-lasso / cytoscape-popper 的 cytoscape 模块增强。
 * 本文件必须是模块（export {}），否则 declare module 会变成环境声明而非增强。
 */
export {};

declare module "cytoscape" {
  interface Core {
    lassoSelectionEnabled(): boolean;
    lassoSelectionEnabled(enabled: boolean): void;
  }
  interface EdgeSingular {
    /**
     * cytoscape-popper 在运行时将 popperRef 挂到元素上；
     * 其自带 d.ts 声明在 SingularData 上，这里在 EdgeSingular 上补充以便调用。
     */
    popperRef(): { getBoundingClientRect(): DOMRect };
  }
}
