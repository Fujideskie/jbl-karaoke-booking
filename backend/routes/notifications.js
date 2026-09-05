import express from 'express';
import { getDb } from '../database.js';

const router = express.Router();

// Get all notifications
router.get('/', async (req, res) => {
  try {
    const db = getDb();
    const result = await db.query(
      `SELECT n.*, b.name as booking_name 
       FROM notifications n
       LEFT JOIN bookings b ON n.booking_id = b.id
       ORDER BY n.created_at DESC
       LIMIT 50`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Get unread notifications count
router.get('/unread-count', async (req, res) => {
  try {
    const db = getDb();
    const result = await db.query(
      'SELECT COUNT(*) as count FROM notifications WHERE is_read = 0'
    );
    res.json({ count: result.rows[0].count || 0 });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
});

// Mark notification as read
router.patch('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDb();
    await db.query(
      'UPDATE notifications SET is_read = 1 WHERE id = $1',
      [id]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// Mark all as read
router.patch('/mark-all-read', async (req, res) => {
  try {
    const db = getDb();
    await db.query('UPDATE notifications SET is_read = 1');
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking all as read:', error);
    res.status(500).json({ error: 'Failed to mark all as read' });
  }
});

// Create notification helper
export async function createNotification(bookingId, type, message) {
  try {
    const db = getDb();
    await db.query(
      'INSERT INTO notifications (booking_id, type, message) VALUES ($1, $2, $3)',
      [bookingId, type, message]
    );
    console.log('✅ Notification created:', message);
  } catch (error) {
    console.error('Error creating notification:', error);
  }
}

export default router;