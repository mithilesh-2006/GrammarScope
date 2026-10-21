export interface DiagnosticModel {
  level: 'error' | 'warning' | 'info';
  message: string;
  line?: number | null;
  column?: number | null;
  symbol?: string | null;
}

export interface ProductionModel {
  id: number;
  lhs: string;
  rhs: string[];
  production_str: string;
}

export interface GrammarValidateResponse {
  is_valid: boolean;
  start_symbol?: string | null;
  nonterminals: string[];
  terminals: string[];
  productions: ProductionModel[];
  diagnostics: DiagnosticModel[];
  nullable_symbols: string[];
  reachable_symbols: string[];
  unreachable_symbols: string[];
  productive_symbols: string[];
  nonproductive_symbols: string[];
}

export interface ParseTreeNode {
  symbol: string;
  kind: 'nonterminal' | 'terminal' | 'epsilon';
  production_id?: number | null;
  production?: string | null;
  span?: [number, number] | null;
  children: ParseTreeNode[];
}

export interface ParseResponse {
  accepted: boolean;
  tokens: string[];
  distinct_parse_count: number;
  trees: ParseTreeNode[];
  complete: boolean;
  duration_seconds: number;
  message: string;
  limits_reached: string[];
}

export interface EarleyChartItem {
  production: string;
  origin: number;
  is_complete: boolean;
}

export interface EarleyChartStep {
  chart_index: number;
  token: string;
  items: EarleyChartItem[];
}

export interface StringAmbiguityResponse {
  status: 'ambiguous' | 'unique_parse' | 'no_parse' | 'inconclusive';
  scope: string;
  input_tokens: string[];
  distinct_parse_count_found: number;
  trees: ParseTreeNode[];
  complete: boolean;
  limits_reached: string[];
  message: string;
  chart_tables?: EarleyChartStep[];
}

export interface GrammarAmbiguityResponse {
  status: 'ambiguous' | 'no_witness_within_limits' | 'inconclusive';
  scope: string;
  witness_string?: string[] | null;
  witness_string_display?: string | null;
  distinct_parse_count_found: number;
  trees: ParseTreeNode[];
  candidates_evaluated: number;
  total_candidates_generated: number;
  search_limits: {
    max_tokens: number;
    max_candidates: number;
    timeout_seconds: number;
  };
  duration_seconds: number;
  limits_reached: string[];
  message: string;
}

export interface FirstFollowResponse {
  start_symbol: string;
  first_sets: Record<string, string[]>;
  follow_sets: Record<string, string[]>;
}

export interface CYKCellModel {
  length: number;
  start: number;
  span_text: string;
  nonterminals: string[];
}

export interface CYKRowModel {
  length: number;
  cells: CYKCellModel[];
}

export interface CYKResponse {
  accepted: boolean;
  tokens: string[];
  cnf_start_symbol: string;
  cnf_productions: string[];
  table: CYKRowModel[];
  duration_seconds: number;
}
