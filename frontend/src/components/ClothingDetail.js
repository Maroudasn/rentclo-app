import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from './protected/AuthContext';
import { getItemDetail, toggleFavorite, getSimilarItems, deleteItem } from '../utils/api';
import { getItemImages, handleImageError } from '../utils/imageHelpers';
import './ClothingDetail.css';

const ClothingDetail = () => {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [item, setItem] = useState(null);
  const [similarItems, setSimilarItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeImage, setActiveImage] = useState(0);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    fetchItemDetail();
    fetchSimilarItems();
  }, [itemId]);

  const fetchItemDetail = async () => {
    try {
      setLoading(true);
      const itemData = await getItemDetail(itemId);
      
      // Get relevant images using our smart image helper
      const itemImages = getItemImages(itemData);
      setItem({
        ...itemData,
        images: itemImages
      });
    } catch (err) {
      setError('Failed to load item details');
      console.error('Error fetching item:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSimilarItems = async () => {
    try {
      const similarData = await getSimilarItems(itemId);
      
      // Process similar items to include proper images
      const processedSimilarItems = (similarData.items || []).map(similarItem => ({
        ...similarItem,
        images: getItemImages(similarItem)
      }));
      
      setSimilarItems(processedSimilarItems);
    } catch (err) {
      console.error('Error fetching similar items:', err);
    }
  };

  const handleFavoriteToggle = async () => {
    if (!item || favoriteLoading) return;
    
    setFavoriteLoading(true);
    try {
      const result = await toggleFavorite(itemId);
      setItem(prev => ({
        ...prev,
        is_favorited: result.is_favorited
      }));
    } catch (err) {
      console.error('Error toggling favorite:', err);
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleEditClick = () => {
    // Navigate to add-item page with edit mode and item data
    navigate(`/add-item?edit=${itemId}`);
  };

  const handleDeleteConfirm = async () => {
    setDeleteLoading(true);
    try {
      await deleteItem(itemId);
      alert('✅ Item deleted successfully!');
      navigate('/home');
    } catch (err) {
      console.error('Error deleting item:', err);
      alert('❌ Failed to delete item. Please try again.');
    } finally {
      setDeleteLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
  };

  const handleBookNow = () => {
    navigate(`/item/${itemId}/book`);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getConditionBadge = (condition) => {
    const conditionStyles = {
      new: { label: '✨ New', class: 'condition-new' },
      excellent: { label: '👍 Excellent', class: 'condition-excellent' },
      good: { label: '✅ Good', class: 'condition-good' },
      fair: { label: '⚠️ Fair', class: 'condition-fair' }
    };
    
    const style = conditionStyles[condition] || conditionStyles.good;
    return <span className={`condition-badge ${style.class}`}>{style.label}</span>;
  };

  if (loading) {
    return (
      <div className="clothing-detail-loading">
        <div className="loading-spinner"></div>
        <p>Loading item details...</p>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="clothing-detail-error">
        <h2>Item Not Found</h2>
        <p>{error || "The item you're looking for doesn't exist or is no longer available."}</p>
        <Link to="/home" className="back-to-home-btn">
          ← Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="clothing-detail">
      {/* Breadcrumb Navigation */}
      <nav className="breadcrumb">
        <Link to="/home">Home</Link>
        <span> / </span>
        <Link to="/home">Browse</Link>
        <span> / </span>
        <span>{item.title}</span>
      </nav>

      <div className="detail-container">
        {/* Image Gallery */}
        <div className="image-gallery">
          <div className="main-image">
            <img 
              src={item.images[activeImage]} 
              alt={item.title}
              onError={(e) => handleImageError(e, item)}
            />
          </div>
          
          {item.images.length > 1 && (
            <div className="image-thumbnails">
              {item.images.map((image, index) => (
                <button
                  key={index}
                  className={`thumbnail ${index === activeImage ? 'active' : ''}`}
                  onClick={() => setActiveImage(index)}
                >
                  <img 
                    src={image} 
                    alt={`${item.title} view ${index + 1}`}
                    onError={(e) => handleImageError(e, item)}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Item Information */}
        <div className="item-info">
          <div className="item-header">
            <h1>{item.title}</h1>
            <div className="item-meta">
              <span className="item-category">{item.category}</span>
              {getConditionBadge(item.condition)}
            </div>
            <div className="item-price">€{item.price_per_day} <span className="price-period">/ day</span></div>
          </div>

          {/* Quick Actions */}
          <div className="quick-actions">
            {/* Show Book Now button only if user is not the owner */}
            {user && user.id !== item.user_id && (
              <button 
                onClick={handleBookNow}
                className="book-now-btn"
              >
                📅 Book Now
              </button>
            )}
            
            {/* Show Edit and Delete buttons only if user is the owner */}
            {user && user.id === item.user_id && (
              <>
                <button 
                  onClick={handleEditClick}
                  className="edit-btn"
                >
                  ✏️ Edit Item
                </button>
                
                <button 
                  onClick={handleDeleteClick}
                  disabled={deleteLoading}
                  className="delete-btn"
                >
                  {deleteLoading ? '⏳ Deleting...' : '🗑️ Delete Item'}
                </button>
              </>
            )}
            
            {/* Favorite button for all authenticated users except owner */}
            {user && user.id !== item.user_id && (
              <button 
                onClick={handleFavoriteToggle}
                disabled={favoriteLoading}
                className={`favorite-btn ${item.is_favorited ? 'favorited' : ''}`}
              >
                {favoriteLoading ? '❤️' : (item.is_favorited ? '❤️ Saved' : '🤍 Save')}
              </button>
            )}
          </div>

          {/* Item Details */}
          <div className="details-section">
            <h3>Item Details</h3>
            <div className="details-grid">
              <div className="detail-item">
                <span className="detail-label">Brand:</span>
                <span className="detail-value">{item.brand || 'Not specified'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Size:</span>
                <span className="detail-value">{item.size}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Color:</span>
                <span className="detail-value">{item.color || 'Not specified'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Gender:</span>
                <span className="detail-value">
                  {item.gender === 'men' ? '👨 Men' : 
                   item.gender === 'women' ? '👩 Women' : '🚻 Unisex'}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Occasion:</span>
                <span className="detail-value">{item.occasion || 'Any occasion'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Location:</span>
                <span className="detail-value">📍 {item.location_area}</span>
              </div>
            </div>
          </div>

          {/* Description */}
          {item.description && (
            <div className="description-section">
              <h3>Description</h3>
              <p>{item.description}</p>
            </div>
          )}

          {/* Specifications */}
          {(item.material || item.care_instructions || item.measurements) && (
            <div className="specifications-section">
              <h3>Specifications</h3>
              <div className="specs-grid">
                {item.material && (
                  <div className="spec-item">
                    <span className="spec-label">Material:</span>
                    <span className="spec-value">{item.material}</span>
                  </div>
                )}
                {item.measurements && (
                  <div className="spec-item">
                    <span className="spec-label">Measurements:</span>
                    <span className="spec-value">{item.measurements}</span>
                  </div>
                )}
                {item.care_instructions && (
                  <div className="spec-item">
                    <span className="spec-label">Care Instructions:</span>
                    <span className="spec-value">{item.care_instructions}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Availability */}
          <div className="availability-section">
            <h3>📅 Availability</h3>
            <div className="availability-dates">
              <div className="date-range">
                <span className="date-label">Available from:</span>
                <span className="date-value">{formatDate(item.availability_start)}</span>
              </div>
              <div className="date-range">
                <span className="date-label">Available until:</span>
                <span className="date-value">{formatDate(item.availability_end)}</span>
              </div>
            </div>
          </div>

          {/* Owner Information */}
          <div className="owner-section">
            <h3>👤 Item Owner</h3>
            <div className="owner-info">
              <div className="owner-avatar">
                {item.owner_name.charAt(0).toUpperCase()}
              </div>
              <div className="owner-details">
                <h4>{item.owner_name}</h4>
                <div className="owner-stats">
                  <span className="owner-rating">⭐ {item.owner_rating}/5</span>
                  <span className="owner-joined">Member since {new Date(item.owner_joined).getFullYear()}</span>
                </div>
              </div>
            </div>
            <button className="contact-owner-btn">
              💬 Contact Owner
            </button>
          </div>
        </div>
      </div>

      {/* Similar Items Section */}
      {similarItems.length > 0 && (
        <div className="similar-items-section">
          <h2>You might also like</h2>
          <div className="similar-items-grid">
            {similarItems.map(similarItem => (
              <Link 
                key={similarItem.id} 
                to={`/item/${similarItem.id}`}
                className="similar-item-card"
              >
                <div className="similar-item-image">
                  <img 
                    src={similarItem.images[0]} 
                    alt={similarItem.title}
                    onError={(e) => handleImageError(e, similarItem)}
                  />
                </div>
                <div className="similar-item-info">
                  <h4>{similarItem.title}</h4>
                  <p className="similar-item-price">€{similarItem.price_per_day}/day</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>🗑️ Delete Item</h3>
            <p>Are you sure you want to delete "<strong>{item.title}</strong>"?</p>
            <p className="warning-text">⚠️ This action cannot be undone.</p>
            <div className="modal-actions">
              <button 
                onClick={handleDeleteCancel}
                className="cancel-btn"
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteConfirm}
                className="confirm-delete-btn"
                disabled={deleteLoading}
              >
                {deleteLoading ? '⏳ Deleting...' : '🗑️ Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClothingDetail;