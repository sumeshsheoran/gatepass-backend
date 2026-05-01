const { admin, isFirebaseReady } = require('../config/firebase');

const sendToDevice = async (fcmToken, { title, body, data = {} }) => {
  if (!isFirebaseReady()) {
    console.warn('[FCM] Firebase not ready — skipping notification. Title:', title);
    return;
  }
  if (!fcmToken) {
    console.warn('[FCM] No FCM token — skipping notification. Title:', title);
    return;
  }

  const message = {
    token: fcmToken,
    notification: { title, body },
    data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
    android: {
      priority: 'high',
      notification: { sound: 'default', channelId: 'visitor_alerts' },
    },
  };

  console.log('[FCM] Sending:', title, '→ token:', fcmToken.substring(0, 20) + '...');
  try {
    const response = await admin.messaging().send(message);
    console.log('[FCM] Success:', response);
  } catch (err) {
    console.error('[FCM] Error:', err.code || '', err.message);
  }
};

const sendToMultipleDevices = async (fcmTokens, payload) => {
  await Promise.allSettled(fcmTokens.map((token) => sendToDevice(token, payload)));
};

module.exports = { sendToDevice, sendToMultipleDevices };
