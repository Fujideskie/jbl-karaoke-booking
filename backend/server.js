import express from 'express';
import cors from 'cors';
import { initializeDatabase, getDb } from './database.js';
import bookingRoutes from './routes/bookings.js';
import dashboardRoutes from './routes/dashboard.js';
import historyRoutes from './routes/history.js';
import notificationRoutes from './routes/notifications.js';

const app = express();
const PORT = process.env.PORT || 5000;

// CORS - allow all origins for testing
app.use(cors({
  origin: '*'
}));
app.use(express.json());

// TEMPORARY ROUTE - DELETE ALL DATA (POST method)
app.post('/api/delete-all', async (req, res) => {
  try {
    const db = getDb();
    await db.query('DELETE FROM notifications');
    await db.query('DELETE FROM bookings');
    await db.query('ALTER SEQUENCE bookings_id_seq RESTART WITH 1');
    await db.query('ALTER SEQUENCE notifications_id_seq RESTART WITH 1');
    res.json({ message: 'All data deleted successfully!' });
  } catch (error) {
    console.error('Error deleting data:', error);
    res.status(500).json({ error: error.message });
  }
});

// Routes
app.use('/api/bookings', bookingRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/notifications', notificationRoutes);

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: '🎤 JBL Karaoke API is running!' });
});

// Start server
async function startServer() {
  try {
    await initializeDatabase();
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📍 Delete all data: POST /api/delete-all`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
  }
}

startServer();