import React, { useState, useEffect } from 'react';
import { useAuth } from './protected/AuthContext';
import { apiGet, apiPost, apiDelete } from '../utils/api';
import './Favorites.css';

const Favorites = () => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.id) {
      fetchFavorites();
    }
  }, [user]);

  const fetchFavorites = async () => {
    if (!user?.id) {
      setError('Please log in to view your favorites');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');
      const response = await apiGet(`/user/${user.id}/favorites`);
      setFavorites(response.favorites || []);
    } catch (error) {
      console.error('Error fetching favorites:', error);
      setError('Failed to load favorites');
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (itemId) => {
    try {
      await apiDelete(`/user/${user.id}/favorites/${itemId}`);
      setFavorites(favorites.filter(fav => fav.id !== itemId));
    } catch (error) {
      console.error('Error removing favorite:', error);
      setError('Failed to remove favorite');
    }
  };

  const addToCart = async (itemId) => {
    try {
      await apiPost('/cart/add', { item_id: itemId, quantity: 1 });
      // Show success message or update UI
      alert('Item added to cart!');
    } catch (error) {
      console.error('Error adding to cart:', error);
      setError('Failed to add item to cart');
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const getAvailabilityStatus = (available) => {
    return available ? 'Available' : 'Unavailable';
  };

  if (loading) {
    return (
      <div className="favorites">
        <div className="loading">
          <span>📚</span>
          Loading your favorites...
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="favorites">
        <div className="no-favorites">
          <div className="no-favorites-icon">🔒</div>
          <h3>Login Required</h3>
          <p>Please log in to view your favorites!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="favorites">
      <div className="favorites-header">
        <h2>❤️ My Favorites</h2>
        <p>Items you've saved for later</p>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {favorites.length === 0 ? (
        <div className="no-favorites">
          <div className="no-favorites-icon">💔</div>
          <h3>No favorites yet</h3>
          <p>Start browsing items and click the heart icon to save them here!</p>
          <button 
            className="browse-btn"
            onClick={() => window.location.href = '/'}
          >
            Browse Items
          </button>
        </div>
      ) : (
        <>
          <div className="favorites-stats">
            <div className="stat-item">
              <span className="stat-number">{favorites.length}</span>
              <span className="stat-label">Saved Items</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">
                {favorites.filter(fav => fav.available).length}
              </span>
              <span className="stat-label">Available</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">
                {formatPrice(
                  favorites
                    .filter(fav => fav.available)
                    .reduce((total, fav) => total + (fav.price_per_day || 0), 0) / 
                  favorites.filter(fav => fav.available).length || 0
                )}
              </span>
              <span className="stat-label">Avg. Price</span>
            </div>
          </div>

          <div className="favorites-grid">
            {favorites.map((item) => (
              <div key={item.id} className="favorite-card">
                <div className="item-image">
                  {item.image_url ? (
                    <img 
                      src={item.image_url} 
                      alt={item.name}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div className="no-image" style={{display: item.image_url ? 'none' : 'flex'}}>
                    <span>📦</span>
                    <span>No Image</span>
                  </div>
                  <div className={`availability-badge ${item.available ? 'available' : 'unavailable'}`}>
                    {getAvailabilityStatus(item.available)}
                  </div>
                  <button 
                    className="remove-favorite-btn"
                    onClick={() => removeFavorite(item.id)}
                    title="Remove from favorites"
                  >
                    ❤️
                  </button>
                </div>

                <div className="item-details">
                  <h3 className="item-title">{item.name}</h3>
                  
                  {item.description && (
                    <p className="item-description">{item.description}</p>
                  )}

                  <div className="item-info">
                    <div className="info-row">
                      <span className="info-label">Price per day:</span>
                      <span className="info-value">
                        {formatPrice(item.price_per_day || 0)}
                      </span>
                    </div>
                    
                    {item.category && (
                      <div className="info-row">
                        <span className="info-label">Category:</span>
                        <span className="info-value">{item.category}</span>
                      </div>
                    )}

                    {item.location && (
                      <div className="info-row">
                        <span className="info-label">Location:</span>
                        <span className="info-value">{item.location}</span>
                      </div>
                    )}
                  </div>

                  <div className="item-meta">
                    {item.owner_name && (
                      <div className="owner-info">
                        <span>👤 Listed by {item.owner_name}</span>
                      </div>
                    )}
                    {item.created_at && (
                      <div className="saved-date">
                        💾 Saved {new Date(item.created_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>

                  <div className="item-actions">
                    {item.available ? (
                      <>
                        <button 
                          className="action-btn rent-btn"
                          onClick={() => window.location.href = `/item/${item.id}`}
                        >
                          View Details
                        </button>
                        <button 
                          className="action-btn cart-btn"
                          onClick={() => addToCart(item.id)}
                        >
                          Add to Cart
                        </button>
                      </>
                    ) : (
                      <button className="action-btn unavailable-btn" disabled>
                        Unavailable
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Favorites;