import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  FileText,
  Files,
  Info,
  Search,
  Send,
  Sparkles,
} from "lucide-react";

import DocumentUpload from "./components/DocumentUpload";
import MessageBubble from "./components/MessageBubble";
import { askQuestion, uploadDocument } from "./services/api";
import "./App.css";

function App() {
  const [isDarkMode, setIsDarkMode] = useState(
    () => window.localStorage.getItem("rag-theme") === "dark"
  );
  const [aboutOpen, setAboutOpen] = useState(false);
  const [currentUpload, setCurrentUpload] = useState(null);
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState("");
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const messagesEndRef = useRef(null);

  useEffect(() => {
    window.localStorage.setItem("rag-theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

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

      setCurrentUpload({
        ...result,
        filename: result.filename || file.name,
      });
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
    <div className={`app-shell ${isDarkMode ? "theme-dark" : "theme-light"}`}>
      <aside className="sidebar">
        <div className="brand">
          <h1>RagApplication</h1>
        </div>

        <div className="sidebar-section">
          <div className="section-heading">
            <span>Your document</span>
          </div>

          <DocumentUpload
            onUpload={handleUpload}
            uploading={uploading}
          />

          <div className="section-heading current-upload-heading">
            <span>Current upload</span>
          </div>

          <div className="current-upload-panel">
            {currentUpload ? (
              <div
                className="document-item"
                title={currentUpload.filename}
              >
                <div className="document-icon">
                  <FileText size={17} />
                </div>

                <div className="document-details">
                  <span className="document-name">
                    {currentUpload.filename}
                  </span>
                  <span className="document-meta">
                    {currentUpload.chunks_created} chunks indexed
                  </span>
                </div>
              </div>
            ) : (
              <div className="empty-documents">
                <p>No upload yet</p>
              </div>
            )}
          </div>
        </div>

        <div className="sidebar-footer">
          <button
            className="sidebar-tool"
            type="button"
            onClick={() => setIsDarkMode((current) => !current)}
            aria-label="Toggle dark mode"
            aria-pressed={isDarkMode}
          >
            <span className="theme-toggle-track" aria-hidden="true">
              <span className="theme-toggle-knob" />
            </span>
            <span>Dark mode</span>
          </button>
          <button
            className="sidebar-tool"
            type="button"
            onClick={() => setAboutOpen(true)}
          >
            <Info size={17} />
            <span>About this website</span>
          </button>
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
                  <span>Searching your document and generating an answer...</span>
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
                placeholder="Ask a question about your document..."
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

          </div>
        </section>
      </main>

      {aboutOpen && (
        <div className="about-backdrop">
          <section
            className="about-dialog"
            role="region"
            aria-labelledby="about-title"
          >
            <div className="about-dialog-header">
              <button
                className="about-back"
                type="button"
                onClick={() => setAboutOpen(false)}
              >
                <ArrowLeft size={17} />
                <span>Back</span>
              </button>
              <div>
                <h2 id="about-title">How this app works</h2>
                <p>From your file to a source-backed answer.</p>
              </div>
            </div>

            <div
              className="rag-flow"
              aria-label="File to chunks to Qdrant search to Gemini answer"
            >
              <div className="rag-flow-step">
                <FileText size={18} />
                <span>Your file</span>
              </div>
              <ArrowRight className="rag-flow-arrow" size={16} aria-hidden="true" />
              <div className="rag-flow-step">
                <Files size={18} />
                <span>Text chunks</span>
              </div>
              <ArrowRight className="rag-flow-arrow" size={16} aria-hidden="true" />
              <div className="rag-flow-step">
                <Search size={18} />
                <span>Qdrant search</span>
              </div>
              <ArrowRight className="rag-flow-arrow" size={16} aria-hidden="true" />
              <div className="rag-flow-step">
                <Sparkles size={18} />
                <span>Gemini answer</span>
              </div>
            </div>

            <ol className="about-explanation">
              <li>Upload one PDF or TXT file.</li>
              <li>The app extracts its text and splits it into chunks.</li>
              <li>Those chunks are indexed in Qdrant.</li>
              <li>Your question retrieves the most relevant chunks.</li>
              <li>Gemini uses those passages to write an answer.</li>
              <li>The answer includes the retrieved source references.</li>
            </ol>
          </section>
        </div>
      )}
    </div>
  );
}

export default App;
