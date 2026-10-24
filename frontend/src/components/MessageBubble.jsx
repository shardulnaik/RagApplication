import { useState } from "react";
import ReactMarkdown from "react-markdown";
import {
    Bot,
    ChevronDown,
    ChevronUp,
    FileText,
    Layers,
    UserRound,
} from "lucide-react";

function MessageBubble({ message }) {
    const [showSources, setShowSources] = useState(false);

    const isUser = message.role === "user";
    const sources = Array.isArray(message.sources)
        ? message.sources
        : [];

    return (
        <article
            className={`message-row ${isUser ? "message-row-user" : "message-row-assistant"
                }`}
        >
            <div className={`message-avatar ${isUser ? "user-avatar" : "assistant-avatar"}`}>
                {isUser ? <UserRound size={17} /> : <Bot size={18} />}
            </div>

            <div className="message-content">
                <div className="message-author">
                    {isUser ? "You" : "KnowledgeRAG"}
                </div>

                <div className={`message-card ${isUser ? "user-message-card" : ""}`}>
                    <div className="message-markdown">
                        <ReactMarkdown>{message.content || ""}</ReactMarkdown>
                    </div>
                </div>

                {!isUser && sources.length > 0 && (
                    <div className="sources-section">
                        <button
                            type="button"
                            className="sources-toggle"
                            onClick={() => setShowSources((previous) => !previous)}
                            aria-expanded={showSources}
                        >
                            <Layers size={15} />

                            <span>
                                {sources.length} retrieved{" "}
                                {sources.length === 1 ? "source" : "sources"}
                            </span>

                            {Number.isInteger(message.retrievedChunks) && (
                                <span className="retrieved-count">
                                    {message.retrievedChunks} chunks
                                </span>
                            )}

                            {showSources ? (
                                <ChevronUp size={15} />
                            ) : (
                                <ChevronDown size={15} />
                            )}
                        </button>

                        {showSources && (
                            <div className="source-list">
                                {sources.map((source, index) => (
                                    <div
                                        className="source-card"
                                        key={`${source.source_id || "source"}-${index}`}
                                    >
                                        <div className="source-card-header">
                                            <div className="source-file-icon">
                                                <FileText size={16} />
                                            </div>

                                            <div className="source-file-details">
                                                <span className="source-filename">
                                                    {source.filename || "Unknown document"}
                                                </span>

                                                <span className="source-location">
                                                    {source.source_id || `S${index + 1}`}
                                                    {source.page ? ` · Page ${source.page}` : ""}
                                                </span>
                                            </div>

                                            {typeof source.score === "number" && (
                                                <span
                                                    className="source-score"
                                                    title="Vector similarity score"
                                                >
                                                    {source.score.toFixed(2)}
                                                </span>
                                            )}
                                        </div>

                                        {source.snippet && (
                                            <p className="source-snippet">
                                                {source.snippet}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </article>
    );
}

export default MessageBubble;
