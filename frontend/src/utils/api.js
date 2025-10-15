import axios from 'axios';

// Base URL configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8001';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('session_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Handle 401 errors (unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Attempt to refresh token
        const newToken = await refreshToken();
        
        if (newToken) {
          // Update the authorization header
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          // Retry the original request
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        // Perform logout if refresh fails
        performLogout();
        return Promise.reject(refreshError);
      }
    }
    
    // For other errors, just reject
    return Promise.reject(error);
  }
);

// Function to perform logout (clear storage and redirect)
const performLogout = () => {
  // Clear localStorage
  localStorage.removeItem('session_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
  
  // Redirect to login
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
};

// Token verification - Updated to use a simple endpoint
export const verifyToken = async () => {
  try {
    // Use /users endpoint since /verify might not exist
    const response = await api.get('/users');
    return response.data;
  } catch (error) {
    if (error.response?.status === 401) {
      performLogout();
    }
    throw error;
  }
};

// Fetch user data - Updated to work with your backend
export const fetchUserData = async (userId = null) => {
  try {
    if (userId) {
      const response = await api.get(`/users/${userId}`);
      return response.data;
    } else {
      // Get current user data - adjust based on your API
      const response = await api.get('/users');
      // Assuming the first user is the current one for demo purposes
      return Array.isArray(response.data) ? response.data[0] : response.data;
    }
  } catch (error) {
    if (error.response?.status === 401) {
      performLogout();
    }
    throw error;
  }
};

// Refresh token - Simplified for your current backend
export const refreshToken = async () => {
  try {
    // Since your backend might not have refresh tokens yet,
    // we'll just return the current token for now
    const currentToken = localStorage.getItem('session_token');
    
    if (!currentToken) {
      throw new Error('No token available');
    }

    // For now, just return the current token
    // In a real implementation, you'd call a refresh endpoint
    return currentToken;
    
  } catch (error) {
    console.error('Token refresh failed:', error);
    performLogout();
    throw error;
  }
};

// User authentication - Updated for your backend
export const loginUser = async (credentials) => {
  try {
    const response = await api.post('/login', credentials);
    
    // Ensure response has the expected structure
    if (response.data && response.data.user) {
      return {
        session_token: response.data.session_token || response.data.access_token,
        user: response.data.user,
        refresh_token: response.data.refresh_token
      };
    }
    
    throw new Error('Invalid response format from server');
    
  } catch (error) {
    // Enhanced error handling
    if (error.response) {
      // Server responded with error status
      throw new Error(error.response.data?.detail || error.response.data?.message || 'Login failed');
    } else if (error.request) {
      // Network error
      throw new Error('Network error. Please check your connection.');
    } else {
      // Other error
      throw new Error('Login failed. Please try again.');
    }
  }
};

// User registration - Updated for your backend
export const registerUser = async (userData) => {
  try {
    console.log("📨 Sending registration data:", userData);
    
    const response = await api.post('/register', userData);
    console.log("✅ Registration response:", response.data);
    
    return response.data;
    
  } catch (error) {
    console.error("💥 Registration API error:", error);
    
    if (error.response) {
      // Server responded with error status
      const errorDetail = error.response.data?.detail || error.response.data?.message || error.response.data;
      console.error("📋 Server error details:", errorDetail);
      
      // Handle 422 validation errors
      if (error.response.status === 422) {
        const validationErrors = error.response.data?.detail || "Validation failed";
        throw new Error(`Registration validation failed: ${JSON.stringify(validationErrors)}`);
      }
      
      throw new Error(errorDetail || `Registration failed (${error.response.status})`);
    } else if (error.request) {
      // Network error
      throw new Error('Cannot connect to server. Please ensure the backend is running.');
    } else {
      // Other error
      throw new Error('Registration failed. Please try again.');
    }
  }
};

// Logout user
export const logoutUser = async () => {
  try {
    // If your backend has a logout endpoint, call it
    await api.post('/logout');
  } catch (error) {
    console.error('Logout API error:', error);
  } finally {
    performLogout();
  }
};

// Get platform statistics
export const getStats = async () => {
  try {
    const response = await api.get('/stats');
    return response.data;
  } catch (error) {
    console.error('Error fetching stats:', error);
    throw error;
  }
};

// Get properties
export const getProperties = async () => {
  try {
    const response = await api.get('/properties');
    return response.data;
  } catch (error) {
    console.error('Error fetching properties:', error);
    throw error;
  }
};

// Generic API methods with better error handling
export const apiGet = async (endpoint, config = {}) => {
  try {
    const response = await api.get(endpoint, config);
    return response.data;
  } catch (error) {
    handleApiError(error, `GET ${endpoint}`);
    throw error;
  }
};

export const apiPost = async (endpoint, data = {}, config = {}) => {
  try {
    const response = await api.post(endpoint, data, config);
    return response.data;
  } catch (error) {
    handleApiError(error, `POST ${endpoint}`);
    throw error;
  }
};

export const apiPut = async (endpoint, data = {}, config = {}) => {
  try {
    const response = await api.put(endpoint, data, config);
    return response.data;
  } catch (error) {
    handleApiError(error, `PUT ${endpoint}`);
    throw error;
  }
};

export const apiDelete = async (endpoint, config = {}) => {
  try {
    const response = await api.delete(endpoint, config);
    return response.data;
  } catch (error) {
    handleApiError(error, `DELETE ${endpoint}`);
    throw error;
  }
};

// Enhanced error handling function
const handleApiError = (error, context = '') => {
  if (error.response) {
    console.error(`API Error (${context}):`, error.response.status, error.response.data);
    
    if (error.response.status === 401) {
      performLogout();
    }
    
    throw new Error(
      error.response.data?.detail || 
      error.response.data?.message || 
      `Request failed with status ${error.response.status}`
    );
  } else if (error.request) {
    console.error(`Network Error (${context}):`, error.request);
    throw new Error('Network error. Please check your connection and try again.');
  } else {
    console.error(`Error (${context}):`, error.message);
    throw new Error('An unexpected error occurred. Please try again.');
  }
};

// Get user profile
export const getUserProfile = async () => {
  try {
    const response = await api.get('/profile');
    return response.data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};

// Update user profile
export const updateUserProfile = async (profileData) => {
  try {
    console.log('Updating profile with:', profileData);
    const response = await api.put('/profile', profileData);
    return response.data;
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
};

// Change password
export const changePassword = async (passwordData) => {
  try {
    const response = await api.post('/change-password', passwordData);
    return response.data;
  } catch (error) {
    console.error('Error changing password:', error);
    throw error;
  }
};

// Get user statistics
export const getUserStats = async () => {
  try {
    const response = await api.get('/user-stats');
    return response.data;
  } catch (error) {
    console.error('Error fetching user stats:', error);
    throw error;
  }
};

// Search items with filters
export const searchItems = async (filters = {}) => {
  try {
    console.log('Searching with filters:', filters);
    const response = await api.post('/search', filters);
    return response.data;
  } catch (error) {
    console.error('Search error:', error);
    throw error;
  }
};

// Get filter options
export const getFilterOptions = async () => {
  try {
    const response = await api.get('/search/filters');
    return response.data;
  } catch (error) {
    console.error('Error getting filter options:', error);
    throw error;
  }
};

// Health check
export const healthCheck = async () => {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch (error) {
    console.error('Health check failed:', error);
    throw error;
  }
};

// Add new item
export const addItem = async (formData) => {
  try {
    console.log('Adding new item...');
    const response = await api.post('/items/add', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error adding item:', error);
    throw error;
  }
};

// Get categories
export const getCategories = async () => {
  try {
    const response = await api.get('/items/categories');
    return response.data;
  } catch (error) {
    console.error('Error getting categories:', error);
    throw error;
  }
};

// Get sizes by category
export const getSizesByCategory = async (category) => {
  try {
    const response = await api.get(`/items/sizes/${category}`);
    return response.data;
  } catch (error) {
    console.error('Error getting sizes:', error);
    throw error;
  }
};

// Get item details
export const getItemDetail = async (itemId) => {
  try {
    const response = await api.get(`/items/${itemId}`);
    return response.data;
  } catch (error) {
    console.error('Error getting item details:', error);
    throw error;
  }
};

// Toggle favorite
export const toggleFavorite = async (itemId) => {
  try {
    const response = await api.post(`/items/${itemId}/favorite`);
    return response.data;
  } catch (error) {
    console.error('Error toggling favorite:', error);
    throw error;
  }
};

// Get user favorites
export const getUserFavorites = async (userId) => {
  try {
    const response = await api.get(`/user/${userId}/favorites`);
    return response.data;
  } catch (error) {
    console.error('Error getting user favorites:', error);
    throw error;
  }
};

// Create booking
export const createBooking = async (bookingData) => {
  try {
    const response = await api.post('/bookings', bookingData);
    return response.data;
  } catch (error) {
    console.error('Error creating booking:', error);
    throw error;
  }
};

// Get user bookings
export const getUserBookings = async () => {
  try {
    const response = await api.get('/bookings');
    return response.data;
  } catch (error) {
    console.error('Error getting user bookings:', error);
    throw error;
  }
};

// Cancel booking
export const cancelBooking = async (bookingId) => {
  try {
    const response = await api.post(`/bookings/${bookingId}/cancel`);
    return response.data;
  } catch (error) {
    console.error('Error canceling booking:', error);
    throw error;
  }
};

// Get similar items
export const getSimilarItems = async (itemId) => {
  try {
    const response = await api.get(`/items/${itemId}/similar`);
    return response.data;
  } catch (error) {
    console.error('Error getting similar items:', error);
    throw error;
  }
};

// Get user's own items
export const getMyItems = async () => {
  try {
    const response = await api.get('/items/my-items');
    return response.data;
  } catch (error) {
    console.error('Error getting my items:', error);
    throw error;
  }
};

// Edit item
export const editItem = async (itemId, formData) => {
  try {
    console.log(`Editing item ${itemId}...`);
    const response = await api.put(`/items/${itemId}/edit`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error editing item:', error);
    throw error;
  }
};

// Delete item
export const deleteItem = async (itemId) => {
  try {
    console.log(`Deleting item ${itemId}...`);
    const response = await api.delete(`/items/${itemId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting item:', error);
    throw error;
  }
};

// Export the axios instance for custom use
export default api;