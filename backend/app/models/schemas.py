from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    question: str = Field(
        ...,
        min_length=1,
        max_length=4000,
        description="The question to ask about uploaded documents.",
    )


class SourceReference(BaseModel):
    source_id: str
    filename: str
    page: str | None = None
    snippet: str
    score: float | None = None


class ChatResponse(BaseModel):
    answer: str
    sources: list[SourceReference]
    retrieved_chunks: int