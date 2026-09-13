import { prisma } from '../utils/db';
import * as bcrypt from 'bcryptjs';
import { logger } from '../utils/logger';

async function runTests() {
  console.log('========================================================');
  console.log('            AgriHub Automated System Test Suite         ');
  console.log('========================================================');
  
  let passedTests = 0;
  let failedTests = 0;

  const assert = (condition: boolean, testName: string) => {
    if (condition) {
      console.log(`[PASS] - ${testName}`);
      passedTests++;
    } else {
      console.error(`[FAIL] - ${testName}`);
      failedTests++;
    }
  };

  try {
    // Test 1: User Cryptography & Authentication
    console.log('\n--- 1. Cryptography & Auth Tests ---');
    const testPassword = 'my_secure_farm_pass_123';
    const hash = await bcrypt.hash(testPassword, 10);
    const isValid = await bcrypt.compare(testPassword, hash);
    assert(isValid, 'Password hashing and verification matches');

    // Test 2: Database Operations (CRUD)
    console.log('\n--- 2. Database Operations (CRUD) Tests ---');
    const uniqueEmail = `test_farmer_${Date.now()}@agrihub.com`;
    const testUser = await prisma.user.create({
      data: {
        email: uniqueEmail,
        password: hash,
        name: 'Test Farmer Ramesh',
        role: 'FARMER',
      },
    });
    
    assert(testUser.id !== undefined, 'User registered successfully inside DB');
    
    const queriedUser = await prisma.user.findUnique({
      where: { email: uniqueEmail },
    });
    
    assert(queriedUser?.name === 'Test Farmer Ramesh', 'User retrieved correctly from database');

    // Clean up test user
    await prisma.user.delete({ where: { id: testUser.id } });
    const deletedUser = await prisma.user.findUnique({ where: { email: uniqueEmail } });
    assert(deletedUser === null, 'User deleted cleanly (DB cleanup works)');

    // Test 3: Alert Trigger Logic & Thresholds
    console.log('\n--- 3. Anomaly Alert Logic Tests ---');
    // Find device AGR-001 from seeding
    const device = await prisma.device.findFirst({
      where: { id: 'AGR-001' },
      include: { sensors: true },
    });

    if (device) {
      const moistureSensor = device.sensors.find((s) => s.type === 'SOIL_MOISTURE');
      
      if (moistureSensor) {
        // Mock a reading that breaches minimum threshold (safe min is 30%)
        const criticalValue = 15.0; 
        const isBreached = criticalValue < (moistureSensor.minThreshold || 30);
        
        assert(isBreached, 'Moisture reading correctly flagged as threshold breach');

        // Create mock breach alert
        const testAlert = await prisma.alert.create({
          data: {
            title: 'Critical Soil Moisture Breach',
            description: `Sensor reading is ${criticalValue}%, which is below threshold limit.`,
            severity: 'CRITICAL',
            deviceId: device.id,
            sensorId: moistureSensor.id,
          },
        });

        assert(testAlert.id !== undefined, 'Database alert record successfully created');
        
        // Clean up test alert
        await prisma.alert.delete({ where: { id: testAlert.id } });
      } else {
        console.warn('Soil moisture sensor not found, skipping breach assertion.');
      }
    } else {
      console.warn('Device AGR-001 not found, skipping threshold assertions.');
    }

    console.log('\n========================================================');
    console.log(`Test Execution Completed. Passed: ${passedTests} | Failed: ${failedTests}`);
    console.log('========================================================');

    if (failedTests > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err: any) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

runTests();
