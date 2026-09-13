import { Router } from 'express';
import { getDevices, addDevice, deleteDevice, updateHardwareData, updateHardwareStatus, getHardwareDiagnostics } from '../controllers/deviceController';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

router.get('/', authenticateJWT, getDevices);
router.post('/', authenticateJWT, addDevice);
router.delete('/:id', authenticateJWT, deleteDevice);
router.get('/:id/diagnostics', authenticateJWT, getHardwareDiagnostics);

// Direct telemetry API for physical bridge
router.post('/telemetry', updateHardwareData);
router.post('/telemetry/status', updateHardwareStatus);

export default router;
