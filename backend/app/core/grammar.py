from dataclasses import dataclass, field
from typing import List, Set, Tuple, Optional, Dict
import re
from app.utils.errors import GrammarSyntaxError

EPSILON_LITERALS = {"ε", "epsilon", "EPSILON", "λ", "lambda", "''", '""'}

@dataclass(frozen=True)
class Production:
    id: int
    lhs: str
    rhs: Tuple[str, ...]

    @property
    def is_epsilon(self) -> bool:
        return len(self.rhs) == 0

    def __str__(self) -> str:
        rhs_str = " ".join(self.rhs) if self.rhs else "ε"
        return f"{self.lhs} -> {rhs_str}"

@dataclass
class Grammar:
    start_symbol: str
    nonterminals: Set[str] = field(default_factory=set)
    terminals: Set[str] = field(default_factory=set)
    productions: List[Production] = field(default_factory=list)
    _prod_by_lhs: Dict[str, List[Production]] = field(default_factory=dict, init=False)

    def __post_init__(self):
        self.rebuild_index()

    def rebuild_index(self):
        self._prod_by_lhs = {}
        for p in self.productions:
            self._prod_by_lhs.setdefault(p.lhs, []).append(p)

    def get_productions_for(self, symbol: str) -> List[Production]:
        return self._prod_by_lhs.get(symbol, [])

    def is_nonterminal(self, symbol: str) -> bool:
        return symbol in self.nonterminals

    def is_terminal(self, symbol: str) -> bool:
        return symbol in self.terminals

def parse_grammar_text(text: str, custom_start: Optional[str] = None) -> Grammar:
    """
    Parses a grammar specification text into a Grammar object.
    Supports:
      A -> alpha | beta
      A ::= alpha
      Epsilon: ε, epsilon, EPSILON, λ, lambda, or empty RHS
      Comments starting with # or //
    """
    if not text or not text.strip():
        raise GrammarSyntaxError("Grammar text cannot be empty.", line=1, column=1)

    lines = text.splitlines()
    raw_productions: List[Tuple[str, Tuple[str, ...], int, int]] = []
    lhs_order: List[str] = []
    nonterminals: Set[str] = set()

    for line_idx, raw_line in enumerate(lines, start=1):
        line = raw_line.strip()
        if not line or line.startswith("#") or line.startswith("//"):
            continue

        # Split line by comment if inline comment exists
        for comment_prefix in ("#", "//"):
            if comment_prefix in line:
                line = line.split(comment_prefix, 1)[0].strip()

        if not line:
            continue

        # Determine delimiter
        delimiter = None
        for delim in ("::=", "->", "→"):
            if delim in line:
                delimiter = delim
                break

        if delimiter is None:
            raise GrammarSyntaxError(
                f"Missing production operator ('->' or '::=') in: '{raw_line}'",
                line=line_idx,
                column=1
            )

        parts = line.split(delimiter, 1)
        lhs = parts[0].strip()
        rhs_part = parts[1].strip()

        if not lhs:
            raise GrammarSyntaxError("Missing left-hand side nonterminal.", line=line_idx, column=1)

        # LHS should be a single symbol
        lhs_tokens = lhs.split()
        if len(lhs_tokens) != 1:
            raise GrammarSyntaxError(f"Left-hand side must be a single nonterminal, found: '{lhs}'", line=line_idx, column=1)

        lhs_sym = lhs_tokens[0]
        if lhs_sym not in nonterminals:
            nonterminals.add(lhs_sym)
            lhs_order.append(lhs_sym)

        # Handle alternatives
        alternatives = rhs_part.split("|")
        for alt_idx, alt in enumerate(alternatives):
            alt_tokens = alt.strip().split()
            # Check for epsilon
            if not alt_tokens:
                # empty RHS is epsilon
                rhs_symbols: Tuple[str, ...] = ()
            elif len(alt_tokens) == 1 and alt_tokens[0] in EPSILON_LITERALS:
                rhs_symbols = ()
            else:
                # If epsilon literal is mixed with other symbols
                for sym in alt_tokens:
                    if sym in EPSILON_LITERALS:
                        raise GrammarSyntaxError(
                            f"Epsilon literal '{sym}' cannot be combined with other symbols in alternative '{alt.strip()}'.",
                            line=line_idx,
                            column=raw_line.find(sym) + 1
                        )
                rhs_symbols = tuple(alt_tokens)

            col = raw_line.find(alt) + 1 if alt else raw_line.find(delimiter) + len(delimiter)
            raw_productions.append((lhs_sym, rhs_symbols, line_idx, col))

    if not raw_productions:
        raise GrammarSyntaxError("No valid productions found in grammar text.", line=1, column=1)

    # Determine start symbol
    start_symbol = custom_start if custom_start else lhs_order[0]
    if start_symbol not in nonterminals:
        raise GrammarSyntaxError(
            f"Start symbol '{start_symbol}' is not defined as a nonterminal in the grammar.",
            line=1,
            column=1
        )

    # Collect terminals: symbols in RHS that are not nonterminals
    terminals: Set[str] = set()
    for _, rhs, _, _ in raw_productions:
        for sym in rhs:
            if sym not in nonterminals:
                terminals.add(sym)

    # Deduplicate productions while keeping stable IDs
    seen_prods = set()
    productions: List[Production] = []
    prod_id = 1

    for lhs, rhs, _, _ in raw_productions:
        sig = (lhs, rhs)
        if sig not in seen_prods:
            seen_prods.add(sig)
            productions.append(Production(id=prod_id, lhs=lhs, rhs=rhs))
            prod_id += 1

    return Grammar(
        start_symbol=start_symbol,
        nonterminals=nonterminals,
        terminals=terminals,
        productions=productions
    )
