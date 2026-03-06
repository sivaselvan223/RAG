import { useState, useRef, useEffect } from 'react';

export default function ChatInput({ onSend, isLoading }) {
    const [message, setMessage] = useState('');
    const textareaRef = useRef(null);

    // Auto-resize textarea
    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
        }
    }, [message]);

    const handleSend = () => {
        if (message.trim() && !isLoading) {
            onSend(message.trim());
            setMessage('');
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="chat-input-container">
            <div className="chat-input-wrapper">
                <textarea
                    ref={textareaRef}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask a question about your documents..."
                    rows={1}
                    disabled={isLoading}
                    id="chat-input"
                />
                <button
                    className="send-btn"
                    onClick={handleSend}
                    disabled={!message.trim() || isLoading}
                    id="send-button"
                    title="Send message"
                >
                    ➤
                </button>
            </div>
            <div className="chat-input-hint">
                Press Enter to send • Shift+Enter for new line • Powered by Ollama + LangChain
            </div>
        </div>
    );
}
