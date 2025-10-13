import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from './protected/AuthContext';
import { editItem, getCategories, getSizesByCategory, getItemDetail } from '../utils/api';
import './AddItem.css'; // Reuse the same styles

const EditItem = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { itemId } = useParams();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price_per_day: '',
    category: '',
    gender: '',
    occasion: '',
    size: '',
    condition: '',
    brand: '',
    color: '',
    location_area: '',
    availability_start: '',
    availability_end: ''
  });
  
  const [categories, setCategories] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadItemData();
    loadCategories();
  }, [itemId]);

  useEffect(() => {
    if (formData.category) {
      loadSizes(formData.category);
    } else {
      setSizes([]);
    }
  }, [formData.category]);

  const loadItemData = async () => {
    try {
      setLoadingData(true);
      const response = await getItemDetail(itemId);
      const item = response.item;
      
      // Convert dates to YYYY-MM-DD format for input fields
      const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        return dateString.split('T')[0]; // Extract date part
      };

      setFormData({
        title: item.title || '',
        description: item.description || '',
        price_per_day: item.price_per_day || '',
        category: item.category || '',
        gender: item.gender || '',
        occasion: item.occasion || '',
        size: item.size || '',
        condition: item.condition || '',
        brand: item.brand || '',
        color: item.color || '',
        location_area: item.location_area || '',
        availability_start: formatDateForInput(item.availability_start),
        availability_end: formatDateForInput(item.availability_end)
      });
    } catch (error) {
      setMessage('❌ Failed to load item data');
      console.error('Error loading item:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await getCategories();
      setCategories(response.categories || []);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const loadSizes = async (category) => {
    try {
      const response = await getSizesByCategory(category);
      setSizes(response.sizes || []);
    } catch (error) {
      console.error('Failed to load sizes:', error);
      setSizes([]);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    // Validation
    if (!formData.title || !formData.price_per_day || !formData.category || 
        !formData.gender || !formData.occasion || !formData.size || !formData.condition || 
        !formData.location_area || !formData.availability_start || 
        !formData.availability_end) {
      setMessage('Please fill in all required fields');
      setLoading(false);
      return;
    }

    // Date validation
    const startDate = new Date(formData.availability_start);
    const endDate = new Date(formData.availability_end);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (endDate <= startDate) {
      setMessage('End date must be after start date');
      setLoading(false);
      return;
    }

    try {
      // Create FormData object
      const submitData = new FormData();
      
      // Append all form fields
      Object.keys(formData).forEach(key => {
        if (formData[key] !== '') {
          submitData.append(key, formData[key]);
        }
      });

      // Submit to backend
      const result = await editItem(itemId, submitData);
      
      setMessage(`✅ ${result.message}`);
      
      // Redirect to my items page after successful update
      setTimeout(() => {
        navigate('/my-items');
      }, 2000);

    } catch (error) {
      console.error('Edit item error:', error);
      let errorMessage = 'Failed to update item';
      
      if (error.response?.status === 422) {
        const details = error.response?.data?.detail;
        if (Array.isArray(details)) {
          errorMessage = details.map(d => d.msg).join(', ');
        } else if (details) {
          errorMessage = details;
        } else {
          errorMessage = 'Please check all required fields are filled correctly';
        }
      } else if (error.response?.status === 401) {
        errorMessage = 'Please log in to edit items';
      } else if (error.response?.status === 403) {
        errorMessage = 'You can only edit your own items';
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      }
      
      setMessage(`❌ ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  if (loadingData) {
    return (
      <div className="add-item-page">
        <div className="loading">Loading item data...</div>
      </div>
    );
  }

  return (
    <div className="add-item-page">
      <div className="add-item-container">
        <div className="add-item-header">
          <h1>✏️ Edit Item</h1>
          <p>Update your item details</p>
          <button 
            type="button" 
            className="back-btn"
            onClick={() => navigate('/my-items')}
          >
            ← Back to My Items
          </button>
        </div>

        {message && <div className="message">{message}</div>}

        <form onSubmit={handleSubmit} className="add-item-form">
          {/* Basic Information */}
          <div className="form-section">
            <h3>📝 Basic Information</h3>
            
            <div className="form-group">
              <label htmlFor="title">Item Title *</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="e.g., Elegant Evening Dress"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe your item in detail..."
                rows="4"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="price_per_day">Price per Day (€) *</label>
                <input
                  type="number"
                  id="price_per_day"
                  name="price_per_day"
                  value={formData.price_per_day}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  placeholder="e.g., 25.00"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="condition">Condition *</label>
                <select
                  id="condition"
                  name="condition"
                  value={formData.condition}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select condition</option>
                  <option value="new">New</option>
                  <option value="like-new">Like New</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                </select>
              </div>
            </div>
          </div>

          {/* Category & Details */}
          <div className="form-section">
            <h3>🏷️ Category & Details</h3>
            
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
                  <option value="">Select category</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="size">Size *</label>
                <select
                  id="size"
                  name="size"
                  value={formData.size}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select size</option>
                  {sizes.map(size => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="gender">Gender *</label>
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select gender</option>
                  <option value="women">Women</option>
                  <option value="men">Men</option>
                  <option value="unisex">Unisex</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="occasion">Occasion *</label>
                <select
                  id="occasion"
                  name="occasion"
                  value={formData.occasion}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select occasion</option>
                  <option value="formal">Formal</option>
                  <option value="casual">Casual</option>
                  <option value="sports">Sports</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="brand">Brand</label>
                <input
                  type="text"
                  id="brand"
                  name="brand"
                  value={formData.brand}
                  onChange={handleInputChange}
                  placeholder="e.g., Zara, H&M, Nike"
                />
              </div>

              <div className="form-group">
                <label htmlFor="color">Color</label>
                <input
                  type="text"
                  id="color"
                  name="color"
                  value={formData.color}
                  onChange={handleInputChange}
                  placeholder="e.g., Black, Blue, Red"
                />
              </div>
            </div>
          </div>

          {/* Location & Availability */}
          <div className="form-section">
            <h3>📍 Location & Availability</h3>
            
            <div className="form-group">
              <label htmlFor="location_area">Location/Area *</label>
              <input
                type="text"
                id="location_area"
                name="location_area"
                value={formData.location_area}
                onChange={handleInputChange}
                placeholder="e.g., Downtown, City Center, Suburb"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="availability_start">Available From *</label>
                <input
                  type="date"
                  id="availability_start"
                  name="availability_start"
                  value={formData.availability_start}
                  onChange={handleInputChange}
                  min={today}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="availability_end">Available Until *</label>
                <input
                  type="date"
                  id="availability_end"
                  name="availability_end"
                  value={formData.availability_end}
                  onChange={handleInputChange}
                  min={formData.availability_start || today}
                  required
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="form-actions">
            <button 
              type="button" 
              className="cancel-btn"
              onClick={() => navigate('/my-items')}
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="submit-btn"
              disabled={loading}
            >
              {loading ? '⏳ Updating...' : '✅ Update Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditItem;