const { admin, isFirebaseReady } = require('../config/firebase');

const sendToDevice = async (fcmToken, { title, body, data = {} }) => {
  if (!isFirebaseReady()) {
    console.log('[FCM disabled] Would send:', { fcmToken, title, body });
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

  try {
    const response = await admin.messaging().send(message);
    console.log('[FCM] Sent:', response);
  } catch (err) {
    console.error('[FCM] Error:', err.message);
  }
};

const sendToMultipleDevices = async (fcmTokens, payload) => {
  await Promise.allSettled(fcmTokens.map((token) => sendToDevice(token, payload)));
};

module.exports = { sendToDevice, sendToMultipleDevices };
