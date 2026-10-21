from dataclasses import dataclass, field
from typing import List, Set, Dict, Optional, Any
from app.core.grammar import Grammar, parse_grammar_text
from app.utils.errors import GrammarSyntaxError

@dataclass
class Diagnostic:
    level: str  # "error", "warning", "info"
    message: str
    line: Optional[int] = None
    column: Optional[int] = None
    symbol: Optional[str] = None

@dataclass
class ValidationReport:
    is_valid: bool
    grammar: Optional[Grammar] = None
    start_symbol: Optional[str] = None
    nonterminals: List[str] = field(default_factory=list)
    terminals: List[str] = field(default_factory=list)
    diagnostics: List[Diagnostic] = field(default_factory=list)
    nullable_symbols: List[str] = field(default_factory=list)
    reachable_symbols: List[str] = field(default_factory=list)
    unreachable_symbols: List[str] = field(default_factory=list)
    productive_symbols: List[str] = field(default_factory=list)
    nonproductive_symbols: List[str] = field(default_factory=list)

def find_nullable_symbols(grammar: Grammar) -> Set[str]:
    """Finds all nonterminals that can derive the empty string."""
    nullable: Set[str] = set()
    changed = True
    while changed:
        changed = False
        for prod in grammar.productions:
            if prod.lhs not in nullable:
                if all(sym in nullable for sym in prod.rhs):
                    nullable.add(prod.lhs)
                    changed = True
    return nullable

def find_reachable_symbols(grammar: Grammar) -> Set[str]:
    """Finds all nonterminals reachable from the start symbol."""
    if grammar.start_symbol not in grammar.nonterminals:
        return set()
    reachable: Set[str] = {grammar.start_symbol}
    changed = True
    while changed:
        changed = False
        for nt in list(reachable):
            for prod in grammar.get_productions_for(nt):
                for sym in prod.rhs:
                    if grammar.is_nonterminal(sym) and sym not in reachable:
                        reachable.add(sym)
                        changed = True
    return reachable

def find_productive_symbols(grammar: Grammar) -> Set[str]:
    """Finds all nonterminals that can derive a terminal string (or empty string)."""
    productive: Set[str] = set()
    changed = True
    while changed:
        changed = False
        for prod in grammar.productions:
            if prod.lhs not in productive:
                # RHS symbols must all be terminals or productive nonterminals
                if all(grammar.is_terminal(sym) or sym in productive for sym in prod.rhs):
                    productive.add(prod.lhs)
                    changed = True
    return productive

def validate_grammar(text: str, custom_start: Optional[str] = None) -> ValidationReport:
    """
    Validates a grammar string, computes diagnostics, and analyzes reachable/productive symbols.
    """
    diagnostics: List[Diagnostic] = []
    
    try:
        grammar = parse_grammar_text(text, custom_start=custom_start)
    except GrammarSyntaxError as e:
        diagnostics.append(Diagnostic(
            level="error",
            message=e.message,
            line=e.line,
            column=e.column
        ))
        return ValidationReport(
            is_valid=False,
            grammar=None,
            diagnostics=diagnostics
        )
    except Exception as e:
        diagnostics.append(Diagnostic(
            level="error",
            message=str(e),
            line=1,
            column=1
        ))
        return ValidationReport(
            is_valid=False,
            grammar=None,
            diagnostics=diagnostics
        )

    # Compute analysis sets
    nullable = find_nullable_symbols(grammar)
    reachable = find_reachable_symbols(grammar)
    productive = find_productive_symbols(grammar)

    unreachable = grammar.nonterminals - reachable
    nonproductive = grammar.nonterminals - productive

    for nt in sorted(unreachable):
        diagnostics.append(Diagnostic(
            level="warning",
            message=f"Nonterminal '{nt}' is unreachable from start symbol '{grammar.start_symbol}'.",
            symbol=nt
        ))

    for nt in sorted(nonproductive):
        diagnostics.append(Diagnostic(
            level="warning",
            message=f"Nonterminal '{nt}' is non-productive (cannot derive any terminal string).",
            symbol=nt
        ))

    # Check for empty terminals warning
    if not grammar.terminals and not nullable:
        diagnostics.append(Diagnostic(
            level="warning",
            message="Grammar contains no terminal symbols and no epsilon derivation.",
        ))

    return ValidationReport(
        is_valid=True,
        grammar=grammar,
        start_symbol=grammar.start_symbol,
        nonterminals=sorted(list(grammar.nonterminals)),
        terminals=sorted(list(grammar.terminals)),
        diagnostics=diagnostics,
        nullable_symbols=sorted(list(nullable)),
        reachable_symbols=sorted(list(reachable)),
        unreachable_symbols=sorted(list(unreachable)),
        productive_symbols=sorted(list(productive)),
        nonproductive_symbols=sorted(list(nonproductive))
    )
