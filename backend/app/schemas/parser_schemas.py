from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Union

class ParseRequest(BaseModel):
    grammar: str = Field(..., max_length=20000)
    input_string: Optional[str] = Field(None, max_length=5000)
    input_tokens: Optional[List[str]] = Field(None)
    start_symbol: Optional[str] = Field(None, max_length=50)
    token_mode: str = Field("auto", description="auto, whitespace, compact, or explicit")
    max_trees: int = Field(10, ge=1, le=50)

class ParseTreeNodeModel(BaseModel):
    symbol: str
    kind: str
    production_id: Optional[int] = None
    production: Optional[str] = None
    span: Optional[List[int]] = None
    children: List[Any] = Field(default_factory=list)

class ParseResponse(BaseModel):
    accepted: bool
    tokens: List[str]
    distinct_parse_count: int
    trees: List[Dict[str, Any]]
    complete: bool
    duration_seconds: float
    message: str
    limits_reached: List[str] = Field(default_factory=list)

class CYKRequest(BaseModel):
    grammar: str = Field(..., max_length=20000)
    input_string: Optional[str] = Field(None, max_length=5000)
    input_tokens: Optional[List[str]] = Field(None)
    token_mode: str = Field("auto")

class CYKCellModel(BaseModel):
    length: int
    start: int
    span_text: str
    nonterminals: List[str]

class CYKRowModel(BaseModel):
    length: int
    cells: List[CYKCellModel]

class CYKResponse(BaseModel):
    accepted: bool
    tokens: List[str]
    cnf_start_symbol: str
    cnf_productions: List[str]
    table: List[CYKRowModel]
    duration_seconds: float
