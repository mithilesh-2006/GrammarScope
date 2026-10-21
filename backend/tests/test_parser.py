import pytest
from app.core.grammar import parse_grammar_text
from app.core.earley_parser import EarleyParser

def test_parser_basic_expression():
    text = """
    E -> E + T | T
    T -> T * F | F
    F -> ( E ) | id
    """
    grammar = parse_grammar_text(text)
    parser = EarleyParser(grammar)
    
    # Valid string
    tokens = ["id", "+", "id", "*", "id"]
    accepted, forest, stats = parser.parse(tokens)
    assert accepted is True
    trees, complete = forest.extract_trees()
    assert len(trees) == 1
    assert complete is True

    # Invalid string
    tokens_invalid = ["id", "+", "*"]
    accepted_inv, _, _ = parser.parse(tokens_invalid)
    assert accepted_inv is False

def test_parser_left_recursion():
    text = """
    S -> S a | a
    """
    grammar = parse_grammar_text(text)
    parser = EarleyParser(grammar)
    tokens = ["a", "a", "a"]
    accepted, forest, stats = parser.parse(tokens)
    assert accepted is True
    trees, _ = forest.extract_trees()
    assert len(trees) == 1

def test_parser_nested_parentheses():
    text = """
    S -> ( S ) | a
    """
    grammar = parse_grammar_text(text)
    parser = EarleyParser(grammar)
    tokens = ["(", "(", "a", ")", ")"]
    accepted, forest, _ = parser.parse(tokens)
    assert accepted is True
    trees, _ = forest.extract_trees()
    assert len(trees) == 1

def test_parser_epsilon():
    text = """
    S -> A B
    A -> a | ε
    B -> b
    """
    grammar = parse_grammar_text(text)
    parser = EarleyParser(grammar)
    tokens = ["b"]
    accepted, forest, _ = parser.parse(tokens)
    assert accepted is True
    trees, _ = forest.extract_trees()
    assert len(trees) == 1
