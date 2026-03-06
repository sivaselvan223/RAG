import Document from '../models/Document.js';
import { processDocument, deleteDocumentChunks } from '../services/ragService.js';
import fs from 'fs';
import path from 'path';

/**
 * Upload and process a document
 * POST /api/documents/upload
 */
export async function uploadDocument(req, res) {
    try {
        console.log('--- Upload Request Started ---');
        console.log('File details:', req.file);

        if (!req.file) {
            console.log('❌ No file in request');
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const { originalname, filename, path: filePath, size } = req.file;
        const ext = path.extname(originalname).toLowerCase().replace('.', '');

        if (!['pdf', 'txt'].includes(ext)) {
            console.log('❌ Invalid file type:', ext);
            // Clean up uploaded file
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            return res.status(400).json({ error: 'Only PDF and TXT files are supported' });
        }

        console.log('Creating DB record...');
        // Create document record in MongoDB
        const doc = await Document.create({
            filename,
            originalName: originalname,
            fileType: ext,
            fileSize: size,
            status: 'processing',
        });
        console.log('✅ DB record created:', doc._id);

        // Send immediate response
        res.status(201).json({
            message: 'Document uploaded, processing started',
            document: doc,
        });

        // Process document asynchronously (extract → chunk → embed → store)
        // Using a non-blocking execution block
        (async () => {
            try {
                console.log(`Starting processing for: ${originalname}`);
                const chunkCount = await processDocument(filePath, ext, doc._id, originalname);
                doc.chunkCount = chunkCount;
                doc.status = 'ready';
                await doc.save();
                console.log(`✅ Document "${originalname}" processed: ${chunkCount} chunks`);
            } catch (processError) {
                console.error(`❌ Error processing "${originalname}":`, processError);
                doc.status = 'error';
                doc.errorMessage = processError.message;
                await doc.save();
            }
        })();

    } catch (error) {
        console.error('Upload error:', error);
        // Important: check if headers sent to avoid "Headers already sent" error
        if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to upload document' });
        }
    }
}

/**
 * Get all documents
 * GET /api/documents
 */
export async function getDocuments(req, res) {
    try {
        const documents = await Document.find().sort({ createdAt: -1 });
        res.json(documents);
    } catch (error) {
        console.error('Get documents error:', error);
        res.status(500).json({ error: 'Failed to fetch documents' });
    }
}

/**
 * Delete a document
 * DELETE /api/documents/:id
 */
export async function deleteDocument(req, res) {
    try {
        const doc = await Document.findById(req.params.id);
        if (!doc) {
            return res.status(404).json({ error: 'Document not found' });
        }

        // Delete chunks from vector DB
        await deleteDocumentChunks(doc._id);

        // Delete uploaded file if it exists
        const filePath = path.join('uploads', doc.filename);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        // Delete MongoDB record
        await Document.findByIdAndDelete(req.params.id);

        res.json({ message: 'Document deleted successfully' });
    } catch (error) {
        console.error('Delete document error:', error);
        res.status(500).json({ error: 'Failed to delete document' });
    }
}
