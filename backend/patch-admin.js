require('dotenv').config();
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  id: String,
  email: String,
  systemRole: String,
  role: String,
}, { strict: false });

const User = mongoose.model('User', userSchema);

const patch = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB Atlas');

    // Update all existing admins that have role:'admin' but no systemRole
    const result = await User.updateMany(
      { $or: [{ role: 'admin' }, { email: 'admin@coldsis.com' }] },
      { $set: { systemRole: 'admin', role: 'Administrator' } }
    );

    console.log(`🔧 Updated ${result.modifiedCount} user(s) with systemRole: admin`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Patch failed:', err.message);
    process.exit(1);
  }
};

patch();
