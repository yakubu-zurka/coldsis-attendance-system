const express = require('express');
const router = express.Router();
const { authUser, getUserProfile, registerUser, getStaff, updateStaff, deleteStaff, updatePassword } = require('../controllers/authController');
const { protect, admin } = require('../middleware/authMiddleware');

router.post('/login', authUser);
router.route('/profile').get(protect, getUserProfile);
router.route('/profile/password').put(protect, updatePassword);
router.route('/register').post(protect, admin, registerUser);
// Public endpoint for the shared CheckIn terminal to list staff
router.route('/staff').get(getStaff);
router.route('/staff/:id').put(protect, admin, updateStaff).delete(protect, admin, deleteStaff);

module.exports = router;
