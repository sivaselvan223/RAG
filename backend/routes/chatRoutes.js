import express from 'express';
import {
    askQuestion,
    streamAnswer,
    getChatHistory,
    getChatById,
    deleteChat,
} from '../controllers/chatController.js';

const router = express.Router();

router.post('/ask', askQuestion);
router.post('/stream', streamAnswer);
router.get('/history', getChatHistory);
router.get('/:id', getChatById);
router.delete('/:id', deleteChat);

export default router;
