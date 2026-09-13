"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('Seeding database...');
    // Clean up database first
    await prisma.notification.deleteMany({});
    await prisma.alert.deleteMany({});
    await prisma.sensorReading.deleteMany({});
    await prisma.sensor.deleteMany({});
    await prisma.device.deleteMany({});
    await prisma.cropCycle.deleteMany({});
    await prisma.field.deleteMany({});
    await prisma.farm.deleteMany({});
    await prisma.user.deleteMany({});
    // 1. Create Users
    const hashedPassword = await bcrypt.hash('password123', 10);
    const farmer = await prisma.user.create({
        data: {
            email: 'farmer@agrihub.com',
            password: hashedPassword,
            name: 'Ramesh Patel',
            phone: '+91 98765 43210',
            location: 'Madhya Pradesh, India',
            role: 'FARMER',
            language: 'EN',
        },
    });
    const admin = await prisma.user.create({
        data: {
            email: 'admin@agrihub.com',
            password: hashedPassword,
            name: 'AgriHub Admin',
            phone: '+91 99999 99999',
            location: 'New Delhi, India',
            role: 'ADMIN',
            language: 'EN',
        },
    });
    console.log(`Created users: ${farmer.email} (Farmer) and ${admin.email} (Admin)`);
    // 2. Create Farm
    const farm = await prisma.farm.create({
        data: {
            name: 'Vedic Organic Farm',
            location: 'Indore Region, MP',
            userId: farmer.id,
        },
    });
    // 3. Create Field
    const field = await prisma.field.create({
        data: {
            name: 'West Wheat Field',
            size: 5.5,
            farmId: farm.id,
        },
    });
    // 4. Create Crop Cycle
    const cropCycle = await prisma.cropCycle.create({
        data: {
            cropName: 'Wheat (Malvi Var.)',
            startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Started 30 days ago
            status: 'ACTIVE',
            fieldId: field.id,
        },
    });
    // 5. Create Device
    const device = await prisma.device.create({
        data: {
            id: 'AGR-001',
            name: 'Main Field ESP32 Hub',
            status: 'DISCONNECTED',
            type: 'ESP32',
            firmwareVersion: 'v1.4.2',
            farmId: farm.id,
        },
    });
    // 6. Create Sensors
    const sensorsData = [
        {
            type: 'SOIL_MOISTURE',
            name: 'Soil Moisture Sensor',
            unit: '%',
            currentReading: 0,
            minThreshold: 30.0,
            maxThreshold: 85.0,
        },
        {
            type: 'TEMPERATURE',
            name: 'DHT22 Temperature Sensor',
            unit: '°C',
            currentReading: 0,
            minThreshold: 15.0,
            maxThreshold: 38.0,
        },
        {
            type: 'HUMIDITY',
            name: 'DHT22 Humidity Sensor',
            unit: '%',
            currentReading: 0,
            minThreshold: 20.0,
            maxThreshold: 90.0,
        },
        {
            type: 'RAINFALL',
            name: 'Rain Gauge/Detector',
            unit: '%',
            currentReading: 0,
            minThreshold: 0.0,
            maxThreshold: 80.0, // trigger warning above 80 if heavy downpour
        },
        {
            type: 'SOUND',
            name: 'Pest Noise Microphone',
            unit: 'dB',
            currentReading: 0,
            minThreshold: 0.0,
            maxThreshold: 70.0, // warning above 70dB (possible pest swarm/intrusion)
        },
        {
            type: 'VIBRATION',
            name: 'Geophone Vibration Sensor',
            unit: 'Hz',
            currentReading: 0,
            minThreshold: 0.0,
            maxThreshold: 30.0, // warning if vibration spikes (mechanical interference/burrowing pests)
        },
    ];
    const createdSensors = [];
    for (const s of sensorsData) {
        const sensor = await prisma.sensor.create({
            data: {
                type: s.type,
                name: s.name,
                unit: s.unit,
                currentReading: s.currentReading,
                minThreshold: s.minThreshold,
                maxThreshold: s.maxThreshold,
                deviceId: device.id,
                status: 'NORMAL',
            },
        });
        createdSensors.push(sensor);
    }
    console.log(`Created device AGR-001 with ${createdSensors.length} sensors.`);
    // 7. Seed Sensor Readings (Historical trend for the last 24 hours)
    console.log('Generating historical sensor readings (24 hours)...');
    const now = new Date();
    for (const sensor of createdSensors) {
        const readings = [];
        let baseValue = sensor.currentReading;
        for (let i = 24; i >= 0; i--) {
            const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
            // Introduce realistic fluctuations based on sensor type
            let drift = 0;
            if (sensor.type === 'TEMPERATURE') {
                // Temperature dips at night and rises in afternoon (diurnal cycle)
                const hour = timestamp.getHours();
                const tempCycle = Math.sin(((hour - 6) / 24) * 2 * Math.PI); // cycle peaking at 15:00
                baseValue = 24 + tempCycle * 6 + (Math.random() - 0.5);
            }
            else if (sensor.type === 'HUMIDITY') {
                // Humidity inversely relates to temperature
                const hour = timestamp.getHours();
                const humCycle = Math.sin(((hour - 18) / 24) * 2 * Math.PI);
                baseValue = 60 + humCycle * 15 + (Math.random() - 0.5) * 3;
            }
            else if (sensor.type === 'SOIL_MOISTURE') {
                // Moisture slowly decreases over time
                baseValue = baseValue - 0.2 + (Math.random() - 0.4) * 0.5;
                if (baseValue < 30)
                    baseValue = 30; // floor at 30%
            }
            else if (sensor.type === 'RAINFALL') {
                baseValue = Math.max(0, Math.min(100, baseValue + (Math.random() - 0.5) * 5));
            }
            else {
                baseValue = Math.max(0, baseValue + (Math.random() - 0.5) * 4);
            }
            readings.push({
                sensorId: sensor.id,
                value: parseFloat(baseValue.toFixed(1)),
                unit: sensor.unit,
                timestamp,
            });
        }
        await prisma.sensorReading.createMany({
            data: readings,
        });
    }
    // Update currentReading to be the last value
    for (const sensor of createdSensors) {
        const latestReading = await prisma.sensorReading.findFirst({
            where: { sensorId: sensor.id },
            orderBy: { timestamp: 'desc' },
        });
        if (latestReading) {
            await prisma.sensor.update({
                where: { id: sensor.id },
                data: { currentReading: latestReading.value },
            });
        }
    }
    // 8. Create some Mock Alerts
    await prisma.alert.create({
        data: {
            title: 'Low Soil Moisture Warning',
            description: 'West Wheat Field moisture dropped below 35% threshold. Irrigation advised.',
            severity: 'WARNING',
            deviceId: device.id,
            sensorId: createdSensors.find(s => s.type === 'SOIL_MOISTURE')?.id,
            createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
        },
    });
    await prisma.alert.create({
        data: {
            title: 'High Temperature Advisory',
            description: 'Midday temperature exceeded 35°C. Check crop stress levels.',
            severity: 'INFO',
            deviceId: device.id,
            sensorId: createdSensors.find(s => s.type === 'TEMPERATURE')?.id,
            createdAt: new Date(now.getTime() - 4 * 60 * 60 * 1000), // 4 hours ago
        },
    });
    // 9. Create Notifications
    await prisma.notification.create({
        data: {
            title: 'Device AGR-001 Connected',
            message: 'ESP32 agricultural device has established active telemetry link.',
            userId: farmer.id,
        },
    });
    console.log('Database seeding completed successfully!');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
