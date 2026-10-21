import React from 'react';
import { GitFork, AlertTriangle, ShieldCheck, Binary, Terminal } from 'lucide-react';

export const DocumentationPage: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in text-slate-800">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-1">Theoretical Foundations & Architecture</h1>
        <p className="text-xs text-slate-500">
          Learn how GrammarScope processes context-free grammars, parses derivations, and analyzes ambiguity.
        </p>
      </div>

      {/* Grammar Notation */}
      <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-indigo-700 font-bold text-sm">
          <Terminal size={18} />
          <h2>1. Grammar Format & Notation</h2>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          GrammarScope accepts standard context-free grammar production rules. A nonterminal on the left-hand side is separated from its alternatives by <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-indigo-600">-&gt;</code> or <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-indigo-600">::=</code>, and multiple derivations for the same nonterminal are separated by pipe <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-indigo-600">|</code>.
        </p>
        <div className="bg-slate-900 text-slate-200 p-3.5 rounded-lg font-mono text-xs space-y-1">
          <div><span className="text-indigo-400"># Arithmetic Expression Grammar</span></div>
          <div>E -&gt; E + E | E * E | ( E ) | id</div>
          <div><span className="text-indigo-400"># Epsilon (empty string) productions:</span></div>
          <div>S -&gt; ( S ) S | ε</div>
        </div>
        <p className="text-xs text-slate-600">
          <strong>Epsilon:</strong> Recognized as <code className="font-mono text-indigo-600">ε</code>, <code className="font-mono text-indigo-600">epsilon</code>, or empty right-hand side. Internally, epsilon is stored as an empty sequence of symbols rather than a terminal token.
        </p>
      </section>

      {/* Earley Parsing Engine */}
      <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-indigo-700 font-bold text-sm">
          <GitFork size={18} />
          <h2>2. Earley Parsing & Shared Packed Parse Forest (SPPF)</h2>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          To parse general context-free grammars (including ambiguous grammars, left-recursive grammars, and epsilon productions), GrammarScope implements the <strong>Earley algorithm</strong>.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-1">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <h4 className="font-bold text-slate-800 mb-1">Predictor</h4>
            <p className="text-slate-600">
              When the dot precedes a nonterminal <code className="font-mono">B</code>, introduces all productions for <code className="font-mono">B</code> into the current chart position.
            </p>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <h4 className="font-bold text-slate-800 mb-1">Scanner</h4>
            <p className="text-slate-600">
              When the dot precedes a terminal that matches the next input token, advances the state into the next chart index.
            </p>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <h4 className="font-bold text-slate-800 mb-1">Completer</h4>
            <p className="text-slate-600">
              When a production reaches the end of its RHS, advances all previous states awaiting that nonterminal and registers reduction backpointers.
            </p>
          </div>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          The parser retains all valid reduction paths in a backpointer chart, forming a compact parse forest. Distinct derivations for identical sub-spans are preserved, allowing full parse tree reconstruction.
        </p>
      </section>

      {/* Ambiguity & Undecidability */}
      <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
          <AlertTriangle size={18} />
          <h2>3. Grammar Ambiguity & Theoretical Limits</h2>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          A grammar is ambiguous if there exists at least one terminal string in its language that possesses <strong>two or more distinct parse trees</strong> (or equivalently, two distinct leftmost derivations).
        </p>
        
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-xs space-y-2 text-amber-900">
          <h4 className="font-bold flex items-center gap-1.5 text-amber-800">
            <ShieldCheck size={16} /> Undecidability of General CFG Ambiguity
          </h4>
          <p className="leading-relaxed">
            In theoretical computer science, determining whether an arbitrary context-free grammar is ambiguous is <strong>undecidable</strong>. This is proven by reduction from <em>Post&apos;s Correspondence Problem (PCP)</em>. Consequently, no algorithm can ever decide ambiguity for all CFGs.
          </p>
          <p className="leading-relaxed font-semibold">
            Therefore, GrammarScope relies on evidence-based bounded search:
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-amber-800">
            <li>If a witness string with two distinct parse trees is discovered, the grammar is <strong>confirmed ambiguous</strong>.</li>
            <li>If no witness is found within limits, the system reports <strong>No witness found within limits</strong> — never claiming the grammar is proved unambiguous.</li>
          </ul>
        </div>
      </section>

      {/* CYK & FIRST/FOLLOW */}
      <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-indigo-700 font-bold text-sm">
          <Binary size={18} />
          <h2>4. CYK Algorithm & FIRST / FOLLOW Sets</h2>
        </div>
        <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
          <div>
            <strong className="text-slate-800">FIRST and FOLLOW sets:</strong> Fundamental components of top-down parsers (LL(1)). FIRST(X) is the set of terminals that can begin strings derived from X (including ε if nullable). FOLLOW(A) is the set of terminals that can appear immediately to the right of A in any sentential form. GrammarScope computes both via fixed-point iteration.
          </div>
          <div>
            <strong className="text-slate-800">Chomsky Normal Form & CYK:</strong> The Cocke-Younger-Kasami (CYK) algorithm determines membership in <code className="font-mono">O(n³ |G|)</code> dynamic programming time for grammars in Chomsky Normal Form (rules of form <code className="font-mono">A -&gt; B C</code> or <code className="font-mono">A -&gt; a</code>). GrammarScope converts CFGs to CNF and renders the full dynamic programming triangle.
          </div>
        </div>
      </section>
    </div>
  );
};
