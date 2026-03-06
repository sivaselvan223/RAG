import { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import ChatInput from './components/ChatInput';
import FileUpload from './components/FileUpload';
import {
    getDocuments,
    deleteDocument,
    getChatHistory,
    getChatById,
    deleteChat,
    streamQuestion,
    healthCheck,
} from './api/index';

export default function App() {
    // State
    const [documents, setDocuments] = useState([]);
    const [chatHistories, setChatHistories] = useState([]);
    const [activeChatId, setActiveChatId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [streamingText, setStreamingText] = useState('');
    const [showUpload, setShowUpload] = useState(false);
    const [isOnline, setIsOnline] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Check backend health
    useEffect(() => {
        const checkHealth = async () => {
            try {
                await healthCheck();
                setIsOnline(true);
            } catch {
                setIsOnline(false);
            }
        };
        checkHealth();
        const interval = setInterval(checkHealth, 30000);
        return () => clearInterval(interval);
    }, []);

    // Load documents and chat history
    const loadDocuments = useCallback(async () => {
        try {
            const docs = await getDocuments();
            setDocuments(docs);
        } catch (err) {
            console.error('Failed to load documents:', err);
        }
    }, []);

    const loadChatHistory = useCallback(async () => {
        try {
            const chats = await getChatHistory();
            setChatHistories(chats);
        } catch (err) {
            console.error('Failed to load chat history:', err);
        }
    }, []);

    useEffect(() => {
        loadDocuments();
        loadChatHistory();
    }, [loadDocuments, loadChatHistory]);

    // Poll for document status updates
    useEffect(() => {
        const hasProcessing = documents.some(d => d.status === 'processing');
        if (!hasProcessing) return;

        const interval = setInterval(loadDocuments, 3000);
        return () => clearInterval(interval);
    }, [documents, loadDocuments]);

    // Handle new chat
    const handleNewChat = () => {
        setActiveChatId(null);
        setMessages([]);
        setStreamingText('');
    };

    // Handle select chat
    const handleSelectChat = async (chatId) => {
        try {
            setActiveChatId(chatId);
            setIsLoading(true);
            const chat = await getChatById(chatId);
            setMessages(chat.messages || []);
        } catch (err) {
            console.error('Failed to load chat:', err);
        } finally {
            setIsLoading(false);
        }
    };

    // Handle delete chat
    const handleDeleteChat = async (chatId) => {
        try {
            await deleteChat(chatId);
            if (activeChatId === chatId) {
                handleNewChat();
            }
            loadChatHistory();
        } catch (err) {
            console.error('Failed to delete chat:', err);
        }
    };

    // Handle delete document
    const handleDeleteDocument = async (docId) => {
        try {
            await deleteDocument(docId);
            loadDocuments();
        } catch (err) {
            console.error('Failed to delete document:', err);
        }
    };

    // Handle send message - uses streaming
    const handleSendMessage = async (question) => {
        // Add user message immediately
        const userMsg = { role: 'user', content: question };
        setMessages(prev => [...prev, userMsg]);
        setIsLoading(true);
        setStreamingText('');

        let fullAnswer = '';
        let sources = [];

        await streamQuestion(
            question,
            activeChatId,
            // onToken
            (token) => {
                fullAnswer += token;
                setStreamingText(fullAnswer);
            },
            // onSources
            (srcList) => {
                sources = srcList;
            },
            // onDone
            (chatId) => {
                // Add assistant message with full answer
                setMessages(prev => [
                    ...prev,
                    { role: 'assistant', content: fullAnswer, sources },
                ]);
                setStreamingText('');
                setIsLoading(false);

                if (chatId) {
                    setActiveChatId(chatId);
                }
                loadChatHistory();
            },
            // onError
            (errorMsg) => {
                setMessages(prev => [
                    ...prev,
                    { role: 'assistant', content: `Sorry, an error occurred: ${errorMsg}` },
                ]);
                setStreamingText('');
                setIsLoading(false);
            }
        );
    };

    // Handle upload complete
    const handleUploadComplete = () => {
        loadDocuments();
    };

    return (
        <div className="app">
            {/* Mobile sidebar overlay */}
            <div
                className={`sidebar-overlay ${sidebarOpen ? 'visible' : ''}`}
                onClick={() => setSidebarOpen(false)}
            />

            <Sidebar
                documents={documents}
                chatHistories={chatHistories}
                activeChatId={activeChatId}
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                onNewChat={() => { handleNewChat(); setSidebarOpen(false); }}
                onSelectChat={(id) => { handleSelectChat(id); setSidebarOpen(false); }}
                onDeleteChat={handleDeleteChat}
                onDeleteDocument={handleDeleteDocument}
                onUploadClick={() => { setShowUpload(true); setSidebarOpen(false); }}
                onRefreshDocs={loadDocuments}
            />

            <div className="main-content">
                <div className="main-header">
                    <button
                        className="hamburger-btn"
                        onClick={() => setSidebarOpen(prev => !prev)}
                        aria-label="Toggle menu"
                    >
                        ☰
                    </button>
                    <h2>
                        {activeChatId
                            ? chatHistories.find(c => c._id === activeChatId)?.title || 'Chat'
                            : 'New Chat'}
                    </h2>
                    <div className="header-status">
                        <div className={`status-dot ${isOnline ? '' : 'offline'}`} />
                        {isOnline ? 'Connected' : 'Offline'}
                    </div>
                </div>

                <ChatWindow
                    messages={messages}
                    isLoading={isLoading}
                    streamingText={streamingText}
                />

                <ChatInput
                    onSend={handleSendMessage}
                    isLoading={isLoading}
                />
            </div>

            <FileUpload
                isOpen={showUpload}
                onClose={() => setShowUpload(false)}
                onUploadComplete={handleUploadComplete}
            />
        </div>
    );
}
