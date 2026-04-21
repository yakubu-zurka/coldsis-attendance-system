const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  staffId: { type: String, required: true, ref: 'User' }, // Assuming it maps to User.id
  staffName: { type: String, required: true },
  date: { type: String, required: true }, // Format YYYY-MM-DD
  status: { 
    type: String, 
    enum: ['active', 'completed', 'present', 'absent', 'late', 'half-day'], 
    default: 'active' 
  },
  checkIn: {
    time: { type: String },
    timestamp: { type: Number },
    location: {
      lat: { type: Number },
      lng: { type: Number },
      accuracy: { type: Number }
    },
    deviceInfo: { type: String },
    isWithinGeofence: { type: Boolean }
  },
  checkOut: {
    time: { type: String },
    timestamp: { type: Number },
    location: {
      lat: { type: Number },
      lng: { type: Number },
      accuracy: { type: Number }
    },
    deviceInfo: { type: String },
    isWithinGeofence: { type: Boolean }
  },
  notes: { type: String }
}, { timestamps: true });

const Attendance = mongoose.model('Attendance', attendanceSchema);
module.exports = Attendance;
