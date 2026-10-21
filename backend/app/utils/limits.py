from dataclasses import dataclass
from typing import Optional

@dataclass
class ParseLimits:
    max_grammar_length: int = 20000
    max_productions: int = 200
    max_tokens: int = 150
    max_trees: int = 20
    timeout_seconds: float = 5.0

@dataclass
class GrammarSearchLimits:
    max_tokens: int = 10
    max_candidates: int = 500
    timeout_seconds: float = 4.0
    max_trees_per_candidate: int = 2
