# AgriHub — Smart Agriculture Platform for Low-Connectivity Environments

AgriHub is a smart farming prototype that combines ESP32-based field sensing, local serial telemetry, a web dashboard, alerts, and sensor-driven advisory logic. It is designed to keep field data acquisition useful in low-connectivity environments by allowing the ESP32 to communicate locally with the hardware bridge before data is forwarded to the backend when the local system is available.

> **SIH 2026 context:** AgriHub is being developed against Problem Statement **26180** in the Agriculture / FoodTech / Rural Development domain.

## Current Prototype

The implemented prototype uses:

- ESP32 microcontroller
- DHT11 temperature and humidity sensor
- Soil-moisture sensor
- Rain / wetness sensor
- Microphone / sound sensor
- Vibration sensor
- USB serial hardware bridge
- React + TypeScript farmer dashboard
- Express + TypeScript backend
- Prisma with SQLite for local development
- Socket.IO for live dashboard updates
- JWT-based authentication and farm ownership checks

## System Architecture

```text
Field Sensors
  │
  ├─ DHT11 (temperature + humidity)
  ├─ Soil moisture
  ├─ Rain / wetness
  ├─ Microphone
  └─ Vibration
        │
        ▼
      ESP32
        │
        │ USB Serial / local connection
        ▼
 Hardware Bridge
        │
        ▼
 Express REST API + Socket.IO
        │
        ├─ Prisma / SQLite
        └─ Advisory + alert logic
        │
        ▼
 React + TypeScript Dashboard
```

This architecture does **not depend on a continuous field internet link for sensor acquisition**. The current prototype uses a local ESP32-to-computer serial path. Cloud/off-site synchronization can be added separately where connectivity is available.

## Telemetry Semantics

| Sensor | Stored/display unit | Notes |
|---|---|---|
| DHT11 temperature | °C | Physical temperature reading |
| DHT11 humidity | % | Relative humidity |
| Soil moisture | % | Converted moisture value when percentage conversion is available |
| Rain / wetness | raw | Sensor/ADC evidence; not rainfall probability |
| Microphone | raw | Sensor amplitude; not calibrated dB |
| Vibration | state/raw | Detection state or raw intensity; not calibrated Hz |

**Important:** raw rain, microphone, and vibration readings must not be presented as calibrated physical units unless the sensors have been calibrated and the conversion is implemented.

## Implemented Features

- Farmer authentication with JWT
- Farm ownership validation
- Device registration and sensor provisioning
- ESP32 serial telemetry ingestion
- Live telemetry delivery through Socket.IO
- Sensor history storage
- Threshold-based warning states
- Hardware connection diagnostics
- English/Hindi interface support
- Sensor-driven advisory endpoint
- Admin functionality included in the application

Some advanced agriculture capabilities are part of the broader project roadmap. The repository should not be interpreted as evidence that every planned AI model or field experiment has already been validated.

## Quick Start

### Requirements

- Node.js 18+
- npm
- A Chromium-based browser for browser serial features, where used
- ESP32 hardware only when testing physical telemetry

### Install

```bash
git clone https://github.com/Tanishak1/AgriHub.git
cd AgriHub
npm run install:all
```

### Initialize the local database

```bash
npm run db:migrate
```

### Run the application

```bash
npm run dev
```

Default local endpoints:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`

### Run the hardware bridge

Configure the serial port in the hardware-bridge environment file, then run:

```bash
npm run dev --prefix hardware-bridge
```

Typical bridge settings:

```env
HARDWARE_PORT=COM5
HARDWARE_BAUD_RATE=115200
DEVICE_ID=ESP32_AGRIHUB
BACKEND_URL=http://localhost:5000/api/devices/telemetry
```

The COM port can differ between computers. Use the port assigned to the ESP32 on the machine running the bridge.

## Sensor Wiring Used by the Prototype

| Component | ESP32 GPIO |
|---|---:|
| DHT11 | 4 |
| Soil moisture | 34 |
| Rain / wetness | 32 |
| Microphone | 35 |
| Vibration | 27 |
| LED | 25 |
| Buzzer | 26 |

Sensor sampling interval used in the prototype firmware: approximately **2000 ms**.

## Backend Tests

```bash
npm run test --prefix backend
```

## Project Status

AgriHub is an active prototype. Hardware readings, calibration, advisory rules, and field validation should be treated according to the evidence available from the actual implementation. The project is being refined for reliable demonstrations and future field testing.

## Team

Developed as the **AgriHub** smart-farming project by Team Revengers.
