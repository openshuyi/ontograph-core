"use client";

import Link from "next/link";

const gradientPairs = [
  ["#6366f1", "#8b5cf6"],
  ["#06b6d4", "#3b82f6"],
  ["#ec4899", "#8b5cf6"],
  ["#10b981", "#06b6d4"],
  ["#f59e0b", "#ef4444"],
  ["#8b5cf6", "#ec4899"],
] as const;

interface ParticleNode {
  x: number;
  y: number;
}

const staticNodes: ParticleNode[] = Array.from({ length: 120 }, () => ({
  x: Math.random() * 1920,
  y: Math.random() * 1080,
}));

const ConnectionLayer = () => (
  <svg
    aria-hidden="true"
    className="absolute inset-0 w-full h-full"
    style={{ zIndex: 0 }}
  >
    <defs>
      {gradientPairs.map(([c1, c2], i) => (
        <linearGradient
          key={`grad-${i}`}
          id={`cg-${i}`}
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stopColor={c1} stopOpacity="0.3" />
          <stop offset="100%" stopColor={c2} stopOpacity="0.3" />
        </linearGradient>
      ))}
    </defs>
    {staticNodes.flatMap((n, i) => {
      const gk = i % gradientPairs.length;
      const targetA = staticNodes[(i + 7) % staticNodes.length];
      const targetB = staticNodes[(i + 13) % staticNodes.length];
      return [
        <line
          key={`la-${i}`}
          x1={n.x}
          y1={n.y}
          x2={targetA.x}
          y2={targetA.y}
          stroke={`url(#cg-${gk})`}
          strokeWidth="0.6"
        />,
        <line
          key={`lb-${i}`}
          x1={n.x}
          y1={n.y}
          x2={targetB.x}
          y2={targetB.y}
          stroke={`url(#cg-${gk})`}
          strokeWidth="0.4"
        />,
      ];
    })}
  </svg>
);

const NodeDotsLayer = () => (
  <svg aria-hidden="true" className="absolute inset-0 w-full h-full">
    <defs>
      {gradientPairs.map(([c1], i) => (
        <radialGradient
          key={`gr-${i}`}
          id={`ng-${i}`}
          cx="50%"
          cy="50%"
          r="50%"
        >
          <stop offset="0%" stopColor={c1} stopOpacity="0.8" />
          <stop offset="100%" stopColor={c1} stopOpacity="0" />
        </radialGradient>
      ))}
    </defs>
    {staticNodes.map((n, i) => {
      const gk = i % gradientPairs.length;
      const r = 1.5 + (i % 3);
      return (
        <g key={`d-${i}`}>
          <circle
            cx={n.x}
            cy={n.y}
            r={r * 3}
            fill={`url(#ng-${gk})`}
            opacity="0.15"
          />
          <circle
            cx={n.x}
            cy={n.y}
            r={r}
            fill={gradientPairs[gk][0]}
            opacity="0.4"
          />
        </g>
      );
    })}
  </svg>
);

const features = [
  {
    icon: (
      <svg
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
        />
      </svg>
    ),
    bg: "bg-indigo-500/10",
    text: "text-indigo-500",
    title: "Expr AST Safe Evaluation",
    description:
      "Pure function recursion, zero eval — no prototype pollution or injection risk.",
  },
  {
    icon: (
      <svg
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
        />
      </svg>
    ),
    bg: "bg-cyan-500/10",
    text: "text-cyan-500",
    title: "Abstract Query Engine",
    description:
      "FilterOp to ObjectSet to Neo4j Cypher compilation with pluggable backends.",
  },
  {
    icon: (
      <svg
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
        />
      </svg>
    ),
    bg: "bg-violet-500/10",
    text: "text-violet-500",
    title: "RBAC + Row-Level Security",
    description:
      "Deny-first policy with granular permissions and row-level security conditions.",
  },
  {
    icon: (
      <svg
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    ),
    bg: "bg-emerald-500/10",
    text: "text-emerald-500",
    title: "W3C SHACL Validation",
    description:
      "Standard Shapes generation and validation for data integrity guarantees.",
  },
  {
    icon: (
      <svg
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm0 8a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zm10 0a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1h-4a1 1 0 01-1-1v-6z"
        />
      </svg>
    ),
    bg: "bg-pink-500/10",
    text: "text-pink-500",
    title: "Fluent Builder API",
    description:
      "defineEntity().attr().rel().constraint().build() with full TypeScript inference.",
  },
  {
    icon: (
      <svg
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 10V3L4 14h7v7l9-11h-7z"
        />
      </svg>
    ),
    bg: "bg-amber-500/10",
    text: "text-amber-500",
    title: "350+ Supply Chain Ontology",
    description:
      "Pre-built TMS, WMS, OMS, BMS reference models ready for production.",
  },
] as const;

const exportFormats = [
  {
    format: "OWL 2 Turtle",
    icon: "U0001F989",
    description: "W3C standard ontology serialization",
  },
  {
    format: "SHACL Shapes",
    icon: "\u2705",
    description: "W3C data validation shapes",
  },
  {
    format: "Neo4j Cypher",
    icon: "U0001F5C4\uFE0F",
    description: "Database constraints and DDL",
  },
  {
    format: "JSON Schema",
    icon: "U0001F4CB",
    description: "Draft 2020-12 with $defs",
  },
  {
    format: "Mermaid",
    icon: "U0001F4CA",
    description: "Renders natively in GitHub READMEs",
  },
  {
    format: "Graphviz DOT",
    icon: "U0001F535",
    description: "Publication-quality diagrams",
  },
];

export default function HomePage() {
  return (
    <div>
      <section className="relative overflow-hidden border-b border-fd-border/40 min-h-[85vh]">
        <div className="absolute inset-0 bg-fd-background">
          <ConnectionLayer />
          <NodeDotsLayer />
          <div className="absolute inset-0 bg-gradient-to-b from-fd-background via-fd-background/80 to-fd-background" />
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 py-24 min-h-[85vh]">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-fd-border/50 bg-fd-muted/50 px-4 py-1.5 text-sm text-fd-muted-foreground backdrop-blur-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            v0.0.1 — Now available on npm
          </div>

          <h1 className="mb-6 max-w-4xl text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl lg:text-8xl">
            <div>Define your world</div>
            <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 bg-clip-text text-transparent">
              in pure TypeScript
            </div>
          </h1>

          <p className="mb-10 max-w-2xl text-xl text-fd-muted-foreground">
            An enterprise-grade ontology framework — type-safe entities,
            relations, constraints and rules. One definition exports to OWL 2,
            SHACL, Neo4j, JSON Schema and Mermaid.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/docs/quick-start"
              className="group inline-flex items-center gap-2 rounded-lg bg-fd-primary px-8 py-3 text-lg font-medium text-fd-primary-foreground transition-all hover:bg-fd-primary/90 hover:shadow-lg hover:shadow-fd-primary/20"
            >
              Get Started
              <svg
                className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </Link>
            <Link
              href="/docs"
              className="inline-flex items-center gap-2 rounded-lg border border-fd-border bg-fd-muted/50 px-8 py-3 text-lg font-medium text-fd-foreground backdrop-blur-sm transition-all hover:bg-fd-muted hover:border-fd-border/80"
            >
              Read Docs
            </Link>
            <Link
              href="/exports-demo"
              className="inline-flex items-center gap-2 rounded-lg border border-fd-border/60 bg-fd-card/50 px-8 py-3 text-lg font-medium text-fd-foreground backdrop-blur-sm transition-all hover:bg-fd-card/70 hover:border-fd-border"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Export Demo
            </Link>
          </div>

          <div className="mt-16 w-full max-w-3xl">
            <div className="overflow-hidden rounded-xl border border-fd-border/60 bg-fd-card/80 backdrop-blur-md shadow-2xl shadow-fd-primary/5">
              <div className="flex items-center gap-2 border-b border-fd-border/50 px-4 py-3">
                <span className="h-3 w-3 rounded-full bg-red-500/80" />
                <span className="h-3 w-3 rounded-full bg-yellow-500/80" />
                <span className="h-3 w-3 rounded-full bg-green-500/80" />
                <span className="ml-2 text-xs font-mono text-fd-muted-foreground">
                  ontology.ts
                </span>
              </div>
              <pre className="overflow-x-auto p-6 text-left text-sm leading-relaxed">
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

      <section className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you need for enterprise ontologies
            </h2>
            <p className="text-lg text-fd-muted-foreground">
              Inspired by Palantir Ontology, built for the open-source world.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="group overflow-hidden rounded-xl border border-fd-border/60 bg-fd-card/50 p-6 backdrop-blur-sm transition-all hover:border-fd-border hover:bg-fd-card/70 hover:shadow-lg"
              >
                <div
                  className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg ${f.bg} ${f.text}`}
                >
                  {f.icon}
                </div>
                <h3 className="mb-2 text-lg font-semibold">{f.title}</h3>
                <p className="text-sm text-fd-muted-foreground">
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-fd-border/40 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
              One definition, multiple outputs
            </h2>
            <p className="text-lg text-fd-muted-foreground">
              Define your ontology once in TypeScript — export to any format.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {exportFormats.map((e) => (
              <div
                key={e.format}
                className="flex items-start gap-4 rounded-xl border border-fd-border/40 bg-fd-muted/30 p-5 transition-all hover:bg-fd-muted/50"
              >
                <div className="shrink-0 text-2xl">{e.icon}</div>
                <div>
                  <h3 className="font-semibold">{e.format}</h3>
                  <p className="text-sm text-fd-muted-foreground">
                    {e.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-fd-border/40 px-6 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Ready to define your world?
          </h2>
          <p className="mb-8 text-lg text-fd-muted-foreground">
            Get started in minutes with a type-safe ontology framework.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/docs/quick-start"
              className="inline-flex items-center gap-2 rounded-lg bg-fd-primary px-8 py-3 font-medium text-fd-primary-foreground transition-all hover:bg-fd-primary/90"
            >
              Quick Start
            </Link>
            <div className="font-mono text-sm rounded-lg border border-fd-border px-4 py-3 bg-fd-muted/30 select-all">
              bun add @ontograph/core
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
