import pytest
from app.core.grammar import parse_grammar_text
from app.core.first_follow import compute_first_sets, compute_follow_sets

def test_first_and_follow_expression():
    text = """
    E -> T E'
    E' -> + T E' | ε
    T -> F T'
    T' -> * F T' | ε
    F -> ( E ) | id
    """
    grammar = parse_grammar_text(text)
    first = compute_first_sets(grammar)
    follow = compute_follow_sets(grammar, first)

    assert "id" in first["F"]
    assert "(" in first["F"]
    assert "+" in first["E'"]
    assert "ε" in first["E'"]

    # FOLLOW(E) should contain $ and )
    assert "$" in follow["E"]
    assert ")" in follow["E"]
