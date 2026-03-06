# 🧠 DocuMind AI — MERN Stack RAG Chatbot

A full-stack AI-powered document chatbot built with the **MERN stack** and a local **RAG (Retrieval-Augmented Generation)** pipeline. Upload PDFs or text files, ask questions in natural language, and get accurate answers with source citations — all running locally with **Ollama**.

![DocuMind AI](https://img.shields.io/badge/Stack-MERN-green) ![Ollama](https://img.shields.io/badge/LLM-Ollama-blue) ![LangChain](https://img.shields.io/badge/RAG-LangChain-orange) ![License](https://img.shields.io/badge/License-MIT-yellow)

---

## ✨ Features

- 📄 **Document Upload** — Drag-and-drop PDF and TXT files
- 🔍 **RAG Pipeline** — Automatic text extraction, chunking, and embedding
- 🤖 **AI Chat** — Ask questions and get context-aware answers
- 📚 **Source Citations** — Every answer includes references to the source documents
- 💬 **Chat History** — Conversations are saved and can be revisited
- 🌊 **Streaming Responses** — Real-time token-by-token answer generation (SSE)
- 📱 **Mobile Responsive** — Hamburger menu sidebar, touch-friendly design
- 🎨 **Premium UI** — Dark theme with glassmorphism, gradients, and animations

---

## 🏗️ Architecture

```
Frontend (React + Vite)
        ↓
  Vite Dev Proxy
        ↓
Backend API (Express.js)
   ├── Document Upload → Text Extraction → Chunking → Embedding → Vector Store
   ├── Chat Query → Vector Search → Context Retrieval → LLM Generation
   └── MongoDB (metadata + chat history)
        ↓
  Ollama (Local LLM)
   ├── llama3.2:3b (chat/generation)
   └── nomic-embed-text (embeddings)
```

---

## 📁 Project Structure

```
RAG/
├── backend/
│   ├── config/
│   │   └── db.js                 # MongoDB connection
│   ├── controllers/
│   │   ├── chatController.js     # Chat endpoints & streaming
│   │   └── documentController.js # Upload, list, delete documents
│   ├── models/
│   │   ├── ChatHistory.js        # Chat history schema
│   │   └── Document.js           # Document metadata schema
│   ├── routes/
│   │   ├── chatRoutes.js         # /api/chat/* routes
│   │   └── documentRoutes.js     # /api/documents/* routes
│   ├── services/
│   │   ├── llmService.js         # LangChain + Ollama integration
│   │   └── ragService.js         # RAG pipeline (extract, chunk, embed, search)
│   ├── uploads/                  # Uploaded files (gitignored)
│   ├── .env                      # Environment variables (gitignored)
│   ├── nodemon.json              # Nodemon config
│   ├── package.json
│   └── server.js                 # Express entry point
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── index.js          # API client (fetch wrapper)
│   │   ├── components/
│   │   │   ├── ChatInput.jsx     # Message input with auto-resize
│   │   │   ├── ChatWindow.jsx    # Message display + streaming
│   │   │   ├── FileUpload.jsx    # Drag-and-drop upload modal
│   │   │   ├── Sidebar.jsx       # Documents, history, navigation
│   │   │   └── SourceCard.jsx    # Source citation cards
│   │   ├── App.jsx               # Main application component
│   │   ├── index.css             # Full design system (dark theme)
│   │   └── main.jsx              # React entry point
│   ├── index.html                # HTML template
│   ├── package.json
│   └── vite.config.js            # Vite + proxy config
│
├── .gitignore
└── README.md
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Vite 5, Vanilla CSS |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB (Mongoose) |
| **Vector Store** | LangChain MemoryVectorStore |
| **LLM** | Ollama — `llama3.2:3b` |
| **Embeddings** | Ollama — `nomic-embed-text` |
| **RAG Framework** | LangChain.js |
| **File Parsing** | pdf-parse |

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [MongoDB](https://www.mongodb.com/) (running locally or Atlas)
- [Ollama](https://ollama.ai/) (installed and running)

### 1. Clone the Repository

```bash
git clone https://github.com/sivaselvan223/RAG.git
cd RAG
```

### 2. Pull Ollama Models

```bash
ollama pull llama3.2:3b
ollama pull nomic-embed-text
```

### 3. Setup Backend

```bash
cd backend
npm install
```

Create a `.env` file in `backend/`:

```env
MONGODB_URI=mongodb://localhost:27017/rag-chatbot
OLLAMA_BASE_URL=http://localhost:11434
LLM_MODEL=llama3.2:3b
EMBEDDING_MODEL=nomic-embed-text
PORT=5000
```

### 4. Setup Frontend

```bash
cd ../frontend
npm install
```

### 5. Run the Application

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

### 6. Open the App

- **Desktop:** [http://localhost:5173](http://localhost:5173)
- **Mobile (same WiFi):** `http://<your-local-ip>:5173`

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/documents/upload` | Upload a document (multipart) |
| `GET` | `/api/documents` | List all documents |
| `DELETE` | `/api/documents/:id` | Delete a document |
| `POST` | `/api/chat/ask` | Ask a question (non-streaming) |
| `POST` | `/api/chat/stream` | Ask a question (SSE streaming) |
| `GET` | `/api/chat/history` | Get all chat sessions |
| `GET` | `/api/chat/:id` | Get a specific chat |
| `DELETE` | `/api/chat/:id` | Delete a chat session |

---

## 📱 Mobile Support

The app is fully responsive with:
- ☰ Hamburger menu for sidebar navigation
- Touch-friendly 44px+ tap targets
- Safe area support for notched phones
- Optimized layouts for screens down to 380px

---

## 📝 How RAG Works

1. **Upload** → User uploads a PDF/TXT document
2. **Extract** → Text is extracted using `pdf-parse` or `fs`
3. **Chunk** → Text is split into 1000-character chunks (200 overlap)
4. **Embed** → Each chunk is converted to a vector using `nomic-embed-text`
5. **Store** → Vectors are stored in an in-memory vector store
6. **Query** → User asks a question → question is embedded
7. **Retrieve** → Top 5 most similar chunks are retrieved
8. **Generate** → Chunks + question are sent to `llama3.2:3b` for answer generation
9. **Cite** → Answer includes source citations from the retrieved chunks

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

<p align="center">
  Built with ❤️ using MERN Stack + Ollama + LangChain
</p>
