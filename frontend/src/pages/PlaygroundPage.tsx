import React, { useState } from 'react';
import type { FirstFollowResponse, CYKResponse } from '../types';
import { api } from '../services/api';
import { Play, RefreshCw, XCircle, CheckCircle, Table } from 'lucide-react';

interface PlaygroundPageProps {
  grammarText: string;
  startSymbol: string;
  inputString: string;
  setInputString: (str: string) => void;
}

export const PlaygroundPage: React.FC<PlaygroundPageProps> = ({
  grammarText,
  startSymbol,
  inputString,
  setInputString,
}) => {
  const [activeTab, setActiveTab] = useState<'first_follow' | 'cyk'>('first_follow');

  // FIRST / FOLLOW state
  const [ffLoading, setFfLoading] = useState(false);
  const [ffResult, setFfResult] = useState<FirstFollowResponse | null>(null);
  const [ffError, setFfError] = useState<string | null>(null);

  // CYK state
  const [cykLoading, setCykLoading] = useState(false);
  const [cykResult, setCykResult] = useState<CYKResponse | null>(null);
  const [cykError, setCykError] = useState<string | null>(null);

  const handleComputeFirstFollow = async () => {
    setFfLoading(true);
    setFfError(null);
    try {
      const res = await api.getFirstFollow(grammarText, startSymbol || undefined);
      setFfResult(res);
    } catch (err: any) {
      setFfError(err.message || 'Failed to compute FIRST/FOLLOW sets');
    } finally {
      setFfLoading(false);
    }
  };

  const handleRunCYK = async () => {
    setCykLoading(true);
    setCykError(null);
    try {
      const res = await api.runCYK(grammarText, inputString, 'auto');
      setCykResult(res);
    } catch (err: any) {
      setCykError(err.message || 'CYK analysis failed');
    } finally {
      setCykLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Algorithm Playground</h1>
          <p className="text-xs text-slate-500">
            Interactive exploration of FIRST & FOLLOW set derivation and Cocke-Younger-Kasami (CYK) dynamic programming.
          </p>
        </div>

        {/* Subtabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('first_follow')}
            className={`px-4 py-2 rounded-lg transition-all ${
              activeTab === 'first_follow'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            FIRST & FOLLOW Sets
          </button>
          <button
            onClick={() => setActiveTab('cyk')}
            className={`px-4 py-2 rounded-lg transition-all ${
              activeTab === 'cyk'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            CYK Dynamic Programming
          </button>
        </div>
      </div>

      {/* FIRST & FOLLOW Subtab */}
      {activeTab === 'first_follow' && (
        <div className="space-y-6">
          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-800 text-sm mb-1">Compute Sets for Current Grammar</h3>
              <p className="text-xs text-slate-500">
                Calculates FIRST(X) and FOLLOW(A) using iterative fixed-point evaluation.
              </p>
            </div>
            <button
              onClick={handleComputeFirstFollow}
              disabled={ffLoading}
              className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
            >
              {ffLoading ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />}
              Compute FIRST & FOLLOW
            </button>
          </div>

          {ffError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <XCircle size={15} className="shrink-0" />
              <span>{ffError}</span>
            </div>
          )}

          {ffResult && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                  FIRST & FOLLOW Sets (Start: {ffResult.start_symbol})
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/75 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-5 py-3 w-40">Nonterminal</th>
                      <th className="px-5 py-3">FIRST Set</th>
                      <th className="px-5 py-3">FOLLOW Set</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {Object.keys(ffResult.first_sets).map((nt) => (
                      <tr key={nt} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-5 py-3 font-mono font-bold text-indigo-700">
                          {nt}
                        </td>
                        <td className="px-5 py-3 font-mono">
                          &#123;{' '}
                          {ffResult.first_sets[nt].map((sym) => (
                            <span
                              key={sym}
                              className={`inline-block mr-1.5 px-2 py-0.5 rounded text-[11px] ${
                                sym === 'ε'
                                  ? 'bg-amber-100 text-amber-800 font-bold'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              }`}
                            >
                              {sym}
                            </span>
                          ))}
                          &#125;
                        </td>
                        <td className="px-5 py-3 font-mono">
                          &#123;{' '}
                          {(ffResult.follow_sets[nt] || []).map((sym) => (
                            <span
                              key={sym}
                              className={`inline-block mr-1.5 px-2 py-0.5 rounded text-[11px] ${
                                sym === '$'
                                  ? 'bg-purple-100 text-purple-800 font-bold'
                                  : 'bg-blue-50 text-blue-700 border border-blue-200'
                              }`}
                            >
                              {sym}
                            </span>
                          ))}
                          &#125;
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CYK Subtab */}
      {activeTab === 'cyk' && (
        <div className="space-y-6">
          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              <div className="sm:col-span-8 space-y-1">
                <label className="text-xs font-bold text-slate-700">Input String to Parse via CYK:</label>
                <input
                  type="text"
                  value={inputString}
                  onChange={(e) => setInputString(e.target.value)}
                  placeholder="e.g. id + id"
                  className="w-full px-3.5 py-2 font-mono text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="sm:col-span-4">
                <button
                  onClick={handleRunCYK}
                  disabled={cykLoading || !inputString.trim()}
                  className="w-full flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
                >
                  {cykLoading ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />}
                  Run CYK Parser
                </button>
              </div>
            </div>
          </div>

          {cykError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <XCircle size={15} className="shrink-0" />
              <span>{cykError}</span>
            </div>
          )}

          {cykResult && (
            <div className="space-y-6">
              {/* Status Header */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  {cykResult.accepted ? (
                    <span className="flex items-center gap-1.5 font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                      <CheckCircle size={14} className="text-emerald-500" /> Accepted by CNF Grammar
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                      <XCircle size={14} className="text-rose-500" /> Rejected by CNF Grammar
                    </span>
                  )}
                  <span className="text-slate-500">
                    CNF Start Symbol: <strong className="font-mono text-indigo-700">{cykResult.cnf_start_symbol}</strong>
                  </span>
                </div>

                <div className="text-slate-500 font-mono text-[11px]">
                  Duration: {(cykResult.duration_seconds * 1000).toFixed(1)} ms
                </div>
              </div>

              {/* Dynamic Programming Triangular Table */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                    <Table size={16} className="text-indigo-600" /> CYK Dynamic Programming Matrix
                  </h3>
                  <span className="text-[11px] text-slate-400">Rows = substring length (1..n), Columns = starting token index</span>
                </div>

                <div className="overflow-x-auto pb-2">
                  <div className="inline-block min-w-full space-y-2">
                    {/* Render from length n down to 1 (traditional CYK pyramid) */}
                    {[...cykResult.table].reverse().map((row) => (
                      <div key={row.length} className="flex items-center gap-2">
                        <div className="w-16 font-mono text-xs font-bold text-slate-400 text-right pr-2 shrink-0">
                          len {row.length}
                        </div>
                        <div className="flex gap-2">
                          {row.cells.map((cell) => {
                            const isRoot = row.length === cykResult.tokens.length;
                            const derivesStart = cell.nonterminals.includes(cykResult.cnf_start_symbol);
                            return (
                              <div
                                key={cell.start}
                                className={`w-32 min-h-[58px] p-2 rounded-lg border text-xs flex flex-col justify-between transition-all ${
                                  isRoot && derivesStart
                                    ? 'bg-emerald-50 border-emerald-300 shadow-sm'
                                    : cell.nonterminals.length > 0
                                    ? 'bg-indigo-50/50 border-indigo-200'
                                    : 'bg-slate-50/60 border-slate-200 opacity-60'
                                }`}
                              >
                                <div className="text-[10px] text-slate-400 font-mono truncate" title={cell.span_text}>
                                  &quot;{cell.span_text}&quot;
                                </div>
                                <div className="font-mono font-bold text-indigo-900 mt-1">
                                  {cell.nonterminals.length > 0 ? (
                                    cell.nonterminals.join(', ')
                                  ) : (
                                    <span className="text-slate-300 font-normal">∅</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}

                    {/* Bottom row: token labels */}
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                      <div className="w-16 text-right pr-2 text-[10px] font-bold text-slate-400 shrink-0 uppercase">
                        Tokens
                      </div>
                      <div className="flex gap-2">
                        {cykResult.tokens.map((tok, i) => (
                          <div
                            key={i}
                            className="w-32 text-center py-1 rounded bg-slate-800 text-white font-mono text-xs font-bold"
                          >
                            {tok}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* CNF Production Rules */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 text-xs space-y-2">
                <h4 className="font-bold text-slate-700">Derived Chomsky Normal Form (CNF) Rules ({cykResult.cnf_productions.length}):</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 font-mono text-[11px] text-slate-600 bg-slate-50 p-3 rounded-lg max-h-48 overflow-y-auto">
                  {cykResult.cnf_productions.map((p, idx) => (
                    <div key={idx} className="bg-white p-1 rounded border border-slate-200 truncate">
                      {p}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
