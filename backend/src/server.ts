import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { setupSocket } from './websocket/socketHandler';
import { logger } from './utils/logger';

// Load environmental variables
dotenv.config();

// Initialize express app
const app = express();
const server = createServer(app);

// CORS config
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
app.use(cors({
  origin: '*', // Allow all origins for simple developer setup
  credentials: true,
}));

// Body parser
app.use(express.json());

// Logger middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.originalUrl}`);
  next();
});

// Import route modules
import authRoutes from './routes/authRoutes';
import deviceRoutes from './routes/deviceRoutes';
import sensorRoutes from './routes/sensorRoutes';
import cropRoutes from './routes/cropRoutes';
import alertRoutes from './routes/alertRoutes';
import aiRoutes from './routes/aiRoutes';

// Register routes
app.use('/api/auth', authRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/sensors', sensorRoutes);
app.use('/api/crops', cropRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/ai', aiRoutes);

// Base status endpoint
app.get('/status', (req, res) => {
  res.json({
    status: 'ONLINE',
    service: 'AgriHub API Service',
    time: new Date().toISOString(),
  });
});

// Global central error handler middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled request exception:', err);
  const status = err.statusCode || 500;
  res.status(status).json({
    error: err.message || 'An unexpected server error occurred.',
  });
});

// Start WebSockets
const io = setupSocket(server);

// A device is disconnected until the physical bridge posts a valid packet.
void import('./utils/db').then(async ({ prisma }) => {
  await prisma.device.updateMany({ data: { status: 'DISCONNECTED' } });
  setInterval(async () => {
    const cutoff = new Date(Date.now() - 15000);
    const staleDevices = await prisma.device.findMany({ where: { status: 'CONNECTED', lastSeen: { lt: cutoff } } });
    for (const device of staleDevices) {
      await prisma.device.update({ where: { id: device.id }, data: { status: 'DISCONNECTED' } });
      const { broadcastDeviceStatus } = await import('./websocket/socketHandler');
      broadcastDeviceStatus(device.id, 'DISCONNECTED');
      logger.warn(`[HARDWARE] ${device.id} timed out; marked DISCONNECTED.`);
    }
  }, 5000);
}).catch((error) => logger.error('Unable to reset hardware status:', error));

// Boot application
const PORT = Number(process.env.PORT || 5000);
server.listen(PORT, '0.0.0.0', () => {
  logger.info(`=========================================`);
  logger.info(` AgriHub Server running on port ${PORT} `);
  logger.info(`=========================================`);
});
