from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class DiagnosticModel(BaseModel):
    level: str
    message: str
    line: Optional[int] = None
    column: Optional[int] = None
    symbol: Optional[str] = None

class ProductionModel(BaseModel):
    id: int
    lhs: str
    rhs: List[str]
    production_str: str

class GrammarValidateRequest(BaseModel):
    grammar: str = Field(..., max_length=20000, description="The grammar text")
    start_symbol: Optional[str] = Field(None, max_length=50, description="Optional custom start symbol")

class GrammarValidateResponse(BaseModel):
    is_valid: bool
    start_symbol: Optional[str] = None
    nonterminals: List[str] = Field(default_factory=list)
    terminals: List[str] = Field(default_factory=list)
    productions: List[ProductionModel] = Field(default_factory=list)
    diagnostics: List[DiagnosticModel] = Field(default_factory=list)
    nullable_symbols: List[str] = Field(default_factory=list)
    reachable_symbols: List[str] = Field(default_factory=list)
    unreachable_symbols: List[str] = Field(default_factory=list)
    productive_symbols: List[str] = Field(default_factory=list)
    nonproductive_symbols: List[str] = Field(default_factory=list)

class FirstFollowResponse(BaseModel):
    start_symbol: str
    first_sets: Dict[str, List[str]]
    follow_sets: Dict[str, List[str]]
