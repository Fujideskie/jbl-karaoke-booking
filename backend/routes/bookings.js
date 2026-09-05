import express from 'express';
import { getDb } from '../database.js';

const router = express.Router();

// Check if date is already booked
async function isDateAvailable(date, excludeId = null) {
  const db = getDb();
  
  let query = `
    SELECT COUNT(*) as count 
    FROM bookings 
    WHERE date = $1 
    AND status != 'cancelled'
  `;
  
  let params = [date];
  
  if (excludeId) {
    query += ' AND id != $2';
    params.push(excludeId);
  }
  
  const result = await db.query(query, params);
  return result.rows[0].count == 0;
}

// Check if slot is available
async function isSlotAvailable(date, startTime, endTime, excludeId = null) {
  const db = getDb();
  
  let query = `
    SELECT COUNT(*) as count 
    FROM bookings 
    WHERE date = $1 
    AND status = 'confirmed'
    AND (
      (start_time <= $2 AND end_time > $3) OR
      (start_time < $4 AND end_time >= $5) OR
      (start_time >= $6 AND end_time <= $7)
    )
  `;
  
  let params = [date, startTime, startTime, endTime, endTime, startTime, endTime];
  
  if (excludeId) {
    query += ' AND id != $8';
    params.push(excludeId);
  }
  
  const result = await db.query(query, params);
  return result.rows[0].count == 0;
}

// Create booking
router.post('/', async (req, res) => {
  try {
    const { name, contact, date, start_time, end_time, address, notes, total_price } = req.body;
    
    if (!name || !contact || !date || !start_time || !end_time || !address) {
      return res.status(400).json({ error: 'All required fields must be filled' });
    }
    
    const dateAvailable = await isDateAvailable(date);
    if (!dateAvailable) {
      return res.status(409).json({ 
        error: 'This date is already fully booked. Only one booking per day is allowed.' 
      });
    }
    
    const slotAvailable = await isSlotAvailable(date, start_time, end_time);
    if (!slotAvailable) {
      return res.status(409).json({ 
        error: 'Time slot is already booked. Please choose another time.' 
      });
    }
    
    const db = getDb();
    const status = 'confirmed';
    const price = total_price || 1500;
    
    const result = await db.query(
      `INSERT INTO bookings (name, contact, date, start_time, end_time, address, notes, status, total_price) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [name, contact, date, start_time, end_time, address, notes || '', status, price]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

// Get all bookings
router.get('/', async (req, res) => {
  try {
    const db = getDb();
    const result = await db.query(`
      SELECT * FROM bookings 
      ORDER BY date ASC, start_time ASC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// Update booking status
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['pending', 'confirmed', 'cancelled', 'completed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const db = getDb();
    
    const bookingResult = await db.query('SELECT * FROM bookings WHERE id = $1', [id]);
    if (bookingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    const booking = bookingResult.rows[0];
    
    if (status === 'confirmed') {
      const slotAvailable = await isSlotAvailable(
        booking.date, 
        booking.start_time, 
        booking.end_time, 
        parseInt(id)
      );
      
      if (!slotAvailable) {
        return res.status(409).json({ 
          error: 'This time slot is no longer available' 
        });
      }
    }
    
    await db.query(
      'UPDATE bookings SET status = $1 WHERE id = $2',
      [status, id]
    );
    
    const updatedResult = await db.query('SELECT * FROM bookings WHERE id = $1', [id]);
    res.json(updatedResult.rows[0]);
  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(500).json({ error: 'Failed to update booking' });
  }
});

// Get available dates
router.get('/available-dates', async (req, res) => {
  try {
    const db = getDb();
    const today = new Date().toISOString().split('T')[0];
    
    const bookedResult = await db.query(
      `SELECT DISTINCT date FROM bookings WHERE status != 'cancelled'`
    );
    
    const bookedDateSet = new Set(bookedResult.rows.map(b => b.date));
    
    const availableDates = [];
    const currentDate = new Date(today);
    
    for (let i = 0; i < 30; i++) {
      const dateStr = currentDate.toISOString().split('T')[0];
      if (!bookedDateSet.has(dateStr)) {
        availableDates.push(dateStr);
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    res.json(availableDates);
  } catch (error) {
    console.error('Error fetching available dates:', error);
    res.status(500).json({ error: 'Failed to fetch available dates' });
  }
});

export default router;