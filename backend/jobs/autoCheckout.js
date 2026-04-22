const cron = require('node-cron');
const Attendance = require('../models/Attendance');

const MAX_DURATION_MS = 14 * 60 * 60 * 1000; // 14 hours

const startAutoCheckoutJob = (io) => {
  // Run every 15 minutes
  cron.schedule('*/15 * * * *', async () => {
    console.log('🧹 Running Auto-Checkout Janitor Job...');
    
    try {
      const now = Date.now();
      
      // Find all active check-ins
      const activeRecords = await Attendance.find({ status: 'active' });
      
      let closedCount = 0;

      for (const record of activeRecords) {
        if (record.checkIn && record.checkIn.timestamp) {
          const duration = now - record.checkIn.timestamp;
          
          // If duration exceeds 14 hours
          if (duration >= MAX_DURATION_MS) {
            record.status = 'completed';
            record.checkOut = {
              time: 'Auto-Closed',
              timestamp: now,
              location: null,
              deviceInfo: 'System Janitor',
              isWithinGeofence: false
            };
            
            await record.save();
            closedCount++;

            // Emit to clients so dashboard updates in real-time
            if (io) {
              io.emit('attendance_update', record);
              io.emit('staff_location_update', {
                id: record.staffId,
                name: record.staffName,
                location: null,
                timestamp: now,
                status: 'auto-closed'
              });
            }
          }
        }
      }

      if (closedCount > 0) {
        console.log(`✅ Auto-closed ${closedCount} stale attendance records.`);
      }
    } catch (error) {
      console.error('❌ Auto-Checkout Job failed:', error.message);
    }
  });
};

module.exports = startAutoCheckoutJob;
