import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { OllamaEmbeddings } from '@langchain/ollama';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import fs from 'fs';

let memoryStore = null;
let embeddings = null;

/**
 * Initialize MemoryVectorStore
 */
async function initVectorStore() {
    if (memoryStore) return memoryStore;

    embeddings = new OllamaEmbeddings({
        model: process.env.EMBEDDING_MODEL || 'nomic-embed-text',
        baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    });

    memoryStore = new MemoryVectorStore(embeddings);

    console.log('✅ Memory Vector Store initialized');
    return memoryStore;
}

/**
 * Extract text from uploaded file (PDF or TXT)
 */
async function extractText(filePath, fileType) {
    if (fileType === 'pdf') {
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdfParse(dataBuffer);
        return data.text;
    } else {
        return fs.readFileSync(filePath, 'utf-8');
    }
}

/**
 * Split text into chunks using LangChain's RecursiveCharacterTextSplitter
 */
async function chunkText(text) {
    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
    });
    return await splitter.splitText(text);
}

/**
 * Generate embeddings for an array of text chunks
 */
async function generateEmbeddings(chunks) {
    if (!embeddings) {
        embeddings = new OllamaEmbeddings({
            model: process.env.EMBEDDING_MODEL || 'nomic-embed-text',
            baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
        });
    }
    return await embeddings.embedDocuments(chunks);
}

/**
 * Store document chunks + embeddings in memory store
 */
async function storeInVectorDB(chunks, embeddingVectors, documentId, filename) {
    const store = await initVectorStore();

    // Map string chunks into Document objects
    const documents = chunks.map((chunk, i) => ({
        pageContent: chunk,
        metadata: {
            documentId: documentId.toString(),
            filename,
            chunkIndex: i,
        }
    }));

    await store.addDocuments(documents);

    console.log(`✅ Stored ${chunks.length} chunks for "${filename}" in Memory DB`);
}

/**
 * Full pipeline: extract → chunk → embed → store
 */
async function processDocument(filePath, fileType, documentId, filename) {
    // Step 1: Extract text
    const text = await extractText(filePath, fileType);
    if (!text || text.trim().length === 0) {
        throw new Error('No text could be extracted from the file');
    }

    // Step 2: Chunk text
    const chunks = await chunkText(text);

    // Step 3: Generate embeddings
    const embeddingVectors = await generateEmbeddings(chunks);

    // Step 4: Store in vector DB
    await storeInVectorDB(chunks, embeddingVectors, documentId, filename);

    return chunks.length;
}

/**
 * Search vector DB for relevant chunks given a query
 */
async function searchSimilarChunks(query, topK = 5) {
    const store = await initVectorStore();

    const results = await store.similaritySearchWithScore(query, topK);

    // Format results to match previous output shape
    const chunks = results.map(([doc, score]) => ({
        text: doc.pageContent,
        filename: doc.metadata?.filename || 'Unknown',
        score: score,
    }));

    return chunks;
}

/**
 * Delete all chunks for a specific document from MemoryStore
 */
async function deleteDocumentChunks(documentId) {
    const store = await initVectorStore();

    try {
        // Since MemoryStore doesn't have a clean delete method by metadata,
        // we manually filter out the documents that don't match the ID
        const docIdStr = documentId.toString();
        const initialCount = store.memoryVectors.length;

        store.memoryVectors = store.memoryVectors.filter(
            vec => vec.metadata?.documentId !== docIdStr
        );

        const deletedCount = initialCount - store.memoryVectors.length;
        console.log(`🗑️ Deleted ${deletedCount} chunks for document ${documentId}`);
    } catch (error) {
        console.error(`Error deleting chunks: ${error.message}`);
    }
}

export {
    initVectorStore,
    processDocument,
    searchSimilarChunks,
    deleteDocumentChunks,
};
