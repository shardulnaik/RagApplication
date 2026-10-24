from pathlib import Path

from llama_index.core import StorageContext, VectorStoreIndex
from llama_index.core.node_parser import SentenceSplitter
from llama_index.core.vector_stores import MetadataFilter, MetadataFilters
from llama_index.embeddings.google_genai import GoogleGenAIEmbedding
from llama_index.vector_stores.qdrant import QdrantVectorStore
from qdrant_client import QdrantClient, models

from app.config import (
    GEMINI_API_KEY,
    GEMINI_EMBEDDING_MODEL,
    QDRANT_API_KEY,
    QDRANT_COLLECTION,
    QDRANT_PATH,
    QDRANT_URL,
)


_qdrant_client = None


def get_embedding_model():
    if not GEMINI_API_KEY:
        raise ValueError(
            "GEMINI_API_KEY is missing from the root .env file."
        )

    return GoogleGenAIEmbedding(
        model_name=GEMINI_EMBEDDING_MODEL,
        api_key=GEMINI_API_KEY,
    )


def get_qdrant_client():
    global _qdrant_client

    if _qdrant_client is None:
        if QDRANT_URL:
            if not QDRANT_API_KEY:
                raise ValueError(
                    "QDRANT_API_KEY is required when QDRANT_URL is set."
                )

            # Connect to the persistent Qdrant Cloud cluster.
            _qdrant_client = QdrantClient(
                url=QDRANT_URL,
                api_key=QDRANT_API_KEY,
                timeout=30,
            )

        else:
            # Fall back to local persistent storage for development.
            Path(QDRANT_PATH).mkdir(
                parents=True,
                exist_ok=True,
            )

            _qdrant_client = QdrantClient(
                path=str(QDRANT_PATH)
            )

    return _qdrant_client


def get_vector_store():
    return QdrantVectorStore(
        client=get_qdrant_client(),
        collection_name=QDRANT_COLLECTION,
    )


def index_documents(documents):
    if not documents:
        raise ValueError(
            "No readable document content was found."
        )

    embedding_model = get_embedding_model()
    vector_store = get_vector_store()

    splitter = SentenceSplitter(
        chunk_size=800,
        chunk_overlap=120,
    )

    nodes = splitter.get_nodes_from_documents(documents)

    if not nodes:
        raise ValueError(
            "Document processing produced no chunks."
        )

    storage_context = StorageContext.from_defaults(
        vector_store=vector_store
    )

    active_document_id = documents[0].metadata["active_document_id"]
    client = get_qdrant_client()

    try:
        VectorStoreIndex(
            nodes=nodes,
            storage_context=storage_context,
            embed_model=embedding_model,
            show_progress=False,
        )
    except Exception:
        if client.collection_exists(QDRANT_COLLECTION):
            client.delete(
                collection_name=QDRANT_COLLECTION,
                points_selector=models.FilterSelector(
                    filter=models.Filter(
                        must=[
                            models.FieldCondition(
                                key="active_document_id",
                                match=models.MatchValue(
                                    value=active_document_id
                                ),
                            )
                        ]
                    )
                ),
                wait=True,
            )
        raise

    try:
        client.delete(
            collection_name=QDRANT_COLLECTION,
            points_selector=models.FilterSelector(
                filter=models.Filter(
                    must_not=[
                        models.FieldCondition(
                            key="active_document_id",
                            match=models.MatchValue(
                                value=active_document_id
                            ),
                        )
                    ]
                )
            ),
            wait=True,
        )
    except Exception:
        client.delete(
            collection_name=QDRANT_COLLECTION,
            points_selector=models.FilterSelector(
                filter=models.Filter(
                    must=[
                        models.FieldCondition(
                            key="active_document_id",
                            match=models.MatchValue(
                                value=active_document_id
                            ),
                        )
                    ]
                )
            ),
            wait=True,
        )
        raise

    return len(nodes)


def retrieve_chunks(question: str, top_k: int = 5):
    if not question.strip():
        raise ValueError("Question cannot be empty.")

    client = get_qdrant_client()

    if not client.collection_exists(QDRANT_COLLECTION):
        raise ValueError(
            "No documents have been indexed yet. "
            "Upload a document first."
        )

    index = VectorStoreIndex.from_vector_store(
        vector_store=get_vector_store(),
        embed_model=get_embedding_model(),
    )

    retriever = index.as_retriever(
        similarity_top_k=top_k,
        filters=MetadataFilters(
            filters=[
                MetadataFilter(
                    key="active_document",
                    value="true",
                )
            ]
        ),
    )

    results = retriever.retrieve(question)

    chunks = []

    for position, result in enumerate(results, start=1):
        text = result.node.get_content()
        metadata = result.node.metadata or {}

        filename = (
            metadata.get("filename")
            or metadata.get("file_name")
            or metadata.get("source")
            or "Unknown document"
        )

        page = (
            metadata.get("page_label")
            or metadata.get("page_number")
            or metadata.get("page")
        )

        score = (
            round(float(result.score), 4)
            if result.score is not None
            else None
        )

        chunks.append(
            {
                "source_id": f"S{position}",
                "filename": str(filename),
                "page": str(page) if page is not None else None,
                "snippet": text[:500],
                "text": text,
                "score": score,
            }
        )

    return chunks