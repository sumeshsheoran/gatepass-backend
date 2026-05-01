require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { syncDB } = require('./src/models');

const authRoutes = require('./src/routes/authRoutes');
const companyRoutes = require('./src/routes/companyRoutes');
const userRoutes = require('./src/routes/userRoutes');
const visitorRoutes = require('./src/routes/visitorRoutes');
const dashboardRoutes = require('./src/routes/dashboardRoutes');

const app = express();

app.set('trust proxy', true); // read X-Forwarded-Proto / X-Forwarded-Host from Hostinger's nginx
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const { uploadsBase } = require('./src/middleware/upload');
app.use('/uploads', express.static(uploadsBase));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/auth', authRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/users', userRoutes);
app.use('/api/visitors', visitorRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.get('/api/health', (req, res) => {
  const { isFirebaseReady } = require('./src/config/firebase');
  const proto = req.get('x-forwarded-proto') || req.protocol;
  const host = req.get('x-forwarded-host') || req.get('host');
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    baseUrl: process.env.BASE_URL || `${proto}://${host}`,
    uploadsUrl: (process.env.BASE_URL || `${proto}://${host}`) + '/uploads',
    firebaseReady: isFirebaseReady(),
  });
});

// Check FCM token status for a user by email
app.get('/api/check-push/:email', async (req, res) => {
  try {
    const { User } = require('./src/models');
    const user = await User.findOne({ where: { email: req.params.email } });
    if (!user) return res.json({ found: false });
    res.json({ found: true, name: user.name, role: user.role, hasFcmToken: !!user.fcmToken, fcmTokenPreview: user.fcmToken ? user.fcmToken.substring(0, 20) + '...' : null });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

const { User } = require('./src/models');

const autoSeed = async () => {
  const exists = await User.findOne({ where: { email: 'superadmin@securegate.com' } });
  if (!exists) {
    await User.create({
      name: 'Super Admin',
      email: 'superadmin@securegate.com',
      password: 'Admin@1234',
      phone: '9999999999',
      role: 'superAdmin',
      isActive: true,
    });
    console.log('SuperAdmin created: superadmin@securegate.com / Admin@1234');
  }
};

const PORT = process.env.PORT || 5000;

syncDB()
  .then(autoSeed)
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
