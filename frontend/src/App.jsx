import { useEffect, useRef, useState } from "react";
import { FileText, Send } from "lucide-react";

import DocumentUpload from "./components/DocumentUpload";
import MessageBubble from "./components/MessageBubble";
import { askQuestion, uploadDocument } from "./services/api";
import "./App.css";

function App() {
  const [documents, setDocuments] = useState([]);
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState("");
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, sending]);

  async function handleUpload(file) {
    setUploading(true);
    setNotice("");
    setError("");

    try {
      const result = await uploadDocument(file);

      setDocuments([
        {
          ...result,
          filename: result.filename || file.name,
        },
      ]);
      setMessages([]);
      setQuestion("");

      setNotice(
        `${result.filename || file.name} indexed successfully. ${result.chunks_created
        } chunks created.`
      );
    } catch (err) {
      setError(err.message || "Document upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const submittedQuestion = question.trim();

    if (!submittedQuestion || sending) {
      return;
    }

    setError("");
    setNotice("");
    setQuestion("");

    setMessages((previous) => [
      ...previous,
      {
        role: "user",
        content: submittedQuestion,
        sources: [],
      },
    ]);

    setSending(true);

    try {
      const response = await askQuestion(submittedQuestion);

      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content: response.answer,
          sources: response.sources || [],
          retrievedChunks: response.retrieved_chunks ?? 0,
        },
      ]);
    } catch (err) {
      setError(err.message || "Unable to generate an answer.");
    } finally {
      setSending(false);
    }
  }

  function removeNotice() {
    setNotice("");
    setError("");
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <h1>RagApplication</h1>
        </div>

        <div className="sidebar-section">
          <div className="section-heading">
            <span>Your documents</span>
          </div>

          <DocumentUpload
            onUpload={handleUpload}
            uploading={uploading}
          />

          <div className="document-list">
            {documents.length === 0 ? (
              <div className="empty-documents">
                <FileText size={22} />
                <p>No documents yet</p>
                <span>Upload a file to get started.</span>
              </div>
            ) : (
              documents.map((document, index) => (
                <div
                  className="document-item"
                  key={`${document.document_id}-${index}`}
                  title={document.filename}
                >
                  <div className="document-icon">
                    <FileText size={17} />
                  </div>

                  <div className="document-details">
                    <span className="document-name">
                      {document.filename}
                    </span>
                    <span className="document-meta">
                      {document.chunks_created} chunks indexed
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="sidebar-footer">
          <div className="status-indicator" />
          <div>
            <strong>Local workspace</strong>
            <span>Gemini · Qdrant</span>
          </div>
        </div>
      </aside>

      <main className="main-workspace">
        <section className="chat-workspace">
          {(notice || error) && (
            <div className={error ? "notice notice-error" : "notice"}>
              <span>{error || notice}</span>
              <button
                type="button"
                onClick={removeNotice}
                aria-label="Dismiss notification"
              >
                ×
              </button>
            </div>
          )}

          <div className="conversation">
            <div className="message-list">
              {messages.map((message, index) => (
                <MessageBubble
                  key={`${message.role}-${index}`}
                  message={message}
                />
              ))}

              {sending && (
                <div className="typing-indicator">
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                  <span>Searching documents and generating an answer...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          <div className="composer-area">
            <form className="composer" onSubmit={handleSubmit}>
              <textarea
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter" &&
                    !event.shiftKey &&
                    !event.nativeEvent.isComposing
                  ) {
                    event.preventDefault();
                    event.currentTarget.form?.requestSubmit();
                  }
                }}
                placeholder="Ask a question about your documents..."
                rows={2}
                maxLength={4000}
                disabled={sending}
                aria-label="Your question"
              />

              <div className="composer-bottom">
                <button
                  type="submit"
                  className="send-button"
                  disabled={!question.trim() || sending}
                  aria-label="Send question"
                >
                  <Send size={17} />
                  <span>Ask</span>
                </button>
              </div>
            </form>

            <p className="disclaimer">
              Answers are based on passages retrieved from your uploaded
              document. Check the cited sources for details.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
