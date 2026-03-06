import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { OllamaEmbeddings } from '@langchain/ollama';
import { ChromaClient } from 'chromadb';
import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import fs from 'fs';

let chromaClient = null;
let collection = null;
let embeddings = null;

/**
 * Initialize ChromaDB client and collection
 */
async function initVectorStore() {
    if (collection) return collection;

    chromaClient = new ChromaClient();
    embeddings = new OllamaEmbeddings({
        model: process.env.EMBEDDING_MODEL || 'nomic-embed-text',
        baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    });

    collection = await chromaClient.getOrCreateCollection({
        name: process.env.CHROMA_COLLECTION || 'rag_documents',
    });

    console.log('✅ ChromaDB collection initialized');
    return collection;
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
 * Store document chunks + embeddings in ChromaDB
 */
async function storeInVectorDB(chunks, embeddingVectors, documentId, filename) {
    const col = await initVectorStore();

    const ids = chunks.map((_, i) => `${documentId}_chunk_${i}`);
    const metadatas = chunks.map((_, i) => ({
        documentId: documentId.toString(),
        filename,
        chunkIndex: i,
    }));

    await col.add({
        ids,
        embeddings: embeddingVectors,
        documents: chunks,
        metadatas,
    });

    console.log(`✅ Stored ${chunks.length} chunks for "${filename}" in ChromaDB`);
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
    const col = await initVectorStore();

    // Generate embedding for the query
    if (!embeddings) {
        embeddings = new OllamaEmbeddings({
            model: process.env.EMBEDDING_MODEL || 'nomic-embed-text',
            baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
        });
    }
    const queryEmbedding = await embeddings.embedQuery(query);

    const results = await col.query({
        queryEmbeddings: [queryEmbedding],
        nResults: topK,
    });

    // Format results
    const chunks = [];
    if (results.documents && results.documents[0]) {
        for (let i = 0; i < results.documents[0].length; i++) {
            chunks.push({
                text: results.documents[0][i],
                filename: results.metadatas[0][i]?.filename || 'Unknown',
                score: results.distances ? results.distances[0][i] : null,
            });
        }
    }

    return chunks;
}

/**
 * Delete all chunks for a specific document from ChromaDB
 */
async function deleteDocumentChunks(documentId) {
    const col = await initVectorStore();

    try {
        // Get all IDs matching this document
        const results = await col.get({
            where: { documentId: documentId.toString() },
        });

        if (results.ids && results.ids.length > 0) {
            await col.delete({ ids: results.ids });
            console.log(`🗑️ Deleted ${results.ids.length} chunks for document ${documentId}`);
        }
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
