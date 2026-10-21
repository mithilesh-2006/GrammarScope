from fastapi import APIRouter, HTTPException
from app.schemas.ambiguity_schemas import (
    StringAmbiguityRequest,
    StringAmbiguityResponse,
    GrammarAmbiguityRequest,
    GrammarAmbiguityResponse
)
from app.services.ambiguity_service import AmbiguityService
from app.utils.errors import GrammarScopeError

router = APIRouter(prefix="/ambiguity", tags=["ambiguity"])

@router.post("/string", response_model=StringAmbiguityResponse)
def string_ambiguity_endpoint(payload: StringAmbiguityRequest):
    try:
        return AmbiguityService.analyze_string(
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
        raise HTTPException(status_code=500, detail=f"String ambiguity analysis error: {str(e)}")

@router.post("/grammar", response_model=GrammarAmbiguityResponse)
def grammar_ambiguity_endpoint(payload: GrammarAmbiguityRequest):
    try:
        return AmbiguityService.search_grammar(
            grammar_text=payload.grammar,
            start_symbol=payload.start_symbol,
            max_tokens=payload.max_tokens,
            max_candidates=payload.max_candidates,
            timeout_seconds=payload.timeout_seconds
        )
    except GrammarScopeError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Grammar ambiguity search error: {str(e)}")
