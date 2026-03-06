import { ChatOllama } from '@langchain/ollama';

let llm = null;

function getLLM() {
    if (!llm) {
        llm = new ChatOllama({
            model: process.env.LLM_MODEL || 'llama3.2:3b',
            baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
            temperature: 0.3,
        });
    }
    return llm;
}

/**
 * Build a RAG prompt with context chunks and user question, then query LLM.
 * Returns the answer text and source references.
 */
async function queryWithContext(question, retrievedChunks) {
    const model = getLLM();

    // Build context from retrieved chunks
    const context = retrievedChunks
        .map((chunk, i) => `[Source ${i + 1}: ${chunk.filename}]\n${chunk.text}`)
        .join('\n\n---\n\n');

    const prompt = `You are an AI document assistant. Answer the user's question using ONLY the provided context from their uploaded documents. If the context doesn't contain enough information to answer, say so honestly.

Always cite your sources by mentioning the source filename.

Context:
${context}

Question:
${question}

Answer:`;

    const response = await model.invoke(prompt);
    const answer = response.content;

    // Extract unique source filenames
    const sources = retrievedChunks.map(chunk => ({
        filename: chunk.filename,
        chunkText: chunk.text.substring(0, 200) + (chunk.text.length > 200 ? '...' : ''),
    }));

    // Deduplicate sources by filename
    const uniqueSources = sources.filter(
        (source, index, self) =>
            index === self.findIndex(s => s.filename === source.filename && s.chunkText === source.chunkText)
    );

    return {
        answer,
        sources: uniqueSources,
    };
}

/**
 * Stream response from LLM (for future streaming support)
 */
async function* streamWithContext(question, retrievedChunks) {
    const model = getLLM();

    const context = retrievedChunks
        .map((chunk, i) => `[Source ${i + 1}: ${chunk.filename}]\n${chunk.text}`)
        .join('\n\n---\n\n');

    const prompt = `You are an AI document assistant. Answer the user's question using ONLY the provided context from their uploaded documents. If the context doesn't contain enough information to answer, say so honestly.

Always cite your sources by mentioning the source filename.

Context:
${context}

Question:
${question}

Answer:`;

    const stream = await model.stream(prompt);
    for await (const chunk of stream) {
        yield chunk.content;
    }
}

export { queryWithContext, streamWithContext };
