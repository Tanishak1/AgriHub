import { Response } from 'express';
import { prisma } from '../utils/db';
import { AuthRequest } from '../middleware/auth';

// Fetch all sensors
export const getSensors = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    const sensors = await prisma.sensor.findMany({
      where: {
        device: {
          farm: { userId },
        },
      },
    });

    return res.json(sensors);
  } catch (error) {
    console.error('Fetch sensors error:', error);
    return res.status(500).json({ error: 'Server error retrieving sensors.' });
  }
};

// Fetch specific sensor details
export const getSensorDetail = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const sensor = await prisma.sensor.findFirst({
      where: {
        id,
        device: {
          farm: { userId },
        },
      },
      include: {
        device: true,
      },
    });

    if (!sensor) {
      return res.status(404).json({ error: 'Sensor not found or unauthorized access.' });
    }

    return res.json(sensor);
  } catch (error) {
    console.error('Fetch sensor detail error:', error);
    return res.status(500).json({ error: 'Server error retrieving sensor details.' });
  }
};

// Fetch historical readings for charts
export const getSensorReadings = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { range } = req.query; // '1d', '7d', '30d'
    const userId = req.user?.id;

    // Verify owner
    const sensor = await prisma.sensor.findFirst({
      where: {
        id,
        device: {
          farm: { userId },
        },
      },
    });

    if (!sensor) {
      return res.status(404).json({ error: 'Sensor not found or unauthorized access.' });
    }

    const device = await prisma.device.findUnique({ where: { id: sensor.deviceId } });
    if (device?.status !== 'CONNECTED') return res.json([]);

    let cutoffDate = new Date();
    if (range === '7d') {
      cutoffDate.setDate(cutoffDate.getDate() - 7);
    } else if (range === '30d') {
      cutoffDate.setDate(cutoffDate.getDate() - 30);
    } else {
      // Default to 1 day (24 hours)
      cutoffDate.setHours(cutoffDate.getHours() - 24);
    }

    const readings = await prisma.sensorReading.findMany({
      where: {
        sensorId: id,
        timestamp: { gte: cutoffDate },
      },
      orderBy: { timestamp: 'asc' },
    });

    return res.json(readings);
  } catch (error) {
    console.error('Fetch readings error:', error);
    return res.status(500).json({ error: 'Server error retrieving sensor readings.' });
  }
};

// Configure thresholds
export const updateSensorThresholds = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { minThreshold, maxThreshold, name } = req.body;
    const userId = req.user?.id;

    const sensor = await prisma.sensor.findFirst({
      where: {
        id,
        device: {
          farm: { userId },
        },
      },
    });

    if (!sensor) {
      return res.status(404).json({ error: 'Sensor not found or unauthorized access.' });
    }

    const updated = await prisma.sensor.update({
      where: { id },
      data: {
        name: name !== undefined ? name : sensor.name,
        minThreshold: minThreshold !== undefined ? (minThreshold === null ? null : parseFloat(minThreshold)) : sensor.minThreshold,
        maxThreshold: maxThreshold !== undefined ? (maxThreshold === null ? null : parseFloat(maxThreshold)) : sensor.maxThreshold,
      },
    });

    return res.json({
      message: 'Sensor configured successfully.',
      sensor: updated,
    });
  } catch (error) {
    console.error('Update sensor error:', error);
    return res.status(500).json({ error: 'Server error configuring sensor.' });
  }
};
