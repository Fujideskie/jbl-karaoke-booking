import express from 'express';
import { getDb } from '../database.js';

const router = express.Router();

// Function to compute end date
const getEndDate = (date, startTime, endTime) => {
  if (startTime > endTime) {
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);
    return endDate.toISOString().split('T')[0];
  }
  return date;
};

// Function to check if session is actually completed
const isSessionCompleted = (bookingDate, startTime, endTime, currentDate, currentTime) => {
  const isOvernight = startTime > endTime;
  
  if (bookingDate < currentDate) {
    if (isOvernight) {
      const endDate = new Date(bookingDate);
      endDate.setDate(endDate.getDate() + 1);
      const endDateStr = endDate.toISOString().split('T')[0];
      
      if (endDateStr < currentDate) {
        return true;
      }
      if (endDateStr === currentDate) {
        return endTime <= currentTime;
      }
      return false;
    }
    return true;
  }
  
  if (bookingDate === currentDate) {
    if (isOvernight) {
      return false;
    }
    return endTime <= currentTime;
  }
  
  return false;
};

// Get dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    const db = getDb();
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    const currentMonth = today.substring(0, 7);
    
    // Get all confirmed bookings
    const confirmedResult = await db.query(
      `SELECT * FROM bookings WHERE status = 'confirmed'`
    );
    const allConfirmed = confirmedResult.rows;
    
    // Check each booking if session is really completed
    for (const booking of allConfirmed) {
      const isCompleted = isSessionCompleted(
        booking.date,
        booking.start_time,
        booking.end_time,
        today,
        currentTime
      );
      
      if (isCompleted) {
        await db.query(
          'UPDATE bookings SET status = $1 WHERE id = $2',
          ['completed', booking.id]
        );
        
        const existingNotif = await db.query(
          `SELECT * FROM notifications 
           WHERE booking_id = $1 AND type = 'session_end'`,
          [booking.id]
        );
        
        if (existingNotif.rows.length === 0) {
          const endDate = getEndDate(booking.date, booking.start_time, booking.end_time);
          let endDateStr = '';
          if (endDate !== booking.date) {
            endDateStr = ` (ends ${endDate})`;
          }
          const message = `✅ Session ended: ${booking.name} (${booking.start_time} - ${booking.end_time}${endDateStr})`;
          await db.query(
            'INSERT INTO notifications (booking_id, type, message) VALUES ($1, $2, $3)',
            [booking.id, 'session_end', message]
          );
        }
      }
    }
    
    // Today's active bookings
    const todayResult = await db.query(
      `SELECT * FROM bookings 
       WHERE date = $1 
       AND status = 'confirmed'
       ORDER BY start_time ASC`,
      [today]
    );
    const todayBookings = todayResult.rows;
    
    // Check today's schedule and create daily notification
    if (todayBookings.length > 0) {
      const existingNotif = await db.query(
        `SELECT * FROM notifications 
         WHERE type = 'daily_schedule' 
         AND DATE(created_at) = CURRENT_DATE`
      );
      
      if (existingNotif.rows.length === 0) {
        const bookingDetails = todayBookings.map(b => {
          const endDate = getEndDate(b.date, b.start_time, b.end_time);
          let endDateStr = '';
          if (endDate !== b.date) {
            endDateStr = ` (ends ${endDate})`;
          }
          return `${b.name} (${b.start_time}-${b.end_time}${endDateStr})`;
        }).join(', ');
        
        const message = `📅 Today's Schedule: ${todayBookings.length} booking(s) - ${bookingDetails}`;
        
        await db.query(
          'INSERT INTO notifications (booking_id, type, message) VALUES ($1, $2, $3)',
          [null, 'daily_schedule', message]
        );
      }
    }
    
    // Tomorrow's bookings
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const tomorrowResult = await db.query(
      `SELECT * FROM bookings 
       WHERE date = $1 
       AND status = 'confirmed'
       ORDER BY start_time ASC`,
      [tomorrow]
    );
    const tomorrowBookings = tomorrowResult.rows;
    
    // Upcoming bookings
    const upcomingResult = await db.query(
      `SELECT * FROM bookings 
       WHERE date > $1 
       AND status = 'confirmed'
       ORDER BY date ASC, start_time ASC 
       LIMIT 10`,
      [tomorrow]
    );
    const upcomingBookings = upcomingResult.rows;
    
    // Add end_date to each booking
    const addEndDate = (bookings) => {
      return bookings.map(booking => ({
        ...booking,
        end_date: getEndDate(booking.date, booking.start_time, booking.end_time)
      }));
    };
    
    const totalResult = await db.query('SELECT COUNT(*) as count FROM bookings');
    const totalBookings = parseInt(totalResult.rows[0].count) || 0;
    
    const monthlyResult = await db.query(
      `SELECT COALESCE(SUM(total_price), 0) as total 
       FROM bookings 
       WHERE date LIKE $1`,
      [`${currentMonth}%`]
    );
    const monthlyIncome = parseFloat(monthlyResult.rows[0].total) || 0;
    
    const totalIncomeResult = await db.query(
      `SELECT COALESCE(SUM(total_price), 0) as total FROM bookings`
    );
    const totalIncome = parseFloat(totalIncomeResult.rows[0].total) || 0;
    
    const pendingResult = await db.query(
      "SELECT COUNT(*) as count FROM bookings WHERE status = 'pending'"
    );
    const pending = parseInt(pendingResult.rows[0].count) || 0;
    
    res.json({
      today: addEndDate(todayBookings),
      tomorrow: addEndDate(tomorrowBookings),
      upcoming: addEndDate(upcomingBookings),
      summary: {
        totalBookings: totalBookings,
        monthlyIncome: monthlyIncome,
        totalIncome: totalIncome,
        pending: pending
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

export default router;