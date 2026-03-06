export default function Sidebar({
    documents,
    chatHistories,
    activeChatId,
    isOpen,
    onClose,
    onNewChat,
    onSelectChat,
    onDeleteChat,
    onDeleteDocument,
    onUploadClick,
    onRefreshDocs,
}) {
    const formatDate = (dateStr) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const formatSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    // Close sidebar on mobile after an action
    const handleAction = (action) => (...args) => {
        action(...args);
        if (onClose) onClose();
    };

    return (
        <div className={`sidebar ${isOpen ? 'open' : ''}`}>

            {/* Logo & New Chat */}
            <div className="sidebar-header">
                <div className="sidebar-logo">
                    <div className="logo-icon">🧠</div>
                    <h1>DocuMind AI</h1>
                </div>
                <button className="new-chat-btn" onClick={onNewChat} id="new-chat-btn">
                    ＋ New Chat
                </button>
            </div>

            {/* Documents Section */}
            <div className="sidebar-section" style={{ flex: '0 0 auto', maxHeight: '40%', overflowY: 'auto' }}>
                <div className="sidebar-section-title">📂 Documents ({documents.length})</div>
                {documents.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">📄</div>
                        <p>No documents yet</p>
                    </div>
                ) : (
                    documents.map((doc) => (
                        <div key={doc._id} className="doc-item">
                            <div className={`doc-icon ${doc.fileType}`}>
                                {doc.fileType === 'pdf' ? '📕' : '📘'}
                            </div>
                            <div className="doc-info">
                                <div className="doc-name" title={doc.originalName}>
                                    {doc.originalName}
                                </div>
                                <div className="doc-meta">
                                    {formatSize(doc.fileSize)} • {doc.chunkCount} chunks
                                </div>
                            </div>
                            <span className={`doc-status ${doc.status}`}>
                                {doc.status}
                            </span>
                            <button
                                className="doc-delete-btn"
                                onClick={() => onDeleteDocument(doc._id)}
                                title="Delete document"
                            >
                                🗑️
                            </button>
                        </div>
                    ))
                )}
            </div>

            {/* Chat History Section */}
            <div className="sidebar-section" style={{ flex: 1 }}>
                <div className="sidebar-section-title">💬 Chat History</div>
                {chatHistories.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">💭</div>
                        <p>No chats yet</p>
                    </div>
                ) : (
                    chatHistories.map((chat) => (
                        <div
                            key={chat._id}
                            className={`chat-item ${activeChatId === chat._id ? 'active' : ''}`}
                            onClick={() => onSelectChat(chat._id)}
                        >
                            <span className="chat-item-icon">💬</span>
                            <span className="chat-item-title" title={chat.title}>
                                {chat.title}
                            </span>
                            <button
                                className="chat-delete-btn"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteChat(chat._id);
                                }}
                                title="Delete chat"
                            >
                                ✕
                            </button>
                        </div>
                    ))
                )}
            </div>

            {/* Upload Button */}
            <div className="upload-area">
                <button className="upload-btn" onClick={onUploadClick} id="upload-btn">
                    ⬆ Upload Document
                </button>
            </div>
        </div>
    );
}
