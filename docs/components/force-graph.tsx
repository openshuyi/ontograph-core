"use client";

import * as d3 from "d3";
import { useEffect, useRef, useState, useCallback } from "react";

// Node and Link type definitions
export interface GraphNode {
  id: string;
  label: string;
  group: string;
  color: string;
  properties?: Record<string, unknown>;
  data?: unknown;
  // D3 simulation adds these properties
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
  index?: number;
}

export interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  type?: string;
  label?: string;
  properties?: Record<string, unknown>;
  data?: unknown;
  // D3 simulation resolves these
  sourceNode?: GraphNode;
  targetNode?: GraphNode;
  index?: number;
}

interface ForceGraphDemoProps {
  nodes: GraphNode[];
  links: GraphLink[];
  className?: string;
}

// Tooltip state
interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  content: string;
}

export function ForceGraphDemo({ nodes, links, className }: ForceGraphDemoProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [mounted, setMounted] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    content: "",
  });
  const simulationRef = useRef<d3.Simulation<GraphNode, GraphLink> | null>(null);

  // Get unique groups for legend
  const groups = [...new Set(nodes.map((n) => n.group))].map((group) => {
    const node = nodes.find((n) => n.group === group);
    return { group, color: node?.color || "#999" };
  });

  // Handle resize
  useEffect(() => {
    setMounted(true);
    
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({
          width: Math.max(width, 800),
          height: Math.max(height, 600),
        });
      }
    };

    updateDimensions();
    
    const resizeObserver = new ResizeObserver(updateDimensions);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, []);

  // Initialize D3 visualization
  useEffect(() => {
    if (!mounted || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const { width, height } = dimensions;

    // Clear previous content
    svg.selectAll("*").remove();

    // Create zoomable container
    const g = svg.append("g").attr("class", "graph-container");

    // Setup zoom
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform.toString());
      });

    svg.call(zoom);

    // Create defs for glow effect
    const defs = svg.append("defs");
    
    // Add glow filter for each unique color
    const uniqueColors = [...new Set(nodes.map(n => n.color))];
    uniqueColors.forEach((color, i) => {
      const filter = defs.append("filter")
        .attr("id", `glow-${i}`)
        .attr("x", "-50%")
        .attr("y", "-50%")
        .attr("width", "200%")
        .attr("height", "200%");
      
      filter.append("feGaussianBlur")
        .attr("stdDeviation", "3")
        .attr("result", `blur-${i}`);
      
      filter.append("feFlood")
        .attr("flood-color", color)
        .attr("flood-opacity", "0.5")
        .attr("result", `color-${i}`);
      
      filter.append("feComposite")
        .attr("in", `color-${i}`)
        .attr("in2", `blur-${i}`)
        .attr("operator", "in")
        .attr("result", `shadow-${i}`);
      
      const merge = filter.append("feMerge");
      merge.append("feMergeNode").attr("in", `shadow-${i}`);
      merge.append("feMergeNode").attr("in", "SourceGraphic");
    });

    // Prepare data - create copies to avoid mutating original
    const simulationNodes: GraphNode[] = nodes.map((n, i) => ({
      ...n,
      x: width / 2 + (Math.random() - 0.5) * 100,
      y: height / 2 + (Math.random() - 0.5) * 100,
      index: i,
    }));

    const simulationLinks: GraphLink[] = links.map((l, i) => ({
      ...l,
      source: typeof l.source === "string" 
        ? simulationNodes.find(n => n.id === l.source) || simulationNodes[0] 
        : l.source,
      target: typeof l.target === "string" 
        ? simulationNodes.find(n => n.id === l.target) || simulationNodes[0] 
        : l.target,
      index: i,
    }));

    // Create links
    const linkGroup = g.append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(simulationLinks)
      .join("line")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", 2);

    // Link labels (optional)
    const linkLabels = g.append("g")
      .attr("class", "link-labels")
      .selectAll("text")
      .data(simulationLinks.filter(l => l.label))
      .join("text")
      .attr("class", "link-label")
      .attr("font-size", "10px")
      .attr("fill", "#888")
      .attr("text-anchor", "middle")
      .attr("dy", -5)
      .text(d => d.label || "");

    // Create nodes group
    const nodeGroup = g.append("g")
      .attr("class", "nodes")
      .selectAll("g.node")
      .data(simulationNodes)
      .join("g")
      .attr("class", "node")
      .style("cursor", "grab");

    // Find the glow filter index for each node
    const getGlowFilterId = (color: string) => {
      const idx = uniqueColors.indexOf(color);
      return `glow-${idx}`;
    };

    // Node circles
    nodeGroup.append("circle")
      .attr("r", 20)
      .attr("fill", (d) => d.color)
      .attr("stroke", "#fff")
      .attr("stroke-width", 2)
      .attr("stroke-opacity", 0.8)
      .style("filter", (d) => `url(#${getGlowFilterId(d.color)})`);

    // Node labels
    nodeGroup.append("text")
      .attr("class", "node-label")
      .attr("dy", 35)
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .attr("fill", "#e0e0e0")
      .attr("font-weight", "500")
      .text((d) => d.label);

    const dragHandler = d3.drag<SVGGElement, GraphNode>()
      .on("start", (event, d) => {
        if (!event.active) simulationRef.current?.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on("drag", (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on("end", (event, d) => {
        if (!event.active) simulationRef.current?.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });
    
    (nodeGroup as d3.Selection<SVGGElement, GraphNode, SVGGElement, unknown>).call(dragHandler);

    // Tooltip handlers
    nodeGroup
      .on("mouseover", (event, d) => {
        const propsText = d.properties 
          ? Object.entries(d.properties)
              .map(([key, value]) => `${key}: ${String(value)}`)
              .join("\n")
          : "";
        
        const content = propsText 
          ? `${d.label}\n${propsText}` 
          : d.label;
        
        setTooltip({
          visible: true,
          x: event.clientX,
          y: event.clientY,
          content,
        });
      })
      .on("mousemove", (event) => {
        setTooltip((prev) => ({
          ...prev,
          x: event.clientX,
          y: event.clientY,
        }));
      })
      .on("mouseout", () => {
        setTooltip({ visible: false, x: 0, y: 0, content: "" });
      });

    // Create force simulation
    const simulation = d3.forceSimulation<GraphNode>(simulationNodes)
      .force("link", d3.forceLink<GraphNode, GraphLink>(simulationLinks)
        .id((d) => d.id)
        .distance(100)
        .strength(0.5))
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide().radius(30));

    simulationRef.current = simulation;

    // Update positions on tick
    simulation.on("tick", () => {
      linkGroup
        .attr("x1", (d) => (d.source as GraphNode).x ?? 0)
        .attr("y1", (d) => (d.source as GraphNode).y ?? 0)
        .attr("x2", (d) => (d.target as GraphNode).x ?? 0)
        .attr("y2", (d) => (d.target as GraphNode).y ?? 0);

      linkLabels
        .attr("x", (d) => {
          const src = d.source as GraphNode;
          const tgt = d.target as GraphNode;
          return ((src.x ?? 0) + (tgt.x ?? 0)) / 2;
        })
        .attr("y", (d) => {
          const src = d.source as GraphNode;
          const tgt = d.target as GraphNode;
          return ((src.y ?? 0) + (tgt.y ?? 0)) / 2;
        });

      nodeGroup.attr("transform", (d) => `translate(${d.x ?? 0},${d.y ?? 0})`);
    });

    // Cleanup
    return () => {
      simulation.stop();
      simulationRef.current = null;
    };
  }, [mounted, dimensions, nodes, links]);

  // Reheat simulation
  const handleReheat = useCallback(() => {
    if (simulationRef.current) {
      simulationRef.current.alpha(1).restart();
    }
  }, []);

  if (!mounted) {
    return (
      <div 
        className={className}
        style={{ minHeight: 600, minWidth: 800 }}
      >
        <div className="flex items-center justify-center h-full bg-[#1a1a2e] rounded-lg">
          <div className="text-gray-400 animate-pulse">Loading graph...</div>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`relative bg-[#1a1a2e] rounded-lg overflow-hidden ${className || ""}`}
      style={{ minHeight: 600, minWidth: 800 }}
    >
      {/* SVG Canvas */}
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className="w-full h-full"
        style={{ minHeight: 600 }}
      />

      {/* Reheat Button */}
      <button
        type="button"
        onClick={handleReheat}
        className="absolute top-4 right-4 px-4 py-2 bg-[#2a2a4e] hover:bg-[#3a3a6e] 
                   text-gray-200 rounded-lg border border-gray-600 
                   transition-all duration-200 shadow-lg
                   hover:shadow-xl hover:border-gray-500
                   active:scale-95"
      >
        <span className="flex items-center gap-2">
          <svg 
            className="w-4 h-4" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
            aria-label="Reheat icon"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M13 10V3L4 14h7v7l9-11h-7z" 
            />
          </svg>
          Reheat
        </span>
      </button>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-[#2a2a4e]/90 backdrop-blur-sm rounded-lg p-3 border border-gray-600">
        <div className="text-xs text-gray-400 mb-2 font-medium">Legend</div>
        <div className="flex flex-col gap-2">
          {groups.map(({ group, color }) => (
            <div key={group} className="flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded-full shadow-sm"
                style={{ 
                  backgroundColor: color,
                  boxShadow: `0 0 8px ${color}40`
                }}
              />
              <span className="text-sm text-gray-300">{group}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tooltip */}
      {tooltip.visible && (
        <div
          className="fixed z-50 bg-[#2a2a4e]/95 backdrop-blur-sm rounded-lg p-3 
                     border border-gray-500 shadow-xl pointer-events-none
                     max-w-xs whitespace-pre-wrap"
          style={{
            left: tooltip.x,
            top: tooltip.y - 10,
            transform: "translate(-50%, -100%)",
          }}
        >
          <div className="text-sm text-gray-100 font-medium whitespace-pre-wrap">
            {tooltip.content}
          </div>
        </div>
      )}
    </div>
  );
}

// Default export for convenience
export default ForceGraphDemo;