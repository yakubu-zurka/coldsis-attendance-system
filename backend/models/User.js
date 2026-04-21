const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, default: 'Staff' },         // Job title: Developer, Manager, etc.
  systemRole: { type: String, enum: ['staff', 'admin'], default: 'staff' }, // Access level
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  department: { type: String },
  telephone: { type: String },
  position: { type: String },
  joinDate: { type: Date, default: Date.now },
  lastActive: { type: Date },
  profileUrl: { type: String },
  location: {
    lat: { type: Number },
    lng: { type: Number },
    address: { type: String },
    updatedAt: { type: Date }
  },
  pinHash: { type: String },
  pinSalt: { type: String }
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
module.exports = User;
