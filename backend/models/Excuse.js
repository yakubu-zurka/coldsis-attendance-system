const mongoose = require('mongoose');

const excuseSchema = new mongoose.Schema({
  staffId: {
    type: String,
    required: true
  },
  staffName: {
    type: String,
    required: true
  },
  date: {
    type: String, // YYYY-MM-DD
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Ensure a staff can only submit one excuse per day
excuseSchema.index({ staffId: 1, date: 1 }, { unique: true });

const Excuse = mongoose.model('Excuse', excuseSchema);

module.exports = Excuse;
