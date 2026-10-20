"use client";

import { useEffect, useId, useRef, useState } from "react";

interface MermaidProps {
  /** Mermaid diagram source code */
  code: string;
  /** Force a theme; "auto" follows the docs light/dark mode */
  theme?: "light" | "dark" | "auto";
  caption?: string;
}

function isDarkMode(): boolean {
  if (typeof document === "undefined") return false;
  return document.documentElement.classList.contains("dark");
}

/**
 * Client-side Mermaid renderer for MDX pages.
 *
 * Renders the diagram source produced by `MermaidExporter` from
 * `@ontograph/core`, following the docs color scheme by default.
 */
export function Mermaid({ code, theme = "auto", caption }: MermaidProps) {
  const reactId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentTheme, setCurrentTheme] = useState<"light" | "dark">("light");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const renderCounter = useRef(0);

  // Track docs theme (fumadocs toggles the `dark` class on <html>)
  useEffect(() => {
    if (theme !== "auto") {
      setCurrentTheme(theme);
      return;
    }
    const update = () => setCurrentTheme(isDarkMode() ? "dark" : "light");
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, [theme]);

  useEffect(() => {
    let cancelled = false;

    const renderMermaid = async () => {
      setLoading(true);
      setError(null);
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: currentTheme === "dark" ? "dark" : "default",
          securityLevel: "strict",
          class: { useMaxWidth: true },
          fontFamily: "inherit",
        });
        renderCounter.current += 1;
        const id = `mermaid-${reactId.replace(/[^a-zA-Z0-9]/g, "")}-${renderCounter.current}`;
        const { svg } = await mermaid.render(id, code);
        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = svg;
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to render diagram",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    renderMermaid();
    return () => {
      cancelled = true;
    };
  }, [code, currentTheme, reactId]);

  return (
    <figure className="not-prose my-6 overflow-x-auto rounded-sm border border-fd-border bg-fd-card p-4">
      {loading && !error ? (
        <div className="flex h-40 items-center justify-center text-sm text-fd-muted-foreground">
          Rendering diagram...
        </div>
      ) : null}
      {error ? (
        <div className="flex flex-col gap-3 p-4">
          <p className="text-sm text-fd-primary">
            Diagram failed to render: {error}
          </p>
          <pre className="overflow-x-auto rounded-sm bg-fd-muted p-3 text-xs">
            <code>{code}</code>
          </pre>
        </div>
      ) : null}
      <div
        ref={containerRef}
        className="flex justify-center [&_svg]:max-w-full"
        style={error ? { display: "none" } : undefined}
      />
      {caption ? (
        <figcaption className="mt-3 text-center text-xs text-fd-muted-foreground">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
