import Link from "next/link";

/**
 * 洛书点阵：数字 → 方点阵列
 * 洛书九宫：4 9 2 / 3 5 7 / 8 1 6（戴九履一，左三右七，二四为肩，六八为足，五居中央）
 * 点取方形以合 hairline 刻版语言（天圆地方，圆用在印章，不在点）。
 */
const LUOSHU_DOTS: Record<number, Array<[number, number]>> = {
  1: [[1, 1]],
  2: [
    [0, 0],
    [2, 2],
  ],
  3: [
    [0, 0],
    [1, 1],
    [2, 2],
  ],
  4: [
    [0, 0],
    [0, 2],
    [2, 0],
    [2, 2],
  ],
  5: [
    [0, 0],
    [0, 2],
    [1, 1],
    [2, 0],
    [2, 2],
  ],
  6: [
    [0, 0],
    [0, 2],
    [1, 0],
    [1, 2],
    [2, 0],
    [2, 2],
  ],
  7: [
    [0, 0],
    [0, 2],
    [1, 0],
    [1, 1],
    [1, 2],
    [2, 0],
    [2, 2],
  ],
  8: [
    [0, 0],
    [0, 1],
    [0, 2],
    [1, 0],
    [1, 2],
    [2, 0],
    [2, 1],
    [2, 2],
  ],
  9: [
    [0, 0],
    [0, 1],
    [0, 2],
    [1, 0],
    [1, 1],
    [1, 2],
    [2, 0],
    [2, 1],
    [2, 2],
  ],
};

const LuoshuDots = ({ count }: { count: number }) => {
  const on = LUOSHU_DOTS[count] ?? [];
  return (
    <div className="grid grid-cols-3 gap-1.5" aria-hidden="true">
      {Array.from({ length: 9 }, (_, i) => {
        const row = Math.floor(i / 3);
        const col = i % 3;
        const filled = on.some(([r, c]) => r === row && c === col);
        return (
          <span
            key={i}
            className={
              filled ? "h-1.5 w-1.5 bg-fd-foreground/35" : "h-1.5 w-1.5"
            }
          />
        );
      })}
    </div>
  );
};

const features = [
  {
    title: "Expr AST Safe Evaluation",
    description:
      "Pure function recursion, zero eval — no prototype pollution or injection risk.",
    icon: (
      <svg
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
        />
      </svg>
    ),
  },
  {
    title: "Abstract Query Engine",
    description:
      "FilterOp to ObjectSet to Neo4j Cypher compilation with pluggable backends.",
    icon: (
      <svg
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
        />
      </svg>
    ),
  },
  {
    title: "RBAC + Row-Level Security",
    description:
      "Deny-first policy with granular permissions and row-level security conditions.",
    icon: (
      <svg
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
        />
      </svg>
    ),
  },
  {
    title: "W3C SHACL Validation",
    description:
      "Standard Shapes generation and validation for data integrity guarantees.",
    icon: (
      <svg
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    ),
  },
  {
    title: "Fluent Builder API",
    description:
      "defineEntity().attr().rel().constraint().build() with full TypeScript inference.",
    icon: (
      <svg
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm0 8a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zm10 0a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1h-4a1 1 0 01-1-1v-6z"
        />
      </svg>
    ),
  },
  {
    title: "350+ Supply Chain Ontology",
    description:
      "Pre-built TMS, WMS, OMS, BMS reference models ready for production.",
    icon: (
      <svg
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M13 10V3L4 14h7v7l9-11h-7z"
        />
      </svg>
    ),
  },
] as const;

/**
 * 六种导出格式落户九宫外圈六格（中宫留空）。
 * 每格标注洛书数与后天八卦方位（点位与洛书数严格对应）：
 *   1 坎·北  2 坤·西南  3 震·东  4 巽·东南  6 乾·西北  7 兑·西  8 艮·东北  9 离·南
 */
const exportFormats = [
  {
    format: "OWL 2 Turtle",
    numeral: "四",
    direction: "巽 · 东南",
    gridArea: "1 / 1",
    description: "W3C standard ontology serialization",
  },
  {
    format: "SHACL Shapes",
    numeral: "二",
    direction: "坤 · 西南",
    gridArea: "1 / 3",
    description: "W3C data validation shapes",
  },
  {
    format: "Neo4j Cypher",
    numeral: "八",
    direction: "艮 · 东北",
    gridArea: "3 / 1",
    description: "Database constraints and DDL",
  },
  {
    format: "JSON Schema",
    numeral: "六",
    direction: "乾 · 西北",
    gridArea: "3 / 3",
    description: "Draft 2020-12 with $defs",
  },
  {
    format: "Mermaid",
    numeral: "三",
    direction: "震 · 东",
    gridArea: "2 / 1",
    description: "Renders natively in GitHub READMEs",
  },
  {
    format: "Graphviz DOT",
    numeral: "七",
    direction: "兑 · 西",
    gridArea: "2 / 3",
    description: "Publication-quality diagrams",
  },
] as const;

export default function HomePage() {
  return (
    <div>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-fd-border px-6 py-24 md:min-h-[85vh] md:py-28">
        <div
          aria-hidden="true"
          className="pattern-luoshu pointer-events-none absolute inset-0 opacity-60 [-webkit-mask-image:radial-gradient(ellipse_at_center,black_10%,transparent_70%)] [mask-image:radial-gradient(ellipse_at_center,black_10%,transparent_70%)]"
        />

        <div className="absolute right-6 top-6 hidden md:right-10 md:top-10 md:block">
          <div className="seal h-20 w-14 text-2xl">本体</div>
        </div>

        <div className="relative mx-auto flex max-w-3xl flex-col items-center text-center">
          <div className="mb-8 inline-flex items-center gap-2 rounded-sm border border-fd-border px-3 py-1.5 text-xs tracking-[0.02em] text-fd-muted-foreground">
            <span className="h-1.5 w-1.5 bg-fd-primary" aria-hidden="true" />
            v0.0.1 — Now available on npm
          </div>

          <h1 className="font-serif text-5xl font-semibold leading-[1.15] tracking-tight sm:text-6xl md:text-7xl">
            以代码定义世界
            <span className="mt-5 block font-sans text-xl font-normal tracking-normal text-fd-muted-foreground sm:text-2xl">
              Define your world in pure TypeScript
            </span>
          </h1>

          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-fd-muted-foreground">
            An enterprise-grade ontology framework — type-safe entities,
            relations, constraints and rules. One definition exports to OWL 2,
            SHACL, Neo4j, JSON Schema and Mermaid.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/docs/quick-start"
              className="group inline-flex items-center gap-2 rounded-sm bg-fd-primary px-6 py-3 font-medium text-fd-primary-foreground transition-colors hover:bg-fd-primary/90"
            >
              Get Started
              <svg
                className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </Link>
            <Link
              href="/docs"
              className="inline-flex items-center gap-2 rounded-sm border border-fd-border px-6 py-3 font-medium text-fd-foreground transition-colors hover:border-fd-foreground/40"
            >
              Read Docs
            </Link>
            <Link
              href="/exports-demo"
              className="inline-flex items-center gap-2 rounded-sm border border-fd-border px-6 py-3 font-medium text-fd-foreground transition-colors hover:border-fd-foreground/40"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
                focusable="false"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Export Demo
            </Link>
            <Link
              href="/editor"
              className="inline-flex items-center gap-2 rounded-sm border border-fd-border px-6 py-3 font-medium text-fd-foreground transition-colors hover:border-fd-foreground/40"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
                focusable="false"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M11 4a2 2 0 114 0v1h1a2 2 0 012 2v1h1a2 2 0 110 4h-1v1a2 2 0 01-2 2h-1v1a2 2 0 11-4 0v-1H7a2 2 0 01-2-2v-1H4a2 2 0 110-4h1V7a2 2 0 012-2h1V4a2 2 0 012-2z"
                />
              </svg>
              Ontology Editor
            </Link>
          </div>

          <div className="mt-16 w-full text-left">
            <div className="overflow-hidden rounded-sm border border-fd-border bg-fd-card">
              <div className="flex items-center gap-1.5 border-b border-fd-border px-4 py-2.5">
                <span
                  className="h-2.5 w-2.5 border border-fd-border"
                  aria-hidden="true"
                />
                <span
                  className="h-2.5 w-2.5 border border-fd-border"
                  aria-hidden="true"
                />
                <span
                  className="h-2.5 w-2.5 border border-fd-border"
                  aria-hidden="true"
                />
                <span className="ml-2 font-mono text-xs text-fd-muted-foreground">
                  ontology.ts
                </span>
              </div>
              <pre className="overflow-x-auto p-6 font-mono text-sm leading-relaxed">
                <code>{`import { defineEntity, defineRelation, OntologyValidator } from "@ontograph/core";

const warehouse = defineEntity("sc:Warehouse", {
  label: { en: "Warehouse" },
  kind: "entity",
})
  .attr("sc:capacity", { required: true })
  .rel("sc:stores", { min: 0, max: Infinity })
  .build();

const product = defineEntity("sc:Product", {
  label: { en: "Product" },
  kind: "entity",
})
  .attr("sc:sku", { identity: true, required: true })
  .build();`}</code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* ── 六合 · 特性 ───────────────────────────────────────── */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <div className="mb-4 inline-flex items-center gap-2 text-sm text-fd-muted-foreground">
              <span className="h-1.5 w-1.5 bg-fd-primary" aria-hidden="true" />
              六合
            </div>
            <h2 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
              Everything you need for enterprise ontologies
            </h2>
            <p className="mt-4 text-lg text-fd-muted-foreground">
              Inspired by Palantir Ontology, built for the open-source world.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-sm border border-fd-border p-6 transition-colors hover:border-fd-foreground/40"
              >
                <div className="mb-4 text-fd-primary">{feature.icon}</div>
                <h3 className="text-lg font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-fd-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 九宫 · 一源多出 ───────────────────────────────────── */}
      <section className="border-t border-fd-border px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <div className="mb-16 text-center">
            <div className="mb-4 inline-flex items-center gap-2 text-sm text-fd-muted-foreground">
              <span className="h-1.5 w-1.5 bg-fd-primary" aria-hidden="true" />
              九宫
            </div>
            <h2 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
              One definition, multiple outputs
            </h2>
            <p className="mt-4 text-lg text-fd-muted-foreground">
              Define your ontology once in TypeScript — export to any format.
            </p>
          </div>

          <div className="jiugong">
            {exportFormats.map((item) => (
              <div
                key={item.format}
                style={{ gridArea: item.gridArea }}
                className="group"
              >
                <div className="flex h-full flex-col justify-between gap-8 p-4 transition-colors group-hover:bg-fd-muted sm:p-6">
                  <div className="flex items-baseline justify-between">
                    <span className="font-serif text-lg text-fd-primary">
                      {item.numeral}
                    </span>
                    <span className="text-xs text-fd-muted-foreground">
                      {item.direction}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold">{item.format}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-fd-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {/* 上中宫 · 九·离 */}
            <div
              style={{ gridArea: "1 / 2" }}
              className="grid place-items-center gap-3 p-6"
            >
              <LuoshuDots count={9} />
              <span className="font-serif text-xs text-fd-muted-foreground">
                九 · 离
              </span>
            </div>

            {/* 中宫（5）留空 · 品牌落款 */}
            <div className="zhong-gong grid place-items-center p-6">
              <div className="seal h-16 w-16 text-lg">洛书</div>
            </div>

            {/* 下中宫 · 一·坎 */}
            <div
              style={{ gridArea: "3 / 2" }}
              className="grid place-items-center gap-3 p-6"
            >
              <LuoshuDots count={1} />
              <span className="font-serif text-xs text-fd-muted-foreground">
                一 · 坎
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-t border-fd-border px-6 py-24">
        <div
          aria-hidden="true"
          className="pattern-hui pointer-events-none absolute inset-0 opacity-[0.04]"
        />
        <div className="relative mx-auto max-w-3xl text-center">
          <h2 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
            Ready to define your world?
          </h2>
          <p className="mt-4 text-lg text-fd-muted-foreground">
            Get started in minutes with a type-safe ontology framework.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/docs/quick-start"
              className="rounded-sm bg-fd-primary px-6 py-3 font-medium text-fd-primary-foreground transition-colors hover:bg-fd-primary/90"
            >
              Quick Start
            </Link>
            <div className="select-all rounded-sm border border-fd-border bg-fd-muted/40 px-4 py-3 font-mono text-sm">
              <span
                className="mr-2 select-none text-fd-muted-foreground"
                aria-hidden="true"
              >
                $
              </span>
              bun add @ontograph/core
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
