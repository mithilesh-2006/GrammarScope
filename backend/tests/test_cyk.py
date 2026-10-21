import pytest
from app.core.grammar import parse_grammar_text
from app.core.cyk_parser import CYKParser
from app.core.grammar_conversion import convert_to_cnf

def test_cnf_conversion_and_cyk():
    text = """
    S -> A B | B C
    A -> B A | a
    B -> C C | b
    C -> A B | a
    """
    grammar = parse_grammar_text(text)
    cnf, _ = convert_to_cnf(grammar)
    
    # Check that CNF rules are binary or single terminal
    for p in cnf.productions:
        assert len(p.rhs) in (1, 2) or p.is_epsilon

    parser = CYKParser(grammar)
    res = parser.parse(["b", "a", "a", "b", "a"])
    assert "accepted" in res
    assert "table" in res
    assert len(res["table"]) == 5
