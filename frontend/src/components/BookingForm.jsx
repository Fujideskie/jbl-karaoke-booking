import React, { useState, useEffect } from 'react';

function BookingForm({ onSubmit }) {
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    date: '',
    start_time: '',
    package: 'A',
    duration: '12',
    address: '',
    notes: '',
    addons: {
      moving_head: false,
      string_light: false
    }
  });

  const [totalPrice, setTotalPrice] = useState(699);
  const [endTime, setEndTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [availableDates, setAvailableDates] = useState([]);

  // Package rates
  const RATES = {
    'A': { '12': 899, '24': 1199 },
    'B': { '12': 699, '24': 999 }
  };

  const ADDON_PRICES = {
    moving_head: 199,
    string_light: 199
  };

  useEffect(() => {
    fetchAvailableDates();
  }, []);

  const fetchAvailableDates = async () => {
    try {
      const response = await fetch('/api/bookings/available-dates');
      const data = await response.json();
      setAvailableDates(data);
      if (data.length > 0) {
        setFormData(prev => ({ ...prev, date: data[0] }));
      }
    } catch (error) {
      console.error('Error fetching available dates:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData({
      ...formData,
      [name]: value
    });

    // Recompute kapag nagbago ang package, duration, o start_time
    if (name === 'package' || name === 'duration' || name === 'start_time') {
      const newStart = name === 'start_time' ? value : formData.start_time;
      const newPackage = name === 'package' ? value : formData.package;
      const newDuration = name === 'duration' ? value : formData.duration;
      
      if (newStart && newDuration && newPackage) {
        computeEndTimeAndPrice(newStart, newDuration, newPackage, formData.addons);
      } else if (newDuration && newPackage) {
        // Update price kahit walang start time
        const basePrice = RATES[newPackage][newDuration] || 699;
        let addonTotal = 0;
        if (formData.addons.moving_head) addonTotal += ADDON_PRICES.moving_head;
        if (formData.addons.string_light) addonTotal += ADDON_PRICES.string_light;
        setTotalPrice(basePrice + addonTotal);
      }
    }
  };

  const handleAddonChange = (e) => {
    const { name, checked } = e.target;
    const updatedAddons = {
      ...formData.addons,
      [name]: checked
    };
    
    setFormData({
      ...formData,
      addons: updatedAddons
    });

    if (formData.start_time && formData.duration && formData.package) {
      computeEndTimeAndPrice(formData.start_time, formData.duration, formData.package, updatedAddons);
    } else if (formData.duration && formData.package) {
      const basePrice = RATES[formData.package][formData.duration] || 699;
      let addonTotal = 0;
      if (updatedAddons.moving_head) addonTotal += ADDON_PRICES.moving_head;
      if (updatedAddons.string_light) addonTotal += ADDON_PRICES.string_light;
      setTotalPrice(basePrice + addonTotal);
    }
  };

  const computeEndTimeAndPrice = (start, duration, pkg, addons = null) => {
    if (!start || !duration || !pkg) {
      if (duration && pkg) {
        const basePrice = RATES[pkg][duration] || 699;
        setTotalPrice(basePrice);
      }
      return;
    }

    const [hours, minutes] = start.split(':').map(Number);
    const durationHours = parseInt(duration);
    
    let endHours = hours + durationHours;
    let endMinutes = minutes;
    let extraDays = 0;
    
    if (endHours >= 24) {
      extraDays = Math.floor(endHours / 24);
      endHours = endHours % 24;
    }
    
    const endTimeStr = `${String(endHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    setEndTime(endTimeStr);
    
    if (formData.date) {
      const endDateObj = new Date(formData.date);
      endDateObj.setDate(endDateObj.getDate() + extraDays);
      const endDateStr = endDateObj.toISOString().split('T')[0];
      setEndDate(endDateStr);
    }

    const basePrice = RATES[pkg][duration] || 699;
    const currentAddons = addons || formData.addons;
    let addonTotal = 0;
    if (currentAddons.moving_head) addonTotal += ADDON_PRICES.moving_head;
    if (currentAddons.string_light) addonTotal += ADDON_PRICES.string_light;
    
    setTotalPrice(basePrice + addonTotal);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const bookingData = {
        name: formData.name,
        contact: formData.contact,
        date: formData.date,
        start_time: formData.start_time,
        end_time: endTime,
        address: formData.address,
        notes: formData.notes,
        total_price: totalPrice,
        package: formData.package,
        duration: formData.duration,
        addons: formData.addons
      };
      
      await onSubmit(bookingData);
      setFormData({
        name: '',
        contact: '',
        date: availableDates.length > 0 ? availableDates[0] : '',
        start_time: '',
        package: 'A',
        duration: '12',
        address: '',
        notes: '',
        addons: {
          moving_head: false,
          string_light: false
        }
      });
      setEndTime('');
      setEndDate('');
      setTotalPrice(699);
      fetchAvailableDates();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-PH', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatDateLong = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-PH', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getPackageLabel = (pkg) => {
    if (pkg === 'A') {
      return 'Package A (Premium)';
    } else {
      return 'Package B (Standard)';
    }
  };

  return (
    <div className="booking-form-container">
      <h2>Book Your Session</h2>
      <p>KL's JBL Modern Karaoke - Premium Sound Experience</p>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Full Name *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter your full name"
            required
          />
        </div>

        <div className="form-group">
          <label>Contact Number *</label>
          <input
            type="tel"
            name="contact"
            value={formData.contact}
            onChange={handleChange}
            placeholder="0917 123 4567"
            required
          />
        </div>

        <div className="form-group">
          <label>Available Date *</label>
          <select
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
          >
            {availableDates.length === 0 ? (
              <option value="">No available dates</option>
            ) : (
              availableDates.map((date) => (
                <option key={date} value={date}>
                  {formatDateLong(date)}
                </option>
              ))
            )}
          </select>
          {availableDates.length === 0 && (
            <p style={{ color: '#e17055', fontSize: '0.9rem', marginTop: '5px' }}>
              All dates are fully booked. Please check back later.
            </p>
          )}
        </div>

        <div className="form-group">
          <label>Start Time *</label>
          <input
            type="time"
            name="start_time"
            value={formData.start_time}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Package *</label>
          <select
            name="package"
            value={formData.package}
            onChange={handleChange}
            required
          >
            <option value="A">Package A (Premium) - ₱899 (12hrs) / ₱1199 (24hrs)</option>
            <option value="B">Package B (Standard) - ₱699 (12hrs) / ₱999 (24hrs)</option>
          </select>
        </div>

        <div className="form-group">
          <label>Duration *</label>
          <select
            name="duration"
            value={formData.duration}
            onChange={handleChange}
            required
          >
            <option value="12">12 Hours</option>
            <option value="24">24 Hours</option>
          </select>
        </div>

        {(endTime && endDate) && (
          <div className="computed-info">
            <div className="info-row">
              <span>⏰ End Time:</span>
              <strong>{endTime}</strong>
            </div>
            <div className="info-row">
              <span>📅 End Date:</span>
              <strong>{formatDate(endDate)}</strong>
            </div>
            <div className="info-row">
              <span>💰 Base Price:</span>
              <strong>₱{RATES[formData.package][formData.duration]}</strong>
            </div>
          </div>
        )}

        <div className="addons-section">
          <h3>Add-ons</h3>
          <p className="addons-sub">Enhance your karaoke experience!</p>
          
          <div className="addon-item">
            <label className="addon-label">
              <input
                type="checkbox"
                name="moving_head"
                checked={formData.addons.moving_head}
                onChange={handleAddonChange}
              />
              <span className="addon-name">Moving Disco Head LED</span>
              <span className="addon-price">+₱199</span>
            </label>
          </div>

          <div className="addon-item">
            <label className="addon-label">
              <input
                type="checkbox"
                name="string_light"
                checked={formData.addons.string_light}
                onChange={handleAddonChange}
              />
              <span className="addon-name">10 meters String Light</span>
              <span className="addon-price">+₱199</span>
            </label>
          </div>

          {totalPrice > RATES[formData.package][formData.duration] && (
            <div className="addon-total">
              <span>Add-ons Total:</span>
              <strong>+₱{totalPrice - RATES[formData.package][formData.duration]}</strong>
            </div>
          )}
        </div>

        <div className="form-group">
          <label>Address *</label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="e.g., Brgy. San Juan, Lucban, Laguna"
            required
          />
        </div>

        <div className="form-group">
          <label>Special Requests / Notes</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Any special requests? (e.g., song preferences, setup requirements)"
            rows="3"
          />
        </div>

        <div className="price-summary">
          <div className="total-price-card">
            <div className="price-breakdown">
              <div className="breakdown-row">
                <span>{getPackageLabel(formData.package)} ({formData.duration} hours)</span>
                <span>₱{RATES[formData.package][formData.duration]}</span>
              </div>
              {formData.addons.moving_head && (
                <div className="breakdown-row addon-row">
                  <span>Moving Disco Head LED</span>
                  <span>+₱199</span>
                </div>
              )}
              {formData.addons.string_light && (
                <div className="breakdown-row addon-row">
                  <span>10 meters String Light</span>
                  <span>+₱199</span>
                </div>
              )}
              <div className="breakdown-total">
                <span>Total Price</span>
                <strong>₱{totalPrice}</strong>
              </div>
            </div>
          </div>
        </div>

        <button type="submit" disabled={loading || availableDates.length === 0}>
          {loading ? 'Submitting...' : 'Submit Booking'}
        </button>
      </form>
    </div>
  );
}

export default BookingForm;