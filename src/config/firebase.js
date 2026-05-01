const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

let firebaseInitialized = false;

const initializeFirebase = () => {
  if (firebaseInitialized) return;

  let serviceAccount = null;

  // Option 1: full JSON stored in env var (preferred for Hostinger)
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    try {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    } catch (e) {
      console.warn('Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON:', e.message);
    }
  }

  // Option 2: path to JSON file
  if (!serviceAccount && process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    const p = path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
    if (fs.existsSync(p)) {
      try { serviceAccount = JSON.parse(fs.readFileSync(p, 'utf8')); } catch {}
    }
  }

  if (!serviceAccount) {
    console.warn('Firebase service account not configured — push notifications disabled.');
    return;
  }

  try {
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    firebaseInitialized = true;
    console.log('Firebase Admin initialized for project:', serviceAccount.project_id);
  } catch (err) {
    console.warn('Firebase init failed:', err.message);
  }
};

initializeFirebase();

module.exports = { admin, isFirebaseReady: () => firebaseInitialized };
