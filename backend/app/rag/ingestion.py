import tempfile
import uuid
from pathlib import Path

from llama_index.core import SimpleDirectoryReader

from app.config import QDRANT_COLLECTION
from app.rag.retrieval import get_qdrant_client, index_documents


def ingest_document(filename: str, file_bytes: bytes):
    if not file_bytes:
        raise ValueError("The uploaded document is empty.")

    extension = Path(filename).suffix.lower()

    if extension not in {".pdf", ".docx", ".txt"}:
        raise ValueError(
            "Only PDF, DOCX, and TXT files are supported."
        )

    document_id = uuid.uuid4().hex
    temporary_path = None

    try:
        with tempfile.NamedTemporaryFile(
            suffix=extension,
            delete=False,
        ) as temporary_file:
            temporary_file.write(file_bytes)
            temporary_path = Path(temporary_file.name)

        documents = SimpleDirectoryReader(
            input_files=[str(temporary_path)]
        ).load_data()

    except Exception as exc:
        raise ValueError(
            f"Could not read the uploaded document: {exc}"
        ) from exc

    finally:
        if temporary_path is not None:
            temporary_path.unlink(missing_ok=True)

    documents = [
        document
        for document in documents
        if document.text and document.text.strip()
    ]

    if not documents:
        raise ValueError(
            "No readable text was found in the document."
        )

    for document in documents:
        document.metadata.update(
            {
                "document_id": document_id,
                "filename": filename,
                "file_name": filename,
                "source": filename,
                "file_type": extension.lstrip("."),
            }
        )

    # Remove previous document vectors from the active collection.
    # This application supports one active document at a time.
    client = get_qdrant_client()

    if client.collection_exists(QDRANT_COLLECTION):
        client.delete_collection(
            collection_name=QDRANT_COLLECTION
        )

    # Index only the newly uploaded document.
    chunks_created = index_documents(documents)

    return {
        "document_id": document_id,
        "filename": filename,
        "chunks_created": chunks_created,
    }