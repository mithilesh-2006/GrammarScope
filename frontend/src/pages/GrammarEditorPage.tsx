import React, { useState } from 'react';
import type { GrammarValidateResponse } from '../types';
import { api } from '../services/api';
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  Play,
  ArrowRight,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

interface GrammarEditorPageProps {
  grammarText: string;
  setGrammarText: (text: string) => void;
  startSymbol: string;
  setStartSymbol: (sym: string) => void;
  validationReport: GrammarValidateResponse | null;
  setValidationReport: (report: GrammarValidateResponse | null) => void;
  setActiveTab: (tab: string) => void;
}

export const GrammarEditorPage: React.FC<GrammarEditorPageProps> = ({
  grammarText,
  setGrammarText,
  startSymbol,
  setStartSymbol,
  validationReport,
  setValidationReport,
  setActiveTab,
}) => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleValidate = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await api.validateGrammar(grammarText, startSymbol || undefined);
      setValidationReport(res);
      if (res.start_symbol && !startSymbol) {
        setStartSymbol(res.start_symbol);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Validation request failed');
    } finally {
      setLoading(false);
    }
  };

  const insertEpsilon = () => {
    setGrammarText(grammarText + ' ε');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Grammar Editor</h1>
          <p className="text-xs text-slate-500">
            Define context-free productions (e.g. <code className="text-indigo-600 font-mono">E -&gt; E + E | id</code>). Use <code className="text-indigo-600 font-mono">ε</code> or <code className="text-indigo-600 font-mono">epsilon</code> for empty derivation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={insertEpsilon}
            className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
          >
            + Insert ε
          </button>
          <button
            onClick={handleValidate}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
          >
            {loading ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />}
            Validate Grammar
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <XCircle size={16} className="text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Editor Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Editor Box */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="bg-slate-800 text-slate-300 px-4 py-2.5 text-xs font-mono flex items-center justify-between border-b border-slate-700">
              <span className="font-semibold text-slate-200">Context-Free Grammar (CFG)</span>
              <div className="flex items-center gap-2">
                <label className="text-slate-400 text-[11px]">Start Symbol:</label>
                <input
                  type="text"
                  value={startSymbol}
                  onChange={(e) => setStartSymbol(e.target.value)}
                  placeholder={validationReport?.start_symbol || 'Auto (first LHS)'}
                  className="bg-slate-900 border border-slate-700 text-white px-2 py-0.5 rounded text-xs font-mono w-28 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <textarea
              value={grammarText}
              onChange={(e) => setGrammarText(e.target.value)}
              placeholder="Enter productions here, e.g.:&#10;E -> E + E | E * E | ( E ) | id"
              rows={12}
              className="w-full p-4 font-mono text-sm text-slate-800 bg-slate-50/50 resize-y focus:outline-none focus:bg-white transition-colors"
              spellCheck={false}
            />
          </div>

          {/* Quick Nav to other pages */}
          {validationReport?.is_valid && (
            <div className="flex items-center justify-between p-4 bg-indigo-50/80 border border-indigo-100 rounded-xl">
              <div className="flex items-center gap-2 text-xs text-indigo-900 font-medium">
                <Sparkles size={16} className="text-indigo-600" />
                <span>Grammar is validated and ready for analysis!</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('parser')}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-600 hover:text-white transition-colors shadow-sm"
                >
                  Generate Parse Tree <ArrowRight size={13} />
                </button>
                <button
                  onClick={() => setActiveTab('ambiguity')}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm"
                >
                  Analyze Ambiguity <ArrowRight size={13} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Validation & Symbols Sidebar */}
        <div className="space-y-4">
          {/* Validity status card */}
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Validation Status</h3>
            {validationReport ? (
              validationReport.is_valid ? (
                <div className="flex items-center gap-2 text-emerald-700 font-semibold text-sm">
                  <CheckCircle size={18} className="text-emerald-500" />
                  <span>Grammar Valid</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-rose-700 font-semibold text-sm">
                  <XCircle size={18} className="text-rose-500" />
                  <span>Grammar Invalid</span>
                </div>
              )
            ) : (
              <p className="text-xs text-slate-400">Click &quot;Validate Grammar&quot; to inspect symbols and rules.</p>
            )}

            {/* Diagnostics List */}
            {validationReport?.diagnostics && validationReport.diagnostics.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <h4 className="text-[11px] font-semibold text-slate-600">Diagnostics:</h4>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {validationReport.diagnostics.map((d, i) => (
                    <div
                      key={i}
                      className={`p-2 rounded-lg text-xs flex items-start gap-1.5 ${
                        d.level === 'error'
                          ? 'bg-rose-50 text-rose-800 border border-rose-200'
                          : d.level === 'warning'
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-blue-50 text-blue-800 border border-blue-200'
                      }`}
                    >
                      {d.level === 'error' ? (
                        <XCircle size={14} className="text-rose-500 shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />
                      )}
                      <div>
                        {d.line && <span className="font-semibold">[Line {d.line}] </span>}
                        <span>{d.message}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Symbol classification */}
          {validationReport?.is_valid && (
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-3 text-xs">
              <h3 className="font-bold uppercase tracking-wider text-slate-500 text-[11px]">Symbol Analysis</h3>
              
              <div>
                <span className="font-semibold text-slate-700">Start Symbol:</span>
                <span className="ml-2 font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                  {validationReport.start_symbol}
                </span>
              </div>

              <div>
                <span className="font-semibold text-slate-700 block mb-1">Nonterminals ({validationReport.nonterminals.length}):</span>
                <div className="flex flex-wrap gap-1">
                  {validationReport.nonterminals.map((nt) => (
                    <span key={nt} className="font-mono bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded text-[11px]">
                      {nt}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span className="font-semibold text-slate-700 block mb-1">Terminals ({validationReport.terminals.length}):</span>
                <div className="flex flex-wrap gap-1">
                  {validationReport.terminals.map((t) => (
                    <span key={t} className="font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[11px]">
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {validationReport.nullable_symbols.length > 0 && (
                <div>
                  <span className="font-semibold text-slate-700 block mb-1">Nullable Symbols (derive ε):</span>
                  <div className="flex flex-wrap gap-1">
                    {validationReport.nullable_symbols.map((s) => (
                      <span key={s} className="font-mono bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-[11px]">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {validationReport.unreachable_symbols.length > 0 && (
                <div>
                  <span className="font-semibold text-rose-700 block mb-1">Unreachable Symbols:</span>
                  <div className="flex flex-wrap gap-1">
                    {validationReport.unreachable_symbols.map((s) => (
                      <span key={s} className="font-mono bg-rose-100 text-rose-800 px-2 py-0.5 rounded text-[11px]">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {validationReport.nonproductive_symbols.length > 0 && (
                <div>
                  <span className="font-semibold text-rose-700 block mb-1">Nonproductive Symbols:</span>
                  <div className="flex flex-wrap gap-1">
                    {validationReport.nonproductive_symbols.map((s) => (
                      <span key={s} className="font-mono bg-rose-100 text-rose-800 px-2 py-0.5 rounded text-[11px]">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
