import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { logger } from '../utils/logger';

let io: SocketIOServer | null = null;

export const setupSocket = (server: HTTPServer) => {
  io = new SocketIOServer(server, {
    cors: {
      origin: '*', // Allow all origins for testing/development
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    logger.info(`Socket client connected: ${socket.id}`);

    // Join device room to receive specific telemetry
    socket.on('subscribe_device', (deviceId: string) => {
      socket.join(`device:${deviceId}`);
      logger.info(`Socket ${socket.id} subscribed to device: ${deviceId}`);
    });

    socket.on('unsubscribe_device', (deviceId: string) => {
      socket.leave(`device:${deviceId}`);
      logger.info(`Socket ${socket.id} unsubscribed from device: ${deviceId}`);
    });

    socket.on('disconnect', () => {
      logger.info(`Socket client disconnected: ${socket.id}`);
    });
  });

  return io;
};

// Broadcast telemetry reading to subscribed clients
export const broadcastTelemetry = (deviceId: string, telemetry: {
  sensorType: string;
  sensorId: string;
  value: number;
  unit: string;
  timestamp: string;
  status: string;
}) => {
  if (io) {
    io.to(`device:${deviceId}`).emit('telemetry', telemetry);
    // Also broadcast globally for dashboard lists
    io.emit('telemetry_global', { deviceId, ...telemetry });
  }
};

// Broadcast device connection status changes
export const broadcastDeviceStatus = (deviceId: string, status: string) => {
  if (io) {
    io.emit('device_status', { deviceId, status });
  }
};

// Broadcast alerts
export const broadcastAlert = (alert: {
  id: string;
  title: string;
  description: string;
  severity: string;
  deviceId: string;
  sensorId: string | null;
  createdAt: string;
}) => {
  if (io) {
    io.emit('new_alert', alert);
  }
};
