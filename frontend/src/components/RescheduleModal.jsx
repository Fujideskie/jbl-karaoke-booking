import React, { useState } from 'react';

function RescheduleModal({ booking, onClose, onReschedule }) {
  const [date, setDate] = useState(booking.date);
  const [startTime, setStartTime] = useState(booking.start_time);
  const [endTime, setEndTime] = useState(booking.end_time);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const today = new Date().toISOString().split('T')[0];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await onReschedule(booking.id, {
        date,
        start_time: startTime,
        end_time: endTime
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to reschedule');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h3>🔄 Reschedule Booking</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Booking Info */}
        <div className="modal-booking-info">
          <div className="modal-info-name">#{booking.id} - {booking.name}</div>
          <div className="modal-info-current">
            Current: {booking.date} | {booking.start_time} - {booking.end_time}
          </div>
        </div>

        {error && <div className="modal-error">{error}</div>}

        {/* Form */}
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="modal-form-group">
            <label>New Date *</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={today}
              required
            />
          </div>

          <div className="modal-form-row">
            <div className="modal-form-group">
              <label>Start Time *</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>

            <div className="modal-form-group">
              <label>End Time *</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="modal-btn modal-btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="modal-btn modal-btn-confirm" disabled={loading}>
              {loading ? 'Rescheduling...' : 'Reschedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RescheduleModal;