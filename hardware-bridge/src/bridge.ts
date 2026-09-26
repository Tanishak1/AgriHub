import axios from 'axios';
import dotenv from 'dotenv';
import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';

dotenv.config();

export type DeviceStatus = 'CONNECTED' | 'WAITING_FOR_DATA' | 'DISCONNECTED' | 'CONNECTING' | 'ERROR' | 'UPDATING';

export interface HardwareSensorReading {
  sensorType: 'SOIL_MOISTURE' | 'TEMPERATURE' | 'HUMIDITY' | 'RAINFALL' | 'SOUND' | 'VIBRATION';
  value: number;
  unit: string;
}

export interface HardwareDeviceConnection {
  deviceId: string;
  getStatus(): DeviceStatus;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  onData(handler: (readings: HardwareSensorReading[], rawPacket: string) => Promise<void>): void;
}

const SENSOR_TYPES = new Set<HardwareSensorReading['sensorType']>([
  'SOIL_MOISTURE', 'TEMPERATURE', 'HUMIDITY', 'RAINFALL', 'SOUND', 'VIBRATION'
]);

type SerialPacket = {
  type?: string;
  device?: string;
  readings?: Array<{ sensorType: string; value: unknown; unit?: string }>;
  sensors?: Record<string, unknown>;
  [key: string]: unknown;
};

const normalizePacketReadings = (packet: SerialPacket): HardwareSensorReading[] => {
  const directEntries = new Map<HardwareSensorReading['sensorType'], number>();

  if (Array.isArray(packet.readings)) {
    for (const item of packet.readings) {
      if (!item || typeof item.sensorType !== 'string' || typeof item.value === 'undefined') continue;
      const numericValue = typeof item.value === 'number' ? item.value : Number(item.value);
      if (Number.isFinite(numericValue)) {
        const sensorType = item.sensorType as HardwareSensorReading['sensorType'];
        if (SENSOR_TYPES.has(sensorType)) {
          directEntries.set(sensorType, numericValue);
        }
      }
    }
  }

  if (packet.sensors && typeof packet.sensors === 'object') {
    for (const [sensorType, value] of Object.entries(packet.sensors)) {
      if (typeof value === 'number' || typeof value === 'boolean') {
        const normalizedType = sensorType as HardwareSensorReading['sensorType'];
        if (SENSOR_TYPES.has(normalizedType)) {
          directEntries.set(normalizedType, typeof value === 'number' ? value : Number(value));
        }
      }
    }
  }

  const keyMap: Array<{ keys: string[]; sensorType: HardwareSensorReading['sensorType']; unit: string }> = [
    { keys: ['temperature', 'temp', 'airTemperature'], sensorType: 'TEMPERATURE', unit: '°C' },
    { keys: ['humidity', 'relativeHumidity'], sensorType: 'HUMIDITY', unit: '%' },
    { keys: ['soilMoisture', 'soil_moisture', 'soilMoisturePercentage'], sensorType: 'SOIL_MOISTURE', unit: '%' },
    { keys: ['rainRaw', 'rainfall', 'rain', 'rainfallRaw'], sensorType: 'RAINFALL', unit: 'raw' },
    { keys: ['microphoneRaw', 'sound', 'microphone', 'noiseLevel'], sensorType: 'SOUND', unit: 'raw' },
    { keys: ['vibrationDetected', 'vibrationRaw', 'vibration', 'vibrationLevel'], sensorType: 'VIBRATION', unit: 'state' },
  ];

  for (const { keys, sensorType } of keyMap) {
    for (const key of keys) {
      if (!(key in packet)) continue;
      const rawValue = packet[key];
      const numericValue = typeof rawValue === 'number' ? rawValue : typeof rawValue === 'boolean' ? Number(rawValue) : Number(rawValue ?? NaN);
      if (Number.isFinite(numericValue)) {
        directEntries.set(sensorType, numericValue);
      }
    }
  }

  if (directEntries.size === 0) return [];

  return [...directEntries.entries()].map(([sensorType, value]) => ({
    sensorType,
    value,
    unit: '',
  }));
};

export class SerialHardwareDevice implements HardwareDeviceConnection {
  deviceId: string;
  status: DeviceStatus = 'DISCONNECTED';
  private port: SerialPort | null = null;
  private dataHandler: ((readings: HardwareSensorReading[], rawPacket: string) => Promise<void>) | null = null;
  private readonly path: string;
  private readonly baudRate: number;

  constructor(deviceId: string, path: string, baudRate: number) {
    this.deviceId = deviceId;
    this.path = path;
    this.baudRate = baudRate;
  }

  getStatus(): DeviceStatus {
    return this.status;
  }

  async connect(): Promise<void> {
    this.status = 'CONNECTING';
    console.log(`[HARDWARE] Connecting to ${this.path} at ${this.baudRate} baud...`);
    this.port = new SerialPort({ path: this.path, baudRate: this.baudRate, autoOpen: false });
    const parser = this.port.pipe(new ReadlineParser({ delimiter: '\n' }));
    parser.on('data', (line: string) => this.handleLine(line));
    this.port.on('error', (error) => {
      this.status = 'ERROR';
      console.error(`[SERIAL] ${error.message}`);
    });
    this.port.on('close', () => {
      if (this.status !== 'DISCONNECTED') {
        this.status = 'DISCONNECTED';
        console.error('[SERIAL] ESP32 serial port closed.');
      }
    });
    await new Promise<void>((resolve, reject) => this.port!.open((error) => error ? reject(error) : resolve()));
    this.status = 'CONNECTED';
    console.log(`[HARDWARE] Connected to ${this.path}.`);
  }

  async disconnect(): Promise<void> {
    this.status = 'DISCONNECTED';
    if (this.port?.isOpen) await new Promise<void>((resolve) => this.port!.close(() => resolve()));
    this.port = null;
    console.log(`[HARDWARE] Serial connection closed.`);
  }

  onData(handler: (readings: HardwareSensorReading[], rawPacket: string) => Promise<void>): void {
    this.dataHandler = handler;
  }

  private handleLine(line: string): void {
    const raw = line.trim();
    if (!raw) return;
    console.log(`[HARDWARE] RAW: ${raw}`);
    try {
      const packet = JSON.parse(raw) as SerialPacket;
      const deviceIdFromPacket = typeof packet.device === 'string' && packet.device.trim() ? packet.device.trim() : null;
      if (deviceIdFromPacket) {
        this.deviceId = deviceIdFromPacket;
        console.log(`[ESP32] Device ID reported by hardware: ${this.deviceId}`);
      }

      const readings = normalizePacketReadings(packet);
      if (readings.length === 0) {
        throw new Error('packet contains no valid sensor values');
      }

      console.log('[ESP32] PARSED:', JSON.stringify(readings));
      this.status = 'CONNECTED';
      void this.dataHandler?.(readings, raw);
    } catch (error: any) {
      console.error(`[PARSING] Rejected serial packet: ${error.message}`);
      console.error(`[PARSING] Raw packet: ${raw}`);
    }
  }
}

// 2. Main Local Service Bridge controller
class LocalDeviceBridge {
  private device: HardwareDeviceConnection;
  private backendUrl = process.env.BACKEND_URL || 'http://localhost:5000/api/devices/telemetry';
  private statusUrl = (process.env.BACKEND_URL || 'http://localhost:5000/api/devices/telemetry').replace(/\/telemetry$/, '/telemetry/status');
  private reconnectTimer: NodeJS.Timeout | null = null;
  private stopping = false;

  constructor(device: HardwareDeviceConnection) {
    this.device = device;
  }

  async start() {
    console.log('========================================================');
    console.log('       AgriHub Standalone Device Communication Bridge    ');
    console.log('========================================================');
    
    try {
      this.device.onData(async (readings, rawPacket) => {
        try {
          await axios.post(this.statusUrl, { deviceId: this.device.deviceId, status: 'CONNECTED', rawPacket, parsedPacket: { readings }, validatedSensorData: readings });
          await axios.post(this.backendUrl, {
            deviceId: this.device.deviceId,
            readings,
          });
          console.log(`[API] Sensor data sent.`);
        } catch (err: any) {
          console.error(`[API] Upload failed: ${err.message}`);
        }
      });
      await this.connectWithRetry();
    } catch (err: any) {
      console.error(`[HARDWARE] Connection failure: ${err.message}`);
      await axios.post(this.statusUrl, { deviceId: this.device.deviceId, status: 'ERROR', error: err.message }).catch(() => undefined);
    }
  }

  stop() {
    this.stopping = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.device.disconnect();
    console.log('[Bridge] Service halted.');
  }

  private async connectWithRetry(): Promise<void> {
    if (this.stopping) return;
    try {
      await this.device.connect();
      await axios.post(this.statusUrl, { deviceId: this.device.deviceId, status: 'WAITING_FOR_DATA' }).catch(() => undefined);
      this.monitorConnection();
    } catch (err: any) {
      console.error(`[HARDWARE] ESP32 not found on configured serial port: ${err.message}`);
      await axios.post(this.statusUrl, { deviceId: this.device.deviceId, status: 'ERROR', error: err.message }).catch(() => undefined);
      this.reconnectTimer = setTimeout(() => this.connectWithRetry(), 5000);
    }
  }

  private monitorConnection(): void {
    if (this.stopping) return;
    this.reconnectTimer = setTimeout(() => {
      if (this.device.getStatus() === 'CONNECTED' || this.device.getStatus() === 'WAITING_FOR_DATA') {
        this.monitorConnection();
      } else {
        void this.connectWithRetry();
      }
    }, 5000);
  }
}

// Boot Client Bridge
const targetDeviceId = process.env.DEVICE_ID || 'AGR-001';
const serialPath = process.env.HARDWARE_PORT;
const baudRate = Number(process.env.HARDWARE_BAUD_RATE || 115200);
if (!serialPath) throw new Error('HARDWARE_PORT is required; no physical hardware connection was configured.');
const serialDevice = new SerialHardwareDevice(targetDeviceId, serialPath, baudRate);
const bridgeService = new LocalDeviceBridge(serialDevice);

bridgeService.start();

// Handle graceful termination
process.on('SIGINT', () => {
  bridgeService.stop();
  process.exit(0);
});
