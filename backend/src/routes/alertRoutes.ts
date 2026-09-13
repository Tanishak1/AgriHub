import { Router } from 'express';
import { getAlerts, markAlertRead, getNotifications, markNotificationRead, clearNotifications } from '../controllers/alertController';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

router.get('/', authenticateJWT, getAlerts);
router.put('/:id/read', authenticateJWT, markAlertRead);

router.get('/notifications', authenticateJWT, getNotifications);
router.put('/notifications/:id/read', authenticateJWT, markNotificationRead);
router.delete('/notifications', authenticateJWT, clearNotifications);

export default router;
