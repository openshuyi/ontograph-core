"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import cytoscape from "cytoscape";

export interface GraphNode {
  id: string;
  label: string;
  group: string;
  color: string;
  properties?: Record<string, unknown>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

interface CytoscapeGraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  onNodeClick?: (nodeId: string) => void;
}

export function CytoscapeGraph({ nodes, edges, onNodeClick }: CytoscapeGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  const [mounted, setMounted] = useState(false);
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    label: string;
    group: string;
    color: string;
    properties?: Record<string, unknown>;
  } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !containerRef.current) return;

    if (cyRef.current) {
      cyRef.current.destroy();
    }

    const elements: cytoscape.ElementDefinition[] = [
      ...nodes.map((n) => ({
        group: "nodes" as const,
        data: { id: n.id, label: n.label, group: n.group, color: n.color },
      })),
      ...edges.map((e) => ({
        group: "edges" as const,
        data: { id: e.id, source: e.source, target: e.target, label: e.label },
      })),
    ];

    const cy = cytoscape({
      container: containerRef.current,
      elements,
      style: [
        {
          selector: "node",
          style: {
            "background-color": "data(color)",
            label: "data(label)",
            "text-valign": "center",
            "text-halign": "center",
            "text-wrap": "wrap",
            "text-max-width": "80px",
            "font-size": "11px",
            "font-weight": "bold",
            color: "#fff",
            width: "50px",
            height: "50px",
            "border-width": 2,
            "border-color": "#fff",
            "border-opacity": 0.4,
          },
        },
        {
          selector: "edge",
          style: {
            width: 2,
            "line-color": "#666",
            "target-arrow-color": "#666",
            "target-arrow-shape": "triangle",
            "curve-style": "bezier",
            label: "data(label)",
            "font-size": "9px",
            color: "#999",
            "text-rotation": "autorotate",
            "text-margin-y": -8,
          },
        },
        {
          selector: ":selected",
          style: {
            "border-width": 3,
            "border-color": "#fff",
            "border-opacity": 0.8,
          },
        },
      ],
      layout: {
        name: "cose",
        animate: true,
        animationDuration: 500,
        padding: 40,
        nodeRepulsion: 4500,
        idealEdgeLength: 120,
        edgeElasticity: 100,
        nestingFactor: 5,
        gravity: 80,
        numIter: 1000,
      },
      minZoom: 0.3,
      maxZoom: 3,
    });

    cyRef.current = cy;

    cy.on("tap", "node", (evt) => {
      const nodeId = evt.target.id();
      onNodeClick?.(nodeId);
    });

    cy.on("mouseover", "node", (evt) => {
      const target = evt.target;
      const nodeId = target.id();
      const renderPosition = target.renderedPosition();
      setTooltip({
        x: renderPosition.x,
        y: renderPosition.y,
        label: target.data("label"),
        group: target.data("group"),
        color: target.data("color"),
        properties: nodes.find((n) => n.id === nodeId)?.properties,
      });
    });

    cy.on("mouseout", "node", () => {
      setTooltip(null);
    });

    return () => {
      cy.destroy();
      cyRef.current = null;
    };
  }, [mounted, nodes, edges, onNodeClick]);

  const handleReheat = useCallback(() => {
    if (cyRef.current) {
      cyRef.current.layout({
        name: "cose",
        animate: true,
        animationDuration: 500,
        padding: 40,
        nodeRepulsion: 4500,
        idealEdgeLength: 120,
        edgeElasticity: 100,
        nestingFactor: 5,
        gravity: 80,
        numIter: 1000,
      }).run();
    }
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-full bg-[#1a1a2e] rounded-xl">
        <p className="text-gray-400">Loading graph...</p>
      </div>
    );
  }

  const uniqueGroups = [...new Set(nodes.map((n) => n.group))];

  return (
    <div className="relative w-full h-full bg-[#1a1a2e] rounded-xl overflow-hidden">
      <div ref={containerRef} className="w-full h-full" style={{ minHeight: 500 }} />
      {tooltip && (
        <div
          className="absolute z-50 pointer-events-none bg-gray-900/95 backdrop-blur border border-gray-700 rounded-lg px-4 py-3 shadow-xl text-sm"
          style={{
            left: tooltip.x + 20,
            top: tooltip.y - 10,
            maxWidth: 240,
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tooltip.color }} />
            <span className="font-semibold text-white">{tooltip.label}</span>
          </div>
          <div className="text-gray-400 text-xs mb-1">Group: {tooltip.group}</div>
          {tooltip.properties &&
            Object.entries(tooltip.properties)
              .slice(0, 4)
              .map(([key, value]) => (
                <div key={key} className="text-gray-400 text-xs">
                  <span className="text-gray-500">{key}:</span> {String(value)}
                </div>
              ))}
        </div>
      )}
      <div className="absolute top-3 right-3 flex gap-2">
        <button
          type="button"
          onClick={handleReheat}
          className="px-3 py-1.5 text-xs font-medium rounded-md bg-white/10 text-white hover:bg-white/20 transition-colors border border-white/10"
        >
          <span className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-label="Reheat">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Reheat
          </span>
        </button>
      </div>
      {uniqueGroups.length > 0 && (
        <div className="absolute bottom-3 left-3 bg-gray-900/80 backdrop-blur-sm rounded-lg px-3 py-2 border border-gray-700/50">
          <div className="text-xs text-gray-400 mb-1.5 font-medium">Legend</div>
          <div className="flex flex-wrap gap-3">
            {uniqueGroups.map((group) => {
              const node = nodes.find((n) => n.group === group);
              return (
                <div key={group} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: node?.color }} />
                  <span className="text-xs text-gray-300">{group}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
