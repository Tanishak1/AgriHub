import { Router } from 'express';
import { signup, login, getProfile, updateProfile } from '../controllers/authController';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

router.post('/signup', signup);
router.post('/login', login);
router.get('/me', authenticateJWT, getProfile);
router.put('/me', authenticateJWT, updateProfile);

export default router;
