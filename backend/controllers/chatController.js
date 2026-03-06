import ChatHistory from '../models/ChatHistory.js';
import { searchSimilarChunks } from '../services/ragService.js';
import { queryWithContext, streamWithContext } from '../services/llmService.js';

/**
 * Ask a question - runs the full RAG pipeline
 * POST /api/chat/ask
 * Body: { question, chatId? }
 */
export async function askQuestion(req, res) {
    try {
        const { question, chatId } = req.body;

        if (!question || question.trim().length === 0) {
            return res.status(400).json({ error: 'Question is required' });
        }

        // Step 1: Search vector DB for relevant chunks
        const retrievedChunks = await searchSimilarChunks(question, 5);

        if (retrievedChunks.length === 0) {
            return res.json({
                answer: 'I couldn\'t find any relevant information in the uploaded documents. Please upload documents first or try a different question.',
                sources: [],
                chatId: chatId || null,
            });
        }

        // Step 2: Send to LLM with context
        const { answer, sources } = await queryWithContext(question, retrievedChunks);

        // Step 3: Save to chat history
        let chat;
        if (chatId) {
            chat = await ChatHistory.findById(chatId);
        }

        if (!chat) {
            chat = new ChatHistory({
                title: question.substring(0, 50) + (question.length > 50 ? '...' : ''),
                messages: [],
            });
        }

        chat.messages.push(
            { role: 'user', content: question },
            { role: 'assistant', content: answer, sources }
        );
        await chat.save();

        res.json({
            answer,
            sources,
            chatId: chat._id,
        });
    } catch (error) {
        console.error('Ask question error:', error);
        res.status(500).json({ error: 'Failed to process question: ' + error.message });
    }
}

/**
 * Stream answer (SSE endpoint)
 * POST /api/chat/stream
 */
export async function streamAnswer(req, res) {
    try {
        const { question, chatId } = req.body;

        if (!question || question.trim().length === 0) {
            return res.status(400).json({ error: 'Question is required' });
        }

        // Set SSE headers
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        // Search for context
        const retrievedChunks = await searchSimilarChunks(question, 5);

        if (retrievedChunks.length === 0) {
            res.write(`data: ${JSON.stringify({ type: 'content', text: 'I couldn\'t find any relevant information in the uploaded documents.' })}\n\n`);
            res.write(`data: ${JSON.stringify({ type: 'done', sources: [] })}\n\n`);
            res.end();
            return;
        }

        // Stream LLM response
        let fullAnswer = '';
        const sources = retrievedChunks.map(chunk => ({
            filename: chunk.filename,
            chunkText: chunk.text.substring(0, 200) + (chunk.text.length > 200 ? '...' : ''),
        }));

        // Deduplicate sources
        const uniqueSources = sources.filter(
            (source, index, self) =>
                index === self.findIndex(s => s.filename === source.filename && s.chunkText === source.chunkText)
        );

        // Send sources first
        res.write(`data: ${JSON.stringify({ type: 'sources', sources: uniqueSources })}\n\n`);

        for await (const token of streamWithContext(question, retrievedChunks)) {
            fullAnswer += token;
            res.write(`data: ${JSON.stringify({ type: 'content', text: token })}\n\n`);
        }

        // Save to chat history
        let chat;
        if (chatId) {
            chat = await ChatHistory.findById(chatId);
        }
        if (!chat) {
            chat = new ChatHistory({
                title: question.substring(0, 50) + (question.length > 50 ? '...' : ''),
                messages: [],
            });
        }
        chat.messages.push(
            { role: 'user', content: question },
            { role: 'assistant', content: fullAnswer, sources: uniqueSources }
        );
        await chat.save();

        res.write(`data: ${JSON.stringify({ type: 'done', chatId: chat._id })}\n\n`);
        res.end();
    } catch (error) {
        console.error('Stream error:', error);
        res.write(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`);
        res.end();
    }
}

/**
 * Get all chat histories
 * GET /api/chat/history
 */
export async function getChatHistory(req, res) {
    try {
        const chats = await ChatHistory.find()
            .select('title createdAt updatedAt')
            .sort({ updatedAt: -1 });
        res.json(chats);
    } catch (error) {
        console.error('Get chat history error:', error);
        res.status(500).json({ error: 'Failed to fetch chat history' });
    }
}

/**
 * Get a single chat by ID
 * GET /api/chat/:id
 */
export async function getChatById(req, res) {
    try {
        const chat = await ChatHistory.findById(req.params.id);
        if (!chat) {
            return res.status(404).json({ error: 'Chat not found' });
        }
        res.json(chat);
    } catch (error) {
        console.error('Get chat error:', error);
        res.status(500).json({ error: 'Failed to fetch chat' });
    }
}

/**
 * Delete a chat
 * DELETE /api/chat/:id
 */
export async function deleteChat(req, res) {
    try {
        await ChatHistory.findByIdAndDelete(req.params.id);
        res.json({ message: 'Chat deleted successfully' });
    } catch (error) {
        console.error('Delete chat error:', error);
        res.status(500).json({ error: 'Failed to delete chat' });
    }
}
