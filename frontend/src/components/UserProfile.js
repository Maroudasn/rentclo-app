import React, { useState, useEffect } from 'react';
import { useAuth } from './protected/AuthContext';
import { apiGet, apiPut, changePassword } from '../utils/api';
import './UserProfile.css';

const UserProfile = () => {
  const { user, logout } = useAuth();
  const [activeSection, setActiveSection] = useState('profile');
  const [profileData, setProfileData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Profile edit form state
  const [editForm, setEditForm] = useState({
    email: '',
    phone: '',
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

  useEffect(() => {
    fetchUserProfile();
    fetchUserStats();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      // Mock API call - replace with actual endpoint
      const mockProfile = {
        id: user?.id,
        username: user?.username,
        email: user?.email || 'user@example.com',
        phone: user?.phone || '+1234567890',
        address: {
          address_line1: '123 Main Street',
          address_line2: 'Apt 4B',
          city: 'New York',
          state: 'NY',
          zip_code: '10001',
          country: 'USA'
        },
        profile_picture: null
      };

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      setProfileData(mockProfile);
      setEditForm({
        email: mockProfile.email,
        phone: mockProfile.phone,
        address: { ...mockProfile.address }
      });
    } catch (error) {
      setMessage('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      // Mock user statistics
      const mockStats = {
        totalBookings: 3,
        itemsListed: user?.user_type !== 'tenant' ? 2 : 0,
        memberSince: '2024-01-15'
      };
      setUserStats(mockStats);
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const handleEditToggle = () => {
    if (isEditing) {
      // Cancel editing - reset form
      setEditForm({
        email: profileData.email,
        phone: profileData.phone,
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
      // Mock API call - replace with actual endpoint
      console.log('Updating profile with:', editForm);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update local state
      setProfileData(prev => ({
        ...prev,
        email: editForm.email,
        phone: editForm.phone,
        address: { ...editForm.address }
      }));
      
      setMessage('Profile updated successfully!');
      setIsEditing(false);
    } catch (error) {
      setMessage('Failed to update profile');
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
            <button 
              className={`sidebar-btn ${activeSection === 'activity' ? 'active' : ''}`}
              onClick={() => setActiveSection('activity')}
            >
              📊 Activity Overview
            </button>
          </div>

          <div className="user-quick-info">
            <h4>Quick Stats</h4>
            <p>Bookings: {userStats.totalBookings}</p>
            <p>Listings: {userStats.itemsListed}</p>
            <p>Member since: {new Date(userStats.memberSince).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="profile-content">
          {message && (
            <div className={`message ${message.includes('success') ? 'success' : 'error'}`}>
              {message}
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
                    <button className="upload-btn" disabled>
                      📷 Upload Photo
                    </button>
                  </div>

                  <div className="profile-details">
                    <div className="detail-row">
                      <label>Username:</label>
                      <span>{profileData?.username}</span>
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

          {/* Activity Overview Section */}
          {activeSection === 'activity' && (
            <div className="content-section">
              <div className="section-header">
                <h2>Activity Overview</h2>
              </div>

              <div className="activity-stats">
                <div className="stat-card">
                  <div className="stat-icon">📅</div>
                  <div className="stat-info">
                    <h3>{userStats.totalBookings}</h3>
                    <p>Total Bookings</p>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">👕</div>
                  <div className="stat-info">
                    <h3>{userStats.itemsListed}</h3>
                    <p>Items Listed</p>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">⭐</div>
                  <div className="stat-info">
                    <h3>{new Date(userStats.memberSince).getFullYear()}</h3>
                    <p>Member Since</p>
                  </div>
                </div>
              </div>

              <div className="quick-links">
                <h3>Quick Actions</h3>
                <div className="links-grid">
                  <button className="quick-link-btn" disabled>
                    📋 My Bookings
                  </button>
                  {user?.user_type !== 'tenant' && (
                    <button className="quick-link-btn" disabled>
                      🛍️ My Listings
                    </button>
                  )}
                  {user?.user_type !== 'tenant' && (
                    <button className="quick-link-btn" disabled>
                      ➕ Add New Item
                    </button>
                  )}
                  <button className="quick-link-btn" disabled>
                    ❤️ Favorites
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;