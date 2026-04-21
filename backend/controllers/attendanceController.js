const Attendance = require('../models/Attendance');
const User = require('../models/User');

// @desc    Record Check-in
// @route   POST /api/attendance/check-in
// @access  Public (from shared terminal)
const checkIn = async (req, res) => {
  const { staffId, staffName, department, date, time, timestamp, location, deviceInfo, isWithinGeofence } = req.body;
  
  try {
    // Optional: Validate staff exists
    const staff = await User.findOne({ id: staffId });
    const nameToUse = staff ? staff.name : staffName;
    const deptToUse = staff ? staff.department : department;

    // Check if user already checked in today
    const existing = await Attendance.findOne({ staffId, date });
    if (existing && existing.checkIn) {
      if (existing.status !== 'completed') {
        return res.status(400).json({ message: 'Already checked in today' });
      } else {
         return res.status(400).json({ message: 'Shift already completed for today' });
      }
    }

    let record = existing;
    if (!record) {
      record = new Attendance({
        staffId,
        staffName: nameToUse,
        department: deptToUse || "N/A",
        date,
        status: 'active'
      });
    }

    record.checkIn = { time, timestamp, location, deviceInfo, isWithinGeofence };
    await record.save();

    if (req.io) {
      req.io.emit('attendance_update', record);
      req.io.emit('staff_location_update', {
        id: staffId,
        name: nameToUse,
        location,
        timestamp,
        status: 'checked-in'
      });
    }

    res.status(201).json(record);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Record Check-out
// @route   POST /api/attendance/check-out
// @access  Public (from shared terminal)
const checkOut = async (req, res) => {
  const { staffId, date, time, timestamp, location, deviceInfo, isWithinGeofence } = req.body;
  
  try {
    const record = await Attendance.findOne({ staffId, date });
    if (!record) {
      return res.status(400).json({ message: 'No check-in found for today' });
    }

    record.status = 'completed';
    record.checkOut = { time, timestamp, location, deviceInfo, isWithinGeofence };
    await record.save();

    if (req.io) {
      req.io.emit('attendance_update', record);
      req.io.emit('staff_location_update', {
        id: staffId,
        name: record.staffName,
        location,
        timestamp,
        status: 'checked-out'
      });
    }

    res.json(record);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all attendance records (Admin) or for specific user
// @route   GET /api/attendance
// @access  Private
const getAttendance = async (req, res) => {
  try {
    const { date, staffId } = req.query;
    let query = {};
    
    if (date) query.date = date;
    if (staffId) query.staffId = staffId;
    
    if (req.user.systemRole !== 'admin') {
      query.staffId = req.user.id;
    }

    const records = await Attendance.find(query).sort({ date: -1 });
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete an attendance record
// @route   DELETE /api/attendance/:id
// @access  Private/Admin
const deleteAttendance = async (req, res) => {
  try {
    const record = await Attendance.findByIdAndDelete(req.params.id);
    if (record) {
      res.json({ message: 'Record deleted' });
    } else {
      res.status(404).json({ message: 'Record not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get today's attendance status for a specific staff member
// @route   GET /api/attendance/today/:staffId
// @access  Public (for shared terminal)
const getTodayStatus = async (req, res) => {
  try {
    const { staffId } = req.params;
    const { date } = req.query; // pass current date from client
    
    if (!staffId || !date) {
      return res.status(400).json({ message: 'staffId and date are required' });
    }

    const record = await Attendance.findOne({ staffId, date });
    if (record) {
      res.json(record);
    } else {
      res.json(null);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  checkIn,
  checkOut,
  getAttendance,
  deleteAttendance,
  getTodayStatus
};
