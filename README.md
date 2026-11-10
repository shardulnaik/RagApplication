# RAGApplication

A document intelligence application built using Retrieval-Augmented Generation.

## Tech Stack

- React + Vite
- FastAPI
- LlamaIndex
- Google Gemini API
- Qdrant

## Features

- Upload PDF, DOCX, and TXT documents
- Extract and chunk document text
- Generate embeddings using Gemini
- Store and retrieve document chunks using Qdrant
- Ask questions about uploaded documents
- Generate answers grounded in retrieved context
- Display retrieved sources and metadata

## Project Structure

- `backend/` — FastAPI backend and RAG pipeline
- `frontend/` — React application
- `storage/` — Reserved for application storage
- `qdrant_storage/` — Local vector database storage

## Environment Configuration

Create a `.env` file in the project root and configure your Gemini API key.

Never commit your `.env` file or expose your API key.

## Running Locally

Start the backend from the project root:

```powershell
python -m uvicorn app.main:app --reload --app-dir backend
