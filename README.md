# AgriHub — Smart IoT Agriculture & AI Advisor

AgriHub is a smart farming web application designed to integrate real-time physical telemetry with agronomy recommendations. The platform supports agricultural monitoring, warning alerts, bilingual advisories, and microcontroller serial streaming.

---

## Technical Architecture

```text
Field Sensor Probes (Soil Moisture, DHT22)
       ↓
Physical ESP32 Microcontroller
       ↓
USB-C Serial / COM Port Link
       ↓
Laptop (running direct Web Serial OR standalone bridge)
       ↓
Express REST API & Socket.IO (WebSockets)
       ↓
SQLite / PostgreSQL Relational Database
       ↓
Vite + React Dashboard (TypeScript & Tailwind)
```

---

## Core Feature Index

1. **Bilingual Navigation & Localization (English & Hindi)**: Supports persistent language selection switching labels, dashboard widgets, telemetry notifications, and error flags.
2. **Setup Instructions (Tabs 1, 2, 3)**: Provides visual guides and physical field placement coordinates for sensors (Soil Moisture fork, DHT22 shield, Rain collector, Boundary Microphone, Geophone).
3. **Interactive Telemetry Dashboard**: Renders real-time value changes in a 6-sensor grid synced via Socket.IO, displaying thresholds warnings.
4. **AI Agronomist Advisor**: Generates task advisories, risk ratings, and speaks them aloud via HTML5 Web Speech Synthesis in Hindi/English.
5. **Web Serial Pairing**: Connects directly to USB-C ports from Chrome/Edge browsers, displaying a raw serial command interface stream.
6. **Physical Hardware Bridge**: Reads newline-delimited JSON from a configured USB serial port and forwards validated telemetry.
7. **Protected Authentication & Admin panel**: JWT sessions validation and access management dashboards auditing system logs.

---

## Installation & Deployment Guide

### 1. Requirements
Ensure **Node.js (v18+)** and **npm** are installed.

### 2. Standard SQLite Quick-Start (Zero Configuration)
To run the entire system instantly using a local SQLite database file:

1. Clone or navigate to the project directory root.
2. Install packages for root, backend, frontend, and bridge concurrently:
   ```bash
   npm run install:all
   ```
3. Initialize the local database and run the migrations:
   ```bash
   npm run db:migrate
   ```
   *(Note: This automatically initializes `prisma/schema.prisma` and seeds default credentials and 24 hours of logs).*
4. Start both the Backend Server and Vite Frontend concurrently:
   ```bash
   npm run dev
   ```
5. Open your browser and navigate to:
   - **Frontend Dashboard**: `http://localhost:5173`
   - **Backend Status API**: `http://localhost:5000/status`

---

### 3. Deploying with PostgreSQL (Docker-Compose Option)
To switch from local development SQLite to a PostgreSQL cluster using Docker:

1. Launch the Postgres database cluster:
   ```bash
   docker-compose up -d postgres
   ```
2. Modify the database provider and target URL:
   - Open `backend/prisma/schema.prisma` and change:
     ```prisma
     datasource db {
       provider = "postgresql"
       url      = env("DATABASE_URL")
     }
     ```
   - In `backend/.env`, uncomment the PostgreSQL configuration line and comment out SQLite:
     ```env
     DATABASE_URL="postgresql://postgres:postgrespassword@localhost:5432/agrihub?schema=public"
     ```
3. Regenerate client assets and push structures:
   ```bash
   npm run db:migrate
   ```
4. Boot services using concurrently or standard commands.

---

## Pre-Configured Test Accounts
Use the seeded credentials to log in:

- **Farmer Profile**:
  - **Email**: `farmer@agrihub.com`
  - **Password**: `password123`
- **Admin Dashboard**:
  - **Email**: `admin@agrihub.com`
  - **Password**: `password123`

---

## Automated Verification Tests
Run the custom test suite validating cryptography, auth controllers, database CRUD, and threshold alerts:
```bash
npm run test --prefix backend
```

---

## Running the Standalone Bridge Client (Headless deployment)
To stream telemetry from a standalone terminal:
```bash
npm run dev --prefix hardware-bridge
```
This boots a background logger transmitting structured sensor data every 5 seconds to the REST server.
