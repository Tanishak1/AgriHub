import { prisma } from '../utils/db';
import { broadcastTelemetry, broadcastDeviceStatus, broadcastAlert } from '../websocket/socketHandler';
import { logger } from '../utils/logger';

export interface SimulatorConfig {
  isRunning: boolean;
  isPaired: boolean;
  pairStartTime: number | null;
  deviceId: string;
  sensorOverrides: Record<string, number>;
  sensorFailures: Record<string, boolean>;
  connectionState: 'CONNECTED' | 'DISCONNECTED' | 'ERROR' | 'UPDATING';
}

interface SensorInternalValues {
  soilMoisture: number;
  temperature: number;
  rainfall: number;
  sound: number;
  vibration: number;
  humidity: number;
}

const simState: SimulatorConfig = {
  isRunning: true,
  isPaired: false,
  pairStartTime: null,
  deviceId: 'AGR-001',
  sensorOverrides: {},
  sensorFailures: {},
  connectionState: 'DISCONNECTED',
};

const internalValues: SensorInternalValues = {
  soilMoisture: 28.5,
  temperature: 34.0,
  rainfall: 15.5,
  sound: 35,
  vibration: 1.20,
  humidity: 50.0,
};

let intervalId: NodeJS.Timeout | null = null;

// Helper to check thresholds and trigger alerts
async function checkThresholds(sensor: any, value: number, deviceId: string, isInitializing: boolean) {
  // During initialization or when value is 0, do not trigger false threshold warnings
  if (isInitializing || value === 0) {
    return 'NORMAL';
  }

  let status = 'NORMAL';
  let triggerAlert = false;
  let severity = 'INFO';
  let title = '';
  let description = '';

  if (sensor.minThreshold !== null && value < sensor.minThreshold) {
    status = 'WARNING';
    triggerAlert = true;
    severity = 'WARNING';
    title = `Low ${sensor.name}`;
    description = `${sensor.name} dropped to ${value}${sensor.unit}, which is below the safe minimum threshold of ${sensor.minThreshold}${sensor.unit}.`;
  } else if (sensor.maxThreshold !== null && value > sensor.maxThreshold) {
    status = 'CRITICAL';
    triggerAlert = true;
    severity = 'CRITICAL';
    title = `High ${sensor.name}`;
    description = `${sensor.name} surged to ${value}${sensor.unit}, exceeding the maximum safe threshold of ${sensor.maxThreshold}${sensor.unit}.`;
  }

  // Create alert in database and emit socket if triggered
  if (triggerAlert) {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const existingAlert = await prisma.alert.findFirst({
      where: {
        sensorId: sensor.id,
        createdAt: { gte: fiveMinutesAgo },
        title,
      },
    });

    if (!existingAlert) {
      const alert = await prisma.alert.create({
        data: {
          title,
          description,
          severity,
          deviceId,
          sensorId: sensor.id,
        },
      });

      broadcastAlert({
        id: alert.id,
        title: alert.title,
        description: alert.description,
        severity: alert.severity,
        deviceId: alert.deviceId,
        sensorId: alert.sensorId,
        createdAt: alert.createdAt.toISOString(),
      });
      logger.warn(`Alert triggered for ${sensor.type}: ${title}`);
    }
  }

  return status;
}

// Perform a single simulation iteration (every 1 second)
async function runIteration() {
  try {
    const { deviceId, sensorOverrides, sensorFailures, connectionState, isRunning, isPaired, pairStartTime } = simState;

    if (!isRunning) return;

    // Retrieve target device
    const device = await prisma.device.findUnique({
      where: { id: deviceId },
      include: { sensors: true },
    });

    if (!device) {
      logger.error(`Device ${deviceId} not found for simulation.`);
      return;
    }

    // Sync device status
    if (device.status !== connectionState) {
      await prisma.device.update({
        where: { id: deviceId },
        data: { status: connectionState, lastSeen: new Date() },
      });
      broadcastDeviceStatus(deviceId, connectionState);
      logger.info(`Device ${deviceId} status synced to ${connectionState}`);
    }

    const now = new Date();

    // If device is not paired or disconnected, ensure all readings stay at 0
    if (!isPaired || connectionState === 'DISCONNECTED' || connectionState === 'ERROR' || !pairStartTime) {
      for (const sensor of device.sensors) {
        if (sensor.currentReading !== 0 || sensor.status !== 'NORMAL') {
          await prisma.sensor.update({
            where: { id: sensor.id },
            data: { currentReading: 0, status: 'NORMAL', updatedAt: now },
          });
          broadcastTelemetry(deviceId, {
            sensorId: sensor.id,
            sensorType: sensor.type,
            value: 0,
            unit: sensor.unit,
            status: 'NORMAL',
            timestamp: now.toISOString(),
          });
        }
      }
      return;
    }

    // Calculate elapsed time since pairing
    const elapsedSec = (Date.now() - pairStartTime) / 1000;
    const isInitializing = elapsedSec < 10;
    const telemetrySec = elapsedSec - 10;

    for (const sensor of device.sensors) {
      // Check simulated failure
      if (sensorFailures[sensor.type]) {
        if (sensor.status !== 'FAILURE') {
          await prisma.sensor.update({
            where: { id: sensor.id },
            data: { status: 'FAILURE', currentReading: 0.0 },
          });
          broadcastTelemetry(deviceId, {
            sensorId: sensor.id,
            sensorType: sensor.type,
            value: 0.0,
            unit: sensor.unit,
            status: 'FAILURE',
            timestamp: now.toISOString(),
          });
          logger.warn(`Sensor failure simulated for type: ${sensor.type}`);
        }
        continue;
      }

      let newValue = 0;

      if (isInitializing) {
        // First 10 seconds: strictly 0 for ALL sensors
        newValue = 0;
      } else if (sensorOverrides[sensor.type] !== undefined) {
        newValue = sensorOverrides[sensor.type];
      } else {
        switch (sensor.type) {
          case 'SOIL_MOISTURE': {
            // Strictly between 27% and 30%. Small, slow, natural fluctuations. Avoid sudden jumps.
            const delta = (Math.random() - 0.5) * 0.3 + (28.5 - internalValues.soilMoisture) * 0.06;
            internalValues.soilMoisture = Math.min(30.0, Math.max(27.0, internalValues.soilMoisture + delta));
            newValue = parseFloat(internalValues.soilMoisture.toFixed(1));
            break;
          }
          case 'TEMPERATURE': {
            // Between 33°C and 35°C. Mostly stable around 34°C. Only very small/slow changes.
            const delta = (Math.random() - 0.5) * 0.12 + (34.0 - internalValues.temperature) * 0.08;
            internalValues.temperature = Math.min(35.0, Math.max(33.0, internalValues.temperature + delta));
            newValue = parseFloat(internalValues.temperature.toFixed(1));
            break;
          }
          case 'RAINFALL': {
            // Strictly around 15–16%.
            // First 20s of telemetry: fluctuate relatively quickly (e.g. 15.2 -> 15.8 -> 15.4 -> 16.0 -> 15.6)
            // After 20s: stable with tiny fluctuations around 15.6–15.7%
            if (telemetrySec <= 20) {
              const quickValues = [15.2, 15.8, 15.4, 16.0, 15.6, 15.3, 15.9, 15.5, 15.7, 15.1];
              const idx = Math.floor((telemetrySec * 2) % quickValues.length);
              internalValues.rainfall = quickValues[idx];
            } else {
              internalValues.rainfall = 15.6 + (Math.random() > 0.5 ? 0.1 : 0.0);
            }
            newValue = parseFloat(internalValues.rainfall.toFixed(1));
            break;
          }
          case 'SOUND': {
            // After 10s: fluctuating rapidly between 0 and 80 dB.
            // Continuously and quickly alternating between different values.
            const noiseSequence = [12, 48, 21, 67, 34, 75, 18, 59, 8, 72, 29, 64, 15, 52, 78, 24, 69, 11, 44, 71];
            const randIdx = Math.floor(Math.random() * noiseSequence.length);
            internalValues.sound = noiseSequence[randIdx];
            newValue = internalValues.sound;
            break;
          }
          case 'VIBRATION': {
            // Between 1.0 and 1.5 Hz. Slow and smooth fluctuations, normally remains stable.
            const delta = (Math.random() - 0.5) * 0.04 + (1.20 - internalValues.vibration) * 0.05;
            internalValues.vibration = Math.min(1.50, Math.max(1.00, internalValues.vibration + delta));
            newValue = parseFloat(internalValues.vibration.toFixed(2));
            break;
          }
          case 'HUMIDITY': {
            const delta = (Math.random() - 0.5) * 0.4 + (50.0 - internalValues.humidity) * 0.05;
            internalValues.humidity = Math.min(60.0, Math.max(40.0, internalValues.humidity + delta));
            newValue = parseFloat(internalValues.humidity.toFixed(1));
            break;
          }
          default:
            newValue = sensor.currentReading;
        }
      }

      // Check thresholds
      const status = await checkThresholds(sensor, newValue, deviceId, isInitializing);

      // Save reading log (every reading when active or first reading of 0)
      if (!isInitializing || sensor.currentReading !== newValue) {
        await prisma.sensorReading.create({
          data: {
            sensorId: sensor.id,
            value: newValue,
            unit: sensor.unit,
            timestamp: now,
          },
        });
      }

      // Update current sensor value in DB
      await prisma.sensor.update({
        where: { id: sensor.id },
        data: {
          currentReading: newValue,
          status,
          updatedAt: now,
        },
      });

      // Broadcast live telemetry WebSocket update
      broadcastTelemetry(deviceId, {
        sensorId: sensor.id,
        sensorType: sensor.type,
        value: newValue,
        unit: sensor.unit,
        status,
        timestamp: now.toISOString(),
      });
    }
  } catch (error) {
    logger.error('Error during simulator iteration:', error);
  }
}

export const startSimulator = () => {
  if (intervalId) clearInterval(intervalId);

  simState.isRunning = true;
  intervalId = setInterval(runIteration, 1000); // tick every 1000ms (1 second) for responsive telemetry
  logger.info('Agricultural Simulator Service initialized (1s tick frequency).');
};

export const stopSimulator = () => {
  simState.isRunning = false;
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  logger.info('Agricultural Simulator Service paused.');
};

export const getSimulatorState = () => {
  const elapsedSec = simState.pairStartTime ? (Date.now() - simState.pairStartTime) / 1000 : 0;
  return {
    ...simState,
    elapsedSec: Math.floor(elapsedSec),
    isInitializing: simState.isPaired && elapsedSec < 10,
  };
};

export const pairSimulator = async () => {
  simState.isPaired = true;
  simState.connectionState = 'CONNECTED';
  simState.pairStartTime = Date.now();
  simState.sensorOverrides = {};
  simState.sensorFailures = {};
  simState.isRunning = true;

  // Reset internal tracking values to exact baselines
  internalValues.soilMoisture = 28.5;
  internalValues.temperature = 34.0;
  internalValues.rainfall = 15.5;
  internalValues.sound = 35;
  internalValues.vibration = 1.20;
  internalValues.humidity = 50.0;

  logger.info('Simulator paired: 10-second initialization countdown started at ' + new Date().toISOString());

  // Immediately set device to CONNECTED in DB
  await prisma.device.updateMany({
    where: { id: simState.deviceId },
    data: { status: 'CONNECTED', lastSeen: new Date() },
  });
  broadcastDeviceStatus(simState.deviceId, 'CONNECTED');

  // Immediately set all sensors to 0 in DB and broadcast 0 telemetry
  const sensors = await prisma.sensor.findMany({
    where: { deviceId: simState.deviceId },
  });

  const now = new Date();
  for (const s of sensors) {
    await prisma.sensor.update({
      where: { id: s.id },
      data: { currentReading: 0, status: 'NORMAL', updatedAt: now },
    });
    broadcastTelemetry(simState.deviceId, {
      sensorId: s.id,
      sensorType: s.type,
      value: 0,
      unit: s.unit,
      status: 'NORMAL',
      timestamp: now.toISOString(),
    });
  }

  return getSimulatorState();
};

export const updateSimulatorState = (updates: Partial<SimulatorConfig>) => {
  if (updates.isRunning !== undefined) simState.isRunning = updates.isRunning;
  if (updates.connectionState !== undefined) simState.connectionState = updates.connectionState;

  if (updates.sensorOverrides !== undefined) {
    simState.sensorOverrides = { ...simState.sensorOverrides, ...updates.sensorOverrides };
  }

  if (updates.sensorFailures !== undefined) {
    simState.sensorFailures = { ...simState.sensorFailures, ...updates.sensorFailures };
  }

  logger.info('Simulator configuration modified:', simState);
  runIteration();
  return getSimulatorState();
};

// Reset overrides and failures to un-paired 0 state
export const resetSimulator = async () => {
  simState.sensorOverrides = {};
  simState.sensorFailures = {};
  simState.connectionState = 'DISCONNECTED';
  simState.isPaired = false;
  simState.pairStartTime = null;
  simState.isRunning = true;

  internalValues.soilMoisture = 28.5;
  internalValues.temperature = 34.0;
  internalValues.rainfall = 15.5;
  internalValues.sound = 35;
  internalValues.vibration = 1.20;
  internalValues.humidity = 50.0;

  // Set device to DISCONNECTED in DB
  await prisma.device.updateMany({
    where: { id: simState.deviceId },
    data: { status: 'DISCONNECTED', lastSeen: new Date() },
  });
  broadcastDeviceStatus(simState.deviceId, 'DISCONNECTED');

  // Set all sensors to 0 in DB and broadcast 0 telemetry
  const sensors = await prisma.sensor.findMany({
    where: { deviceId: simState.deviceId },
  });

  const now = new Date();
  for (const s of sensors) {
    await prisma.sensor.update({
      where: { id: s.id },
      data: { currentReading: 0, status: 'NORMAL', updatedAt: now },
    });
    broadcastTelemetry(simState.deviceId, {
      sensorId: s.id,
      sensorType: s.type,
      value: 0,
      unit: s.unit,
      status: 'NORMAL',
      timestamp: now.toISOString(),
    });
  }

  logger.info('Simulator reset to un-paired state with all sensors at 0.');
  return getSimulatorState();
};
