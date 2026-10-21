from fastapi import APIRouter, HTTPException
from app.schemas.grammar_schemas import (
    GrammarValidateRequest,
    GrammarValidateResponse,
    FirstFollowResponse
)
from app.services.grammar_service import GrammarService
from app.utils.errors import GrammarScopeError

router = APIRouter(prefix="/grammar", tags=["grammar"])

@router.post("/validate", response_model=GrammarValidateResponse)
def validate_grammar_endpoint(payload: GrammarValidateRequest):
    return GrammarService.validate(
        text=payload.grammar,
        custom_start=payload.start_symbol
    )

@router.post("/first-follow", response_model=FirstFollowResponse)
def first_follow_endpoint(payload: GrammarValidateRequest):
    try:
        return GrammarService.get_first_follow(
            text=payload.grammar,
            custom_start=payload.start_symbol
        )
    except GrammarScopeError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to compute FIRST/FOLLOW: {str(e)}")
