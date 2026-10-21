from typing import Dict, Set, Tuple, List, Optional, Any
from app.core.grammar import Grammar

EPSILON = "ε"
END_MARKER = "$"

def compute_first_sets(grammar: Grammar) -> Dict[str, Set[str]]:
    """
    Computes FIRST sets for all nonterminals and terminals in the grammar.
    Uses fixed-point iteration.
    """
    first: Dict[str, Set[str]] = {}

    # Base case for terminals
    for term in grammar.terminals:
        first[term] = {term}

    # Initialize nonterminals with empty sets
    for nt in grammar.nonterminals:
        first[nt] = set()

    changed = True
    while changed:
        changed = False
        for prod in grammar.productions:
            lhs = prod.lhs
            before_len = len(first[lhs])

            if prod.is_epsilon:
                first[lhs].add(EPSILON)
            else:
                all_have_epsilon = True
                for sym in prod.rhs:
                    sym_first = first.get(sym, {sym} if grammar.is_terminal(sym) else set())
                    first[lhs].update(sym_first - {EPSILON})
                    if EPSILON not in sym_first:
                        all_have_epsilon = False
                        break
                if all_have_epsilon:
                    first[lhs].add(EPSILON)

            if len(first[lhs]) > before_len:
                changed = True

    return first

def compute_first_of_sequence(sequence: Tuple[str, ...], first_sets: Dict[str, Set[str]]) -> Set[str]:
    """Computes FIRST set of a sequence of symbols."""
    result: Set[str] = set()
    if not sequence:
        return {EPSILON}

    all_have_epsilon = True
    for sym in sequence:
        sym_first = first_sets.get(sym, {sym})
        result.update(sym_first - {EPSILON})
        if EPSILON not in sym_first:
            all_have_epsilon = False
            break

    if all_have_epsilon:
        result.add(EPSILON)

    return result

def compute_follow_sets(
    grammar: Grammar,
    first_sets: Optional[Dict[str, Set[str]]] = None
) -> Dict[str, Set[str]]:
    """
    Computes FOLLOW sets for all nonterminals in the grammar.
    Uses fixed-point iteration.
    """
    if first_sets is None:
        first_sets = compute_first_sets(grammar)

    follow: Dict[str, Set[str]] = {nt: set() for nt in grammar.nonterminals}
    if grammar.start_symbol in follow:
        follow[grammar.start_symbol].add(END_MARKER)

    changed = True
    while changed:
        changed = False
        for prod in grammar.productions:
            lhs = prod.lhs
            rhs = prod.rhs
            k = len(rhs)

            for i in range(k):
                B = rhs[i]
                if not grammar.is_nonterminal(B):
                    continue

                before_len = len(follow[B])
                beta = rhs[i + 1:]
                first_beta = compute_first_of_sequence(beta, first_sets)

                # Add FIRST(beta) - {ε} to FOLLOW(B)
                follow[B].update(first_beta - {EPSILON})

                # If beta is nullable (or empty), add FOLLOW(A) to FOLLOW(B)
                if EPSILON in first_beta:
                    follow[B].update(follow[lhs])

                if len(follow[B]) > before_len:
                    changed = True

    return follow

def get_first_follow_report(grammar: Grammar) -> Dict[str, Any]:
    first_sets = compute_first_sets(grammar)
    follow_sets = compute_follow_sets(grammar, first_sets)

    return {
        "start_symbol": grammar.start_symbol,
        "first_sets": {
            nt: sorted(list(first_sets.get(nt, set())))
            for nt in sorted(grammar.nonterminals)
        },
        "follow_sets": {
            nt: sorted(list(follow_sets.get(nt, set())))
            for nt in sorted(grammar.nonterminals)
        }
    }
