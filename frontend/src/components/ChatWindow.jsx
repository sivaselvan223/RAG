import { useEffect, useRef } from 'react';
import SourceCard from './SourceCard';

export default function ChatWindow({ messages, isLoading, streamingText }) {
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, streamingText]);

    // Welcome screen when no messages
    if (messages.length === 0 && !isLoading) {
        return (
            <div className="chat-window">
                <div className="welcome-screen">
                    <div className="welcome-icon">🧠</div>
                    <h2>Welcome to DocuMind AI</h2>
                    <p>
                        Upload your documents and ask questions. I'll find relevant information
                        and provide accurate answers with source citations.
                    </p>
                    <div className="welcome-features">
                        <div className="feature-card">
                            <div className="icon">📄</div>
                            <h3>Upload Docs</h3>
                            <p>PDF & text files</p>
                        </div>
                        <div className="feature-card">
                            <div className="icon">💬</div>
                            <h3>Ask Questions</h3>
                            <p>Natural language</p>
                        </div>
                        <div className="feature-card">
                            <div className="icon">🎯</div>
                            <h3>Get Answers</h3>
                            <p>With source citations</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="chat-window">
            <div className="chat-messages">
                {messages.map((msg, index) => (
                    <div key={index} className={`message ${msg.role}`}>
                        <div className="message-avatar">
                            {msg.role === 'user' ? '👤' : '🧠'}
                        </div>
                        <div className="message-content">
                            {msg.content.split('\n').map((line, i) => (
                                <p key={i}>{line || '\u00A0'}</p>
                            ))}
                            {msg.role === 'assistant' && msg.sources && (
                                <SourceCard sources={msg.sources} />
                            )}
                        </div>
                    </div>
                ))}

                {/* Streaming response */}
                {isLoading && streamingText && (
                    <div className="message assistant">
                        <div className="message-avatar">🧠</div>
                        <div className="message-content">
                            {streamingText.split('\n').map((line, i) => (
                                <p key={i}>{line || '\u00A0'}</p>
                            ))}
                            <div className="typing-indicator">
                                <span></span><span></span><span></span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Loading without streaming text */}
                {isLoading && !streamingText && (
                    <div className="message assistant">
                        <div className="message-avatar">🧠</div>
                        <div className="message-content">
                            <div className="typing-indicator">
                                <span></span><span></span><span></span>
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>
        </div>
    );
}
