import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import connectDB from './config/db.js';
import documentRoutes from './routes/documentRoutes.js';
import chatRoutes from './routes/chatRoutes.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Create uploads directory if it doesn't exist
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

// Middleware
app.use(cors({
    origin: true, // Allow any origin for local network testing
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/documents', documentRoutes);
app.use('/api/chat', chatRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        services: {
            server: 'running',
            ollama: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
            llmModel: process.env.LLM_MODEL || 'llama3.2:3b',
            embeddingModel: process.env.EMBEDDING_MODEL || 'nomic-embed-text',
        },
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        error: err.message || 'Internal server error',
    });
});

// Start server
const startServer = async () => {
    try {
        await connectDB();
        app.listen(PORT, () => {
            console.log(`\n🚀 RAG Server running on http://localhost:${PORT}`);
            console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
            console.log(`🤖 LLM Model: ${process.env.LLM_MODEL || 'llama3.2:3b'}`);
            console.log(`📐 Embedding Model: ${process.env.EMBEDDING_MODEL || 'nomic-embed-text'}\n`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
