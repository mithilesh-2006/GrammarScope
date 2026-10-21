import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_grammar_validate_api():
    payload = {
        "grammar": "E -> E + E | id",
        "start_symbol": "E"
    }
    response = client.post("/api/grammar/validate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["is_valid"] is True
    assert "E" in data["nonterminals"]
    assert "id" in data["terminals"]
    assert len(data["productions"]) == 2

def test_grammar_validate_invalid():
    payload = {
        "grammar": "E E + E"
    }
    response = client.post("/api/grammar/validate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["is_valid"] is False
    assert len(data["diagnostics"]) > 0

def test_parser_parse_api():
    payload = {
        "grammar": "E -> E + E | id",
        "input_string": "id + id + id",
        "max_trees": 5
    }
    response = client.post("/api/parser/parse", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["accepted"] is True
    assert data["distinct_parse_count"] >= 2
    assert len(data["trees"]) >= 2

def test_string_ambiguity_api():
    payload = {
        "grammar": "E -> E + E | id",
        "input_string": "id + id + id"
    }
    response = client.post("/api/ambiguity/string", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ambiguous"
    assert data["distinct_parse_count_found"] >= 2

def test_grammar_ambiguity_api():
    payload = {
        "grammar": "S -> S + S | a",
        "max_tokens": 5,
        "max_candidates": 50
    }
    response = client.post("/api/ambiguity/grammar", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ambiguous"
    assert data["witness_string"] is not None

def test_first_follow_api():
    payload = {
        "grammar": "E -> id"
    }
    response = client.post("/api/grammar/first-follow", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "E" in data["first_sets"]
    assert "id" in data["first_sets"]["E"]

def test_cyk_api():
    payload = {
        "grammar": "S -> A B\nA -> a\nB -> b",
        "input_string": "a b"
    }
    response = client.post("/api/parser/cyk", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["accepted"] is True
    assert len(data["table"]) == 2
