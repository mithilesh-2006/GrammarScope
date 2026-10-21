import React from 'react';
import { AlertCircle, CheckCircle, HelpCircle, XCircle, ShieldAlert } from 'lucide-react';

interface StatusBadgeProps {
  status: 'ambiguous' | 'unique_parse' | 'no_parse' | 'no_witness_within_limits' | 'inconclusive' | 'unsupported' | string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  switch (status) {
    case 'ambiguous':
      return (
        <span
          title="At least two distinct parse trees exist for this string under the grammar."
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300"
        >
          <AlertCircle size={14} className="text-rose-600" />
          Ambiguity Confirmed
        </span>
      );

    case 'unique_parse':
      return (
        <span
          title="Exhaustive analysis completed and established exactly one parse tree for this string."
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300"
        >
          <CheckCircle size={14} className="text-emerald-600" />
          Unique Parse Confirmed
        </span>
      );

    case 'no_parse':
      return (
        <span
          title="The input string cannot be derived from the grammar."
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300"
        >
          <XCircle size={14} className="text-slate-500" />
          No Parse (String Not in Language)
        </span>
      );

    case 'no_witness_within_limits':
      return (
        <span
          title="The bounded grammar search found no ambiguous string in explored candidates. Note: General CFG ambiguity is undecidable."
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300"
        >
          <ShieldAlert size={14} className="text-amber-600" />
          No Witness Found Within Limits
        </span>
      );

    case 'inconclusive':
      return (
        <span
          title="A time, tree, candidate, or cycle limit prevented completing exhaustive analysis."
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-300"
        >
          <HelpCircle size={14} className="text-purple-600" />
          Inconclusive (Limits Reached)
        </span>
      );

    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-300">
          {status}
        </span>
      );
  }
};
