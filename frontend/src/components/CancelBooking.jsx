import React, { useState } from 'react';

function CancelBooking() {
  const [bookingId, setBookingId] = useState('');
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    setBooking(null);

    try {
      const response = await fetch(`/api/bookings/${bookingId}`);
      
      if (response.ok) {
        const data = await response.json();
        setBooking(data);
      } else {
        setError('Booking not found. Please check your Booking ID.');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Failed to fetch booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch(`/api/bookings/cancel/${booking.id}`, {
        method: 'POST'
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('✅ Booking cancelled successfully!');
        setBooking({ ...booking, status: 'cancelled' });
      } else {
        setError(data.error || 'Failed to cancel booking');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Failed to cancel booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-PH', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'badge-pending',
      confirmed: 'badge-confirmed',
      cancelled: 'badge-cancelled',
      completed: 'badge-completed'
    };
    return `status-badge ${badges[status] || 'badge-pending'}`;
  };

  return (
    <div className="cancel-booking-container">
      <h2>Cancel Booking</h2>
      <p>Enter your Booking ID to cancel your reservation</p>

      <form onSubmit={handleSearch} className="cancel-search-form">
        <div className="form-group">
          <label>Booking ID *</label>
          <input
            type="text"
            value={bookingId}
            onChange={(e) => setBookingId(e.target.value)}
            placeholder="Enter your Booking ID (e.g., 1, 2, 3)"
            required
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Searching...' : 'Search Booking'}
        </button>
      </form>

      {error && <div className="error-message">{error}</div>}
      {message && <div className="success-message">{message}</div>}

      {booking && (
        <div className="booking-details-card">
          <h3>Booking Details</h3>
          
          <div className="booking-info">
            <div className="info-row">
              <span className="info-label">Booking ID:</span>
              <span className="info-value">#{booking.id}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Name:</span>
              <span className="info-value">{booking.name}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Contact:</span>
              <span className="info-value">{booking.contact}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Date:</span>
              <span className="info-value">{formatDate(booking.date)}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Time:</span>
              <span className="info-value">{booking.start_time} - {booking.end_time}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Address:</span>
              <span className="info-value">{booking.address}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Total Price:</span>
              <span className="info-value">₱{booking.total_price}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Status:</span>
              <span className={getStatusBadge(booking.status)}>
                {booking.status.toUpperCase()}
              </span>
            </div>
          </div>

          {booking.status !== 'cancelled' && booking.status !== 'completed' && (
            <button 
              className="cancel-btn" 
              onClick={handleCancel}
              disabled={loading}
            >
              {loading ? 'Cancelling...' : 'Cancel Booking'}
            </button>
          )}

          {booking.status === 'cancelled' && (
            <div className="cancelled-notice">
              This booking has been cancelled.
            </div>
          )}

          {booking.status === 'completed' && (
            <div className="completed-notice">
              This booking is already completed and cannot be cancelled.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default CancelBooking;