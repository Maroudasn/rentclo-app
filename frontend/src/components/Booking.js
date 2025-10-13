import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getItemDetail } from '../utils/api';
import { getItemImages, handleImageError } from '../utils/imageHelpers';
import './Booking.css';

const Booking = () => {
  const { itemId } = useParams();
  const navigate = useNavigate();
  
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [days, setDays] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchItemDetail();
  }, [itemId]);

  useEffect(() => {
    if (bookingDate && endDate) {
      const start = new Date(bookingDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      setDays(Math.max(1, diffDays));
    }
  }, [bookingDate, endDate]);

  const fetchItemDetail = async () => {
    try {
      setLoading(true);
      const itemData = await getItemDetail(itemId);
      
      // Process item with proper images
      const processedItem = {
        ...itemData,
        images: getItemImages(itemData)
      };
      setItem(processedItem);
      
      // Set minimum booking date to today
      const today = new Date().toISOString().split('T')[0];
      setBookingDate(today);
      
      // Set default end date to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setEndDate(tomorrow.toISOString().split('T')[0]);
      
    } catch (err) {
      setError('Failed to load item details');
      console.error('Error fetching item:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalPrice = () => {
    if (!item) return 0;
    return (item.price_per_day * days).toFixed(2);
  };

  const getMinDate = () => {
    const today = new Date();
    const minStart = new Date(item?.availability_start);
    return today > minStart ? today.toISOString().split('T')[0] : item?.availability_start?.split('T')[0];
  };

  const getMaxDate = () => {
    return item?.availability_end?.split('T')[0];
  };

  const validateDates = () => {
    if (!bookingDate || !endDate) return false;
    
    const start = new Date(bookingDate);
    const end = new Date(endDate);
    const availStart = new Date(item.availability_start);
    const availEnd = new Date(item.availability_end);
    
    return start >= availStart && end <= availEnd && start <= end;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateDates()) {
      alert('Please select valid dates within the availability period.');
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Simulate booking API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      alert(`Booking confirmed! You have rented "${item.title}" for ${days} day(s) starting from ${bookingDate}. Total cost: €${calculateTotalPrice()}`);
      
      // Navigate back to item details or to a confirmation page
      navigate(`/item/${itemId}`);
      
    } catch (error) {
      alert('Booking failed. Please try again.');
      console.error('Booking error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="booking-loading">
        <div className="loading-spinner"></div>
        <p>Loading booking details...</p>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="booking-error">
        <h2>Unable to Load Booking</h2>
        <p>{error || "The item you're trying to book is not available."}</p>
        <Link to="/home" className="back-to-home-btn">
          ← Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="booking-page">
      <div className="booking-container">
        {/* Breadcrumb */}
        <nav className="booking-breadcrumb">
          <Link to="/home">Home</Link>
          <span> / </span>
          <Link to={`/item/${itemId}`}>{item.title}</Link>
          <span> / </span>
          <span>Book Item</span>
        </nav>

        <h1>📅 Book Your Rental</h1>
        
        {/* Item Summary */}
        <div className="booking-item-summary">
          <div className="item-image">
            <img 
              src={item.images[0]} 
              alt={item.title}
              onError={(e) => handleImageError(e, item)}
            />
          </div>
          <div className="item-details">
            <h3>{item.title}</h3>
            <p className="item-category">{item.category}</p>
            <p className="item-size">Size: {item.size}</p>
            <p className="item-owner">Owner: {item.owner_name}</p>
            <p className="item-price">€{item.price_per_day} <span className="per-day">per day</span></p>
          </div>
        </div>

        {/* Availability Info */}
        <div className="availability-info">
          <h3>📅 Availability Period</h3>
          <p>
            <strong>Available from:</strong> {new Date(item.availability_start).toLocaleDateString()}
            {' '}to{' '}
            <strong>{new Date(item.availability_end).toLocaleDateString()}</strong>
          </p>
        </div>

        {/* Booking Form */}
        <form onSubmit={handleSubmit} className="booking-form">
          <div className="date-inputs">
            <div className="form-group">
              <label htmlFor="bookingDate">Start Date:</label>
              <input
                type="date"
                id="bookingDate"
                value={bookingDate}
                min={getMinDate()}
                max={getMaxDate()}
                onChange={(e) => setBookingDate(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="endDate">End Date:</label>
              <input
                type="date"
                id="endDate"
                value={endDate}
                min={bookingDate}
                max={getMaxDate()}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="duration-display">
            <p><strong>Rental Duration:</strong> {days} day{days !== 1 ? 's' : ''}</p>
          </div>

          {/* Price Breakdown */}
          <div className="price-breakdown">
            <h3>💰 Price Summary</h3>
            <div className="price-details">
              <div className="price-row">
                <span>Daily Rate:</span>
                <span>€{item.price_per_day}</span>
              </div>
              <div className="price-row">
                <span>Duration:</span>
                <span>{days} day{days !== 1 ? 's' : ''}</span>
              </div>
              <div className="price-row subtotal">
                <span>Subtotal:</span>
                <span>€{calculateTotalPrice()}</span>
              </div>
              <div className="price-row total">
                <span><strong>Total Amount:</strong></span>
                <span><strong>€{calculateTotalPrice()}</strong></span>
              </div>
            </div>
          </div>

          {/* Booking Terms */}
          <div className="booking-terms">
            <h4>📋 Booking Terms</h4>
            <ul>
              <li>Return the item in the same condition</li>
              <li>Pick-up location: {item.location_area}</li>
              <li>Contact owner 24 hours before pickup</li>
              <li>Follow care instructions: {item.care_instructions || 'Handle with care'}</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="booking-actions">
            <button 
              type="submit" 
              className="confirm-booking-btn"
              disabled={submitting || !validateDates()}
            >
              {submitting ? (
                <>
                  <span className="spinner"></span>
                  Processing...
                </>
              ) : (
                `🎉 Confirm Booking - €${calculateTotalPrice()}`
              )}
            </button>
            
            <Link to={`/item/${itemId}`} className="cancel-booking-btn">
              ← Cancel & Go Back
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Booking;