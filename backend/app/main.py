from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging

from app.api.grammar_routes import router as grammar_router
from app.api.parser_routes import router as parser_router
from app.api.ambiguity_routes import router as ambiguity_router
from app.utils.errors import GrammarScopeError

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("grammarscope")

app = FastAPI(
    title="GrammarScope API",
    description="Interactive Syntax Tree Generator and Grammar Ambiguity Analyzer API",
    version="1.0.0"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(GrammarScopeError)
async def grammar_scope_error_handler(request: Request, exc: GrammarScopeError):
    return JSONResponse(
        status_code=400,
        content={"detail": str(exc), "error_type": exc.__class__.__name__}
    )

@app.exception_handler(Exception)
async def general_error_handler(request: Request, exc: Exception):
    logger.exception("Unhandled error occurred:")
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred.", "error_type": "InternalServerError"}
    )

@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "app": "GrammarScope",
        "version": "1.0.0"
    }

app.include_router(grammar_router, prefix="/api")
app.include_router(parser_router, prefix="/api")
app.include_router(ambiguity_router, prefix="/api")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
