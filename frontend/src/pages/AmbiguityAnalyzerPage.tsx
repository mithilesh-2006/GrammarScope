import React, { useState } from 'react';
import type { StringAmbiguityResponse, GrammarAmbiguityResponse } from '../types';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { InteractiveTreeViewer } from '../components/InteractiveTreeViewer';
import {
  Search,
  RefreshCw,
  Play,
  Sliders,
  ShieldAlert,
  Clock,
  Layers,
  CheckCircle2,
  AlertOctagon,
  XCircle,
  HelpCircle,
} from 'lucide-react';

interface AmbiguityAnalyzerPageProps {
  grammarText: string;
  startSymbol: string;
  inputString: string;
  setInputString: (str: string) => void;
}

export const AmbiguityAnalyzerPage: React.FC<AmbiguityAnalyzerPageProps> = ({
  grammarText,
  startSymbol,
  inputString,
  setInputString,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'string' | 'grammar'>('string');

  // String mode state
  const [stringLoading, setStringLoading] = useState(false);
  const [stringResult, setStringResult] = useState<StringAmbiguityResponse | null>(null);
  const [stringError, setStringError] = useState<string | null>(null);

  // Grammar mode state
  const [grammarLoading, setGrammarLoading] = useState(false);
  const [grammarResult, setGrammarResult] = useState<GrammarAmbiguityResponse | null>(null);
  const [grammarError, setGrammarError] = useState<string | null>(null);

  // Search limits
  const [maxTokens, setMaxTokens] = useState<number>(8);
  const [maxCandidates, setMaxCandidates] = useState<number>(200);
  const [timeoutSeconds, setTimeoutSeconds] = useState<number>(4.0);

  const handleAnalyzeString = async () => {
    setStringLoading(true);
    setStringError(null);
    try {
      const res = await api.analyzeStringAmbiguity(
        grammarText,
        inputString,
        startSymbol || undefined,
        'auto',
        10
      );
      setStringResult(res);
    } catch (err: any) {
      setStringError(err.message || 'String analysis failed');
      setStringResult(null);
    } finally {
      setStringLoading(false);
    }
  };

  const handleSearchGrammar = async () => {
    setGrammarLoading(true);
    setGrammarError(null);
    try {
      const res = await api.searchGrammarAmbiguity(
        grammarText,
        startSymbol || undefined,
        maxTokens,
        maxCandidates,
        timeoutSeconds
      );
      setGrammarResult(res);
    } catch (err: any) {
      setGrammarError(err.message || 'Grammar witness search failed');
      setGrammarResult(null);
    } finally {
      setGrammarLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Ambiguity Analyzer</h1>
          <p className="text-xs text-slate-500">
            Investigate string-level derivations or search for ambiguity witnesses within bounded grammar candidate spaces.
          </p>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
          <button
            onClick={() => setActiveSubTab('string')}
            className={`px-4 py-2 rounded-lg transition-all ${
              activeSubTab === 'string'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            String Ambiguity Analysis
          </button>
          <button
            onClick={() => setActiveSubTab('grammar')}
            className={`px-4 py-2 rounded-lg transition-all ${
              activeSubTab === 'grammar'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Grammar Witness Explorer
          </button>
        </div>
      </div>

      {/* String Ambiguity Tab */}
      {activeSubTab === 'string' && (
        <div className="space-y-6">
          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-end gap-3">
              <div className="flex-1 space-y-1">
                <label className="text-xs font-bold text-slate-700">Test String:</label>
                <input
                  type="text"
                  value={inputString}
                  onChange={(e) => setInputString(e.target.value)}
                  placeholder="e.g. id + id * id"
                  className="w-full px-3.5 py-2 font-mono text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500"
                  onKeyDown={(e) => e.key === 'Enter' && handleAnalyzeString()}
                />
              </div>

              <button
                onClick={handleAnalyzeString}
                disabled={stringLoading || !inputString.trim()}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-md shadow-rose-600/20 transition-all disabled:opacity-50"
              >
                {stringLoading ? <RefreshCw size={15} className="animate-spin" /> : <Search size={15} />}
                Check Ambiguity
              </button>
            </div>

            {stringError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <XCircle size={15} className="shrink-0" />
                <span>{stringError}</span>
              </div>
            )}

            {stringResult && (
              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <StatusBadge status={stringResult.status} />
                  <span className="text-slate-600">{stringResult.message}</span>
                </div>
                <div className="text-slate-400 font-mono text-[11px]">
                  Distinct trees found: <strong>{stringResult.distinct_parse_count_found}</strong>
                </div>
              </div>
            )}
          </div>

          {/* Results display */}
          {stringResult && stringResult.trees.length >= 2 ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-2.5">
                <AlertOctagon size={18} className="text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold mb-0.5">Concrete Ambiguity Evidence Discovered</h4>
                  <p className="text-rose-700">
                    The string has multiple structurally distinct derivations under this grammar. Both valid parse trees are rendered below side-by-side for comparison.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <InteractiveTreeViewer
                  tree={stringResult.trees[0]}
                  treeIndex={0}
                  totalTrees={stringResult.trees.length}
                  title="Derivation Tree A (Left-precedence)"
                />
                <InteractiveTreeViewer
                  tree={stringResult.trees[1]}
                  treeIndex={1}
                  totalTrees={stringResult.trees.length}
                  title="Derivation Tree B (Right-precedence)"
                />
              </div>
            </div>
          ) : stringResult && stringResult.trees.length === 1 ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start gap-2.5">
                <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold mb-0.5">Single Derivation (Unique Parse)</h4>
                  <p className="text-emerald-700">
                    The SPPF search completed exhaustively and established exactly one parse tree for this input.
                  </p>
                </div>
              </div>

              <InteractiveTreeViewer
                tree={stringResult.trees[0]}
                treeIndex={0}
                totalTrees={1}
                title="Unique Parse Tree"
              />
            </div>
          ) : null}
        </div>
      )}

      {/* Grammar Ambiguity Tab */}
      {activeSubTab === 'grammar' && (
        <div className="space-y-6">
          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-5">
            <div>
              <h3 className="font-bold text-slate-800 text-sm mb-1 flex items-center gap-1.5">
                <Sliders size={16} className="text-indigo-600" /> Bounded Witness Search Parameters
              </h3>
              <p className="text-xs text-slate-500">
                Systematically derives candidate terminal strings from the grammar up to length and candidate bounds.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Max Candidate Length (Tokens):</label>
                <input
                  type="number"
                  min={1}
                  max={15}
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(parseInt(e.target.value) || 8)}
                  className="w-full px-3 py-1.5 text-xs font-mono border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Max Candidates to Test:</label>
                <input
                  type="number"
                  min={10}
                  max={1000}
                  value={maxCandidates}
                  onChange={(e) => setMaxCandidates(parseInt(e.target.value) || 200)}
                  className="w-full px-3 py-1.5 text-xs font-mono border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Timeout (Seconds):</label>
                <input
                  type="number"
                  step="0.5"
                  min={1}
                  max={15}
                  value={timeoutSeconds}
                  onChange={(e) => setTimeoutSeconds(parseFloat(e.target.value) || 4.0)}
                  className="w-full px-3 py-1.5 text-xs font-mono border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                <ShieldAlert size={14} className="text-amber-500" />
                <span>Bounded search is evidence-based and cannot prove arbitrary CFG unambiguity.</span>
              </div>

              <button
                onClick={handleSearchGrammar}
                disabled={grammarLoading}
                className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50"
              >
                {grammarLoading ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />}
                Search for Witness
              </button>
            </div>

            {grammarError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <XCircle size={15} className="shrink-0" />
                <span>{grammarError}</span>
              </div>
            )}
          </div>

          {/* Grammar Search Result */}
          {grammarResult && (
            <div className="space-y-6">
              {/* Status Header Card */}
              <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={grammarResult.status} />
                    <span className="font-semibold text-xs text-slate-800">{grammarResult.message}</span>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Layers size={13} />
                      <span>Candidates tested: <strong>{grammarResult.candidates_evaluated}</strong></span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={13} />
                      <span>{(grammarResult.duration_seconds * 1000).toFixed(0)} ms</span>
                    </span>
                  </div>
                </div>

                {grammarResult.status === 'ambiguous' && grammarResult.witness_string && (
                  <div className="mt-3 p-3.5 bg-rose-50 border border-rose-200 rounded-lg flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 block mb-0.5">
                        Discovered Witness String:
                      </span>
                      <code className="text-sm font-mono font-bold text-rose-950 bg-white px-2 py-0.5 rounded border border-rose-300">
                        {grammarResult.witness_string_display}
                      </code>
                    </div>
                    <span className="text-xs text-rose-700 font-medium">
                      2 distinct parse trees found below
                    </span>
                  </div>
                )}

                {grammarResult.status === 'no_witness_within_limits' && (
                  <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs space-y-1">
                    <div className="font-bold flex items-center gap-1.5 text-amber-800">
                      <HelpCircle size={15} /> Scope of Analysis Completed
                    </div>
                    <p className="text-amber-700 leading-relaxed">
                      All {grammarResult.candidates_evaluated} candidate strings up to length {grammarResult.search_limits.max_tokens} had unique parses. Because context-free grammar ambiguity is undecidable in the general case (proven by reduction from Post&apos;s Correspondence Problem), this finite search does <strong>not</strong> prove the grammar is unambiguous.
                    </p>
                  </div>
                )}
              </div>

              {/* Witness Parse Trees */}
              {grammarResult.status === 'ambiguous' && grammarResult.trees.length >= 2 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <InteractiveTreeViewer
                    tree={grammarResult.trees[0]}
                    treeIndex={0}
                    totalTrees={grammarResult.trees.length}
                    title="Witness Parse Tree 1"
                  />
                  <InteractiveTreeViewer
                    tree={grammarResult.trees[1]}
                    treeIndex={1}
                    totalTrees={grammarResult.trees.length}
                    title="Witness Parse Tree 2"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
