import admin from 'firebase-admin';

// Initialize Firebase Admin (using environment variables for security)
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  } catch (error) {
    console.error('Firebase admin initialization error:', error);
  }
}

export const sendFCMNotification = async (tokens: string[], title: string, body: string, data?: any) => {
  if (tokens.length === 0) return;

  const message = {
    notification: {
      title,
      body,
    },
    data: data || {},
    tokens: tokens,
    android: {
      priority: 'high' as const,
      notification: {
        sound: 'default',
        clickAction: 'FLUTTER_NOTIFICATION_CLICK',
      },
    },
    apns: {
      payload: {
        aps: {
          sound: 'default',
          badge: 1,
        },
      },
    },
  };

  try {
    const response = await admin.messaging().sendEachForMulticast(message);
    console.log('Successfully sent FCM messages:', response.successCount);
    return response;
  } catch (error) {
    console.error('Error sending FCM message:', error);
    throw error;
  }
};
