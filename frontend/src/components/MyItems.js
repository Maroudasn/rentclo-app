import React, { useState, useEffect } from 'react';
import { useAuth } from './protected/AuthContext';
import { getMyItems, deleteItem } from '../utils/api';
import { useNavigate } from 'react-router-dom';
import './MyItems.css';

const MyItems = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadMyItems();
  }, []);

  const loadMyItems = async () => {
    try {
      setLoading(true);
      const response = await getMyItems();
      setItems(response.items || []);
    } catch (error) {
      setMessage('❌ Failed to load your items');
      console.error('Error loading items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (itemId) => {
    navigate(`/edit-item/${itemId}`);
  };

  const handleDelete = async (itemId, itemTitle) => {
    if (window.confirm(`Are you sure you want to delete "${itemTitle}"? This action cannot be undone.`)) {
      try {
        setMessage('');
        await deleteItem(itemId);
        setMessage(`✅ "${itemTitle}" deleted successfully`);
        // Remove the item from the list
        setItems(items.filter(item => item.id !== itemId));
        
        // Clear message after 3 seconds
        setTimeout(() => setMessage(''), 3000);
      } catch (error) {
        const errorMessage = error.response?.data?.detail || 'Failed to delete item';
        setMessage(`❌ ${errorMessage}`);
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="my-items-page">
        <div className="loading">Loading your items...</div>
      </div>
    );
  }

  return (
    <div className="my-items-page">
      <div className="my-items-header">
        <h1>🛍️ My Items</h1>
        <p>Manage the items you've added for rent</p>
        <button 
          className="add-new-btn"
          onClick={() => navigate('/add-item')}
        >
          ➕ Add New Item
        </button>
      </div>

      {message && <div className="message">{message}</div>}

      {items.length === 0 ? (
        <div className="no-items">
          <h3>No items yet</h3>
          <p>You haven't added any items for rent yet.</p>
          <button 
            className="add-first-item-btn"
            onClick={() => navigate('/add-item')}
          >
            Add Your First Item
          </button>
        </div>
      ) : (
        <div className="items-grid">
          {items.map(item => (
            <div key={item.id} className="item-card">
              <div className="item-image">
                {item.image_url ? (
                  <img src={item.image_url} alt={item.title} />
                ) : (
                  <div className="no-image">📷</div>
                )}
              </div>
              
              <div className="item-info">
                <h3>{item.title}</h3>
                <p className="price">€{item.price_per_day}/day</p>
                <p className="category">{item.category} • {item.size}</p>
                <p className="condition">Condition: {item.condition}</p>
                <p className="availability">
                  Available: {formatDate(item.start_date)} - {formatDate(item.end_date)}
                </p>
                <p className="status">
                  Status: {item.is_available ? '✅ Available' : '❌ Unavailable'}
                </p>
              </div>
              
              <div className="item-actions">
                <button 
                  className="edit-btn"
                  onClick={() => handleEdit(item.id)}
                >
                  ✏️ Edit
                </button>
                <button 
                  className="delete-btn"
                  onClick={() => handleDelete(item.id, item.title)}
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyItems;