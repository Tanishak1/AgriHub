import { Response, Request } from 'express';
import { prisma } from '../utils/db';
import { AuthRequest } from '../middleware/auth';
import { broadcastTelemetry } from '../websocket/socketHandler';
import { broadcastDeviceStatus } from '../websocket/socketHandler';
import { updateHardwareDiagnostics, getHardwareDiagnostics as readHardwareDiagnostics } from '../services/hardwareDiagnostics';

// Get all devices on a user's farms
export const getDevices = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized.' });

    // Retrieve all devices that belong to the user's farms
    const devices = await prisma.device.findMany({
      where: {
        farm: {
          userId: userId,
        },
      },
      include: {
        sensors: true,
      },
    });

    return res.json(devices);
  } catch (error) {
    console.error('Fetch devices error:', error);
    return res.status(500).json({ error: 'Server error fetching devices.' });
  }
};

// Add device to user's farm
export const addDevice = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id, name, type, farmId } = req.body;

    if (!id || !name || !farmId) {
      return res.status(400).json({ error: 'Device ID, Name, and Farm ID are required.' });
    }

    // Verify user owns the farm
    const farm = await prisma.farm.findFirst({
      where: { id: farmId, userId },
    });

    if (!farm) {
      return res.status(403).json({ error: 'You do not own this farm.' });
    }

    // Check if device already exists
    const existingDevice = await prisma.device.findUnique({
      where: { id },
    });

    if (existingDevice) {
      return res.status(409).json({ error: 'A device with this serial ID already exists.' });
    }

    const device = await prisma.device.create({
      data: {
        id,
        name,
        type: type || 'SIMULATOR',
        status: 'DISCONNECTED',
        farmId,
      },
    });

    // Automatically provision default sensors for this type of agricultural device
    const defaultSensors = [
      { type: 'SOIL_MOISTURE', name: 'Soil Moisture Sensor', unit: '%', min: 25, max: 80 },
      { type: 'TEMPERATURE', name: 'DHT11 Air Temperature', unit: '°C', min: 15, max: 38 },
      { type: 'HUMIDITY', name: 'DHT11 Air Humidity', unit: '%', min: 20, max: 90 },
      { type: 'RAINFALL', name: 'Rain/Wetness Sensor', unit: 'raw', min: 0, max: null },
      { type: 'SOUND', name: 'Microphone Sensor', unit: 'raw', min: 0, max: null },
      { type: 'VIBRATION', name: 'Vibration Detection', unit: 'state', min: 0, max: 1 },
    ];

    for (const sensor of defaultSensors) {
      await prisma.sensor.create({
        data: {
          type: sensor.type,
          name: sensor.name,
          unit: sensor.unit,
          minThreshold: sensor.min,
          maxThreshold: sensor.max,
          currentReading: 0.0,
          deviceId: device.id,
        },
      });
    }

    const fullDevice = await prisma.device.findUnique({
      where: { id: device.id },
      include: { sensors: true },
    });

    return res.status(201).json({
      message: 'Device and sensors provisioned successfully.',
      device: fullDevice,
    });
  } catch (error) {
    console.error('Add device error:', error);
    return res.status(500).json({ error: 'Server error provisioning device.' });
  }
};

// Delete Device
export const deleteDevice = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    const device = await prisma.device.findFirst({
      where: { id, farm: { userId } },
    });

    if (!device) {
      return res.status(404).json({ error: 'Device not found or not owned by user.' });
    }

    await prisma.device.delete({ where: { id } });

    return res.json({ message: 'Device removed successfully.' });
  } catch (error) {
    console.error('Delete device error:', error);
    return res.status(500).json({ error: 'Server error removing device.' });
  }
};

// API Endpoint for direct Hardware Bridge connection updates
export const updateHardwareData = async (req: Request, res: Response) => {
  try {
    const { deviceId, readings } = req.body;

    if (!deviceId || !Array.isArray(readings) || readings.length === 0) {
      return res.status(400).json({ error: 'Device ID and reading array are required.' });
    }

    const device = await prisma.device.findUnique({
      where: { id: deviceId },
      include: { sensors: true },
    });

    if (!device) {
      return res.status(404).json({ error: 'Target device not registered on AgriHub.' });
    }

    const validReadings = [] as Array<{ sensorType: string; value: number; unit?: string }>;
    const seenTypes = new Set<string>();

    for (const reading of readings) {
      if (!reading || typeof reading.sensorType !== 'string' || typeof reading.value !== 'number' || !Number.isFinite(reading.value) || seenTypes.has(reading.sensorType)) {
        continue;
      }

      const sensor = device.sensors.find((s) => s.type === reading.sensorType);
      if (!sensor) {
        continue;
      }

      seenTypes.add(reading.sensorType);
      validReadings.push({
        sensorType: reading.sensorType,
        value: reading.value,
        unit: reading.unit || sensor.unit,
      });
    }

    if (validReadings.length === 0) {
      return res.status(422).json({ error: 'Telemetry packet rejected: no valid sensor readings for this device.' });
    }

    await prisma.device.update({
      where: { id: deviceId },
      data: { status: 'CONNECTED', lastSeen: new Date() },
    });

    const now = new Date();
    updateHardwareDiagnostics(deviceId, { validatedSensorData: validReadings, lastPacketTime: now.toISOString() });
    const processedReadings = [];

    for (const r of validReadings) {
      const { sensorType, value, unit } = r;
      const sensor = device.sensors.find((s) => s.type === sensorType);
      if (!sensor) continue;

      let status = 'NORMAL';
      if (sensor.minThreshold !== null && value < sensor.minThreshold) {
        status = 'WARNING';
      } else if (sensor.maxThreshold !== null && value > sensor.maxThreshold) {
        status = 'CRITICAL';
      }

      await prisma.sensorReading.create({
        data: {
          sensorId: sensor.id,
          value,
          unit: unit || sensor.unit,
          timestamp: now,
        },
      });

      await prisma.sensor.update({
        where: { id: sensor.id },
        data: {
          currentReading: value,
          status,
          updatedAt: now,
        },
      });

      const payload = {
        sensorId: sensor.id,
        sensorType,
        value,
        unit: unit || sensor.unit,
        status,
        timestamp: now.toISOString(),
      };

      broadcastTelemetry(deviceId, payload);
      processedReadings.push(payload);
    }

    return res.json({
      message: 'Telemetry updated successfully.',
      deviceStatus: 'CONNECTED',
      readings: processedReadings,
    });
  } catch (error) {
    console.error('Bridge telemetry update error:', error);
    return res.status(500).json({ error: 'Server error processing bridge telemetry.' });
  }
};

export const updateHardwareStatus = async (req: Request, res: Response) => {
  const { deviceId, status, error, rawPacket, parsedPacket, validatedSensorData } = req.body;
  if (!deviceId || !['CONNECTED', 'WAITING_FOR_DATA', 'DISCONNECTED', 'ERROR'].includes(status)) {
    return res.status(400).json({ error: 'Device ID and valid hardware status are required.' });
  }
  const device = await prisma.device.findUnique({ where: { id: deviceId } });
  if (!device) return res.status(404).json({ error: 'Target device not registered on AgriHub.' });
  await prisma.device.update({ where: { id: deviceId }, data: { status } });
  updateHardwareDiagnostics(deviceId, { rawPacket, parsedPacket, validatedSensorData, lastPacketTime: status === 'CONNECTED' ? new Date().toISOString() : undefined });
  broadcastDeviceStatus(deviceId, status);
  console.error(`[HARDWARE] ${deviceId} status ${status}${error ? `: ${error}` : ''}`);
  return res.json({ deviceId, status });
};

export const getHardwareDiagnostics = async (req: AuthRequest, res: Response) => {
  const device = await prisma.device.findFirst({ where: { id: req.params.id, farm: { userId: req.user?.id } }, include: { sensors: true } });
  if (!device) return res.status(404).json({ error: 'Device not found.' });
  return res.json({ deviceId: device.id, connectionState: device.status, serialPort: 'Configured in hardware-bridge/.env', baudRate: 'Configured in hardware-bridge/.env', ...readHardwareDiagnostics(device.id), validatedSensorData: device.status === 'CONNECTED' ? readHardwareDiagnostics(device.id).validatedSensorData : [] });
};
