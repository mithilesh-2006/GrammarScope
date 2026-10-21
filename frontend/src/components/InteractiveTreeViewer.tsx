import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import type { ParseTreeNode } from '../types';
import { ZoomIn, ZoomOut, RotateCcw, Info } from 'lucide-react';

interface InteractiveTreeViewerProps {
  tree: ParseTreeNode | null;
  treeIndex?: number;
  totalTrees?: number;
  onPrevTree?: () => void;
  onNextTree?: () => void;
  title?: string;
}

export const InteractiveTreeViewer: React.FC<InteractiveTreeViewerProps> = ({
  tree,
  treeIndex = 0,
  totalTrees = 1,
  onPrevTree,
  onNextTree,
  title
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [selectedNode, setSelectedNode] = useState<ParseTreeNode | null>(null);
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  useEffect(() => {
    if (!tree || !svgRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth || 700;
    const height = Math.max(container.clientHeight || 450, 400);

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    svg.attr('width', '100%').attr('height', '100%');

    // Create main zoomable group
    const g = svg.append('g').attr('class', 'tree-viewport');

    // Setup zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    zoomBehaviorRef.current = zoom;
    svg.call(zoom);

    // Build D3 hierarchy
    const root = d3.hierarchy<ParseTreeNode>(tree, (d) => d.children || []);

    // Layout configuration
    const nodeWidth = 75;
    const nodeHeight = 70;
    const treeLayout = d3.tree<ParseTreeNode>()
      .nodeSize([nodeWidth, nodeHeight])
      .separation((a, b) => (a.parent === b.parent ? 1.2 : 1.5));

    const treeData = treeLayout(root);

    // Links
    const linkGenerator = d3.linkVertical<any, any>()
      .x((d: any) => d.x)
      .y((d: any) => d.y);

    g.selectAll('.link')
      .data(treeData.links())
      .enter()
      .append('path')
      .attr('class', 'link')
      .attr('d', linkGenerator as any)
      .attr('fill', 'none')
      .attr('stroke', '#94a3b8')
      .attr('stroke-width', 2);

    // Nodes
    const nodeGroup = g.selectAll('.node')
      .data(treeData.descendants())
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', (d) => `translate(${d.x},${d.y})`)
      .style('cursor', 'pointer')
      .on('click', (_, d) => {
        setSelectedNode(d.data);
      });

    // Render node shapes based on kind
    nodeGroup.each(function (d) {
      const el = d3.select(this);
      const isSelected = selectedNode === d.data;

      if (d.data.kind === 'terminal') {
        el.append('rect')
          .attr('x', -24)
          .attr('y', -16)
          .attr('width', 48)
          .attr('height', 32)
          .attr('rx', 8)
          .attr('fill', isSelected ? '#047857' : '#10b981')
          .attr('stroke', isSelected ? '#fbbf24' : '#059669')
          .attr('stroke-width', isSelected ? 3 : 1.5)
          .attr('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))');

        el.append('text')
          .attr('dy', 5)
          .attr('text-anchor', 'middle')
          .attr('fill', '#ffffff')
          .attr('font-size', '13px')
          .attr('font-weight', 'bold')
          .attr('font-family', 'ui-monospace, monospace')
          .text(d.data.symbol);

      } else if (d.data.kind === 'epsilon') {
        el.append('rect')
          .attr('x', -20)
          .attr('y', -14)
          .attr('width', 40)
          .attr('height', 28)
          .attr('rx', 6)
          .attr('fill', '#fef3c7')
          .attr('stroke', '#d97706')
          .attr('stroke-width', 1.5)
          .attr('stroke-dasharray', '3,3');

        el.append('text')
          .attr('dy', 5)
          .attr('text-anchor', 'middle')
          .attr('fill', '#b45309')
          .attr('font-size', '14px')
          .attr('font-weight', 'bold')
          .text('ε');

      } else {
        el.append('circle')
          .attr('r', 20)
          .attr('fill', isSelected ? '#3730a3' : '#4f46e5')
          .attr('stroke', isSelected ? '#fbbf24' : '#312e81')
          .attr('stroke-width', isSelected ? 3 : 2)
          .attr('filter', 'drop-shadow(0 2px 6px rgba(0,0,0,0.15))');

        el.append('text')
          .attr('dy', 5)
          .attr('text-anchor', 'middle')
          .attr('fill', '#ffffff')
          .attr('font-size', '13px')
          .attr('font-weight', 'bold')
          .attr('font-family', 'ui-monospace, monospace')
          .text(d.data.symbol);
      }
    });

    // Fit view to center
    const xValues = treeData.descendants().map(d => d.x ?? 0);
    const yValues = treeData.descendants().map(d => d.y ?? 0);
    const minX = Math.min(...xValues) - 40;
    const maxX = Math.max(...xValues) + 40;
    const minY = Math.min(...yValues) - 30;
    const maxY = Math.max(...yValues) + 40;

    const treeW = maxX - minX;
    const treeH = maxY - minY;
    const scale = Math.min(width / (treeW || 1), height / (treeH || 1), 1.0) * 0.85;

    const initialTransform = d3.zoomIdentity
      .translate(width / 2 - ((minX + maxX) / 2) * scale, 40)
      .scale(scale);

    svg.call(zoom.transform, initialTransform);
  }, [tree, selectedNode]);

  const handleZoom = (factor: number) => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current).transition().duration(250).call(zoomBehaviorRef.current.scaleBy, factor);
  };

  const handleResetZoom = () => {
    if (!tree || !svgRef.current || !zoomBehaviorRef.current || !containerRef.current) return;
    const width = containerRef.current.clientWidth || 700;
    const height = Math.max(containerRef.current.clientHeight || 450, 400);

    const root = d3.hierarchy<ParseTreeNode>(tree, (d) => d.children || []);
    const nodeWidth = 75;
    const nodeHeight = 70;
    const treeData = d3.tree<ParseTreeNode>().nodeSize([nodeWidth, nodeHeight])(root);

    const xValues = treeData.descendants().map(d => d.x ?? 0);
    const yValues = treeData.descendants().map(d => d.y ?? 0);
    const minX = Math.min(...xValues) - 40;
    const maxX = Math.max(...xValues) + 40;
    const minY = Math.min(...yValues) - 30;
    const maxY = Math.max(...yValues) + 40;
    const scale = Math.min(width / (maxX - minX || 1), height / (maxY - minY || 1), 1.0) * 0.85;

    const transform = d3.zoomIdentity
      .translate(width / 2 - ((minX + maxX) / 2) * scale, 40)
      .scale(scale);

    d3.select(svgRef.current).transition().duration(350).call(zoomBehaviorRef.current.transform, transform);
  };

  if (!tree) {
    return (
      <div className="flex items-center justify-center h-72 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 text-slate-500">
        <p className="text-sm font-medium">No parse tree available for display.</p>
      </div>
    );
  }

  return (
    <div className="relative border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm flex flex-col h-full min-h-[460px]" ref={containerRef}>
      {/* Header toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-700 text-sm">{title || 'Parse Tree'}</span>
          {totalTrees > 1 && (
            <span className="text-xs bg-indigo-100 text-indigo-700 font-medium px-2 py-0.5 rounded-full">
              Tree {treeIndex + 1} of {totalTrees}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {totalTrees > 1 && onPrevTree && onNextTree && (
            <div className="flex items-center gap-1 mr-3 border-r border-slate-300 pr-3">
              <button
                onClick={onPrevTree}
                disabled={treeIndex <= 0}
                className="px-2 py-1 text-xs font-medium rounded border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 transition-colors"
              >
                ◀ Prev
              </button>
              <button
                onClick={onNextTree}
                disabled={treeIndex >= totalTrees - 1}
                className="px-2 py-1 text-xs font-medium rounded border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 transition-colors"
              >
                Next ▶
              </button>
            </div>
          )}

          <button
            onClick={() => handleZoom(1.25)}
            title="Zoom In"
            className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-white rounded border border-slate-200 transition-colors"
          >
            <ZoomIn size={16} />
          </button>
          <button
            onClick={() => handleZoom(0.8)}
            title="Zoom Out"
            className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-white rounded border border-slate-200 transition-colors"
          >
            <ZoomOut size={16} />
          </button>
          <button
            onClick={handleResetZoom}
            title="Reset View"
            className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-white rounded border border-slate-200 transition-colors"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="flex-1 w-full h-[400px] relative bg-gradient-to-b from-slate-50/50 to-white">
        <svg ref={svgRef} className="w-full h-full cursor-grab active:cursor-grabbing select-none" />

        {/* Legend */}
        <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm text-xs flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-slate-600 font-medium">
            <span className="w-3.5 h-3.5 rounded-full bg-indigo-600 inline-block"></span> Nonterminal
          </span>
          <span className="flex items-center gap-1.5 text-slate-600 font-medium">
            <span className="w-3.5 h-3 rounded-md bg-emerald-500 inline-block"></span> Terminal
          </span>
          <span className="flex items-center gap-1.5 text-slate-600 font-medium">
            <span className="w-3.5 h-3 rounded-md bg-amber-100 border border-amber-500 border-dashed inline-block"></span> Epsilon (ε)
          </span>
        </div>

        {/* Node inspector panel */}
        {selectedNode && (
          <div className="absolute top-3 right-3 max-w-xs bg-white/95 backdrop-blur-sm p-3.5 rounded-lg border border-indigo-200 shadow-md text-xs z-10 animate-fade-in">
            <div className="flex items-center justify-between font-semibold text-slate-800 pb-1.5 mb-1.5 border-b border-slate-100">
              <span className="flex items-center gap-1 text-indigo-700">
                <Info size={14} /> Node Inspector
              </span>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>
            <div className="space-y-1 text-slate-600">
              <div><strong className="text-slate-700">Symbol:</strong> <span className="font-mono bg-slate-100 px-1 py-0.5 rounded">{selectedNode.symbol}</span></div>
              <div><strong className="text-slate-700">Type:</strong> <span className="capitalize">{selectedNode.kind}</span></div>
              {selectedNode.production && (
                <div><strong className="text-slate-700">Rule:</strong> <span className="font-mono text-indigo-600 bg-indigo-50 px-1 py-0.5 rounded">{selectedNode.production}</span></div>
              )}
              {selectedNode.span && (
                <div><strong className="text-slate-700">Span:</strong> [{selectedNode.span[0]}, {selectedNode.span[1]}]</div>
              )}
              <div><strong className="text-slate-700">Subtree:</strong> <span className="font-mono text-[11px] break-all">{formatBracketed(selectedNode)}</span></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

function formatBracketed(node: ParseTreeNode): string {
  if (node.kind === 'terminal') return node.symbol;
  if (node.kind === 'epsilon') return 'ε';
  const sub = (node.children || []).map(formatBracketed).join(' ');
  return `[${node.symbol} ${sub}]`;
}
