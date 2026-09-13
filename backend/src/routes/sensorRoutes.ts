import { Router } from 'express';
import { getSensors, getSensorDetail, getSensorReadings, updateSensorThresholds } from '../controllers/sensorController';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

router.get('/', authenticateJWT, getSensors);
router.get('/:id', authenticateJWT, getSensorDetail);
router.get('/:id/readings', authenticateJWT, getSensorReadings);
router.put('/:id', authenticateJWT, updateSensorThresholds);

export default router;
