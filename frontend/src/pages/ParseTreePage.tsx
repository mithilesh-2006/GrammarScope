import React, { useState } from 'react';
import type { ParseResponse } from '../types';
import { api } from '../services/api';
import { InteractiveTreeViewer } from '../components/InteractiveTreeViewer';
import {
  GitFork,
  Play,
  RefreshCw,
  Columns,
  CheckCircle,
  XCircle,
  Clock,
  Layers,
} from 'lucide-react';

interface ParseTreePageProps {
  grammarText: string;
  startSymbol: string;
  inputString: string;
  setInputString: (str: string) => void;
}

export const ParseTreePage: React.FC<ParseTreePageProps> = ({
  grammarText,
  startSymbol,
  inputString,
  setInputString,
}) => {
  const [tokenMode, setTokenMode] = useState<string>('auto');
  const maxTrees = 10;
  const [loading, setLoading] = useState(false);
  const [parseResult, setParseResult] = useState<ParseResponse | null>(null);
  const [activeTreeIndex, setActiveTreeIndex] = useState<number>(0);
  const [sideBySide, setSideBySide] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleParse = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await api.parseString(
        grammarText,
        inputString,
        startSymbol || undefined,
        tokenMode,
        maxTrees
      );
      setParseResult(res);
      setActiveTreeIndex(0);
      if (res.trees.length >= 2) {
        setSideBySide(true);
      } else {
        setSideBySide(false);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Parsing failed');
      setParseResult(null);
    } finally {
      setLoading(false);
    }
  };

  const trees = parseResult?.trees || [];
  const currentTree = trees[activeTreeIndex] || null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Parse Tree Viewer</h1>
          <p className="text-xs text-slate-500">
            Supply an input string to generate concrete parse trees using general Earley recognition and SPPF extraction.
          </p>
        </div>

        {trees.length >= 2 && (
          <button
            onClick={() => setSideBySide(!sideBySide)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              sideBySide
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <Columns size={14} />
            <span>{sideBySide ? 'Single View' : 'Side-by-Side Comparison'}</span>
          </button>
        )}
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <XCircle size={16} className="text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Input Form Bar */}
      <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
          <div className="md:col-span-6 space-y-1">
            <label className="text-xs font-bold text-slate-700">Input String or Tokens:</label>
            <input
              type="text"
              value={inputString}
              onChange={(e) => setInputString(e.target.value)}
              placeholder="e.g. id + id * id"
              className="w-full px-3.5 py-2 font-mono text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              onKeyDown={(e) => e.key === 'Enter' && handleParse()}
            />
          </div>

          <div className="md:col-span-3 space-y-1">
            <label className="text-xs font-bold text-slate-700">Tokenization Mode:</label>
            <select
              value={tokenMode}
              onChange={(e) => setTokenMode(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-indigo-500"
            >
              <option value="auto">Auto (Spaces or Maximal-Munch)</option>
              <option value="whitespace">Whitespace (split on spaces)</option>
              <option value="compact">Compact (Maximal-Munch greedy)</option>
              <option value="explicit">Explicit Array</option>
            </select>
          </div>

          <div className="md:col-span-3">
            <button
              onClick={handleParse}
              disabled={loading || !inputString.trim()}
              className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50"
            >
              {loading ? <RefreshCw size={15} className="animate-spin" /> : <Play size={15} />}
              Parse String
            </button>
          </div>
        </div>

        {/* Status bar */}
        {parseResult && (
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              {parseResult.accepted ? (
                <span className="flex items-center gap-1.5 font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  <CheckCircle size={14} className="text-emerald-500" /> String Accepted
                </span>
              ) : (
                <span className="flex items-center gap-1.5 font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                  <XCircle size={14} className="text-rose-500" /> String Rejected
                </span>
              )}

              <span className="text-slate-500 flex items-center gap-1">
                <Layers size={13} />
                <span>Trees found: <strong>{parseResult.distinct_parse_count}</strong></span>
              </span>

              <span className="text-slate-500 flex items-center gap-1">
                <Clock size={13} />
                <span>{(parseResult.duration_seconds * 1000).toFixed(1)} ms</span>
              </span>
            </div>

            <div className="flex items-center gap-1 font-mono text-[11px] text-slate-500">
              <span>Tokens: [{parseResult.tokens.map(t => `'${t}'`).join(', ')}]</span>
            </div>
          </div>
        )}
      </div>

      {/* Parse Tree Visualizer Viewport */}
      {parseResult?.accepted ? (
        sideBySide && trees.length >= 2 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <InteractiveTreeViewer
              tree={trees[0]}
              treeIndex={0}
              totalTrees={trees.length}
              title="Parse Tree A (Alternative 1)"
            />
            <InteractiveTreeViewer
              tree={trees[1]}
              treeIndex={1}
              totalTrees={trees.length}
              title="Parse Tree B (Alternative 2)"
            />
          </div>
        ) : (
          <div className="w-full">
            <InteractiveTreeViewer
              tree={currentTree}
              treeIndex={activeTreeIndex}
              totalTrees={trees.length}
              onPrevTree={() => setActiveTreeIndex(Math.max(0, activeTreeIndex - 1))}
              onNextTree={() => setActiveTreeIndex(Math.min(trees.length - 1, activeTreeIndex + 1))}
            />
          </div>
        )
      ) : parseResult && !parseResult.accepted ? (
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-rose-200 bg-rose-50/50 rounded-xl p-6 text-center space-y-2">
          <XCircle size={32} className="text-rose-500" />
          <h3 className="font-bold text-rose-800 text-sm">String Cannot Be Derived</h3>
          <p className="text-xs text-rose-600 max-w-md">
            The input token sequence could not be generated by the grammar starting from <code className="font-mono">{startSymbol || 'start symbol'}</code>.
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-slate-200 bg-white rounded-xl p-6 text-center space-y-2 text-slate-400">
          <GitFork size={36} className="text-slate-300" />
          <p className="text-xs font-medium">Enter an input string above and click &quot;Parse String&quot; to inspect the interactive syntax tree.</p>
        </div>
      )}
    </div>
  );
};
