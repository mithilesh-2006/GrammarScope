from typing import List, Tuple, Set, Dict, Optional
import itertools
from app.core.grammar import Grammar, Production
from app.core.validation import find_nullable_symbols

def convert_to_cnf(grammar: Grammar) -> Tuple[Grammar, Dict[int, int]]:
    """
    Converts a CFG to Chomsky Normal Form (CNF).
    Produces rules of form:
      A -> B C
      A -> a
      S0 -> ε (if language contains ε)
    Returns:
      (cnf_grammar, prod_mapping)
      where prod_mapping maps each new production ID to the original production ID it originated from.
    """
    prod_mapping: Dict[int, int] = {}
    
    # Check if start symbol appears on RHS
    start_on_rhs = any(grammar.start_symbol in p.rhs for p in grammar.productions)
    orig_start = grammar.start_symbol
    new_start = f"{orig_start}_0" if start_on_rhs else orig_start

    # Initial list of rules: (lhs, rhs_tuple, orig_prod_id)
    rules: List[Tuple[str, Tuple[str, ...], int]] = []
    if start_on_rhs:
        rules.append((new_start, (orig_start,), -1))

    for p in grammar.productions:
        rules.append((p.lhs, p.rhs, p.id))

    # Step 1: Replace terminals in mixed/long productions (len >= 2)
    term_nonterm_map: Dict[str, str] = {}
    term_rules: List[Tuple[str, Tuple[str, ...], int]] = []

    def get_term_nt(term: str) -> str:
        if term not in term_nonterm_map:
            t_name = f"_T_{term}"
            # Ensure name is unique
            idx = 1
            while t_name in grammar.nonterminals:
                t_name = f"_T_{term}_{idx}"
                idx += 1
            term_nonterm_map[term] = t_name
            term_rules.append((t_name, (term,), -1))
        return term_nonterm_map[term]

    step1_rules: List[Tuple[str, Tuple[str, ...], int]] = []
    for lhs, rhs, orig_id in rules:
        if len(rhs) >= 2:
            new_rhs = []
            for sym in rhs:
                if grammar.is_terminal(sym):
                    new_rhs.append(get_term_nt(sym))
                else:
                    new_rhs.append(sym)
            step1_rules.append((lhs, tuple(new_rhs), orig_id))
        else:
            step1_rules.append((lhs, rhs, orig_id))

    step1_rules.extend(term_rules)

    # Step 2: Binarize long productions (len > 2)
    step2_rules: List[Tuple[str, Tuple[str, ...], int]] = []
    bin_counter = 1
    for lhs, rhs, orig_id in step1_rules:
        if len(rhs) > 2:
            curr_lhs = lhs
            for i in range(len(rhs) - 2):
                new_nt = f"_BIN_{bin_counter}"
                bin_counter += 1
                step2_rules.append((curr_lhs, (rhs[i], new_nt), orig_id))
                curr_lhs = new_nt
            step2_rules.append((curr_lhs, (rhs[-2], rhs[-1]), orig_id))
        else:
            step2_rules.append((lhs, rhs, orig_id))

    # Step 3: Remove epsilon productions (except possibly at new_start)
    # Find nullable symbols in step2_rules
    nullable: Set[str] = set()
    changed = True
    while changed:
        changed = False
        for lhs, rhs, _ in step2_rules:
            if lhs not in nullable:
                if len(rhs) == 0 or all(s in nullable for s in rhs):
                    nullable.add(lhs)
                    changed = True

    step3_rules: List[Tuple[str, Tuple[str, ...], int]] = []
    for lhs, rhs, orig_id in step2_rules:
        if len(rhs) == 0:
            if lhs == new_start:
                step3_rules.append((lhs, (), orig_id))
            continue

        # Generate combinations of omitting nullable symbols
        indices_nullable = [i for i, s in enumerate(rhs) if s in nullable]
        if not indices_nullable:
            step3_rules.append((lhs, rhs, orig_id))
        else:
            # Power set of combinations
            for mask in range(1 << len(indices_nullable)):
                omit_indices = {indices_nullable[j] for j in range(len(indices_nullable)) if (mask & (1 << j))}
                new_rhs = tuple(s for i, s in enumerate(rhs) if i not in omit_indices)
                if len(new_rhs) > 0 or lhs == new_start:
                    step3_rules.append((lhs, new_rhs, orig_id))

    # Step 4: Remove unit productions (A -> B where B is a nonterminal)
    # Collect all nonterminals
    all_nts = set([new_start] + list(grammar.nonterminals) + list(term_nonterm_map.values()))
    for lhs, rhs, _ in step3_rules:
        all_nts.add(lhs)
        for s in rhs:
            if s not in grammar.terminals:
                all_nts.add(s)

    # Find unit pairs (A, B) such that A =>* B
    unit_graph: Dict[str, Set[str]] = {nt: set() for nt in all_nts}
    non_unit_rules: List[Tuple[str, Tuple[str, ...], int]] = []

    for lhs, rhs, orig_id in step3_rules:
        if len(rhs) == 1 and rhs[0] in all_nts:
            unit_graph[lhs].add(rhs[0])
        else:
            non_unit_rules.append((lhs, rhs, orig_id))

    # Transitive closure of unit pairs
    closure: Dict[str, Set[str]] = {nt: {nt} for nt in all_nts}
    for nt in all_nts:
        queue = [nt]
        while queue:
            curr = queue.pop(0)
            for nxt in unit_graph.get(curr, set()):
                if nxt not in closure[nt]:
                    closure[nt].add(nxt)
                    queue.append(nxt)

    final_rules: List[Tuple[str, Tuple[str, ...], int]] = []
    seen = set()

    for A in all_nts:
        for B in closure[A]:
            for lhs, rhs, orig_id in non_unit_rules:
                if lhs == B:
                    sig = (A, rhs)
                    if sig not in seen:
                        seen.add(sig)
                        final_rules.append((A, rhs, orig_id))

    # Build final Grammar
    prod_list: List[Production] = []
    final_nts: Set[str] = set()
    final_terms: Set[str] = set()

    for idx, (lhs, rhs, orig_id) in enumerate(final_rules, start=1):
        p = Production(id=idx, lhs=lhs, rhs=rhs)
        prod_list.append(p)
        prod_mapping[idx] = orig_id
        final_nts.add(lhs)
        for s in rhs:
            if s in grammar.terminals:
                final_terms.add(s)

    cnf_grammar = Grammar(
        start_symbol=new_start,
        nonterminals=final_nts,
        terminals=final_terms,
        productions=prod_list
    )

    return cnf_grammar, prod_mapping
