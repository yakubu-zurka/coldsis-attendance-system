const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret', {
    expiresIn: '30d',
  });
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const authUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.systemRole,   // 'admin' or 'staff' — used for access control
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      res.json({
        _id: user._id,
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Register a new user (Admin only typically, or public if allowed)
// @route   POST /api/auth/register
// @access  Private/Admin
const registerUser = async (req, res) => {
  const { id, name, email, password, role, systemRole, department, telephone, position, pinHash, pinSalt } = req.body;

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      id: id || Date.now().toString(),
      name,
      email,
      password,
      role: role || 'Staff',           // Job title
      systemRole: systemRole || 'staff', // Access level (admin/staff)
      department,
      telephone,
      position,
      pinHash,
      pinSalt,
    });

    if (user) {
      // Broadcast new staff to all clients if socket is attached
      if (req.io) {
        req.io.emit('staff_added', user);
      }
      res.status(201).json({
        _id: user._id,
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all staff
// @route   GET /api/auth/staff
// @access  Private
const getStaff = async (req, res) => {
  try {
    const staff = await User.find({}).select('-password');
    res.json(staff);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update staff
// @route   PUT /api/auth/staff/:id
// @access  Private/Admin
const updateStaff = async (req, res) => {
  try {
    const user = await User.findOne({ id: req.params.id });

    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      user.telephone = req.body.telephone || user.telephone;
      user.role = req.body.role || user.role;
      user.department = req.body.department || user.department;
      
      const updatedUser = await user.save();
      
      if (req.io) {
        req.io.emit('staff_updated', updatedUser);
      }
      res.json(updatedUser);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete staff
// @route   DELETE /api/auth/staff/:id
// @access  Private/Admin
const deleteStaff = async (req, res) => {
  try {
    const user = await User.findOneAndDelete({ id: req.params.id });

    if (user) {
      if (req.io) {
        req.io.emit('staff_deleted', req.params.id);
      }
      res.json({ message: 'User removed' });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  authUser,
  getUserProfile,
  registerUser,
  getStaff,
  updateStaff,
  deleteStaff
};
