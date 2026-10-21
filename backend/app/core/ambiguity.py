import time
from typing import List, Optional, Dict, Any, Set, Tuple
from collections import deque
from app.core.grammar import Grammar
from app.core.earley_parser import EarleyParser
from app.core.parse_tree import ParseTreeNode

def analyze_string_ambiguity(
    grammar: Grammar,
    tokens: List[str],
    start_symbol: Optional[str] = None,
    max_trees: int = 10,
    timeout_seconds: float = 5.0
) -> Dict[str, Any]:
    """
    Analyzes whether a specific token string is ambiguous under the grammar.
    Possible statuses:
      - 'ambiguous': at least 2 distinct trees found
      - 'unique_parse': exactly 1 tree found and search was complete (exhaustive)
      - 'no_parse': string cannot be derived
      - 'inconclusive': timeout, cycle, or resource limit prevented establishing uniqueness
    """
    parser = EarleyParser(grammar)
    accepted, forest, stats = parser.parse(
        tokens=tokens,
        start_symbol=start_symbol,
        timeout_seconds=timeout_seconds
    )

    if stats.get("timed_out", False):
        return {
            "status": "inconclusive",
            "scope": "string",
            "input_tokens": tokens,
            "distinct_parse_count_found": 0,
            "trees": [],
            "complete": False,
            "limits_reached": ["timeout"],
            "message": f"Parsing timed out after {timeout_seconds}s before completing derivation."
        }

    if not accepted:
        return {
            "status": "no_parse",
            "scope": "string",
            "input_tokens": tokens,
            "distinct_parse_count_found": 0,
            "trees": [],
            "complete": True,
            "limits_reached": [],
            "message": "The input string cannot be derived from the grammar."
        }

    trees, complete = forest.extract_trees(max_trees=max_trees)
    distinct_count = len(trees)

    if distinct_count >= 2:
        return {
            "status": "ambiguous",
            "scope": "string",
            "input_tokens": tokens,
            "distinct_parse_count_found": distinct_count,
            "trees": [t.to_dict() for t in trees],
            "complete": complete,
            "limits_reached": [] if complete else ["max_trees"],
            "message": f"Ambiguity confirmed: found {distinct_count} distinct parse trees for this string."
        }

    if distinct_count == 1:
        if complete and not forest.has_cycle:
            return {
                "status": "unique_parse",
                "scope": "string",
                "input_tokens": tokens,
                "distinct_parse_count_found": 1,
                "trees": [trees[0].to_dict()],
                "complete": True,
                "limits_reached": [],
                "message": "Unique parse confirmed: exactly one parse tree derives this string."
            }
        else:
            reasons = []
            if not complete:
                reasons.append("tree extraction limit or forest bound")
            if forest.has_cycle:
                reasons.append("cyclic derivations in grammar")
            return {
                "status": "inconclusive",
                "scope": "string",
                "input_tokens": tokens,
                "distinct_parse_count_found": 1,
                "trees": [trees[0].to_dict()],
                "complete": False,
                "limits_reached": reasons,
                "message": f"Inconclusive: one tree found, but additional parses could not be ruled out due to {', '.join(reasons)}."
            }

    # distinct_count == 0 (e.g. cycle with no base derivation)
    return {
        "status": "inconclusive",
        "scope": "string",
        "input_tokens": tokens,
        "distinct_parse_count_found": 0,
        "trees": [],
        "complete": False,
        "limits_reached": ["derivation cycle"],
        "message": "Inconclusive: derivation could not extract a concrete finite parse tree."
    }

def generate_candidate_strings(
    grammar: Grammar,
    start_symbol: Optional[str] = None,
    max_tokens: int = 8,
    max_candidates: int = 300,
    timeout_seconds: float = 3.0
) -> List[List[str]]:
    """
    Generates candidate terminal strings systematically using leftmost derivation BFS.
    Prunes expansions exceeding max_tokens.
    """
    start = start_symbol if start_symbol else grammar.start_symbol
    start_time = time.time()
    queue = deque([((start,), 0)])
    seen_sentential: Set[Tuple[str, ...]] = { (start,) }
    candidates: Set[Tuple[str, ...]] = set()

    while queue and len(candidates) < max_candidates:
        if time.time() - start_time > timeout_seconds:
            break

        current, depth = queue.popleft()

        # Find leftmost nonterminal
        leftmost_idx = -1
        for idx, sym in enumerate(current):
            if grammar.is_nonterminal(sym):
                leftmost_idx = idx
                break

        if leftmost_idx == -1:
            # Sentential form is entirely terminals
            if len(current) <= max_tokens:
                candidates.add(current)
            continue

        # If too many terminal symbols already, prune
        term_count = sum(1 for sym in current if grammar.is_terminal(sym))
        if term_count > max_tokens:
            continue

        nt = current[leftmost_idx]
        prefix = current[:leftmost_idx]
        suffix = current[leftmost_idx + 1:]

        for prod in grammar.get_productions_for(nt):
            next_form = prefix + prod.rhs + suffix
            if len(next_form) <= max_tokens + 4 and next_form not in seen_sentential:
                seen_sentential.add(next_form)
                queue.append((next_form, depth + 1))

    # Sort candidates by length then content
    sorted_candidates = sorted(candidates, key=lambda c: (len(c), c))
    return [list(c) for c in sorted_candidates]

def search_grammar_ambiguity(
    grammar: Grammar,
    start_symbol: Optional[str] = None,
    max_tokens: int = 8,
    max_candidates: int = 200,
    timeout_seconds: float = 4.0
) -> Dict[str, Any]:
    """
    Searches for an ambiguity witness in the language of the grammar within bounded limits.
    Never claims the grammar is unambiguous.
    """
    start_time = time.time()
    candidates = generate_candidate_strings(
        grammar=grammar,
        start_symbol=start_symbol,
        max_tokens=max_tokens,
        max_candidates=max_candidates,
        timeout_seconds=min(1.5, timeout_seconds / 2)
    )

    limits_reached: List[str] = []
    candidates_tested = 0
    witness_found = False
    witness_tokens: Optional[List[str]] = None
    witness_trees: List[Dict[str, Any]] = []

    for cand in candidates:
        if time.time() - start_time > timeout_seconds:
            limits_reached.append("timeout")
            break

        candidates_tested += 1
        res = analyze_string_ambiguity(
            grammar=grammar,
            tokens=cand,
            start_symbol=start_symbol,
            max_trees=2,
            timeout_seconds=max(0.5, (timeout_seconds - (time.time() - start_time)))
        )

        if res["status"] == "ambiguous":
            witness_found = True
            witness_tokens = cand
            witness_trees = res["trees"]
            break

    elapsed = time.time() - start_time

    if witness_found:
        return {
            "status": "ambiguous",
            "scope": "grammar",
            "witness_string": witness_tokens,
            "witness_string_display": " ".join(witness_tokens) if witness_tokens else "ε",
            "distinct_parse_count_found": len(witness_trees),
            "trees": witness_trees,
            "candidates_evaluated": candidates_tested,
            "total_candidates_generated": len(candidates),
            "search_limits": {
                "max_tokens": max_tokens,
                "max_candidates": max_candidates,
                "timeout_seconds": timeout_seconds
            },
            "duration_seconds": elapsed,
            "limits_reached": limits_reached,
            "message": f"Ambiguity witness found: '{' '.join(witness_tokens) if witness_tokens else 'ε'}' has multiple distinct parse trees."
        }

    if limits_reached:
        return {
            "status": "inconclusive",
            "scope": "grammar",
            "witness_string": None,
            "witness_string_display": None,
            "distinct_parse_count_found": 0,
            "trees": [],
            "candidates_evaluated": candidates_tested,
            "total_candidates_generated": len(candidates),
            "search_limits": {
                "max_tokens": max_tokens,
                "max_candidates": max_candidates,
                "timeout_seconds": timeout_seconds
            },
            "duration_seconds": elapsed,
            "limits_reached": limits_reached,
            "message": f"Search limit reached ({', '.join(limits_reached)}) after testing {candidates_tested} candidate strings. Ambiguity status inconclusive."
        }

    return {
        "status": "no_witness_within_limits",
        "scope": "grammar",
        "witness_string": None,
        "witness_string_display": None,
        "distinct_parse_count_found": 0,
        "trees": [],
        "candidates_evaluated": candidates_tested,
        "total_candidates_generated": len(candidates),
        "search_limits": {
            "max_tokens": max_tokens,
            "max_candidates": max_candidates,
            "timeout_seconds": timeout_seconds
        },
        "duration_seconds": elapsed,
        "limits_reached": [],
        "message": f"No ambiguity witness found within limits (searched {candidates_tested} candidate strings up to length {max_tokens}). CFG ambiguity is undecidable in general; this does NOT prove the grammar is unambiguous."
    }
