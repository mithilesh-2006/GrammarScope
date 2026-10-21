from typing import Optional, List, Dict, Any
from app.core.grammar import parse_grammar_text
from app.core.tokenizer import tokenize_input
from app.core.ambiguity import analyze_string_ambiguity, search_grammar_ambiguity
from app.schemas.ambiguity_schemas import (
    StringAmbiguityResponse,
    GrammarAmbiguityResponse
)

class AmbiguityService:
    @staticmethod
    def analyze_string(
        grammar_text: str,
        input_string: Optional[str],
        input_tokens: Optional[List[str]],
        start_symbol: Optional[str] = None,
        token_mode: str = "auto",
        max_trees: int = 10
    ) -> StringAmbiguityResponse:
        grammar = parse_grammar_text(grammar_text, custom_start=start_symbol)
        raw = input_tokens if input_tokens is not None else (input_string if input_string is not None else "")
        tokens = tokenize_input(raw, grammar.terminals, mode=token_mode)

        res = analyze_string_ambiguity(
            grammar=grammar,
            tokens=tokens,
            start_symbol=grammar.start_symbol,
            max_trees=max_trees
        )

        return StringAmbiguityResponse(
            status=res["status"],
            scope=res["scope"],
            input_tokens=res["input_tokens"],
            distinct_parse_count_found=res["distinct_parse_count_found"],
            trees=res["trees"],
            complete=res["complete"],
            limits_reached=res["limits_reached"],
            message=res["message"]
        )

    @staticmethod
    def search_grammar(
        grammar_text: str,
        start_symbol: Optional[str] = None,
        max_tokens: int = 8,
        max_candidates: int = 200,
        timeout_seconds: float = 4.0
    ) -> GrammarAmbiguityResponse:
        grammar = parse_grammar_text(grammar_text, custom_start=start_symbol)

        res = search_grammar_ambiguity(
            grammar=grammar,
            start_symbol=grammar.start_symbol,
            max_tokens=max_tokens,
            max_candidates=max_candidates,
            timeout_seconds=timeout_seconds
        )

        return GrammarAmbiguityResponse(
            status=res["status"],
            scope=res["scope"],
            witness_string=res["witness_string"],
            witness_string_display=res["witness_string_display"],
            distinct_parse_count_found=res["distinct_parse_count_found"],
            trees=res["trees"],
            candidates_evaluated=res["candidates_evaluated"],
            total_candidates_generated=res["total_candidates_generated"],
            search_limits=res["search_limits"],
            duration_seconds=res["duration_seconds"],
            limits_reached=res["limits_reached"],
            message=res["message"]
        )
