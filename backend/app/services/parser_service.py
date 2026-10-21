from typing import Optional, List, Dict, Any, Union
from app.core.grammar import parse_grammar_text
from app.core.tokenizer import tokenize_input
from app.core.earley_parser import EarleyParser
from app.core.cyk_parser import CYKParser
from app.schemas.parser_schemas import (
    ParseResponse,
    CYKResponse,
    CYKRowModel,
    CYKCellModel
)

class ParserService:
    @staticmethod
    def parse(
        grammar_text: str,
        input_string: Optional[str],
        input_tokens: Optional[List[str]],
        start_symbol: Optional[str] = None,
        token_mode: str = "auto",
        max_trees: int = 10
    ) -> ParseResponse:
        grammar = parse_grammar_text(grammar_text, custom_start=start_symbol)
        
        # Tokenize
        raw = input_tokens if input_tokens is not None else (input_string if input_string is not None else "")
        tokens = tokenize_input(raw, grammar.terminals, mode=token_mode)

        parser = EarleyParser(grammar)
        accepted, forest, stats = parser.parse(tokens, start_symbol=grammar.start_symbol)

        trees_dict: List[Dict[str, Any]] = []
        complete = True
        limits_reached: List[str] = []

        if stats.get("timed_out", False):
            limits_reached.append("timeout")
            complete = False

        if accepted:
            trees, complete = forest.extract_trees(max_trees=max_trees)
            trees_dict = [t.to_dict() for t in trees]
            if len(trees_dict) >= max_trees:
                limits_reached.append("max_trees")

        message = (
            f"String accepted with {len(trees_dict)} parse tree(s) extracted."
            if accepted else
            "String cannot be derived by the grammar."
        )

        return ParseResponse(
            accepted=accepted,
            tokens=tokens,
            distinct_parse_count=len(trees_dict),
            trees=trees_dict,
            complete=complete,
            duration_seconds=stats.get("duration_seconds", 0.0),
            message=message,
            limits_reached=limits_reached
        )

    @staticmethod
    def run_cyk(
        grammar_text: str,
        input_string: Optional[str],
        input_tokens: Optional[List[str]],
        token_mode: str = "auto"
    ) -> CYKResponse:
        grammar = parse_grammar_text(grammar_text)
        raw = input_tokens if input_tokens is not None else (input_string if input_string is not None else "")
        tokens = tokenize_input(raw, grammar.terminals, mode=token_mode)

        parser = CYKParser(grammar)
        res = parser.parse(tokens)

        table_rows = [
            CYKRowModel(
                length=r["length"],
                cells=[
                    CYKCellModel(
                        length=c["length"],
                        start=c["start"],
                        span_text=c["span_text"],
                        nonterminals=c["nonterminals"]
                    ) for c in r["cells"]
                ]
            ) for r in res["table"]
        ]

        return CYKResponse(
            accepted=res["accepted"],
            tokens=res["tokens"],
            cnf_start_symbol=res["cnf_start_symbol"],
            cnf_productions=res["cnf_productions"],
            table=table_rows,
            duration_seconds=res["duration_seconds"]
        )
