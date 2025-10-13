import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from './protected/AuthContext';
import { addItem, getCategories, getSizesByCategory, getItemDetail, editItem } from '../utils/api';
import './AddItem.css';

const AddItem = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Check if we're in edit mode
  const editItemId = searchParams.get('edit');
  const isEditMode = !!editItemId;
  
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
  
  const [images, setImages] = useState([]);
  const [categories, setCategories] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [message, setMessage] = useState('');
  const [imagePreviews, setImagePreviews] = useState([]);

  // Load categories on component mount
  useEffect(() => {
    loadCategories();
    
    // If in edit mode, load the item data
    if (isEditMode && editItemId) {
      loadItemData(editItemId);
    }
  }, [isEditMode, editItemId]);

  // Load sizes when category changes
  useEffect(() => {
    if (formData.category) {
      loadSizes(formData.category);
    } else {
      setSizes([]);
    }
  }, [formData.category]);

  const loadCategories = async () => {
    try {
      const categoriesData = await getCategories();
      // Backend returns categories directly as an array
      setCategories(categoriesData || []);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const loadItemData = async (itemId) => {
    try {
      setLoadingData(true);
      const response = await getItemDetail(itemId);
      const item = response.item || response;
      
      // Check if current user owns this item
      if (item.user_id !== user?.id) {
        setMessage('❌ You can only edit your own items');
        navigate('/home');
        return;
      }

      // Convert dates to YYYY-MM-DD format for input fields
      const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        return dateString.split('T')[0]; // Extract date part
      };

      // Pre-fill form with existing data
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

      // Handle existing images - show them as previews but don't include in form submission
      if (item.images && item.images.length > 0) {
        setImagePreviews(item.images.map(url => ({ url, isExisting: true })));
      }

    } catch (error) {
      setMessage('❌ Failed to load item data');
      console.error('Error loading item:', error);
      navigate('/home');
    } finally {
      setLoadingData(false);
    }
  };

  const loadSizes = async (category) => {
    try {
      const sizesData = await getSizesByCategory(category);
      setSizes(sizesData);
    } catch (error) {
      console.error('Failed to load sizes:', error);
      // Fallback sizes based on category type
      const fallbackSizes = getFallbackSizes(category);
      setSizes(fallbackSizes);
    }
  };

  const getFallbackSizes = (category) => {
    const clothingSizes = [
      { size_value: 'XS', display_name: 'XS' },
      { size_value: 'S', display_name: 'S' },
      { size_value: 'M', display_name: 'M' },
      { size_value: 'L', display_name: 'L' },
      { size_value: 'XL', display_name: 'XL' },
      { size_value: 'XXL', display_name: 'XXL' }
    ];
    
    const shoeSizes = [
      { size_value: '36', display_name: '36' },
      { size_value: '37', display_name: '37' },
      { size_value: '38', display_name: '38' },
      { size_value: '39', display_name: '39' },
      { size_value: '40', display_name: '40' },
      { size_value: '41', display_name: '41' },
      { size_value: '42', display_name: '42' },
      { size_value: '43', display_name: '43' }
    ];
    
    const accessorySizes = [
      { size_value: 'ONESIZE', display_name: 'One Size' }
    ];

    if (category === 'Shoes') return shoeSizes;
    if (category === 'Accessories') return accessorySizes;
    return clothingSizes;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Validate number of images
    if (files.length + images.length > 5) {
      setMessage('Maximum 5 images allowed');
      return;
    }

    // Validate file types and sizes
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        setMessage('Only image files are allowed');
        return false;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setMessage('Image size should be less than 5MB');
        return false;
      }
      return true;
    });

    setImages(prev => [...prev, ...validFiles]);

    // Create image previews
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreviews(prev => [...prev, e.target.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
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

    // For new items, require at least one image; for edits, images are optional
    if (!isEditMode && images.length === 0) {
      setMessage('Please add at least one image');
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

      // Append new images (only if user selected new ones)
      images.forEach(image => {
        submitData.append('images', image);
      });

      let result;
      if (isEditMode) {
        // Edit existing item
        result = await editItem(editItemId, submitData);
        setMessage(`✅ ${result.message}`);
      } else {
        // Add new item
        result = await addItem(submitData);
        setMessage(`✅ ${result.message} with ${result.images_saved} images`);
      }
      
      // Reset form after successful submission
      setTimeout(() => {
        if (isEditMode) {
          // Redirect to the updated item detail page
          navigate(`/item/${editItemId}`);
        } else {
          // For new items, reset form and go to home
          setFormData({
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
          setImages([]);
          setImagePreviews([]);
          setSizes([]);
          navigate('/home');
        }
      }, 2000);

    } catch (error) {
      console.error(`${isEditMode ? 'Edit' : 'Add'} item error:`, error);
      let errorMessage = `Failed to ${isEditMode ? 'update' : 'add'} item`;
      
      if (error.response?.status === 422) {
        // Validation error - try to get specific details
        const details = error.response?.data?.detail;
        if (Array.isArray(details)) {
          errorMessage = details.map(d => d.msg).join(', ');
        } else if (details) {
          errorMessage = details;
        } else {
          errorMessage = 'Please check all required fields are filled correctly';
        }
      } else if (error.response?.status === 401) {
        errorMessage = 'Please log in to add items';
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      }
      
      setMessage(`❌ ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // Calculate minimum date for availability (today)
  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  return (
    <div className="add-item-page">
      <div className="add-item-container">
        <div className="add-item-header">
          <h1>{isEditMode ? '✏️ Edit Item' : '🆕 Add New Item'}</h1>
          <p>{isEditMode ? 'Update your item details' : 'List your clothing items for rent and start earning'}</p>
        </div>

        {message && (
          <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}

        {loadingData ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading item data...</p>
          </div>
        ) : (

        <form onSubmit={handleSubmit} className="add-item-form">
          {/* Basic Information Section */}
          <div className="form-section">
            <h3>📝 Basic Information</h3>
            
            <div className="form-group">
              <label htmlFor="title">Item Title *</label>
              <input
                id="title"
                name="title"
                type="text"
                value={formData.title}
                onChange={handleInputChange}
                required
                placeholder="e.g., Elegant Black Dress, Designer Handbag"
                maxLength="100"
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="3"
                placeholder="Describe your item's features, condition, and any special details..."
                maxLength="500"
              />
              <small>{formData.description.length}/500 characters</small>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="price_per_day">Price per Day (€) *</label>
                <input
                  id="price_per_day"
                  name="price_per_day"
                  type="number"
                  value={formData.price_per_day}
                  onChange={handleInputChange}
                  required
                  min="1"
                  max="1000"
                  step="0.01"
                  placeholder="0.00"
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
                  <option value="new">✨ New</option>
                  <option value="excellent">👍 Excellent</option>
                  <option value="good">✅ Good</option>
                  <option value="fair">⚠️ Fair</option>
                </select>
              </div>
            </div>
          </div>

          {/* Category & Details Section */}
          <div className="form-section">
            <h3>📂 Category & Details</h3>
            
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
                    <option key={cat.id || cat.name} value={cat.name}>
                      {cat.name === 'Dresses' && '👗 '}
                      {cat.name === 'Tops' && '👕 '}
                      {cat.name === 'Bottoms' && '👖 '}
                      {cat.name === 'Outerwear' && '🧥 '}
                      {cat.name === 'Accessories' && '👜 '}
                      {cat.name === 'Shoes' && '👠 '}
                      {cat.name === 'Formal Wear' && '🎩 '}
                      {cat.name === 'Casual Wear' && '👚 '}
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

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
                  <option value="women">👩 Women</option>
                  <option value="men">👨 Men</option>
                  <option value="unisex">🚻 Unisex</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="size">Size *</label>
                <select
                  id="size"
                  name="size"
                  value={formData.size}
                  onChange={handleInputChange}
                  required
                  disabled={!formData.category}
                >
                  <option value="">{formData.category ? 'Select size' : 'Select category first'}</option>
                  {sizes.map(size => (
                    <option key={size.size_value} value={size.size_value}>
                      {size.display_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="occasion">Occasion</label>
                <select
                  id="occasion"
                  name="occasion"
                  value={formData.occasion}
                  onChange={handleInputChange}
                >
                  <option value="">Any occasion</option>
                  <option value="formal">🎩 Formal</option>
                  <option value="casual">😊 Casual</option>
                  <option value="sports">⚽ Sports</option>
                  <option value="party">🎊 Party</option>
                  <option value="business">💼 Business</option>
                  <option value="wedding">💒 Wedding</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="brand">Brand</label>
                <input
                  id="brand"
                  name="brand"
                  type="text"
                  value={formData.brand}
                  onChange={handleInputChange}
                  placeholder="e.g., Zara, Nike, Gucci"
                />
              </div>

              <div className="form-group">
                <label htmlFor="color">Color</label>
                <input
                  id="color"
                  name="color"
                  type="text"
                  value={formData.color}
                  onChange={handleInputChange}
                  placeholder="e.g., Black, Red, Blue"
                />
              </div>
            </div>
          </div>

          {/* Location & Availability Section */}
          <div className="form-section">
            <h3>📍 Location & Availability</h3>
            
            <div className="form-group">
              <label htmlFor="location_area">Location Area *</label>
              <select
                id="location_area"
                name="location_area"
                value={formData.location_area}
                onChange={handleInputChange}
                required
              >
                <option value="">Select your area</option>
                <option value="Downtown">🏙️ Downtown</option>
                <option value="Uptown">🏘️ Uptown</option>
                <option value="Beach Area">🏖️ Beach Area</option>
                <option value="Business District">💼 Business District</option>
                <option value="Arts District">🎨 Arts District</option>
                <option value="Sports Complex">⚽ Sports Complex</option>
                <option value="North Area">🧭 North Area</option>
                <option value="City Center">🏛️ City Center</option>
                <option value="Shopping District">🛍️ Shopping District</option>
                <option value="Park Area">🌳 Park Area</option>
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="availability_start">Available From *</label>
                <input
                  id="availability_start"
                  name="availability_start"
                  type="date"
                  value={formData.availability_start}
                  onChange={handleInputChange}
                  required
                  min={getTodayDate()}
                />
              </div>

              <div className="form-group">
                <label htmlFor="availability_end">Available Until *</label>
                <input
                  id="availability_end"
                  name="availability_end"
                  type="date"
                  value={formData.availability_end}
                  onChange={handleInputChange}
                  required
                  min={formData.availability_start || getTodayDate()}
                />
              </div>
            </div>
          </div>

          {/* Images Section */}
          <div className="form-section">
            <h3>🖼️ Images</h3>
            <p className="section-description">Add clear photos of your item. First image will be the main photo.</p>
            
            <div className="image-upload-section">
              <div className="image-upload-area">
                <input
                  type="file"
                  id="images"
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                  className="image-input"
                />
                <label htmlFor="images" className="image-upload-label">
                  <div className="upload-icon">📷</div>
                  <p>Click to upload images</p>
                  <small>Max 5 images, 5MB each</small>
                </label>
              </div>

              {imagePreviews.length > 0 && (
                <div className="image-previews">
                  <h4>Selected Images ({imagePreviews.length}/5):</h4>
                  <div className="preview-grid">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="image-preview">
                        <img src={preview} alt={`Preview ${index + 1}`} />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="remove-image-btn"
                        >
                          ×
                        </button>
                        {index === 0 && <div className="primary-badge">Main</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Submit Section */}
          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate('/home')}
              className="cancel-btn"
              disabled={loading}
            >
              ← Cancel
            </button>
            <button
              type="submit"
              className="publish-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="spinner-small"></div>
                  {isEditMode ? 'Updating...' : 'Publishing...'}
                </>
              ) : (
                isEditMode ? '✅ Update Item' : '🚀 Publish Item'
              )}
            </button>
          </div>
        </form>
        )}
      </div>
    </div>
  );
};

export default AddItem;