import pytest
from app.core.grammar import parse_grammar_text
from app.core.ambiguity import analyze_string_ambiguity, search_grammar_ambiguity

def test_ambiguous_grammar_and_string():
    text = """
    E -> E + E | E * E | id
    """
    grammar = parse_grammar_text(text)
    tokens = ["id", "+", "id", "*", "id"]
    res = analyze_string_ambiguity(grammar, tokens)
    
    assert res["status"] == "ambiguous"
    assert res["distinct_parse_count_found"] >= 2
    assert len(res["trees"]) >= 2
    # Check that trees are distinct
    tree1 = res["trees"][0]
    tree2 = res["trees"][1]
    assert tree1 != tree2

def test_unambiguous_grammar_precedence():
    text = """
    E -> E + T | T
    T -> T * F | F
    F -> ( E ) | id
    """
    grammar = parse_grammar_text(text)
    tokens = ["id", "+", "id", "*", "id"]
    res = analyze_string_ambiguity(grammar, tokens)

    assert res["status"] == "unique_parse"
    assert res["distinct_parse_count_found"] == 1
    assert res["complete"] is True
    assert len(res["trees"]) == 1

def test_no_parse_string():
    text = """
    E -> id + id
    """
    grammar = parse_grammar_text(text)
    tokens = ["id", "*", "id"]
    res = analyze_string_ambiguity(grammar, tokens)
    assert res["status"] == "no_parse"

def test_bounded_grammar_search_witness():
    text = """
    S -> S + S | a
    """
    grammar = parse_grammar_text(text)
    search_res = search_grammar_ambiguity(grammar, max_tokens=6, max_candidates=50)
    assert search_res["status"] == "ambiguous"
    assert search_res["witness_string"] is not None
    assert len(search_res["trees"]) >= 2

def test_bounded_grammar_search_no_witness():
    text = """
    S -> a S b | ε
    """
    grammar = parse_grammar_text(text)
    search_res = search_grammar_ambiguity(grammar, max_tokens=6, max_candidates=50)
    # Must report no_witness_within_limits, NEVER claim unambiguous
    assert search_res["status"] == "no_witness_within_limits"
    assert "not prove" in search_res["message"].lower() or "does not prove" in search_res["message"].lower()
