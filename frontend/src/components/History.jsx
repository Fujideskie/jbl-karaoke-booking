import React, { useState, useEffect } from 'react';

function History() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await fetch('/api/history');
      const data = await response.json();
      setHistory(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching history:', error);
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatShortDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-PH', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return <div className="loading">Loading history...</div>;
  }

  return (
    <div className="history-container">
      <div className="history-header">
        <h2>Booking History</h2>
        <div className="history-stats">
          <span>Total Completed: {history.length}</span>
          <span>Total Revenue: ₱{history.reduce((sum, b) => sum + b.total_price, 0).toLocaleString()}</span>
        </div>
      </div>

      {history.length === 0 ? (
        <div className="empty-history">
          <p>No completed bookings yet</p>
        </div>
      ) : (
        <div className="history-list">
          {history.map((booking) => {
            const endDate = booking.start_time > booking.end_time 
              ? new Date(booking.date)
              : null;
            if (endDate) {
              endDate.setDate(endDate.getDate() + 1);
            }
            
            return (
              <div key={booking.id} className="history-item">
                <div className="history-item-header">
                  <span className="history-name">{booking.name}</span>
                  <span className="history-date">{formatDate(booking.date)}</span>
                </div>
                <div className="history-details">
                <div>
  {booking.start_time} – {booking.end_time}
  {endDate && (
    <span className="end-date"> (ends {formatShortDate(endDate.toISOString().split('T')[0])})</span>
  )}
</div>
                  <div>{booking.address}</div>
                  <div>₱{booking.total_price}</div>
                  {booking.notes && (
                    <div className="history-notes">{booking.notes}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default History;