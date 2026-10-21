from typing import Dict, Any, Optional
from app.core.validation import validate_grammar
from app.core.first_follow import get_first_follow_report
from app.core.grammar import parse_grammar_text
from app.schemas.grammar_schemas import (
    GrammarValidateResponse,
    ProductionModel,
    DiagnosticModel,
    FirstFollowResponse
)

class GrammarService:
    @staticmethod
    def validate(text: str, custom_start: Optional[str] = None) -> GrammarValidateResponse:
        report = validate_grammar(text, custom_start=custom_start)
        
        prods = []
        if report.grammar:
            for p in report.grammar.productions:
                prods.append(ProductionModel(
                    id=p.id,
                    lhs=p.lhs,
                    rhs=list(p.rhs),
                    production_str=str(p)
                ))

        diagnostics = [
            DiagnosticModel(
                level=d.level,
                message=d.message,
                line=d.line,
                column=d.column,
                symbol=d.symbol
            ) for d in report.diagnostics
        ]

        return GrammarValidateResponse(
            is_valid=report.is_valid,
            start_symbol=report.start_symbol,
            nonterminals=report.nonterminals,
            terminals=report.terminals,
            productions=prods,
            diagnostics=diagnostics,
            nullable_symbols=report.nullable_symbols,
            reachable_symbols=report.reachable_symbols,
            unreachable_symbols=report.unreachable_symbols,
            productive_symbols=report.productive_symbols,
            nonproductive_symbols=report.nonproductive_symbols
        )

    @staticmethod
    def get_first_follow(text: str, custom_start: Optional[str] = None) -> FirstFollowResponse:
        grammar = parse_grammar_text(text, custom_start=custom_start)
        report = get_first_follow_report(grammar)
        return FirstFollowResponse(
            start_symbol=report["start_symbol"],
            first_sets=report["first_sets"],
            follow_sets=report["follow_sets"]
        )
