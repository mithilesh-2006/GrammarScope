import React from 'react';
import { SAMPLE_GRAMMARS } from '../utils/samples';
import type { GrammarPreset } from '../utils/samples';
import { Sparkles, ArrowRight, GitFork, ShieldCheck, Search, Code2, Zap } from 'lucide-react';

interface DashboardPageProps {
  onSelectPreset: (preset: GrammarPreset, targetTab?: string) => void;
  setActiveTab: (tab: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onSelectPreset, setActiveTab }) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-8 sm:p-10 text-white shadow-xl border border-slate-800">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-4">
            <Sparkles size={14} /> Interactive Compiler Design & Formal Languages Engine
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4 leading-tight">
            Explore Context-Free Grammars & Detect Ambiguity with Real Evidence
          </h1>
          <p className="text-slate-300 text-sm sm:text-base mb-6 leading-relaxed">
            GrammarScope is an educational platform powered by an actual general context-free parsing engine (Earley algorithm) and Shared Packed Parse Forest. Enter any CFG, parse arbitrary input strings, inspect concrete interactive parse trees, and detect grammar ambiguity.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setActiveTab('editor')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all shadow-md shadow-indigo-600/30"
            >
              <Code2 size={16} /> Open Grammar Editor
            </button>
            <button
              onClick={() => {
                onSelectPreset(SAMPLE_GRAMMARS[0], 'ambiguity');
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-semibold border border-white/10 transition-all"
            >
              <Zap size={16} className="text-amber-400" /> Test Classic Ambiguity
            </button>
          </div>
        </div>

        {/* Decorative background grid */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 bg-[radial-gradient(#818cf8_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
      </div>

      {/* Highlights Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4">
            <GitFork size={20} />
          </div>
          <h3 className="font-bold text-slate-800 text-base mb-2">Real Parse Forest Engine</h3>
          <p className="text-slate-600 text-xs leading-relaxed">
            Not a static mockup. Uses the Earley chart parsing algorithm with backpointers and cycle-aware parse forest extraction to retain multiple distinct derivations.
          </p>
        </div>

        <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-10 h-10 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
            <Search size={20} />
          </div>
          <h3 className="font-bold text-slate-800 text-base mb-2">Evidence-Based Ambiguity</h3>
          <p className="text-slate-600 text-xs leading-relaxed">
            Ambiguity is confirmed only when at least two structurally distinct parse trees are extracted for the same input string. Compare both trees side-by-side.
          </p>
        </div>

        <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center mb-4">
            <ShieldCheck size={20} />
          </div>
          <h3 className="font-bold text-slate-800 text-base mb-2">Honest Undecidability Limits</h3>
          <p className="text-slate-600 text-xs leading-relaxed">
            General CFG ambiguity is mathematically undecidable. When a bounded witness search finds no ambiguous string, it reports search limits—never a false proof of unambiguity.
          </p>
        </div>
      </div>

      {/* Preset Grammars Catalog */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Textbook Grammars & Presets</h2>
            <p className="text-xs text-slate-500">Select any standard grammar to load into the workspace and run immediate analysis</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {SAMPLE_GRAMMARS.map((preset) => (
            <div
              key={preset.id}
              className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                    {preset.category}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      preset.isAmbiguous
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {preset.isAmbiguous ? 'Ambiguous' : 'Unambiguous'}
                  </span>
                </div>
                <h3 className="font-bold text-slate-800 text-sm mb-1">{preset.name}</h3>
                <p className="text-slate-500 text-xs mb-3">{preset.description}</p>
                
                <div className="bg-slate-900 text-indigo-200 p-2.5 rounded-lg font-mono text-[11px] mb-3 overflow-x-auto">
                  {preset.grammar}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-mono">Input: {preset.sampleInput}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => onSelectPreset(preset, 'parser')}
                    className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                  >
                    Parse <ArrowRight size={12} />
                  </button>
                  <button
                    onClick={() => onSelectPreset(preset, 'ambiguity')}
                    className="flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-800 transition-colors"
                  >
                    Analyze <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
