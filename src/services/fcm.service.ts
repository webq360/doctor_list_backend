import * as admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';

let initialized = false;

function initFirebase() {
  if (initialized || admin.apps.length > 0) return;
  try {
    // Try service account file first
    const serviceAccountPath = path.join(__dirname, '../../firebase-service-account.json');
    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } else if (process.env.FIREBASE_PROJECT_ID) {
      // Fallback: env variables
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
      });
    } else {
      console.warn('Firebase Admin not configured — push notifications disabled');
      return;
    }
    initialized = true;
    console.log('Firebase Admin initialized');
  } catch (e) {
    console.error('Firebase Admin init error:', e);
  }
}

export async function sendPushToTokens(
  tokens: string[],
  title: string,
  body: string,
  imageUrl?: string,
  data?: Record<string, string>
): Promise<void> {
  initFirebase();
  if (!initialized || tokens.length === 0) return;

  const chunks: string[][] = [];
  for (let i = 0; i < tokens.length; i += 500) {
    chunks.push(tokens.slice(i, i + 500));
  }

  for (const chunk of chunks) {
    try {
      const message: admin.messaging.MulticastMessage = {
        tokens: chunk,
        notification: { title, body, ...(imageUrl ? { imageUrl } : {}) },
        android: {
          priority: 'high',
          notification: {
            channelId: 'doctor_list_high',
            priority: 'high',
            sound: 'default',
            imageUrl: imageUrl || undefined,
          },
        },
        apns: {
          payload: { aps: { sound: 'default', badge: 1 } },
          fcmOptions: { imageUrl: imageUrl || undefined },
        },
        data: {
          ...(data ?? {}),
          imageUrl: imageUrl || '',
          title,
          body,
        },
      };
      const res = await admin.messaging().sendEachForMulticast(message);
      console.log(`FCM sent: ${res.successCount} success, ${res.failureCount} failed`);
      
      // Log failed tokens with error details
      if (res.failureCount > 0) {
        res.responses.forEach((resp, idx) => {
          if (!resp.success) {
            console.error(`FCM failed for token[${idx}]: ${resp.error?.code} - ${resp.error?.message}`);
            console.error(`Failed token: ${chunk[idx].substring(0, 20)}...`);
            
            // Remove invalid/unregistered tokens from DB
            if (
              resp.error?.code === 'messaging/invalid-registration-token' ||
              resp.error?.code === 'messaging/registration-token-not-registered'
            ) {
              import('../models/user.model').then(({ default: User }) => {
                User.updateOne({ fcmToken: chunk[idx] }, { $unset: { fcmToken: 1 } })
                  .then(() => console.log(`Removed invalid FCM token: ${chunk[idx].substring(0, 20)}...`))
                  .catch(console.error);
              });
            }
          }
        });
      }
    } catch (e) {
      console.error('FCM send error:', e);
    }
  }
}
