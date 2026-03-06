const API_BASE = '/api';

/**
 * Upload a document file
 */
export async function uploadDocument(file) {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API_BASE}/documents/upload`, {
        method: 'POST',
        body: formData,
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Upload failed');
    }

    return res.json();
}

/**
 * Get all documents
 */
export async function getDocuments() {
    const res = await fetch(`${API_BASE}/documents`);
    return res.json();
}

/**
 * Delete a document
 */
export async function deleteDocument(id) {
    const res = await fetch(`${API_BASE}/documents/${id}`, { method: 'DELETE' });
    return res.json();
}

/**
 * Ask a question (non-streaming)
 */
export async function askQuestion(question, chatId = null) {
    const res = await fetch(`${API_BASE}/chat/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, chatId }),
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to get answer');
    }

    return res.json();
}

/**
 * Stream an answer using SSE
 */
export async function streamQuestion(question, chatId, onToken, onSources, onDone, onError) {
    try {
        const res = await fetch(`${API_BASE}/chat/stream`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question, chatId }),
        });

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    try {
                        const data = JSON.parse(line.slice(6));
                        if (data.type === 'content') onToken(data.text);
                        else if (data.type === 'sources') onSources(data.sources);
                        else if (data.type === 'done') onDone(data.chatId);
                        else if (data.type === 'error') onError(data.message);
                    } catch (e) {
                        // skip malformed JSON
                    }
                }
            }
        }
    } catch (err) {
        onError(err.message);
    }
}

/**
 * Get chat history list
 */
export async function getChatHistory() {
    const res = await fetch(`${API_BASE}/chat/history`);
    return res.json();
}

/**
 * Get a specific chat by ID
 */
export async function getChatById(id) {
    const res = await fetch(`${API_BASE}/chat/${id}`);
    return res.json();
}

/**
 * Delete a chat
 */
export async function deleteChat(id) {
    const res = await fetch(`${API_BASE}/chat/${id}`, { method: 'DELETE' });
    return res.json();
}

/**
 * Health check
 */
export async function healthCheck() {
    const res = await fetch(`${API_BASE}/health`);
    return res.json();
}
