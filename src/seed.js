require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const connectDB = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('MongoDB connected');
};

const UserSchema = new mongoose.Schema({
  name: String, email: String, password: String, phone: String,
  role: String, companyIds: [mongoose.Schema.Types.ObjectId],
  fcmToken: String, photoUrl: String, isActive: Boolean,
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', UserSchema);

const seed = async () => {
  await connectDB();

  const existing = await User.findOne({ email: 'superadmin@securegate.com' });
  if (existing) {
    console.log('SuperAdmin already exists.');
    console.log('  Email   : superadmin@securegate.com');
    console.log('  Password: Admin@1234');
    await mongoose.disconnect();
    return;
  }

  const hashed = await bcrypt.hash('Admin@1234', 10);
  await User.create({
    name: 'Super Admin',
    email: 'superadmin@securegate.com',
    password: hashed,
    phone: '9999999999',
    role: 'superAdmin',
    companyIds: [],
    isActive: true,
  });

  console.log('\n✅ Seed complete!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  SuperAdmin Login:');
  console.log('  Email   : superadmin@securegate.com');
  console.log('  Password: Admin@1234');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  await mongoose.disconnect();
};

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
