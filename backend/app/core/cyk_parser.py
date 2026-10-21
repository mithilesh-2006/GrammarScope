import time
from typing import List, Dict, Set, Tuple, Any, Optional
from app.core.grammar import Grammar, Production
from app.core.grammar_conversion import convert_to_cnf

class CYKParser:
    def __init__(self, grammar: Grammar):
        self.original_grammar = grammar
        self.cnf_grammar, self.prod_mapping = convert_to_cnf(grammar)

    def parse(self, tokens: List[str]) -> Dict[str, Any]:
        """
        Runs CYK dynamic-programming recognition algorithm on input tokens.
        Builds triangular parse chart for visualization.
        """
        start_time = time.time()
        n = len(tokens)

        # Handle empty input
        if n == 0:
            # Check if start symbol derives epsilon
            accepted = any(p.is_epsilon and p.lhs == self.cnf_grammar.start_symbol for p in self.cnf_grammar.productions)
            return {
                "accepted": accepted,
                "tokens": [],
                "table": [],
                "duration_seconds": time.time() - start_time,
                "cnf_start_symbol": self.cnf_grammar.start_symbol,
                "cnf_productions": [str(p) for p in self.cnf_grammar.productions]
            }

        # Table: table[l][s] stores set of nonterminals deriving substring of length l starting at s
        # l: length 1 to n (index 0 to n-1)
        # s: start index 0 to n-l
        table: List[List[Set[str]]] = [[set() for _ in range(n - l)] for l in range(n)]

        # Pre-index CNF rules
        # terminal_rules[term] = list of LHS nonterminals
        terminal_rules: Dict[str, List[str]] = {}
        # binary_rules[(B, C)] = list of LHS nonterminals
        binary_rules: Dict[Tuple[str, str], List[str]] = {}

        for prod in self.cnf_grammar.productions:
            if len(prod.rhs) == 1:
                terminal_rules.setdefault(prod.rhs[0], []).append(prod.lhs)
            elif len(prod.rhs) == 2:
                binary_rules.setdefault((prod.rhs[0], prod.rhs[1]), []).append(prod.lhs)

        # Length 1: fill from terminal rules
        for s in range(n):
            tok = tokens[s]
            for lhs in terminal_rules.get(tok, []):
                table[0][s].add(lhs)

        # Length 2 to n:
        for l in range(2, n + 1):  # length
            l_idx = l - 1
            for s in range(n - l + 1):  # start position
                for p in range(1, l):  # partition/split length
                    left_nts = table[p - 1][s]
                    right_nts = table[l - p - 1][s + p]
                    if not left_nts or not right_nts:
                        continue
                    for B in left_nts:
                        for C in right_nts:
                            for A in binary_rules.get((B, C), []):
                                table[l_idx][s].add(A)

        accepted = self.cnf_grammar.start_symbol in table[n - 1][0]
        duration = time.time() - start_time

        # Format table for JSON/frontend display
        formatted_table: List[Dict[str, Any]] = []
        for l in range(1, n + 1):
            row: List[Dict[str, Any]] = []
            for s in range(n - l + 1):
                row.append({
                    "length": l,
                    "start": s,
                    "span_text": " ".join(tokens[s:s + l]),
                    "nonterminals": sorted(list(table[l - 1][s]))
                })
            formatted_table.append({
                "length": l,
                "cells": row
            })

        return {
            "accepted": accepted,
            "tokens": tokens,
            "table": formatted_table,
            "duration_seconds": duration,
            "cnf_start_symbol": self.cnf_grammar.start_symbol,
            "cnf_productions": [str(p) for p in self.cnf_grammar.productions]
        }
