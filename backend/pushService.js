import webpush from 'web-push';
import { getDb } from './database.js';

// Setup VAPID keys
webpush.setVapidDetails(
  process.env.VAPID_EMAIL || 'mailto:kingkongc972@gmail.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// Save subscription to database
export async function saveSubscription(subscription) {
  try {
    const db = getDb();
    await db.query(
      `INSERT INTO push_subscriptions (endpoint, p256dh, auth) 
       VALUES ($1, $2, $3) 
       ON CONFLICT (endpoint) DO UPDATE 
       SET p256dh = $2, auth = $3`,
      [
        subscription.endpoint,
        subscription.keys.p256dh,
        subscription.keys.auth
      ]
    );
    console.log('✅ Subscription saved');
  } catch (error) {
    console.error('Error saving subscription:', error);
  }
}

// Send push notification to all subscribers
export async function sendPushToAll(title, body) {
  try {
    const db = getDb();
    const result = await db.query('SELECT * FROM push_subscriptions');
    const subscriptions = result.rows;

    if (subscriptions.length === 0) {
      console.log('📭 No subscribers to notify');
      return;
    }

    const payload = JSON.stringify({
      title: title,
      body: body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      vibrate: [200, 100, 200],
      data: {
        url: '/',
        timestamp: Date.now()
      }
    });

    const sendPromises = subscriptions.map(async (sub) => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth
        }
      };

      try {
        await webpush.sendNotification(pushSubscription, payload);
        console.log('✅ Notification sent to:', sub.endpoint.substring(0, 50));
      } catch (error) {
        if (error.statusCode === 410) {
          // Subscription expired, remove it
          console.log('🗑️ Removing expired subscription');
          await db.query('DELETE FROM push_subscriptions WHERE endpoint = $1', [sub.endpoint]);
        } else {
          console.error('Error sending to subscription:', error.message);
        }
      }
    });

    await Promise.all(sendPromises);
    console.log(`📤 Sent ${subscriptions.length} notification(s)`);
  } catch (error) {
    console.error('Error sending push notifications:', error);
  }
}

// Get public key
export function getVapidPublicKey() {
  return process.env.VAPID_PUBLIC_KEY;
}