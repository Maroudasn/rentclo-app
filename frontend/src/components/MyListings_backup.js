import React, { useState, useEffect } from 'react';
import { useAuth } from './protected/AuthContext';
import { apiGet, apiDelete } from '../utils/api';
import './MyListings.css';

const MyListings = () => {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');                <div className="item-actions">
                  <button 
                    className="edit-btn"
                    onClick={() => window.location.href = `/add-item?edit=${item.id}`}
                  >
                    ✏️ Edit
                  </button>
                  <button 
                    className="delete-btn"
                    onClick={() => handleDeleteItem(item.id)}
                  >
                    🗑️ Delete
                  </button>
                </div>tFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState('grid'); // grid or list

  useEffect(() => {
    if (user) {
      fetchMyItems();
    }
  }, [user]);

  const fetchMyItems = async () => {
    if (!user) {
      setError('Please log in to view your listings');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');
      console.log('🔄 Fetching user items...');
      const response = await apiGet('/items/my-items');
      console.log('📦 API response:', response);
      setItems(response.items || []);
    } catch (error) {
      console.error('❌ Error fetching items:', error);
      setError('Failed to load your listings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
      return;
    }

    try {
      await apiDelete(`/items/${itemId}`);
      setItems(items.filter(item => item.id !== itemId));
      // Show success message
      console.log('✅ Item deleted successfully');
    } catch (error) {
      console.error('Error deleting item:', error);
      setError('Failed to delete item. Please try again.');
    }
  };

  const filteredAndSortedItems = () => {
    let filtered = items.filter(item => {
      if (filter === 'all') return true;
      if (filter === 'available') return item.is_available;
      if (filter === 'unavailable') return !item.is_available;
      return true;
    });

    // Sort items
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at) - new Date(a.created_at);
        case 'oldest':
          return new Date(a.created_at) - new Date(b.created_at);
        case 'price-high':
          return (b.price_per_day || 0) - (a.price_per_day || 0);
        case 'price-low':
          return (a.price_per_day || 0) - (b.price_per_day || 0);
        case 'title':
          return (a.title || '').localeCompare(b.title || '');
        default:
          return 0;
      }
    });

    return filtered;
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="my-listings">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <h3>Loading your listings...</h3>
          <p>Please wait while we fetch your items</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="my-listings">
        <div className="empty-state">
          <div className="empty-icon">🔒</div>
          <h3>Login Required</h3>
          <p>Please log in to view your listings.</p>
          <button 
            className="primary-btn"
            onClick={() => window.location.href = '/login'}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (user?.user_type === 'tenant') {
    return (
      <div className="my-listings">
        <div className="empty-state">
          <div className="empty-icon">�</div>
          <h3>Tenant Account</h3>
          <p>As a tenant, you can browse and rent items but cannot list your own items.</p>
          <p>To start listing items, please contact support to upgrade your account.</p>
          <button 
            className="primary-btn"
            onClick={() => window.location.href = '/'}
          >
            Browse Items
          </button>
        </div>
      </div>
    );
  }

  const filteredItems = filteredAndSortedItems();
  const stats = {
    total: items.length,
    available: items.filter(item => item.is_available).length,
    unavailable: items.filter(item => !item.is_available).length,
    totalEarnings: items.reduce((sum, item) => sum + (item.price_per_day || 0), 0)
  };

  return (
    <div className="my-listings">
      {/* Header Section */}
      <div className="listings-header">
        <div className="header-content">
          <div className="header-text">
            <h1>My Listings</h1>
            <p>Manage all your rental items in one place</p>
          </div>
          <button 
            className="add-item-btn"
            onClick={() => window.location.href = '/add-item'}
          >
            <span className="btn-icon">➕</span>
            Add New Item
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card total">
          <div className="stat-icon">📦</div>
          <div className="stat-content">
            <h3>{stats.total}</h3>
            <p>Total Items</p>
          </div>
        </div>
        <div className="stat-card available">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>{stats.available}</h3>
            <p>Available</p>
          </div>
        </div>
        <div className="stat-card unavailable">
          <div className="stat-icon">⏸️</div>
          <div className="stat-content">
            <h3>{stats.unavailable}</h3>
            <p>Unavailable</p>
          </div>
        </div>
        <div className="stat-card earnings">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3>{formatPrice(stats.totalEarnings)}</h3>
            <p>Total Daily Value</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <span className="error-icon">⚠️</span>
          {error}
          <button 
            className="error-close"
            onClick={() => setError('')}
          >
            ✕
          </button>
        </div>
      )}

      {/* Controls Bar */}
      <div className="controls-bar">
        <div className="filters">
          <button 
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({stats.total})
          </button>
          <button 
            className={`filter-btn ${filter === 'available' ? 'active' : ''}`}
            onClick={() => setFilter('available')}
          >
            Available ({stats.available})
          </button>
          <button 
            className={`filter-btn ${filter === 'unavailable' ? 'active' : ''}`}
            onClick={() => setFilter('unavailable')}
          >
            Unavailable ({stats.unavailable})
          </button>
        </div>

        <div className="controls-right">
          <div className="sort-controls">
            <label>Sort by:</label>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="sort-select"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="price-high">Price High to Low</option>
              <option value="price-low">Price Low to High</option>
              <option value="title">Title A-Z</option>
            </select>
          </div>
          
          <div className="view-controls">
            <button 
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid View"
            >
              ⊞
            </button>
            <button 
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="List View"
            >
              ☰
            </button>
          </div>
        </div>
      </div>

      {/* Items Container */}
      {filteredItems.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            {items.length === 0 ? '📝' : '🔍'}
          </div>
          <h3>
            {items.length === 0 ? 'No items listed yet' : 'No items match your filter'}
          </h3>
          <p>
            {items.length === 0 
              ? "Start building your rental business by adding your first item!"
              : "Try adjusting your filter settings or add more items."
            }
          </p>
          <button 
            className="primary-btn"
            onClick={() => window.location.href = '/add-item'}
          >
            <span className="btn-icon">➕</span>
            Add Your First Item
          </button>
        </div>
      ) : (
        <div className={`items-container ${viewMode}`}>
          {filteredItems.map((item) => (
            <div key={item.id} className="item-card">
              <div className="item-image">
                {item.image_url ? (
                  <img 
                    src={item.image_url} 
                    alt={item.title}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div 
                  className="no-image" 
                  style={{display: item.image_url ? 'none' : 'flex'}}
                >
                  <span className="placeholder-icon">📷</span>
                  <p>No Image</p>
                </div>
                
                <div className="item-badges">
                  <span className={`availability-badge ${item.is_available ? 'available' : 'unavailable'}`}>
                    {item.is_available ? '✅ Available' : '⏸️ Unavailable'}
                  </span>
                </div>

                <div className="quick-actions">
                  <button 
                    className="quick-action-btn edit"
                    onClick={() => window.location.href = `/add-item?edit=${item.id}`}
                    title="Edit Item"
                  >
                    ✏️
                  </button>
                  <button 
                    className="quick-action-btn delete"
                    onClick={() => handleDeleteItem(item.id)}
                    title="Delete Item"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              <div className="item-content">
                <div className="item-header">
                  <h3 className="item-title">{item.title}</h3>
                  <span className="item-price">{formatPrice(item.price_per_day)}/day</span>
                </div>

                {item.description && (
                  <p className="item-description">{item.description}</p>
                )}

                <div className="item-meta">
                  <div className="meta-row">
                    <span className="meta-label">Category:</span>
                    <span className="meta-value">{item.category || 'N/A'}</span>
                  </div>
                  {item.location_area && (
                    <div className="meta-row">
                      <span className="meta-label">Location:</span>
                      <span className="meta-value">{item.location_area}</span>
                    </div>
                  )}
                  <div className="meta-row">
                    <span className="meta-label">Listed:</span>
                    <span className="meta-value">{formatDate(item.created_at)}</span>
                  </div>
                </div>

                <div className="item-actions">
                  <button 
                    className={`toggle-btn ${item.is_available ? 'disable' : 'enable'}`}
                    onClick={() => toggleItemAvailability(item.id, item.is_available)}
                  >
                    {item.is_available ? '⏸️ Disable' : '▶️ Enable'}
                  </button>
                  <button 
                    className="edit-btn"
                    onClick={() => window.location.href = `/add-item?edit=${item.id}`}
                  >
                    ✏️ Edit
                  </button>
                  <button 
                    className="view-btn"
                    onClick={() => window.location.href = `/items/${item.id}`}
                  >
                    �️ View
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Item Floating Button (for mobile) */}
      <button 
        className="floating-add-btn"
        onClick={() => window.location.href = '/add-item'}
        title="Add New Item"
      >
        ➕
      </button>
    </div>
  );
};

export default MyListings;