from fastapi import APIRouter, HTTPException
from app.schemas.parser_schemas import (
    ParseRequest,
    ParseResponse,
    CYKRequest,
    CYKResponse
)
from app.services.parser_service import ParserService
from app.utils.errors import GrammarScopeError

router = APIRouter(prefix="/parser", tags=["parser"])

@router.post("/parse", response_model=ParseResponse)
def parse_endpoint(payload: ParseRequest):
    try:
        return ParserService.parse(
            grammar_text=payload.grammar,
            input_string=payload.input_string,
            input_tokens=payload.input_tokens,
            start_symbol=payload.start_symbol,
            token_mode=payload.token_mode,
            max_trees=payload.max_trees
        )
    except GrammarScopeError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Parsing error: {str(e)}")

@router.post("/cyk", response_model=CYKResponse)
def cyk_endpoint(payload: CYKRequest):
    try:
        return ParserService.run_cyk(
            grammar_text=payload.grammar,
            input_string=payload.input_string,
            input_tokens=payload.input_tokens,
            token_mode=payload.token_mode
        )
    except GrammarScopeError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"CYK parsing error: {str(e)}")
