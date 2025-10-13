import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../protected/AuthContext';
import { searchItems, getFilterOptions } from '../../utils/api';
import { getItemImages, handleImageError, getThumbnailImage } from '../../utils/imageHelpers';
import './HomePage.css';

const HomePage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    gender: '',
    occasion: '',
    min_price: '',
    max_price: '',
    distance: ''
  });
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterOptions, setFilterOptions] = useState({});
  const [activeTab, setActiveTab] = useState('all');
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  // Load filter options and initial items
  useEffect(() => {
    loadFilterOptions();
    performSearch();
  }, []);

  const loadFilterOptions = async () => {
    try {
      const options = await getFilterOptions();
      setFilterOptions(options);
    } catch (error) {
      console.error('Failed to load filter options:', error);
    }
  };

  const performSearch = async (searchFilters = {}) => {
    setLoading(true);
    try {
      const searchData = {
        query: searchTerm || undefined,
        ...filters,
        ...searchFilters
      };

      // Clean up empty filters
      Object.keys(searchData).forEach(key => {
        if (searchData[key] === '' || searchData[key] === null || searchData[key] === undefined) {
          delete searchData[key];
        }
      });

      // Convert price strings to numbers
      if (searchData.min_price) searchData.min_price = parseFloat(searchData.min_price);
      if (searchData.max_price) searchData.max_price = parseFloat(searchData.max_price);

      const result = await searchItems(searchData);
      
      // Process items to include proper images
      const processedItems = result.items.map(item => ({
        ...item,
        images: getItemImages(item)
      }));
      
      setItems(processedItems);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    performSearch();
  };

  const handleFilterChange = (filterType, value) => {
    const newFilters = {
      ...filters,
      [filterType]: value
    };
    setFilters(newFilters);
    performSearch(newFilters);
  };

  const handlePriceChange = (type, value) => {
    const newFilters = {
      ...filters,
      [type]: value
    };
    setFilters(newFilters);
    
    // Only search if both prices are set or both are cleared
    if ((newFilters.min_price && newFilters.max_price) || (!newFilters.min_price && !newFilters.max_price)) {
      performSearch(newFilters);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilters({
      category: '',
      gender: '',
      occasion: '',
      min_price: '',
      max_price: '',
      distance: ''
    });
    performSearch({});
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    let tabFilters = {};
    
    switch (tab) {
      case 'recommended':
        tabFilters = { occasion: 'formal' };
        break;
      case 'new':
        // This would typically filter by date, but we'll use a mock filter
        tabFilters = { category: 'Dresses' };
        break;
      case 'discounts':
        tabFilters = { max_price: 15 };
        break;
      default:
        tabFilters = {};
    }
    
    performSearch(tabFilters);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="home-page">
      {/* Header */}
      <header className="home-header">
        <div className="header-left">
          <h1 className="logo">RENTCLO</h1>
        </div>
        
        <div className="header-center">
          <form onSubmit={handleSearch} className="search-bar">
            <input
              type="text"
              placeholder="Search for clothes, brands, or categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button type="submit" className="search-btn">🔍</button>
          </form>
        </div>

        <div className="header-right">
          <button className="icon-btn" title="User Profile" onClick={() => navigate('/profile')}>
            👤
          </button>
          <button className="icon-btn" title="Support" onClick={() => navigate('/support')}>
            💬
          </button>
          <button className="logout-btn" onClick={handleLogout} title="Logout">
            🚪
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="home-main">
        {/* Tabs */}
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => handleTabChange('all')}
          >
            All Items
          </button>
          <button 
            className={`tab ${activeTab === 'recommended' ? 'active' : ''}`}
            onClick={() => handleTabChange('recommended')}
          >
            Recommended
          </button>
          <button 
            className={`tab ${activeTab === 'new' ? 'active' : ''}`}
            onClick={() => handleTabChange('new')}
          >
            New Arrivals
          </button>
          <button 
            className={`tab ${activeTab === 'discounts' ? 'active' : ''}`}
            onClick={() => handleTabChange('discounts')}
          >
            Under $15
          </button>
        </div>

        {/* Filters */}
        <div className="filters-section">
          <div className="filters-header">
            <h3>🔍 Filter Items</h3>
            <button onClick={clearFilters} className="clear-filters-btn">
              🗑️ Clear All
            </button>
          </div>
          
          <div className="filters-grid">
            {/* Gender Filter */}
            <div className="filter-group">
              <label>👤 Gender</label>
              <select 
                value={filters.gender} 
                onChange={(e) => handleFilterChange('gender', e.target.value)}
                className="filter-select"
              >
                <option value="">All Genders</option>
                <option value="men">👨 Men</option>
                <option value="women">👩 Women</option>
                <option value="unisex">🚻 Unisex</option>
              </select>
            </div>

            {/* Category Filter - Fixed */}
            <div className="filter-group">
              <label>📁 Category</label>
              <select 
                value={filters.category} 
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="filter-select"
              >
                <option value="">All Categories</option>
                <option value="Dresses">👗 Dresses</option>
                <option value="Tops">� Tops</option>
                <option value="Bottoms">👖 Bottoms</option>
                <option value="Outerwear">🧥 Outerwear</option>
                <option value="Accessories">👜 Accessories</option>
                <option value="Shoes">👠 Shoes</option>
                <option value="Formal Wear">🎩 Formal Wear</option>
                <option value="Casual Wear">👚 Casual Wear</option>
              </select>
            </div>

            {/* Occasion Filter */}
            <div className="filter-group">
              <label>🎉 Occasion</label>
              <select 
                value={filters.occasion} 
                onChange={(e) => handleFilterChange('occasion', e.target.value)}
                className="filter-select"
              >
                <option value="">All Occasions</option>
                <option value="formal">🎩 Formal</option>
                <option value="casual">😊 Casual</option>
                <option value="sports">⚽ Sports</option>
                <option value="party">🎊 Party</option>
              </select>
            </div>

            {/* Price Range Filter - Updated with Maximum Price */}
            <div className="filter-group">
              <label>💰 Price Range (per day)</label>
              <div className="price-range-inputs">
                <div className="price-input-group">
                  <label>Min Price (€)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={filters.min_price}
                    onChange={(e) => handlePriceChange('min_price', e.target.value)}
                    className="price-input"
                    min="0"
                    max={filterOptions.price_range?.max || 100}
                    step="1"
                  />
                </div>
                <div className="price-input-group">
                  <label>Max Price (€)</label>
                  <input
                    type="number"
                    placeholder={filterOptions.price_range?.max || '100'}
                    value={filters.max_price}
                    onChange={(e) => handlePriceChange('max_price', e.target.value)}
                    className="price-input"
                    min="0"
                    max={filterOptions.price_range?.max || 100}
                    step="1"
                  />
                </div>
              </div>
              <div className="price-range-info">
                <small>Max price: €{filterOptions.price_range?.max || 100}</small>
              </div>
            </div>

            {/* Distance Filter - Replaces Area Filter */}
            <div className="filter-group">
              <label>📍 Distance from you</label>
              <select 
                value={filters.distance} 
                onChange={(e) => handleFilterChange('distance', e.target.value)}
                className="filter-select"
              >
                <option value="">Any distance</option>
                <option value="5">📍 Within 5 km</option>
                <option value="10">� Within 10 km</option>
                <option value="20">📍 Within 20 km</option>
                <option value="30">📍 Within 30 km</option>
                <option value="50">� Within 50 km</option>
              </select>
            </div>
          </div>

          {/* Active Filters Display */}
          {(filters.gender || filters.category || filters.occasion || filters.min_price || filters.max_price || filters.distance) && (
            <div className="active-filters">
              <h4>Active Filters:</h4>
              <div className="filter-tags">
                {filters.gender && (
                  <span className="filter-tag">
                    Gender: {filters.gender}
                    <button onClick={() => handleFilterChange('gender', '')}>×</button>
                  </span>
                )}
                {filters.category && (
                  <span className="filter-tag">
                    Category: {filters.category}
                    <button onClick={() => handleFilterChange('category', '')}>×</button>
                  </span>
                )}
                {filters.occasion && (
                  <span className="filter-tag">
                    Occasion: {filters.occasion}
                    <button onClick={() => handleFilterChange('occasion', '')}>×</button>
                  </span>
                )}
                {(filters.min_price || filters.max_price) && (
                  <span className="filter-tag">
                    Price: €{filters.min_price || '0'} - €{filters.max_price || (filterOptions.price_range?.max || 'Any')}
                    <button onClick={() => {
                      handleFilterChange('min_price', '');
                      handleFilterChange('max_price', '');
                    }}>×</button>
                  </span>
                )}
                {filters.distance && (
                  <span className="filter-tag">
                    Distance: Within {filters.distance} km
                    <button onClick={() => handleFilterChange('distance', '')}>×</button>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="results-info">
          <p>
            {loading ? 'Searching...' : `Found ${items.length} items`}
            {Object.values(filters).some(f => f) && ' with current filters'}
          </p>
        </div>

        {/* Items Grid */}
        {loading ? (
          <div className="loading-grid">
            <div className="spinner"></div>
            <p>Loading items...</p>
          </div>
        ) : (
          <div className="content-grid">
            {items.map(item => (
              <Link key={item.id} to={`/item/${item.id}`} className="content-card-link">
                <div className="content-card">
                  <div className="card-image">
                    <img 
                      src={getThumbnailImage(item.images[0]) || item.images[0]} 
                      alt={item.title}
                      onError={(e) => handleImageError(e, item)}
                    />
                    <div className="card-badge">{item.condition}</div>
                  </div>
                  <div className="card-content">
                    <h3>{item.title}</h3>
                    <p className="card-description">{item.description}</p>
                    <div className="card-meta">
                      <span className="card-category">{item.category}</span>
                      <span className="card-gender">{item.gender}</span>
                    </div>
                    <div className="card-price">€{item.price_per_day}/day</div>
                    <div className="card-location">📍 {item.location_area}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && items.length === 0 && (
          <div className="empty-state">
            <h3>No items found</h3>
            <p>Try adjusting your filters or search terms.</p>
            <button onClick={clearFilters} className="clear-filters-btn large">
              Clear All Filters
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default HomePage;