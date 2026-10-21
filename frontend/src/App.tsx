import React, { useState } from 'react';
import { api } from './services/api';
import type { StringAmbiguityResponse } from './types';
import { InteractiveTreeViewer } from './components/InteractiveTreeViewer';
import {
  GitFork,
  Play,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Columns,
  Sparkles,
} from 'lucide-react';

const PRESETS = [
  {
    name: 'Ambiguous Expression (id + id * id)',
    grammar: `E -> E + E | E * E | ( E ) | id`,
    input: `id + id * id`,
  },
  {
    name: 'Unambiguous Precedence (id + id * id)',
    grammar: `E -> E + T | T\nT -> T * F | F\nF -> ( E ) | id`,
    input: `id + id * id`,
  },
  {
    name: 'Dangling Else (if c then if c then s else s)',
    grammar: `S -> if c then S else S | if c then S | stmt`,
    input: `if c then if c then stmt else stmt`,
  },
];

export const App: React.FC = () => {
  const [grammarText, setGrammarText] = useState<string>(
    'E -> E + E | E * E | ( E ) | id'
  );
  const [inputString, setInputString] = useState<string>('id + id * id');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<StringAmbiguityResponse | null>(null);
  const [activeTreeIndex, setActiveTreeIndex] = useState<number>(0);
  const [sideBySide, setSideBySide] = useState<boolean>(false);

  const handleGenerate = async (grammar = grammarText, input = inputString) => {
    if (!grammar.trim() || !input.trim()) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await api.analyzeStringAmbiguity(
        grammar,
        input,
        undefined,
        'auto',
        10
      );
      setResult(res);
      setActiveTreeIndex(0);
      if (res.trees.length >= 2) {
        setSideBySide(true);
      } else {
        setSideBySide(false);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to parse expression');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const loadPreset = (preset: typeof PRESETS[0]) => {
    setGrammarText(preset.grammar);
    setInputString(preset.input);
    handleGenerate(preset.grammar, preset.input);
  };

  const trees = result?.trees || [];
  const currentTree = trees[activeTreeIndex] || null;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 text-white py-3.5 px-6 shadow-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow">
              <GitFork size={20} className="text-white" />
            </div>
            <div>
              <h1 className="font-extrabold text-lg leading-tight tracking-tight">GrammarScope</h1>
              <p className="text-[11px] text-slate-400">Syntax Tree Generator & Ambiguity Checker</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 mr-1 hidden sm:inline">Quick Presets:</span>
            {PRESETS.map((p, idx) => (
              <button
                key={idx}
                onClick={() => loadPreset(p)}
                className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-colors"
              >
                {p.name.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 flex-1 space-y-6">
        {/* Input Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Grammar Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Context-Free Grammar (CFG):
                </label>
                <button
                  onClick={() => setGrammarText(grammarText + ' ε')}
                  className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  + Add ε
                </button>
              </div>
              <textarea
                value={grammarText}
                onChange={(e) => setGrammarText(e.target.value)}
                rows={4}
                className="w-full p-3 font-mono text-xs text-slate-900 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                placeholder="E -> E + E | E * E | ( E ) | id"
              />
            </div>

            {/* Expression String Input */}
            <div className="space-y-1.5 flex flex-col justify-between">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Input Expression / String to Parse:
                </label>
                <input
                  type="text"
                  value={inputString}
                  onChange={(e) => setInputString(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                  className="w-full px-3.5 py-2.5 font-mono text-sm text-slate-900 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  placeholder="e.g. id + id * id"
                />
                <p className="text-[11px] text-slate-400">
                  Tokens can be space-separated or compact (e.g. <code className="text-slate-600">id + id * id</code>).
                </p>
              </div>

              {/* Action Button */}
              <button
                onClick={() => handleGenerate()}
                disabled={loading || !inputString.trim()}
                className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-semibold text-sm shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50"
              >
                {loading ? <RefreshCw size={16} className="animate-spin" /> : <Play size={16} />}
                Generate Syntax Tree & Check Ambiguity
              </button>
            </div>
          </div>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <XCircle size={16} className="text-rose-600 shrink-0" />
            <span className="font-medium">{errorMsg}</span>
          </div>
        )}

        {/* Ambiguity Status Banner */}
        {result && (
          <div
            className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm ${
              result.status === 'ambiguous'
                ? 'bg-rose-50 border-rose-200 text-rose-900'
                : result.status === 'unique_parse'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-slate-100 border-slate-300 text-slate-800'
            }`}
          >
            <div className="flex items-center gap-3">
              {result.status === 'ambiguous' ? (
                <AlertCircle size={24} className="text-rose-600 shrink-0" />
              ) : result.status === 'unique_parse' ? (
                <CheckCircle2 size={24} className="text-emerald-600 shrink-0" />
              ) : (
                <XCircle size={24} className="text-slate-500 shrink-0" />
              )}
              <div>
                <h3 className="font-bold text-sm">
                  {result.status === 'ambiguous'
                    ? `⚠️ AMBIGUOUS: Found ${result.distinct_parse_count_found} Distinct Syntax Trees`
                    : result.status === 'unique_parse'
                    ? '✅ UNAMBIGUOUS: Exactly 1 Unique Syntax Tree Generated'
                    : '❌ String Cannot Be Derived from Grammar'}
                </h3>
                <p className="text-xs opacity-90">{result.message}</p>
              </div>
            </div>

            {trees.length >= 2 && (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setSideBySide(!sideBySide)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    sideBySide
                      ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <Columns size={14} />
                  <span>{sideBySide ? 'Single View' : 'Compare Side-by-Side'}</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tree Visualizer Viewport */}
        {result && result.trees.length > 0 ? (
          sideBySide && trees.length >= 2 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <InteractiveTreeViewer
                tree={trees[0]}
                treeIndex={0}
                totalTrees={trees.length}
                title="Syntax Tree 1 (Derivation A)"
              />
              <InteractiveTreeViewer
                tree={trees[1]}
                treeIndex={1}
                totalTrees={trees.length}
                title="Syntax Tree 2 (Derivation B)"
              />
            </div>
          ) : (
            <InteractiveTreeViewer
              tree={currentTree}
              treeIndex={activeTreeIndex}
              totalTrees={trees.length}
              onPrevTree={() => setActiveTreeIndex(Math.max(0, activeTreeIndex - 1))}
              onNextTree={() => setActiveTreeIndex(Math.min(trees.length - 1, activeTreeIndex + 1))}
              title={trees.length > 1 ? `Syntax Tree (Alternative ${activeTreeIndex + 1})` : 'Syntax Tree'}
            />
          )
        ) : !result ? (
          <div className="border-2 border-dashed border-slate-300 bg-white/70 rounded-2xl h-80 flex flex-col items-center justify-center p-6 text-center text-slate-400 space-y-2">
            <Sparkles size={36} className="text-slate-300" />
            <p className="text-sm font-semibold text-slate-600">No expression parsed yet</p>
            <p className="text-xs text-slate-400 max-w-sm">
              Enter a context-free grammar and an expression above, then click <strong>&quot;Generate Syntax Tree &amp; Check Ambiguity&quot;</strong>.
            </p>
          </div>
        ) : null}
      </main>

      {/* Minimal Footer */}
      <footer className="text-center py-4 text-xs text-slate-400 border-t border-slate-200 bg-white">
        GrammarScope • Earley CFG Parsing Engine & Ambiguity Detection
      </footer>
    </div>
  );
};

export default App;
