import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
    filename: {
        type: String,
        required: true,
    },
    originalName: {
        type: String,
        required: true,
    },
    fileType: {
        type: String,
        enum: ['pdf', 'txt'],
        required: true,
    },
    fileSize: {
        type: Number,
        required: true,
    },
    chunkCount: {
        type: Number,
        default: 0,
    },
    status: {
        type: String,
        enum: ['processing', 'ready', 'error'],
        default: 'processing',
    },
    errorMessage: {
        type: String,
        default: null,
    },
}, {
    timestamps: true,
});

export default mongoose.model('Document', documentSchema);
