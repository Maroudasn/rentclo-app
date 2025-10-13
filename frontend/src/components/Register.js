import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from './protected/AuthContext';
import { registerUser } from '../utils/api';

const Register = () => {
  const [registerData, setRegisterData] = useState({
    username: '',
    email: '',
    password: '',
    confirm_password: '',
    user_type: 'tenant',
    first_name: '',
    last_name: '',
    phone: ''
  });
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    // Basic validation
    if (registerData.password !== registerData.confirm_password) {
      setMessage('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (registerData.password.length < 6) {
      setMessage('Password must be at least 6 characters long');
      setIsLoading(false);
      return;
    }

    try {
      console.log("📝 Attempting registration with:", registerData);
      
      // Send only the basic fields (no address for now)
      const registrationData = {
        username: registerData.username,
        email: registerData.email,
        password: registerData.password,
        confirm_password: registerData.confirm_password,
        user_type: registerData.user_type,
        first_name: registerData.first_name,
        last_name: registerData.last_name,
        phone: registerData.phone
      };

      const response = await registerUser(registrationData);
      setMessage('Registration successful! Redirecting to login...');
      
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      
    } catch (error) {
      console.error("💥 Registration error:", error);
      setMessage(error.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setRegisterData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="app">
      <div className="auth-container">
        <div className="auth-frame">
          <div className="logo-section">
            <h1 className="logo">RENTCLO</h1>
            <p>Create your account</p>
          </div>

          {message && (
            <div className={`message ${message.includes('success') ? 'success' : 'error'}`}>
              {message}
            </div>
          )}

          <form onSubmit={handleRegister} className="auth-form">
            <div className="form-row">
              <div className="input-group">
                <label htmlFor="first_name">First Name *</label>
                <input
                  id="first_name"
                  name="first_name"
                  type="text"
                  required
                  value={registerData.first_name}
                  onChange={handleInputChange}
                  placeholder="Enter your first name"
                />
              </div>
              <div className="input-group">
                <label htmlFor="last_name">Last Name *</label>
                <input
                  id="last_name"
                  name="last_name"
                  type="text"
                  required
                  value={registerData.last_name}
                  onChange={handleInputChange}
                  placeholder="Enter your last name"
                />
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="username">Username *</label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={registerData.username}
                onChange={handleInputChange}
                placeholder="Choose a username"
              />
            </div>

            <div className="input-group">
              <label htmlFor="email">Email *</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={registerData.email}
                onChange={handleInputChange}
                placeholder="Enter your email"
              />
            </div>

            <div className="input-group">
              <label htmlFor="phone">Phone *</label>
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                value={registerData.phone}
                onChange={handleInputChange}
                placeholder="Enter your phone number"
              />
            </div>

            <div className="input-group">
              <label htmlFor="user_type">I want to *</label>
              <select
                id="user_type"
                name="user_type"
                value={registerData.user_type}
                onChange={handleInputChange}
                required
              >
                <option value="tenant">Rent Properties (Tenant)</option>
                <option value="lessor">List Properties (Lessor)</option>
                <option value="both">Both</option>
              </select>
            </div>

            <div className="form-row">
              <div className="input-group">
                <label htmlFor="password">Password *</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={registerData.password}
                  onChange={handleInputChange}
                  placeholder="Create a password"
                />
              </div>
              <div className="input-group">
                <label htmlFor="confirm_password">Confirm Password *</label>
                <input
                  id="confirm_password"
                  name="confirm_password"
                  type="password"
                  required
                  value={registerData.confirm_password}
                  onChange={handleInputChange}
                  placeholder="Confirm your password"
                />
              </div>
            </div>



            <button type="submit" className="auth-btn" disabled={isLoading}>
              {isLoading ? 'Creating Account...' : 'Sign Up'}
            </button>

            <div className="auth-switch">
              <p>Already have an account?</p>
              <Link to="/login" className="switch-btn">
                Login here
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;