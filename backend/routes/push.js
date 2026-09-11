import express from 'express';
import { saveSubscription, getVapidPublicKey, sendPushToAll } from '../pushService.js';

const router = express.Router();

// Get VAPID public key
router.get('/vapid-public-key', (req, res) => {
  res.json({ publicKey: getVapidPublicKey() });
});

// Subscribe to push notifications
router.post('/subscribe', async (req, res) => {
  try {
    const { subscription } = req.body;
    
    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ error: 'Invalid subscription' });
    }

    await saveSubscription(subscription);
    res.json({ success: true, message: 'Subscribed successfully!' });
  } catch (error) {
    console.error('Error subscribing:', error);
    res.status(500).json({ error: 'Failed to subscribe' });
  }
});

// Test push notification
router.post('/test', async (req, res) => {
  try {
    await sendPushToAll(
      '🎤 KL\'s JBL Modern Karaoke',
      'Test notification - Working!'
    );
    res.json({ success: true, message: 'Test notification sent!' });
  } catch (error) {
    console.error('Error sending test:', error);
    res.status(500).json({ error: 'Failed to send test' });
  }
});

export default router;