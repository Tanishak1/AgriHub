import { Router } from 'express';
import { getFarms, createFarm, createField, harvestCropCycle } from '../controllers/cropController';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

router.get('/farms', authenticateJWT, getFarms);
router.post('/farms', authenticateJWT, createFarm);
router.post('/fields', authenticateJWT, createField);
router.post('/cropcycle/:id/harvest', authenticateJWT, harvestCropCycle);

export default router;
