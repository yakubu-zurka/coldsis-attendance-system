require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Inline User model to avoid circular deps
const userSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, default: 'admin' },
  department: { type: String },
  pinHash: { type: String },
  pinSalt: { type: String },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB Atlas');

    const existing = await User.findOne({ email: 'admin@coldsis.com' });
    if (existing) {
      console.log('⚠️  Admin already exists. Skipping seed.');
      process.exit(0);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Admin1234', salt);

    await User.create({
      id: 'ADMIN-001',
      name: 'Admin',
      email: 'admin@coldsis.com',
      password: hashedPassword,
      role: 'Administrator',   // Job title
      systemRole: 'admin',     // Access level
    });

    console.log('🎉 Admin user created successfully!');
    console.log('   Email:    admin@coldsis.com');
    console.log('   Password: Admin1234');
    console.log('   ⚠️  Change the password after first login!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  }
};

seed();
