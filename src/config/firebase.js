const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

let firebaseInitialized = false;

const initializeFirebase = () => {
  if (firebaseInitialized) return;

  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

  if (!serviceAccountPath || !fs.existsSync(path.resolve(serviceAccountPath))) {
    console.warn('Firebase service account not found — push notifications disabled.');
    return;
  }

  try {
    const serviceAccount = require(path.resolve(serviceAccountPath));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    firebaseInitialized = true;
    console.log('Firebase Admin initialized');
  } catch (err) {
    console.warn('Firebase init failed:', err.message);
  }
};

initializeFirebase();

module.exports = { admin, isFirebaseReady: () => firebaseInitialized };
