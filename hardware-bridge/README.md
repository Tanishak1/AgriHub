# AgriHub Standalone Hardware Bridge

This directory contains a standalone Node.js client service that bridges communication between physical USB-C microcontroller devices (such as ESP32, Arduino, or Raspberry Pi) and the AgriHub Web Application Backend.

## System Topology
```text
Agricultural Sensor (Soil Moisture / DHT22)
       ↓
Physical ESP32 Microcontroller
       ↓
USB-C Serial Link (COM Port)
       ↓
Laptop (running local Device Bridge / Service)
       ↓
Axios HTTP POST / WebSocket
       ↓
AgriHub Express Backend API
       ↓
PostgreSQL / SQLite Database
       ↓
Real-Time React Dashboard (Vite)
```

---

## Direct In-Browser Web Serial alternative (No Bridge Needed!)
AgriHub supports direct **Web Serial API pairing** directly in the web browser (Chrome and Edge).
1. Connect your physical ESP32 hub to your laptop via USB-C.
2. In the AgriHub Web Dashboard, navigate to the **Devices** section.
3. Under the **Direct Web Serial Connector** card, click **Pair USB Device**.
4. Choose your ESP32's COM port.
5. The frontend will parse incoming telemetry and upload values to the dashboard automatically.

*If you prefer a background server client (e.g. headless setups, terminal deployments), proceed with running this standalone bridge script.*

---

## Standing up the Bridge Client

### 1. Requirements
Ensure Node.js and NPM are installed on your terminal.

### 2. Configuration (.env)
Create a `.env` file inside this directory. Set `SERIAL_PORT` to the COM port assigned by Windows:
```env
BACKEND_URL="http://localhost:5000/api/devices/telemetry"
DEVICE_ID="AGR-001"
SERIAL_PORT="COM4"
SERIAL_BAUD_RATE="115200"
```

### 3. Installation
Install bridge packages:
```bash
npm install
```

### 4. Running the Bridge
Run the service:
```bash
npm run dev
```

The script opens the configured physical serial port and forwards each newline-delimited JSON packet to the backend. It does not generate readings.

The firmware must send a complete packet containing these exact sensor types:
```json
{"readings":[{"sensorType":"SOIL_MOISTURE","value":42.1,"unit":"%"},{"sensorType":"TEMPERATURE","value":26.4,"unit":"C"},{"sensorType":"HUMIDITY","value":61.2,"unit":"%"},{"sensorType":"RAINFALL","value":0,"unit":"%"},{"sensorType":"SOUND","value":38,"unit":"dB"},{"sensorType":"VIBRATION","value":1.2,"unit":"Hz"}]}
```

No ESP32/Arduino firmware, pin assignment, or packet capture exists in this repository. GPIO mappings and raw-value conversion must be supplied by the firmware.

---

## Extensible Interface Design
The bridge is designed using clean interfaces. You can easily write custom serial port parser adapters by implementing the `HardwareDeviceConnection` contract:

```typescript
export interface HardwareDeviceConnection {
  deviceId: string;
  getStatus(): DeviceStatus;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
       onData(handler: (readings: HardwareSensorReading[], rawPacket: string) => Promise<void>): void;
}
```
For vendor hardware implementations, write a class importing the `@types/serialport` package and parse standard comma-delimited sensor strings.
