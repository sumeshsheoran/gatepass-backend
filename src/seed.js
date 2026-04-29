require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { User, syncDB } = require('./models');

const seed = async () => {
  await syncDB();

  const existing = await User.findOne({ where: { email: 'superadmin@securegate.com' } });
  if (existing) {
    console.log('SuperAdmin already exists.');
    console.log('  Email   : superadmin@securegate.com');
    console.log('  Password: Admin@1234');
    process.exit(0);
  }

  await User.create({
    name: 'Super Admin',
    email: 'superadmin@securegate.com',
    password: 'Admin@1234',
    phone: '9999999999',
    role: 'superAdmin',
    isActive: true,
  });

  console.log('\nSeed complete!');
  console.log('--------------------------------');
  console.log('  SuperAdmin Login:');
  console.log('  Email   : superadmin@securegate.com');
  console.log('  Password: Admin@1234');
  console.log('--------------------------------\n');
  process.exit(0);
};

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
