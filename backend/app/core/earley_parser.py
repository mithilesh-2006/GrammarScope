import time
from typing import List, Tuple, Dict, Set, Optional, Any
from app.core.grammar import Grammar, Production
from app.core.parse_forest import (
    ParseForest,
    NonterminalNode,
    TerminalNode,
    EpsilonNode,
    ForestNode,
)
from app.utils.errors import ResourceLimitExceededError

class EarleyParser:
    def __init__(self, grammar: Grammar):
        self.grammar = grammar

    def parse(
        self,
        tokens: List[str],
        start_symbol: Optional[str] = None,
        timeout_seconds: float = 5.0
    ) -> Tuple[bool, ParseForest, Dict[str, Any]]:
        """
        Runs Earley parsing on the token sequence.
        Returns:
          (accepted, parse_forest, stats)
        """
        start_time = time.time()
        start = start_symbol if start_symbol else self.grammar.start_symbol
        n = len(tokens)

        # Charts: chart[k] is a list of item keys: (prod_id, dot, origin)
        # item_sets[k] stores set of item keys for fast membership
        chart: List[List[Tuple[int, int, int]]] = [[] for _ in range(n + 1)]
        item_sets: List[Set[Tuple[int, int, int]]] = [set() for _ in range(n + 1)]

        # Map prod_id to Production object
        prod_map = {p.id: p for p in self.grammar.productions}

        # Completed items by LHS in each chart: completed_by_lhs[k][lhs] = list of (prod_id, origin)
        completed_by_lhs: List[Dict[str, List[Tuple[int, int]]]] = [{} for _ in range(n + 1)]

        # Transitions: (prod_id, dot, origin, k) -> list of (prev_item_state, child_node)
        # prev_item_state is (prod_id, dot - 1, origin, prev_k) or None (when dot was 0)
        transitions: Dict[Tuple[int, int, int, int], List[Tuple[Optional[Tuple[int, int, int, int]], ForestNode]]] = {}

        # Shared forest nodes: (symbol, i, j) -> NonterminalNode
        forest_nodes: Dict[Tuple[str, int, int], NonterminalNode] = {}

        def get_forest_node(symbol: str, i: int, j: int) -> NonterminalNode:
            key = (symbol, i, j)
            if key not in forest_nodes:
                forest_nodes[key] = NonterminalNode(span=(i, j), symbol=symbol)
            return forest_nodes[key]

        def add_item(k: int, prod_id: int, dot: int, origin: int, prev_state: Optional[Tuple[int, int, int, int]] = None, child_node: Optional[ForestNode] = None) -> bool:
            state_key = (prod_id, dot, origin)
            curr_state = (prod_id, dot, origin, k)
            
            if child_node is not None:
                trans_list = transitions.setdefault(curr_state, [])
                trans_pair = (prev_state, child_node)
                if trans_pair not in trans_list:
                    trans_list.append(trans_pair)

            if state_key not in item_sets[k]:
                item_sets[k].add(state_key)
                chart[k].append(state_key)
                return True
            return False

        # Initialize chart[0] with start productions
        for prod in self.grammar.get_productions_for(start):
            add_item(0, prod.id, 0, 0)

        step_count = 0
        timed_out = False

        for k in range(n + 1):
            idx = 0
            while idx < len(chart[k]):
                step_count += 1
                if step_count % 500 == 0:
                    if time.time() - start_time > timeout_seconds:
                        timed_out = True
                        break

                prod_id, dot, origin = chart[k][idx]
                idx += 1
                prod = prod_map[prod_id]

                if dot < len(prod.rhs):
                    next_sym = prod.rhs[dot]
                    if self.grammar.is_nonterminal(next_sym):
                        # Predictor
                        for sub_prod in self.grammar.get_productions_for(next_sym):
                            add_item(k, sub_prod.id, 0, k)

                        # If next_sym has already completed in chart[k]
                        if next_sym in completed_by_lhs[k]:
                            for comp_prod_id, comp_origin in completed_by_lhs[k][next_sym]:
                                child_node = get_forest_node(next_sym, comp_origin, k)
                                prev_state = (prod_id, dot, origin, comp_origin)
                                add_item(k, prod_id, dot + 1, origin, prev_state=prev_state, child_node=child_node)

                else:
                    # Item is complete
                    lhs = prod.lhs
                    completed_list = completed_by_lhs[k].setdefault(lhs, [])
                    comp_key = (prod_id, origin)
                    if comp_key not in completed_list:
                        completed_list.append(comp_key)

                    # Completer: advance items in chart[origin] expecting lhs
                    child_node = get_forest_node(lhs, origin, k)
                    for p_id, p_dot, p_orig in chart[origin]:
                        p_prod = prod_map[p_id]
                        if p_dot < len(p_prod.rhs) and p_prod.rhs[p_dot] == lhs:
                            prev_state = (p_id, p_dot, p_orig, origin)
                            add_item(k, p_id, p_dot + 1, p_orig, prev_state=prev_state, child_node=child_node)

            if timed_out:
                break

            # Scanner: advance terminals from chart[k] to chart[k+1]
            if k < n:
                token = tokens[k]
                terminal_node = TerminalNode(span=(k, k + 1), symbol=token)
                for prod_id, dot, origin in chart[k]:
                    prod = prod_map[prod_id]
                    if dot < len(prod.rhs) and prod.rhs[dot] == token:
                        prev_state = (prod_id, dot, origin, k)
                        add_item(k + 1, prod_id, dot + 1, origin, prev_state=prev_state, child_node=terminal_node)

        duration = time.time() - start_time

        # Check acceptance
        accepted = False
        if not timed_out:
            for prod in self.grammar.get_productions_for(start):
                if (prod.id, len(prod.rhs), 0) in item_sets[n]:
                    accepted = True
                    break

        if not accepted:
            stats = {
                "accepted": False,
                "duration_seconds": duration,
                "step_count": step_count,
                "timed_out": timed_out
            }
            return (False, ParseForest(None), stats)

        # Build Parse Forest derivations from transitions
        memo_seqs: Dict[Tuple[int, int, int, int], List[List[ForestNode]]] = {}
        visiting: Set[Tuple[int, int, int, int]] = set()
        cycle_detected = False

        def get_children_seqs(p_id: int, p_dot: int, p_orig: int, cur_k: int) -> List[List[ForestNode]]:
            nonlocal cycle_detected
            state = (p_id, p_dot, p_orig, cur_k)
            if p_dot == 0:
                return [[]]

            if state in memo_seqs:
                return memo_seqs[state]

            if state in visiting:
                cycle_detected = True
                return []

            visiting.add(state)
            all_seqs: List[List[ForestNode]] = []

            for prev_state, child_node in transitions.get(state, []):
                if prev_state is None:
                    all_seqs.append([child_node])
                else:
                    prev_seqs = get_children_seqs(prev_state[0], prev_state[1], prev_state[2], prev_state[3])
                    for s in prev_seqs:
                        all_seqs.append(s + [child_node])

            visiting.remove(state)
            memo_seqs[state] = all_seqs
            return all_seqs

        # Populate derivations for each completed nonterminal
        # Handle epsilon productions first
        for k in range(n + 1):
            for prod in self.grammar.productions:
                if prod.is_epsilon and (prod.id, 0, k) in item_sets[k]:
                    nt_node = get_forest_node(prod.lhs, k, k)
                    nt_node.add_derivation(prod, [EpsilonNode(span=(k, k))])

        # Then populate all completed items
        for k in range(n + 1):
            for lhs, comp_items in completed_by_lhs[k].items():
                for p_id, origin in comp_items:
                    prod = prod_map[p_id]
                    nt_node = get_forest_node(lhs, origin, k)
                    if prod.is_epsilon:
                        nt_node.add_derivation(prod, [EpsilonNode(span=(origin, k))])
                    else:
                        seqs = get_children_seqs(p_id, len(prod.rhs), origin, k)
                        for children in seqs:
                            nt_node.add_derivation(prod, children)

        root_node = get_forest_node(start, 0, n)
        forest = ParseForest(root_node)
        if cycle_detected:
            forest.has_cycle = True

        stats = {
            "accepted": True,
            "duration_seconds": duration,
            "step_count": step_count,
            "timed_out": timed_out,
            "has_cycle": cycle_detected
        }
        return (True, forest, stats)
