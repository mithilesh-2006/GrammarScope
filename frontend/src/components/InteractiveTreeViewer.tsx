import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import type { ParseTreeNode } from '../types';
import { ZoomIn, ZoomOut, RotateCcw, Maximize2, Info, Sparkles } from 'lucide-react';

interface InteractiveTreeViewerProps {
  tree: ParseTreeNode | null;
  treeIndex?: number;
  totalTrees?: number;
  onPrevTree?: () => void;
  onNextTree?: () => void;
  title?: string;
  minHeight?: string;
}

export const InteractiveTreeViewer: React.FC<InteractiveTreeViewerProps> = ({
  tree,
  treeIndex = 0,
  totalTrees = 1,
  onPrevTree,
  onNextTree,
  title,
  minHeight = 'min-h-[600px]'
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [selectedNode, setSelectedNode] = useState<ParseTreeNode | null>(null);
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  const calculateLayout = useCallback(() => {
    if (!tree || !svgRef.current) return null;
    const svgEl = svgRef.current;
    const width = svgEl.clientWidth || 800;
    const height = svgEl.clientHeight || 560;

    const root = d3.hierarchy<ParseTreeNode>(tree, (d) => d.children || []);
    const nodeWidth = 75;
    const nodeHeight = 80;
    const treeLayout = d3.tree<ParseTreeNode>()
      .nodeSize([nodeWidth, nodeHeight])
      .separation((a, b) => (a.parent === b.parent ? 1.2 : 1.5));

    const treeData = treeLayout(root);

    const xValues = treeData.descendants().map(d => d.x ?? 0);
    const yValues = treeData.descendants().map(d => d.y ?? 0);

    const minX = Math.min(...xValues);
    const maxX = Math.max(...xValues);
    const maxY = Math.max(...yValues);

    const treeW = maxX - minX + 120;
    const treeH = maxY + 100;

    const availableW = Math.max(width - 60, 200);
    const availableH = Math.max(height - 100, 200);

    // Calculate optimal scale so full tree fits comfortably
    const scale = Math.min(availableW / treeW, availableH / treeH, 1.05);

    // Horizontal centering: center of tree at width / 2
    const treeCenterX = (minX + maxX) / 2;
    const translateX = (width / 2) - (treeCenterX * scale);

    // Vertical top-alignment: root starts 55px from top
    const translateY = 55;

    return {
      treeData,
      transform: d3.zoomIdentity.translate(translateX, translateY).scale(scale)
    };
  }, [tree]);

  const fitTree = useCallback(() => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    const layout = calculateLayout();
    if (!layout) return;

    d3.select(svgRef.current)
      .transition()
      .duration(350)
      .call(zoomBehaviorRef.current.transform, layout.transform);
  }, [calculateLayout]);

  useEffect(() => {
    if (!tree || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const layout = calculateLayout();
    if (!layout) return;

    const { treeData, transform } = layout;

    // Create main zoomable group
    const g = svg.append('g').attr('class', 'tree-viewport');

    // Zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 3.5])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    zoomBehaviorRef.current = zoom;
    svg.call(zoom);

    // Set initial transform
    svg.call(zoom.transform, transform);

    // Render tree links
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
      .attr('stroke', '#cbd5e1')
      .attr('stroke-width', 2.5);

    // Render tree nodes
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

    // Node shapes
    nodeGroup.each(function (d) {
      const el = d3.select(this);
      const isSelected = selectedNode === d.data;

      if (d.data.kind === 'terminal') {
        // Terminal node: rounded rectangle
        el.append('rect')
          .attr('x', -26)
          .attr('y', -17)
          .attr('width', 52)
          .attr('height', 34)
          .attr('rx', 8)
          .attr('fill', isSelected ? '#047857' : '#10b981')
          .attr('stroke', isSelected ? '#fbbf24' : '#059669')
          .attr('stroke-width', isSelected ? 3 : 2)
          .style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.12))');

        el.append('text')
          .attr('dy', 5)
          .attr('text-anchor', 'middle')
          .attr('fill', '#ffffff')
          .attr('font-size', '13px')
          .attr('font-weight', 'bold')
          .attr('font-family', 'ui-monospace, monospace')
          .text(d.data.symbol);

      } else if (d.data.kind === 'epsilon') {
        // Epsilon node: dashed box
        el.append('rect')
          .attr('x', -22)
          .attr('y', -15)
          .attr('width', 44)
          .attr('height', 30)
          .attr('rx', 8)
          .attr('fill', '#fef3c7')
          .attr('stroke', '#d97706')
          .attr('stroke-width', 2)
          .attr('stroke-dasharray', '4,3');

        el.append('text')
          .attr('dy', 5)
          .attr('text-anchor', 'middle')
          .attr('fill', '#b45309')
          .attr('font-size', '15px')
          .attr('font-weight', 'bold')
          .text('ε');

      } else {
        // Nonterminal node: indigo circle
        el.append('circle')
          .attr('r', 22)
          .attr('fill', isSelected ? '#3730a3' : '#4f46e5')
          .attr('stroke', isSelected ? '#fbbf24' : '#312e81')
          .attr('stroke-width', isSelected ? 3.5 : 2.5)
          .style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))');

        el.append('text')
          .attr('dy', 5)
          .attr('text-anchor', 'middle')
          .attr('fill', '#ffffff')
          .attr('font-size', '14px')
          .attr('font-weight', 'bold')
          .attr('font-family', 'ui-monospace, monospace')
          .text(d.data.symbol);
      }
    });
  }, [tree, selectedNode, calculateLayout]);

  const handleZoom = (factor: number) => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current).transition().duration(250).call(zoomBehaviorRef.current.scaleBy, factor);
  };

  if (!tree) {
    return (
      <div className={`flex items-center justify-center ${minHeight} border-2 border-dashed border-slate-300 rounded-2xl bg-white text-slate-400 p-8 text-center`}>
        <div className="space-y-2">
          <Sparkles size={32} className="mx-auto text-slate-300" />
          <p className="text-sm font-semibold text-slate-600">No Syntax Tree Available</p>
          <p className="text-xs text-slate-400">Parse a valid expression to render the interactive tree.</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm flex flex-col ${minHeight}`}
      ref={containerRef}
    >
      {/* Header toolbar */}
      <div className="flex items-center justify-between px-5 py-3 bg-slate-50 border-b border-slate-200 shrink-0">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-800 text-sm">{title || 'Concrete Syntax Tree'}</span>
          {totalTrees > 1 && (
            <span className="text-xs bg-indigo-100 text-indigo-700 font-semibold px-2.5 py-0.5 rounded-full">
              Alternative {treeIndex + 1} of {totalTrees}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {totalTrees > 1 && onPrevTree && onNextTree && (
            <div className="flex items-center gap-1 mr-3 border-r border-slate-300 pr-3">
              <button
                onClick={onPrevTree}
                disabled={treeIndex <= 0}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 transition-colors shadow-2xs"
              >
                ◀ Prev Tree
              </button>
              <button
                onClick={onNextTree}
                disabled={treeIndex >= totalTrees - 1}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 transition-colors shadow-2xs"
              >
                Next Tree ▶
              </button>
            </div>
          )}

          <button
            onClick={() => handleZoom(1.25)}
            title="Zoom In"
            className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-white rounded-lg border border-slate-200 transition-colors"
          >
            <ZoomIn size={16} />
          </button>
          <button
            onClick={() => handleZoom(0.8)}
            title="Zoom Out"
            className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-white rounded-lg border border-slate-200 transition-colors"
          >
            <ZoomOut size={16} />
          </button>
          <button
            onClick={fitTree}
            title="Fit to Screen"
            className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-white rounded-lg border border-slate-200 transition-colors"
          >
            <Maximize2 size={16} />
          </button>
          <button
            onClick={fitTree}
            title="Reset View"
            className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-white rounded-lg border border-slate-200 transition-colors"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      {/* SVG Canvas (pure white background, no gradient obscuring content) */}
      <div className="flex-1 w-full min-h-[520px] relative bg-white">
        <svg
          ref={svgRef}
          className="w-full h-full min-h-[520px] cursor-grab active:cursor-grabbing select-none block"
        />

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm px-3.5 py-2 rounded-xl border border-slate-200 shadow-sm text-xs flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-slate-700 font-semibold">
            <span className="w-3.5 h-3.5 rounded-full bg-indigo-600 inline-block"></span> Nonterminal
          </span>
          <span className="flex items-center gap-1.5 text-slate-700 font-semibold">
            <span className="w-3.5 h-3 rounded-md bg-emerald-500 inline-block"></span> Terminal
          </span>
          <span className="flex items-center gap-1.5 text-slate-700 font-semibold">
            <span className="w-3.5 h-3 rounded-md bg-amber-100 border border-amber-500 border-dashed inline-block"></span> Epsilon (ε)
          </span>
        </div>

        {/* Clickable Node Inspector Panel */}
        {selectedNode && (
          <div className="absolute top-4 right-4 max-w-xs bg-white/95 backdrop-blur-md p-4 rounded-xl border border-indigo-200 shadow-lg text-xs z-10 animate-fade-in">
            <div className="flex items-center justify-between font-bold text-slate-800 pb-2 mb-2 border-b border-slate-100">
              <span className="flex items-center gap-1.5 text-indigo-700">
                <Info size={15} /> Node Details
              </span>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-slate-400 hover:text-slate-700 font-bold text-sm leading-none"
              >
                ✕
              </button>
            </div>
            <div className="space-y-1.5 text-slate-600">
              <div><strong className="text-slate-800">Symbol:</strong> <span className="font-mono bg-slate-100 text-slate-900 px-1.5 py-0.5 rounded font-bold">{selectedNode.symbol}</span></div>
              <div><strong className="text-slate-800">Type:</strong> <span className="capitalize font-medium text-slate-700">{selectedNode.kind}</span></div>
              {selectedNode.production && (
                <div><strong className="text-slate-800">Applied Rule:</strong> <span className="font-mono text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded block mt-0.5 font-semibold">{selectedNode.production}</span></div>
              )}
              {selectedNode.span && (
                <div><strong className="text-slate-800">Token Span:</strong> [{selectedNode.span[0]}, {selectedNode.span[1]}]</div>
              )}
              <div><strong className="text-slate-800">Subtree:</strong> <span className="font-mono text-[11px] text-slate-700 break-all block mt-0.5">{formatBracketed(selectedNode)}</span></div>
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
