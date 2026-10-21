from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class StringAmbiguityRequest(BaseModel):
    grammar: str = Field(..., max_length=20000)
    input_string: Optional[str] = Field(None, max_length=5000)
    input_tokens: Optional[List[str]] = Field(None)
    start_symbol: Optional[str] = Field(None, max_length=50)
    token_mode: str = Field("auto")
    max_trees: int = Field(10, ge=2, le=50)

class StringAmbiguityResponse(BaseModel):
    status: str  # ambiguous, unique_parse, no_parse, inconclusive
    scope: str = "string"
    input_tokens: List[str]
    distinct_parse_count_found: int
    trees: List[Dict[str, Any]]
    complete: bool
    limits_reached: List[str] = Field(default_factory=list)
    message: str

class GrammarAmbiguityRequest(BaseModel):
    grammar: str = Field(..., max_length=20000)
    start_symbol: Optional[str] = Field(None, max_length=50)
    max_tokens: int = Field(8, ge=1, le=15)
    max_candidates: int = Field(200, ge=1, le=1000)
    timeout_seconds: float = Field(4.0, ge=0.5, le=15.0)

class GrammarAmbiguityResponse(BaseModel):
    status: str  # ambiguous, no_witness_within_limits, inconclusive
    scope: str = "grammar"
    witness_string: Optional[List[str]] = None
    witness_string_display: Optional[str] = None
    distinct_parse_count_found: int
    trees: List[Dict[str, Any]]
    candidates_evaluated: int
    total_candidates_generated: int
    search_limits: Dict[str, Any]
    duration_seconds: float
    limits_reached: List[str] = Field(default_factory=list)
    message: str
