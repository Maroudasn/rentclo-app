import React, { useState, useEffect } from 'react';
import { useAuth } from './protected/AuthContext';
import { getUserBookings, cancelBooking } from '../utils/api';
import './MyBookings.css';

const MyBookings = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, pending, completed, cancelled

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await getUserBookings();
      setBookings(response);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setError('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const filteredBookings = bookings.filter(booking => {
    if (filter === 'all') return true;
    return booking.status === filter;
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#28a745';
      case 'pending': return '#ffc107';
      case 'cancelled': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return '✅';
      case 'pending': return '⏳';
      case 'cancelled': return '❌';
      default: return '❓';
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    try {
      await cancelBooking(bookingId);
      setBookings(prev => prev.map(booking => 
        booking.id === bookingId 
          ? { ...booking, status: 'cancelled' }
          : booking
      ));
      console.log('✅ Booking cancelled successfully');
    } catch (error) {
      console.error('Error cancelling booking:', error);
      setError('Failed to cancel booking. Please try again.');
    }
  };

  const isCancellable = (booking) => {
    if (booking.status !== 'pending') return false;
    
    const today = new Date();
    const startDate = new Date(booking.start_date);
    
    // Can only cancel if booking hasn't started yet
    return startDate > today;
  };

  if (loading) {
    return (
      <div className="my-bookings">
        <div className="loading">Loading your bookings...</div>
      </div>
    );
  }

  return (
    <div className="my-bookings">
      <div className="bookings-header">
        <h2>My Bookings</h2>
        <p>Your rental history and upcoming bookings</p>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="bookings-filters">
        <button 
          className={filter === 'all' ? 'filter-btn active' : 'filter-btn'}
          onClick={() => setFilter('all')}
        >
          All ({bookings.length})
        </button>
        <button 
          className={filter === 'pending' ? 'filter-btn active' : 'filter-btn'}
          onClick={() => setFilter('pending')}
        >
          Pending ({bookings.filter(b => b.status === 'pending').length})
        </button>
        <button 
          className={filter === 'completed' ? 'filter-btn active' : 'filter-btn'}
          onClick={() => setFilter('completed')}
        >
          Completed ({bookings.filter(b => b.status === 'completed').length})
        </button>
        <button 
          className={filter === 'cancelled' ? 'filter-btn active' : 'filter-btn'}
          onClick={() => setFilter('cancelled')}
        >
          Cancelled ({bookings.filter(b => b.status === 'cancelled').length})
        </button>
      </div>

      <div className="bookings-list">
        {filteredBookings.length === 0 ? (
          <div className="no-bookings">
            <div className="no-bookings-icon">📋</div>
            <h3>No bookings found</h3>
            <p>
              {filter === 'all' 
                ? "You haven't made any bookings yet. Start exploring items to rent!"
                : `No ${filter} bookings found.`
              }
            </p>
          </div>
        ) : (
          filteredBookings.map(booking => (
            <div key={booking.id} className="booking-card">
              <div className="booking-header">
                <div className="booking-item">
                  <h3>{booking.item_title}</h3>
                  <p className="booking-owner">Rented from: {booking.owner_name}</p>
                </div>
                <div className="booking-status">
                  <span 
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(booking.status) }}
                  >
                    {getStatusIcon(booking.status)} {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </span>
                </div>
              </div>

              <div className="booking-details">
                <div className="booking-dates">
                  <div className="date-item">
                    <span className="date-label">From:</span>
                    <span className="date-value">{formatDate(booking.start_date)}</span>
                  </div>
                  <div className="date-item">
                    <span className="date-label">To:</span>
                    <span className="date-value">{formatDate(booking.end_date)}</span>
                  </div>
                  <div className="date-item">
                    <span className="date-label">Duration:</span>
                    <span className="date-value">{booking.total_days} day{booking.total_days > 1 ? 's' : ''}</span>
                  </div>
                </div>

                <div className="booking-pricing">
                  <div className="price-item">
                    <span className="price-label">Price per day:</span>
                    <span className="price-value">${booking.price_per_day.toFixed(2)}</span>
                  </div>
                  <div className="price-item total">
                    <span className="price-label">Total Amount:</span>
                    <span className="price-value">${booking.total_amount.toFixed(2)}</span>
                  </div>
                </div>

                {booking.notes && (
                  <div className="booking-notes">
                    <span className="notes-label">Notes:</span>
                    <p className="notes-text">{booking.notes}</p>
                  </div>
                )}

                <div className="booking-meta">
                  <div className="booking-meta-info">
                    <span className="booking-date">
                      Booked on: {formatDate(booking.created_at)}
                    </span>
                    <span className="payment-status">
                      Payment: {booking.payment_status}
                    </span>
                  </div>
                  {isCancellable(booking) && (
                    <button 
                      className="cancel-btn"
                      onClick={() => handleCancelBooking(booking.id)}
                      title="Cancel this booking"
                    >
                      ❌ Cancel Booking
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MyBookings;