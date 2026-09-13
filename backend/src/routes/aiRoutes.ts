import { Router } from 'express';
import { getAIRecommendation, handleAIChat } from '../controllers/aiController';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

router.get('/recommend', authenticateJWT, getAIRecommendation);
router.post('/chat', authenticateJWT, handleAIChat);

export default router;
