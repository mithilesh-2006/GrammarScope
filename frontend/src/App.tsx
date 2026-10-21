import React, { useState } from 'react';
import { api } from './services/api';
import type {
  StringAmbiguityResponse,
  GrammarValidateResponse,
} from './types';
import { InteractiveTreeViewer } from './components/InteractiveTreeViewer';
import {
  GitFork,
  Play,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Columns,
  Code2,
  Search,
  BookOpen,
  ArrowRight,
  Info,
} from 'lucide-react';

const PRESETS = [
  {
    name: 'Ambiguous Arithmetic',
    grammar: `E -> E + E | E * E | ( E ) | id`,
    input: `id + id * id`,
    desc: 'Classic ambiguous grammar without operator precedence',
  },
  {
    name: 'Unambiguous Precedence',
    grammar: `E -> E + T | T\nT -> T * F | F\nF -> ( E ) | id`,
    input: `id + id * id`,
    desc: 'Enforces multiplication precedence over addition',
  },
  {
    name: 'Dangling Else',
    grammar: `S -> if c then S else S | if c then S | stmt`,
    input: `if c then if c then stmt else stmt`,
    desc: 'Famous compiler ambiguity in conditional statements',
  },
  {
    name: 'Balanced Parentheses',
    grammar: `S -> ( S ) S | [ S ] S | ε`,
    input: `( ) [ ( ) ]`,
    desc: 'Balanced brackets with epsilon derivations',
  },
  {
    name: 'Left Recursive',
    grammar: `S -> S a | b`,
    input: `b a a a`,
    desc: 'Direct left recursion handled cleanly by Earley parsing',
  },
];

export const App: React.FC = () => {
  // Navigation tab: 'tree' | 'ambiguity' | 'editor' | 'guide'
  const [activeTab, setActiveTab] = useState<'tree' | 'ambiguity' | 'editor' | 'guide'>('tree');

  // Shared inputs
  const [grammarText, setGrammarText] = useState<string>(
    'E -> E + E | E * E | ( E ) | id'
  );
  const [inputString, setInputString] = useState<string>('id + id * id');
  const [startSymbol, setStartSymbol] = useState<string>('E');

  // Parse & Ambiguity State for Tab 1 (Syntax Tree Generator)
  const [treeLoading, setTreeLoading] = useState<boolean>(false);
  const [treeError, setTreeError] = useState<string | null>(null);
  const [parseResult, setParseResult] = useState<StringAmbiguityResponse | null>(null);
  const [activeTreeIndex, setActiveTreeIndex] = useState<number>(0);
  const [sideBySide, setSideBySide] = useState<boolean>(false);

  // Grammar Editor Tab State (Tab 3)
  const [valLoading, setValLoading] = useState<boolean>(false);
  const [valReport, setValReport] = useState<GrammarValidateResponse | null>(null);

  // Handlers
  const handleGenerateTree = async (grammar = grammarText, input = inputString) => {
    if (!grammar.trim() || !input.trim()) return;
    setTreeLoading(true);
    setTreeError(null);
    try {
      const res = await api.analyzeStringAmbiguity(
        grammar,
        input,
        startSymbol || undefined,
        'auto',
        10
      );
      setParseResult(res);
      setActiveTreeIndex(0);
      setSideBySide(res.trees.length >= 2);
    } catch (err: any) {
      setTreeError(err.message || 'Failed to parse expression');
      setParseResult(null);
    } finally {
      setTreeLoading(false);
    }
  };

  const handleValidateGrammar = async () => {
    setValLoading(true);
    try {
      const res = await api.validateGrammar(grammarText, startSymbol || undefined);
      setValReport(res);
      if (res.start_symbol && !startSymbol) setStartSymbol(res.start_symbol);
    } catch {
      // ignore
    } finally {
      setValLoading(false);
    }
  };

  const loadPreset = (preset: typeof PRESETS[0], targetTab?: 'tree' | 'ambiguity') => {
    setGrammarText(preset.grammar);
    setInputString(preset.input);
    if (targetTab) setActiveTab(targetTab);
    handleGenerateTree(preset.grammar, preset.input);
  };

  const trees = parseResult?.trees || [];
  const currentTree = trees[activeTreeIndex] || null;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800">
      {/* Top Header & Navbar */}
      <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between py-3 gap-3">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <GitFork size={22} className="text-white" />
              </div>
              <div>
                <h1 className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
                  GrammarScope
                </h1>
                <p className="text-[11px] text-slate-400">Interactive Syntax Tree Generator &amp; Ambiguity Analyzer</p>
              </div>
            </div>

            {/* Interactive Tab Navigation */}
            <nav className="flex items-center gap-1.5 bg-slate-800/80 p-1.5 rounded-xl border border-slate-700/80">
              <button
                onClick={() => setActiveTab('tree')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'tree'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                }`}
              >
                <GitFork size={15} />
                <span>Syntax Tree Generator</span>
              </button>

              <button
                onClick={() => setActiveTab('ambiguity')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'ambiguity'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                }`}
              >
                <Search size={15} />
                <span>Ambiguity Analyzer</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('editor');
                  handleValidateGrammar();
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'editor'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                }`}
              >
                <Code2 size={15} />
                <span>Grammar Editor</span>
              </button>

              <button
                onClick={() => setActiveTab('guide')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'guide'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                }`}
              >
                <BookOpen size={15} />
                <span>Presets &amp; Guide</span>
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Tab Viewport */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex-1 space-y-6">

        {/* ============================================================== */}
        {/* TAB 1: SYNTAX TREE GENERATOR */}
        {/* ============================================================== */}
        {activeTab === 'tree' && (
          <div className="space-y-6 animate-fade-in">
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
                      + Add ε (Epsilon)
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

                {/* String Input */}
                <div className="space-y-1.5 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Input Expression / String to Parse:
                    </label>
                    <input
                      type="text"
                      value={inputString}
                      onChange={(e) => setInputString(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleGenerateTree()}
                      className="w-full px-3.5 py-2.5 font-mono text-sm text-slate-900 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                      placeholder="e.g. id + id * id"
                    />
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                      <span>Quick Presets:</span>
                      {PRESETS.slice(0, 3).map((p, idx) => (
                        <button
                          key={idx}
                          onClick={() => loadPreset(p, 'tree')}
                          className="text-indigo-600 hover:underline font-medium"
                        >
                          {p.name.split(' ')[0]}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Primary Action Button */}
                  <button
                    onClick={() => handleGenerateTree()}
                    disabled={treeLoading || !inputString.trim()}
                    className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-semibold text-sm shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50"
                  >
                    {treeLoading ? <RefreshCw size={16} className="animate-spin" /> : <Play size={16} />}
                    Generate Syntax Tree &amp; Check Ambiguity
                  </button>
                </div>
              </div>
            </div>

            {/* Error Banner */}
            {treeError && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <XCircle size={16} className="text-rose-600 shrink-0" />
                <span className="font-medium">{treeError}</span>
              </div>
            )}

            {/* Ambiguity Status Banner */}
            {parseResult && (
              <div
                className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm ${
                  parseResult.status === 'ambiguous'
                    ? 'bg-rose-50 border-rose-200 text-rose-900'
                    : parseResult.status === 'unique_parse'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-slate-100 border-slate-300 text-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  {parseResult.status === 'ambiguous' ? (
                    <AlertCircle size={26} className="text-rose-600 shrink-0" />
                  ) : parseResult.status === 'unique_parse' ? (
                    <CheckCircle2 size={26} className="text-emerald-600 shrink-0" />
                  ) : (
                    <XCircle size={26} className="text-slate-500 shrink-0" />
                  )}
                  <div>
                    <h3 className="font-bold text-sm">
                      {parseResult.status === 'ambiguous'
                        ? `⚠️ AMBIGUOUS: Found ${parseResult.distinct_parse_count_found} Distinct Valid Syntax Trees`
                        : parseResult.status === 'unique_parse'
                        ? '✅ UNAMBIGUOUS: Exactly 1 Unique Syntax Tree Generated'
                        : '❌ String Cannot Be Derived by Grammar'}
                    </h3>
                    <p className="text-xs opacity-90">{parseResult.message}</p>
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

            {/* Full-Height Syntax Tree Visualizer */}
            {parseResult && parseResult.trees.length > 0 ? (
              sideBySide && trees.length >= 2 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <InteractiveTreeViewer
                    tree={trees[0]}
                    treeIndex={0}
                    totalTrees={trees.length}
                    title="Syntax Tree 1 (Derivation A)"
                    minHeight="min-h-[620px]"
                  />
                  <InteractiveTreeViewer
                    tree={trees[1]}
                    treeIndex={1}
                    totalTrees={trees.length}
                    title="Syntax Tree 2 (Derivation B)"
                    minHeight="min-h-[620px]"
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
                  minHeight="min-h-[620px]"
                />
              )
            ) : null}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: AMBIGUITY ANALYZER (Side-by-Side Alternative Parses) */}
        {/* ============================================================== */}
        {activeTab === 'ambiguity' && (
          <div className="space-y-6 animate-fade-in">
            {/* Header info card */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Grammar Ambiguity Demonstration</h2>
                <p className="text-xs text-slate-500">
                  Inspect whether expression &quot;<code className="font-mono text-indigo-600 font-bold">{inputString}</code>&quot; has multiple distinct derivations under the current grammar.
                </p>
              </div>
              <button
                onClick={() => handleGenerateTree()}
                disabled={treeLoading}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all disabled:opacity-50"
              >
                {treeLoading ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />}
                Re-evaluate Ambiguity
              </button>
            </div>

            {/* If Ambiguous: Side-by-side alternative derivations comparison */}
            {parseResult && parseResult.trees.length >= 2 ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle size={20} className="text-rose-600 shrink-0" />
                    <div>
                      <span className="font-bold text-sm block">
                        Ambiguity Confirmed: Found {parseResult.trees.length} Distinct Derivations
                      </span>
                      <span className="text-rose-700">
                        The expression has two structurally different parse trees shown side-by-side below.
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-rose-700 bg-white px-3 py-1 rounded-lg border border-rose-200 shadow-2xs">
                    Side-by-Side Comparison
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <InteractiveTreeViewer
                    tree={parseResult.trees[0]}
                    treeIndex={0}
                    totalTrees={parseResult.trees.length}
                    title="Derivation Tree A (Alternative 1)"
                    minHeight="min-h-[620px]"
                  />
                  <InteractiveTreeViewer
                    tree={parseResult.trees[1]}
                    treeIndex={1}
                    totalTrees={parseResult.trees.length}
                    title="Derivation Tree B (Alternative 2)"
                    minHeight="min-h-[620px]"
                  />
                </div>
              </div>
            ) : parseResult && parseResult.trees.length === 1 ? (
              <div className="space-y-6">
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-3">
                  <CheckCircle2 size={24} className="text-emerald-600 shrink-0" />
                  <div>
                    <h3 className="font-bold text-sm">Unambiguous for Current Expression</h3>
                    <p className="text-emerald-700">
                      Exhaustive parse forest analysis established exactly 1 unique derivation tree for &quot;{inputString}&quot;.
                    </p>
                  </div>
                </div>

                <InteractiveTreeViewer
                  tree={parseResult.trees[0]}
                  treeIndex={0}
                  totalTrees={1}
                  title="Unique Derivation Tree"
                  minHeight="min-h-[620px]"
                />
              </div>
            ) : parseResult && parseResult.trees.length === 0 ? (
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
                The expression cannot be derived from this grammar.
              </div>
            ) : (
              <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center text-xs text-slate-400">
                Click &quot;Re-evaluate Ambiguity&quot; to test the expression.
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: GRAMMAR EDITOR & VALIDATOR */}
        {/* ============================================================== */}
        {activeTab === 'editor' && (
          <div className="space-y-6 animate-fade-in">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Grammar Editor &amp; Validator</h2>
                <p className="text-xs text-slate-500">
                  Write and validate custom production rules. Inspect detected nonterminals, terminals, and diagnostics.
                </p>
              </div>
              <button
                onClick={handleValidateGrammar}
                disabled={valLoading}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all disabled:opacity-50"
              >
                {valLoading ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />}
                Validate Grammar
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Editor textarea */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="bg-slate-800 text-white px-4 py-3 text-xs font-mono flex items-center justify-between">
                  <span className="font-semibold text-slate-200">Grammar Notation:</span>
                  <div className="flex items-center gap-2">
                    <label className="text-slate-400 text-[11px]">Start Symbol:</label>
                    <input
                      type="text"
                      value={startSymbol}
                      onChange={(e) => setStartSymbol(e.target.value)}
                      placeholder="e.g. E"
                      className="bg-slate-900 border border-slate-700 text-white px-2 py-0.5 rounded text-xs font-mono w-24 focus:outline-none"
                    />
                  </div>
                </div>

                <textarea
                  value={grammarText}
                  onChange={(e) => setGrammarText(e.target.value)}
                  rows={10}
                  className="w-full p-4 font-mono text-xs text-slate-900 bg-slate-50/50 resize-y focus:outline-none focus:bg-white transition-colors"
                  placeholder="E -> E + E | id"
                />
              </div>

              {/* Symbol Analysis Card */}
              <div className="space-y-4">
                {valReport ? (
                  <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3 text-xs">
                    <div className="flex items-center gap-2 font-bold text-sm">
                      {valReport.is_valid ? (
                        <CheckCircle2 size={18} className="text-emerald-500" />
                      ) : (
                        <XCircle size={18} className="text-rose-500" />
                      )}
                      <span>{valReport.is_valid ? 'Grammar is Valid' : 'Syntax Issues Found'}</span>
                    </div>

                    <div>
                      <strong className="text-slate-700 block mb-1">Nonterminals:</strong>
                      <div className="flex flex-wrap gap-1">
                        {valReport.nonterminals.map((nt) => (
                          <span key={nt} className="font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200">
                            {nt}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <strong className="text-slate-700 block mb-1">Terminals:</strong>
                      <div className="flex flex-wrap gap-1">
                        {valReport.terminals.map((t) => (
                          <span key={t} className="font-mono bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>

                    {valReport.nullable_symbols.length > 0 && (
                      <div>
                        <strong className="text-slate-700 block mb-1">Nullable Nonterminals (Derive ε):</strong>
                        <div className="flex flex-wrap gap-1">
                          {valReport.nullable_symbols.map((s) => (
                            <span key={s} className="font-mono bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="pt-2 border-t border-slate-100">
                      <button
                        onClick={() => {
                          setActiveTab('tree');
                          handleGenerateTree();
                        }}
                        className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors"
                      >
                        Parse in Tree Generator <ArrowRight size={13} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm text-xs text-slate-400 text-center">
                    Click &quot;Validate Grammar&quot; to inspect symbols and rules.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 4: PRESETS & USER GUIDE */}
        {/* ============================================================== */}
        {activeTab === 'guide' && (
          <div className="space-y-6 animate-fade-in">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-1">Standard Demonstration Grammars</h2>
              <p className="text-xs text-slate-500">
                Select any classic compiler design grammar below to instantly test and visualize its syntax trees:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {PRESETS.map((preset, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm mb-1">{preset.name}</h3>
                    <p className="text-slate-500 text-xs mb-3">{preset.desc}</p>
                    <div className="bg-slate-900 text-indigo-200 p-2.5 rounded-xl font-mono text-[11px] mb-3 overflow-x-auto">
                      {preset.grammar}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="font-mono text-slate-400 text-[11px]">Input: {preset.input}</span>
                    <button
                      onClick={() => loadPreset(preset, 'tree')}
                      className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-xs transition-colors shadow-sm"
                    >
                      Load &amp; Generate <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick theoretical tips */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm text-xs space-y-3 text-slate-600 leading-relaxed">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <Info size={16} className="text-indigo-600" /> Key Compiler Concepts
              </h3>
              <p>
                <strong>What is an Ambiguous Grammar?</strong> A context-free grammar is ambiguous if there exists at least one string in its language that has two or more distinct concrete parse trees (or two distinct leftmost derivations).
              </p>
              <p>
                <strong>Why Earley Parsing?</strong> Unlike basic LL(1) or LR(1) parsers which fail or reject ambiguous/left-recursive grammars, the Earley algorithm parses any arbitrary CFG and constructs a Shared Packed Parse Forest (SPPF) preserving all alternative derivations.
              </p>
            </div>
          </div>
        )}

      </main>

      {/* Minimal Footer */}
      <footer className="text-center py-4 text-xs text-slate-400 border-t border-slate-200 bg-white">
        GrammarScope • Earley CFG Engine • Interactive D3.js Syntax Tree Generator
      </footer>
    </div>
  );
};

export default App;
