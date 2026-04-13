const admin = require('firebase-admin');

// Point admin to RTDB emulator
process.env.FIREBASE_DATABASE_EMULATOR_HOST = 'localhost:9000';

admin.initializeApp({
  databaseURL: 'http://localhost:9000?ns=coldsis-local'
});

const db = admin.database();

async function seed() {
  const staffRef = db.ref('staff/COLD-001');
  await staffRef.set({
    id: 'COLD-001',
    name: 'Test User',
    department: 'General',
    pinHash: 'fakehash',
    pinSalt: 'fakesalt'
  });
  console.log('Seeded staff COLD-001');

  const date = new Date().toISOString().slice(0,10);
  const recordId = `COLD-001_${date}`;

  const attendanceRef = db.ref(`attendance/${recordId}`);

  const payload = {
    staffId: 'COLD-001',
    staffName: 'Test User',
    department: 'General',
    date: date,
    status: 'active',
    checkInTime: '09:00',
    checkInTimestamp: Date.now(),
    latitude: 5.6978,
    longitude: -0.17618,
    accuracy: 10
  };

  await attendanceRef.set(payload);
  console.log('Wrote attendance record:', recordId);
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
