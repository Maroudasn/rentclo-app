import React, { useState } from 'react';
import { useAuth } from './protected/AuthContext';
import { apiPost } from '../utils/api';
import './AddNewItem.css';

const AddNewItem = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    price_per_day: '',
    location: '',
    image_url: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const categories = [
    'Electronics',
    'Furniture',
    'Appliances',
    'Sports & Recreation',
    'Tools & Equipment',
    'Vehicles',
    'Books & Media',
    'Clothing & Fashion',
    'Home & Garden',
    'Photography',
    'Musical Instruments',
    'Games & Toys',
    'Other'
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Item name is required');
      return false;
    }
    if (!formData.description.trim()) {
      setError('Description is required');
      return false;
    }
    if (!formData.category) {
      setError('Please select a category');
      return false;
    }
    if (!formData.price_per_day || parseFloat(formData.price_per_day) <= 0) {
      setError('Please enter a valid price per day');
      return false;
    }
    if (!formData.location.trim()) {
      setError('Location is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setLoading(true);
      setError('');
      
      const itemData = {
        ...formData,
        price_per_day: parseFloat(formData.price_per_day),
        owner_id: user.user_id
      };

      await apiPost('/items', itemData);
      
      setSuccess(true);
      setFormData({
        name: '',
        description: '',
        category: '',
        price_per_day: '',
        location: '',
        image_url: ''
      });
      
      // Hide success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
      
    } catch (error) {
      console.error('Error adding item:', error);
      setError(error.message || 'Failed to add item. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      name: '',
      description: '',
      category: '',
      price_per_day: '',
      location: '',
      image_url: ''
    });
    setError('');
    setSuccess(false);
  };

  if (!user) {
    return (
      <div className="add-item">
        <div className="no-access">
          <div className="no-access-icon">🔒</div>
          <h3>Login Required</h3>
          <p>Please log in to add new items to the marketplace.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="add-item">
      <div className="add-item-header">
        <h2>➕ Add New Item</h2>
        <p>List your item for rent on our marketplace</p>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {success && (
        <div className="success-message">
          🎉 Item added successfully! It's now available for rent.
        </div>
      )}

      <form onSubmit={handleSubmit} className="add-item-form">
        <div className="form-section">
          <h3>Basic Information</h3>
          
          <div className="form-group">
            <label htmlFor="name">Item Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="e.g., Canon EOS R5 Camera"
              maxLength="100"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description *</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Describe your item, its condition, what's included, and any special notes..."
              rows="4"
              maxLength="500"
              required
            />
            <div className="char-count">
              {formData.description.length}/500 characters
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="category">Category *</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                required
              >
                <option value="">Select a category</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="price_per_day">Price per Day ($) *</label>
              <input
                type="number"
                id="price_per_day"
                name="price_per_day"
                value={formData.price_per_day}
                onChange={handleInputChange}
                placeholder="0.00"
                min="0.01"
                step="0.01"
                required
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Location & Images</h3>
          
          <div className="form-group">
            <label htmlFor="location">Location *</label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              placeholder="e.g., Downtown Seattle, WA"
              maxLength="100"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="image_url">Image URL (optional)</label>
            <input
              type="url"
              id="image_url"
              name="image_url"
              value={formData.image_url}
              onChange={handleInputChange}
              placeholder="https://example.com/image.jpg"
            />
            <div className="form-hint">
              Add a photo URL to make your listing more attractive
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button 
            type="button" 
            className="reset-btn"
            onClick={handleReset}
            disabled={loading}
          >
            Reset Form
          </button>
          <button 
            type="submit" 
            className="submit-btn"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner">⏳</span>
                Adding Item...
              </>
            ) : (
              'Add Item'
            )}
          </button>
        </div>
      </form>

      <div className="tips-section">
        <h3>💡 Tips for a Great Listing</h3>
        <ul>
          <li>Use a clear, descriptive title that includes the brand and model</li>
          <li>Write a detailed description including condition and what's included</li>
          <li>Set a competitive daily rate by researching similar items</li>
          <li>Add high-quality photos to attract more renters</li>
          <li>Be specific about your location for local pickup/delivery</li>
          <li>Respond quickly to rental requests to build trust</li>
        </ul>
      </div>
    </div>
  );
};

export default AddNewItem;