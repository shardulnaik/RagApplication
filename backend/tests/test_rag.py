from fastapi.testclient import TestClient

from app.main import app
from app.api import chat as chat_api
from app.api import documents as documents_api


client = TestClient(app)


def test_chat_returns_grounded_answer(monkeypatch):
    def fake_answer_question(*, question):
        return {
            "answer": "Employees receive 25 days of annual leave. [S1]",
            "sources": [
                {
                    "source_id": "S1",
                    "filename": "employee_handbook.pdf",
                    "page": "18",
                    "snippet": "Employees receive 25 days of annual leave.",
                    "score": 0.92,
                }
            ],
            "retrieved_chunks": 1,
        }

    monkeypatch.setattr(
        chat_api,
        "answer_question",
        fake_answer_question,
    )

    response = client.post(
        "/api/chat",
        json={"question": "What is the annual leave policy?"},
    )

    assert response.status_code == 200

    data = response.json()

    assert "25 days" in data["answer"]
    assert data["retrieved_chunks"] == 1
    assert data["sources"][0]["filename"] == "employee_handbook.pdf"
    assert data["sources"][0]["source_id"] == "S1"


def test_chat_rejects_blank_question():
    response = client.post(
        "/api/chat",
        json={"question": "   "},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Question cannot be empty."


def test_upload_document_success(monkeypatch):
    def fake_ingest_document(*, filename, file_bytes):
        return {
            "document_id": "test-document-123",
            "filename": filename,
            "chunks_created": 3,
        }

    monkeypatch.setattr(
        documents_api,
        "ingest_document",
        fake_ingest_document,
    )

    response = client.post(
        "/api/documents/upload",
        files={
            "file": (
                "sample.txt",
                b"This is a test document for KnowledgeRAG.",
                "text/plain",
            )
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["filename"] == "sample.txt"
    assert data["chunks_created"] == 3
    assert data["document_id"] == "test-document-123"


def test_upload_rejects_unsupported_file():
    response = client.post(
        "/api/documents/upload",
        files={
            "file": (
                "sample.exe",
                b"unsupported content",
                "application/octet-stream",
            )
        },
    )

    assert response.status_code == 400
    assert "Only PDF, DOCX, and TXT" in response.json()["detail"]