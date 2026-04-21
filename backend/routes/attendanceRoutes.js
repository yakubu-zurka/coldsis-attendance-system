const express = require('express');
const router = express.Router();
const { checkIn, checkOut, getAttendance, deleteAttendance, getTodayStatus } = require('../controllers/attendanceController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(protect, getAttendance);
router.route('/:id').delete(protect, deleteAttendance);
// Public routes for the shared terminal check-in
router.route('/today/:staffId').get(getTodayStatus);
router.route('/check-in').post(checkIn);
router.route('/check-out').post(checkOut);

module.exports = router;
