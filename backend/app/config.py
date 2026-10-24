import os
from pathlib import Path

from dotenv import load_dotenv


# Project root: RagApplication/
PROJECT_ROOT = Path(__file__).resolve().parents[2]

# Load local environment variables.
# On deployment, platform environment variables take precedence.
load_dotenv(PROJECT_ROOT / ".env")


# Application settings
APP_NAME = "KnowledgeRAG API"
APP_VERSION = "1.0.0"


# Gemini configuration
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()

GEMINI_LLM_MODEL = (
    os.getenv("GEMINI_LLM_MODEL", "gemini-3.8-flash").strip()
    or "gemini-3.8-flash"
)

GEMINI_EMBEDDING_MODEL = (
    os.getenv("GEMINI_EMBEDDING_MODEL", "gemini-embedding-2").strip()
    or "gemini-embedding-2"
)


# Qdrant Cloud configuration
QDRANT_URL = os.getenv("QDRANT_URL", "").strip().rstrip("/")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY", "").strip()

QDRANT_COLLECTION = (
    os.getenv("QDRANT_COLLECTION", "knowledge_chunks").strip()
    or "knowledge_chunks"
)


# Local Qdrant fallback when QDRANT_URL is not configured
_raw_qdrant_path = (
    os.getenv("QDRANT_PATH", "qdrant_storage").strip()
    or "qdrant_storage"
)

QDRANT_PATH = Path(_raw_qdrant_path)

if not QDRANT_PATH.is_absolute():
    QDRANT_PATH = PROJECT_ROOT / QDRANT_PATH


# Frontend CORS configuration
FRONTEND_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "FRONTEND_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    ).split(",")
    if origin.strip()
]