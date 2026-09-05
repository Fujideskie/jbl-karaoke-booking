import React from 'react';

function Dashboard({ dashboardData, onRefresh }) {
  if (!dashboardData) {
    return <div className="loading">Loading dashboard...</div>;
  }

  const { today, tomorrow, upcoming, summary } = dashboardData;

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-PH', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getEndDateDisplay = (booking) => {
  // Always show end date if it exists
  if (booking.end_date) {
    return ` (ends ${formatDate(booking.end_date)})`;
  }
  return '';
};

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Dashboard</h2>
        <button onClick={onRefresh} className="refresh-btn">Refresh</button>
      </div>

      <div className="summary-cards">
        <div className="summary-card total">
          <div className="card-info">
            <span className="card-label">Total Bookings</span>
            <span className="card-value">{summary.totalBookings}</span>
          </div>
        </div>
        <div className="summary-card income">
          <div className="card-info">
            <span className="card-label">This Month</span>
            <span className="card-value">₱{summary.monthlyIncome.toLocaleString()}</span>
          </div>
        </div>
        <div className="summary-card total-income">
          <div className="card-info">
            <span className="card-label">Total Income</span>
            <span className="card-value">₱{summary.totalIncome.toLocaleString()}</span>
          </div>
        </div>
        <div className="summary-card pending">
          <div className="card-info">
            <span className="card-label">Pending</span>
            <span className="card-value">{summary.pending}</span>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="bookings-section">
          <h3>Today's Bookings</h3>
          {today.length === 0 ? (
            <p className="empty-message">No active bookings for today</p>
          ) : (
            today.map((booking) => (
              <div key={booking.id} className="booking-item">
                <div className="booking-header">
                  <span className="booking-name">{booking.name}</span>
                  <span className="status-badge active">ACTIVE</span>
                </div>
                <div className="booking-details">
                  <div>
                    {booking.start_time} – {booking.end_time}
                    {getEndDateDisplay(booking)}
                  </div>
                  <div>{booking.address}</div>
                  <div>₱{booking.total_price}</div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="bookings-section">
          <h3>Tomorrow's Bookings</h3>
          {tomorrow.length === 0 ? (
            <p className="empty-message">No bookings for tomorrow</p>
          ) : (
            tomorrow.map((booking) => (
              <div key={booking.id} className="booking-item">
                <div className="booking-header">
                  <span className="booking-name">{booking.name}</span>
                  <span className="status-badge upcoming">UPCOMING</span>
                </div>
                <div className="booking-details">
                  <div>
                    {booking.start_time} – {booking.end_time}
                    {getEndDateDisplay(booking)}
                  </div>
                  <div>{booking.address}</div>
                  <div>₱{booking.total_price}</div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="bookings-section full-width">
          <h3>Upcoming Bookings</h3>
          {upcoming.length === 0 ? (
            <p className="empty-message">No upcoming bookings</p>
          ) : (
            upcoming.map((booking) => (
              <div key={booking.id} className="booking-item">
                <div className="booking-header">
                  <span className="booking-name">{booking.name}</span>
                  <span className="status-badge upcoming">UPCOMING</span>
                </div>
                <div className="booking-details">
                  <div>
                    {booking.date} {booking.start_time} – {booking.end_time}
                    {getEndDateDisplay(booking)}
                  </div>
                  <div>{booking.address}</div>
                  <div>₱{booking.total_price}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;