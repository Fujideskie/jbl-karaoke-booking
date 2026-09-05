import express from 'express';
import { getDb } from '../database.js';

const router = express.Router();

// Get all completed bookings (history)
router.get('/', async (req, res) => {
  try {
    const db = getDb();
    const result = await db.query(
      `SELECT * FROM bookings 
       WHERE status = 'completed'
       ORDER BY date DESC, start_time DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// Get history by date range
router.get('/range', async (req, res) => {
  try {
    const { start, end } = req.query;
    const db = getDb();
    
    let query = `SELECT * FROM bookings WHERE status = 'completed'`;
    const params = [];
    let paramCount = 1;
    
    if (start) {
      query += ` AND date >= $${paramCount}`;
      params.push(start);
      paramCount++;
    }
    if (end) {
      query += ` AND date <= $${paramCount}`;
      params.push(end);
      paramCount++;
    }
    
    query += ` ORDER BY date DESC, start_time DESC`;
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching history by range:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

export default router;