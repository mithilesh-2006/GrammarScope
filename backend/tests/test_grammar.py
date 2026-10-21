import pytest
from app.core.grammar import parse_grammar_text, Production
from app.core.validation import validate_grammar
from app.core.tokenizer import tokenize_input
from app.utils.errors import GrammarSyntaxError, TokenizationError

def test_valid_grammar_parsing():
    text = """
    E -> E + T | T
    T -> T * F | F
    F -> ( E ) | id
    """
    grammar = parse_grammar_text(text)
    assert grammar.start_symbol == "E"
    assert "E" in grammar.nonterminals
    assert "T" in grammar.nonterminals
    assert "F" in grammar.nonterminals
    assert "+" in grammar.terminals
    assert "*" in grammar.terminals
    assert "id" in grammar.terminals
    assert len(grammar.productions) == 6

def test_custom_start_symbol():
    text = """
    S -> A
    A -> a
    """
    grammar = parse_grammar_text(text, custom_start="A")
    assert grammar.start_symbol == "A"

def test_invalid_syntax_missing_arrow():
    text = "E E + T"
    with pytest.raises(GrammarSyntaxError):
        parse_grammar_text(text)

def test_epsilon_parsing():
    text = """
    S -> A b
    A -> ε
    """
    grammar = parse_grammar_text(text)
    assert len(grammar.productions) == 2
    a_prod = [p for p in grammar.productions if p.lhs == "A"][0]
    assert a_prod.is_epsilon
    assert len(a_prod.rhs) == 0

def test_unreachable_and_nonproductive():
    text = """
    S -> a
    U -> b
    N -> N b
    """
    report = validate_grammar(text)
    assert report.is_valid
    assert "U" in report.unreachable_symbols
    assert "N" in report.unreachable_symbols
    assert "N" in report.nonproductive_symbols
    assert "S" in report.productive_symbols

def test_tokenizer_whitespace_and_compact():
    terminals = {"id", "+", "*", "(", ")"}
    tokens_ws = tokenize_input("id + id * id", terminals, mode="whitespace")
    assert tokens_ws == ["id", "+", "id", "*", "id"]

    tokens_compact = tokenize_input("id+id*id", terminals, mode="compact")
    assert tokens_compact == ["id", "+", "id", "*", "id"]

def test_tokenizer_invalid_compact():
    terminals = {"+", "*"}
    with pytest.raises(TokenizationError):
        tokenize_input("unknown_text", terminals, mode="compact")
