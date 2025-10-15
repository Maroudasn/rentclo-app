import React, { useState, useEffect } from 'react';
import { useAuth } from './protected/AuthContext';
import { getUserProfile, updateUserProfile, changePassword, getUserStats, getUserFavorites } from '../utils/api';
import './UserProfile.css';
import MyBookings from './MyBookings';
import MyListings from './MyListings';
import Favorites from './Favorites';
import AddNewItem from './AddNewItem';

const UserProfile = () => {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState('profile');
  const [profileData, setProfileData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Profile edit form state
  const [editForm, setEditForm] = useState({
    email: '',
    phone: '',
    first_name: '',
    last_name: '',
    address: {
      address_line1: '',
      address_line2: '',
      city: '',
      state: '',
      zip_code: '',
      country: 'USA'
    }
  });

  // Password change form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // User stats state
  const [userStats, setUserStats] = useState({
    totalBookings: 0,
    itemsListed: 0,
    memberSince: ''
  });

  const [favoritesCount, setFavoritesCount] = useState(0);

  useEffect(() => {
    fetchUserProfile();
    fetchUserStats();
    fetchFavoritesCount();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      // Use dedicated API function for getting profile data
      const response = await getUserProfile();
      console.log('Profile data received:', response);
      
      setProfileData(response);
      setEditForm({
        email: response.email,
        phone: response.phone,
        first_name: response.first_name,
        last_name: response.last_name,
        address: { ...response.address }
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      setMessage('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      // Use dedicated API function to get user statistics from database
      const response = await getUserStats();
      setUserStats(response);
    } catch (error) {
      console.error('Error fetching user stats:', error);
      // Fallback to default stats if API fails
      setUserStats({
        totalBookings: 0,
        itemsListed: 0,
        memberSince: new Date().toISOString()
      });
    }
  };

  const fetchFavoritesCount = async () => {
    if (!user?.id) return;
    
    try {
      // Use dedicated API function to get favorites from database
      const response = await getUserFavorites(user.id);
      setFavoritesCount(response.favorites?.length || 0);
    } catch (error) {
      console.error('Error fetching favorites count:', error);
      setFavoritesCount(0);
    }
  };

  const handleEditToggle = () => {
    if (isEditing) {
      // Cancel editing - reset form
      setEditForm({
        email: profileData.email,
        phone: profileData.phone,
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        address: { ...profileData.address }
      });
    }
    setIsEditing(!isEditing);
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // Use dedicated API function to update profile
      console.log('Updating profile with:', editForm);
      const response = await updateUserProfile(editForm);
      console.log('Profile update response:', response);
      
      // Refresh profile data from server
      await fetchUserProfile();
      
      setMessage('✅ Profile updated successfully!');
      setIsEditing(false);
    } catch (error) {
      console.error('Profile update error:', error);
      let errorMessage = 'Failed to update profile';
      
      if (error.response?.status === 400) {
        errorMessage = error.response.data.detail || 'Invalid data provided';
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      }
      
      setMessage(`❌ ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    // Validation
    if (!passwordForm.currentPassword.trim()) {
      setMessage('Please enter your current password');
      setLoading(false);
      return;
    }

    if (!passwordForm.newPassword.trim()) {
      setMessage('Please enter a new password');
      setLoading(false);
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage('New passwords do not match');
      setLoading(false);
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setMessage('New password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      console.log('Attempting to change password...');
      // Call the actual API endpoint
      const result = await changePassword({
        current_password: passwordForm.currentPassword,
        new_password: passwordForm.newPassword
      });
      
      console.log('Password change result:', result);
      setMessage('✅ Password changed successfully!');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('Password change error:', error);
      if (error.response?.status === 400) {
        setMessage('❌ Current password is incorrect');
      } else if (error.response?.data?.detail) {
        setMessage(`❌ ${error.response.data.detail}`);
      } else {
        setMessage('❌ Failed to change password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddressChange = (field, value) => {
    setEditForm(prev => ({
      ...prev,
      address: {
        ...prev.address,
        [field]: value
      }
    }));
  };

  const handlePasswordChangeInput = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading && !profileData) {
    return <div className="loading">Loading profile...</div>;
  }

  return (
    <div className="user-profile">
      <div className="profile-container">
        {/* Navigation Sidebar */}
        <div className="profile-sidebar">
          <div className="sidebar-section">
            <h3>Profile Settings</h3>
            <button 
              className={`sidebar-btn ${activeSection === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveSection('profile')}
            >
              👤 Profile Information
            </button>
            <button 
              className={`sidebar-btn ${activeSection === 'password' ? 'active' : ''}`}
              onClick={() => setActiveSection('password')}
            >
              🔒 Change Password
            </button>
          </div>

          <div className="user-quick-info">
            <h4>Quick Stats</h4>
            <p>Bookings: {userStats.totalBookings}</p>
            <p>Listings: {userStats.itemsListed}</p>
            <p>Member since: {userStats.memberSince}</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="profile-content">
          {message && (
            <div className={`message ${message.includes('success') ? 'success' : 'error'}`}>
              {message}
            </div>
          )}

          {/* Quick Actions Section - Now at the top */}
          {activeSection === 'profile' && (
            <div className="modern-quick-actions">
              <div className="quick-actions-header">
                <h2>🚀 Quick Actions</h2>
                <p>Manage your rentals and activity</p>
              </div>
              
              <div className="modern-actions-grid">
                <button 
                  className="modern-action-card"
                  onClick={() => setActiveSection('bookings')}
                >
                  <div className="action-icon">📋</div>
                  <div className="action-content">
                    <h3>My Bookings</h3>
                    <p>View your rental history</p>
                    <span className="action-count">{userStats.totalBookings}</span>
                  </div>
                  <div className="action-arrow">→</div>
                </button>

                {user?.user_type !== 'tenant' && (
                  <button 
                    className="modern-action-card"
                    onClick={() => setActiveSection('listings')}
                  >
                    <div className="action-icon">🛍️</div>
                    <div className="action-content">
                      <h3>My Listings</h3>
                      <p>Manage your items</p>
                      <span className="action-count">{userStats.itemsListed}</span>
                    </div>
                    <div className="action-arrow">→</div>
                  </button>
                )}

                <button 
                  className="modern-action-card"
                  onClick={() => setActiveSection('favorites')}
                >
                  <div className="action-icon">❤️</div>
                  <div className="action-content">
                    <h3>Favorites</h3>
                    <p>Your saved items</p>
                    <span className="action-count">{favoritesCount}</span>
                  </div>
                  <div className="action-arrow">→</div>
                </button>

                {user?.user_type !== 'tenant' && (
                  <button 
                    className="modern-action-card add-item-card"
                    onClick={() => window.location.href = '/add-item'}
                  >
                    <div className="action-icon">➕</div>
                    <div className="action-content">
                      <h3>Add New Item</h3>
                      <p>List something to rent</p>
                    </div>
                    <div className="action-arrow">→</div>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Profile Information Section */}
          {activeSection === 'profile' && (
            <div className="content-section">
              <div className="section-header">
                <h2>Profile Information</h2>
                {!isEditing && (
                  <button onClick={handleEditToggle} className="edit-btn">
                    ✏️ Edit Profile
                  </button>
                )}
              </div>

              {!isEditing ? (
                // Display Mode
                <div className="profile-display">
                  <div className="profile-picture-section">
                    <div className="profile-picture">
                      {profileData?.profile_picture ? (
                        <img src={profileData.profile_picture} alt="Profile" />
                      ) : (
                        <div className="profile-picture-placeholder">
                          {profileData?.first_name?.charAt(0) || user?.first_name?.charAt(0) || 'U'}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="profile-details">
                    <div className="detail-row">
                      <label>Username:</label>
                      <span>{profileData?.username}</span>
                    </div>
                    <div className="detail-row">
                      <label>Full Name:</label>
                      <span>{profileData?.first_name} {profileData?.last_name}</span>
                    </div>
                    <div className="detail-row">
                      <label>Email:</label>
                      <span>{profileData?.email}</span>
                    </div>
                    <div className="detail-row">
                      <label>Phone:</label>
                      <span>{profileData?.phone}</span>
                    </div>
                    <div className="detail-row">
                      <label>Address:</label>
                      <span>
                        {profileData?.address.address_line1}
                        {profileData?.address.address_line2 && `, ${profileData.address.address_line2}`}
                        <br />
                        {profileData?.address.city}, {profileData?.address.state} {profileData?.address.zip_code}
                        <br />
                        {profileData?.address.country}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                // Edit Mode
                <form onSubmit={handleProfileUpdate} className="profile-edit-form">
                  <div className="form-section">
                    <h4>Basic Information</h4>
                    
                    <div className="form-group">
                      <label>Username</label>
                      <input
                        type="text"
                        value={profileData?.username || ''}
                        disabled
                        className="disabled-input"
                      />
                      <small>Username cannot be changed</small>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>First Name *</label>
                        <input
                          type="text"
                          name="first_name"
                          value={editForm.first_name}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Last Name *</label>
                        <input
                          type="text"
                          name="last_name"
                          value={editForm.last_name}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Email *</label>
                      <input
                        type="email"
                        name="email"
                        value={editForm.email}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Phone Number *</label>
                      <input
                        type="tel"
                        name="phone"
                        value={editForm.phone}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-section">
                    <h4>Address Information</h4>
                    
                    <div className="form-group">
                      <label>Address Line 1 *</label>
                      <input
                        type="text"
                        value={editForm.address.address_line1}
                        onChange={(e) => handleAddressChange('address_line1', e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Address Line 2</label>
                      <input
                        type="text"
                        value={editForm.address.address_line2}
                        onChange={(e) => handleAddressChange('address_line2', e.target.value)}
                      />
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>City *</label>
                        <input
                          type="text"
                          value={editForm.address.city}
                          onChange={(e) => handleAddressChange('city', e.target.value)}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>State *</label>
                        <input
                          type="text"
                          value={editForm.address.state}
                          onChange={(e) => handleAddressChange('state', e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>ZIP Code *</label>
                        <input
                          type="text"
                          value={editForm.address.zip_code}
                          onChange={(e) => handleAddressChange('zip_code', e.target.value)}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Country *</label>
                        <select
                          value={editForm.address.country}
                          onChange={(e) => handleAddressChange('country', e.target.value)}
                          required
                        >
                          <option value="USA">United States</option>
                          <option value="UK">United Kingdom</option>
                          <option value="Canada">Canada</option>
                          <option value="Australia">Australia</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="form-actions">
                    <button type="submit" className="save-btn" disabled={loading}>
                      {loading ? 'Saving...' : '💾 Save Changes'}
                    </button>
                    <button type="button" onClick={handleEditToggle} className="cancel-btn">
                      ❌ Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Password Change Section */}
          {activeSection === 'password' && (
            <div className="content-section">
              <div className="section-header">
                <h2>Change Password</h2>
              </div>

              <form onSubmit={handlePasswordChange} className="password-form">
                <div className="form-group">
                  <label>Current Password *</label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordChangeInput}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>New Password *</label>
                  <input
                    type="password"
                    name="newPassword"
                    value={passwordForm.newPassword}
                    onChange={handlePasswordChangeInput}
                    required
                    minLength="6"
                  />
                  <small>Password must be at least 6 characters long</small>
                </div>

                <div className="form-group">
                  <label>Confirm New Password *</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordChangeInput}
                    required
                  />
                </div>

                <button type="submit" className="change-password-btn" disabled={loading}>
                  {loading ? 'Changing Password...' : '🔑 Change Password'}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Render active section content */}
        {activeSection !== 'profile' && (
          <div className="section-header">
            <button 
              className="back-to-profile-btn"
              onClick={() => setActiveSection('profile')}
            >
              ← Back to Profile
            </button>
            <h2 className="section-title">
              {activeSection === 'bookings' && '📋 My Bookings'}
              {activeSection === 'listings' && '🛍️ My Listings'}
              {activeSection === 'favorites' && '❤️ Favorites'}
              {activeSection === 'add-item' && '➕ Add New Item'}
            </h2>
          </div>
        )}
        
        {activeSection === 'bookings' && <MyBookings />}
        {activeSection === 'listings' && <MyListings />}
        {activeSection === 'favorites' && <Favorites />}
        {activeSection === 'add-item' && <AddNewItem />}
      </div>
    </div>
  );
};

export default UserProfile;