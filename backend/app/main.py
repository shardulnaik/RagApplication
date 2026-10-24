from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import APP_NAME, APP_VERSION, FRONTEND_ORIGINS
from app.api.chat import router as chat_router
from app.api.documents import router as documents_router


app = FastAPI(
    title=APP_NAME,
    version=APP_VERSION,
    description="A document-based Retrieval-Augmented Generation application.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(documents_router)
app.include_router(chat_router)


@app.get("/", tags=["System"])
def root():
    return {
        "message": "Welcome to KnowledgeRAG API",
        "status": "running",
        "version": APP_VERSION,
    }


@app.get("/api/health", tags=["System"])
def health_check():
    return {
        "status": "healthy",
        "service": "knowledge-rag-backend",
    }