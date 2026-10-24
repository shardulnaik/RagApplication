import { useEffect, useRef, useState } from "react";
import {
  BrainCircuit,
  FileText,
  MessageSquare,
  Send,
  Sparkles,
  Trash2,
} from "lucide-react";

import DocumentUpload from "./components/DocumentUpload";
import MessageBubble from "./components/MessageBubble";
import { askQuestion, uploadDocument } from "./services/api";
import "./App.css";

const welcomeMessage = {
  role: "assistant",
  content:
    "Welcome to KnowledgeRAG. Upload your documents and ask questions about their contents. I'll retrieve relevant passages and provide answers with source references.",
  sources: [],
};

const suggestedQuestions = [
  "Summarize the main points",
  "What are the key findings?",
  "Explain the most important concepts",
];

function App() {
  const [documents, setDocuments] = useState([]);
  const [messages, setMessages] = useState([welcomeMessage]);
  const [question, setQuestion] = useState("");
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const messagesEndRef = useRef(null);
  const chatGenerationRef = useRef(0);

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

      chatGenerationRef.current += 1;
      setDocuments([
        {
          ...result,
          filename: result.filename || file.name,
        },
      ]);
      setMessages([welcomeMessage]);
      setQuestion("");
      setSending(false);

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

    const chatGeneration = chatGenerationRef.current;
    setSending(true);

    try {
      const response = await askQuestion(submittedQuestion);

      if (chatGeneration !== chatGenerationRef.current) {
        return;
      }

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
      if (chatGeneration === chatGenerationRef.current) {
        setError(err.message || "Unable to generate an answer.");
      }
    } finally {
      if (chatGeneration === chatGenerationRef.current) {
        setSending(false);
      }
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
          <div className="brand-icon">
            <BrainCircuit size={25} />
          </div>

          <div>
            <h1>KnowledgeRAG</h1>
            <p>DOCUMENT INTELLIGENCE</p>
          </div>
        </div>

        <div className="sidebar-section">
          <div className="section-heading">
            <span>Your documents</span>
            <span className="document-count">{documents.length}</span>
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
        <header className="topbar">
          <div className="breadcrumb">
            <span>Workspace</span>
            <span className="breadcrumb-separator">/</span>
            <strong>Document assistant</strong>
          </div>

          <div className="model-badge">
            <span className="model-dot" />
            Gemini powered
          </div>
        </header>

        <section className="chat-workspace">
          <div className="chat-heading">
            <div className="heading-icon">
              <Sparkles size={21} />
            </div>

            <div>
              <h2>Ask your documents</h2>
              <p>
                Retrieve information, discover insights, and explore your
                files.
              </p>
            </div>
          </div>

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
            {messages.length === 1 && (
              <div className="welcome-intro">
                <div className="welcome-icon">
                  <MessageSquare size={25} />
                </div>

                <h3>Your documents, understood.</h3>

                <p>
                  Ask questions about your uploaded files. Answers will be
                  generated from retrieved document passages, with source
                  references where available.
                </p>

                <div className="suggested-questions">
                  {suggestedQuestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => setQuestion(suggestion)}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

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
                <span className="composer-hint">
                  <Sparkles size={13} />
                  Answers grounded in retrieved context
                </span>

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
              AI-generated answers can be inaccurate. Verify important
              information against the original documents.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;