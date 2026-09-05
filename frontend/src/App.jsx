import React, { useState, useEffect } from 'react';
import BookingForm from './components/BookingForm';
import Dashboard from './components/Dashboard';
import History from './components/History';
import NotificationBell from './components/NotificationBell';
import Calendar from './components/Calendar';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('booking');
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await fetch('/api/dashboard/stats');
      const data = await response.json();
      setDashboardData(data);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    }
  };

  const handleBookingSubmit = async (bookingData) => {
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
      });

      if (response.ok) {
        const newBooking = await response.json();
        alert('Booking submitted successfully!');
        fetchDashboard();
        return newBooking;
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
        throw new Error(error.error);
      }
    } catch (error) {
      console.error('Error submitting booking:', error);
      throw error;
    }
  };

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <div>
              <h1>KL's JBL Modern Karaoke</h1>
              <p className="subtitle">Premium Audio Experience</p>
            </div>
          </div>
          <div className="header-right">
            <nav className="nav-tabs">
              <button 
                className={`nav-tab ${activeTab === 'booking' ? 'active' : ''}`}
                onClick={() => setActiveTab('booking')}
              >
                Book Now
              </button>
              <button 
                className={`nav-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
                onClick={() => setActiveTab('dashboard')}
              >
                Dashboard
              </button>
              <button 
                className={`nav-tab ${activeTab === 'history' ? 'active' : ''}`}
                onClick={() => setActiveTab('history')}
              >
                History
              </button>
              <button 
                className={`nav-tab ${activeTab === 'calendar' ? 'active' : ''}`}
                onClick={() => setActiveTab('calendar')}
              >
                Calendar
              </button>
            </nav>
            <NotificationBell />
          </div>
        </div>
      </header>

      <main className="main-content">
        {activeTab === 'booking' && <BookingForm onSubmit={handleBookingSubmit} />}
        {activeTab === 'dashboard' && (
          <Dashboard 
            dashboardData={dashboardData} 
            onRefresh={fetchDashboard}
          />
        )}
        {activeTab === 'history' && <History />}
        {activeTab === 'calendar' && <Calendar />}
      </main>

      <footer className="footer">
        <p>© 2026 KL's JBL Modern Karaoke Rental • Premium Sound • Quality Service</p>
      </footer>
    </div>
  );
}

export default App;