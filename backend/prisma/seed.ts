import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

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

  const now = new Date();
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
