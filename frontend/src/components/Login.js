import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from './protected/AuthContext';
import { loginUser } from '../utils/api';

const Login = () => {
  const [loginData, setLoginData] = useState({ 
    username: '', 
    password: '' 
  });
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      const response = await loginUser(loginData);
      setMessage('Login successful!');
      
      // This should redirect to HomePage
      login(
        response.session_token, 
        response.user,
        response.refresh_token
      );
      
      navigate('/home'); // Make sure this line executes
      
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Login failed. Please check your credentials and try again.';
      setMessage(errorMessage);
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app">
      <div className="auth-container">
        <div className="auth-frame">
          <div className="logo-section">
            <h1 className="logo">RENTCLO</h1>
            <p>Login to your account</p>
          </div>

          {message && (
            <div className={`message ${message.includes('success') ? 'success' : 'error'}`}>
              {message}
            </div>
          )}

          <form onSubmit={handleLogin} className="auth-form">
            <div className="input-group">
              <label htmlFor="username">Username *</label>
              <input
                id="username"
                type="text"
                placeholder="Enter your username"
                required
                value={loginData.username}
                onChange={(e) => setLoginData({...loginData, username: e.target.value})}
              />
            </div>

            <div className="input-group">
              <label htmlFor="password">Password *</label>
              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                required
                value={loginData.password}
                onChange={(e) => setLoginData({...loginData, password: e.target.value})}
              />
            </div>

            <button type="submit" className="auth-btn" disabled={isLoading}>
              {isLoading ? 'Logging in...' : 'Login'}
            </button>

            <div className="auth-switch">
              <p>Don't have an account?</p>
              <Link to="/register" className="switch-btn">
                Create Account
              </Link>
            </div>
          </form>

          <div className="demo-credentials">
            <h4>Demo Credentials:</h4>
            <p><strong>Tenant:</strong> john@example.com / password123</p>
            <p><strong>Lessor:</strong> jane@example.com / password123</p>
            <p><strong>Both:</strong> mike@rentclo.com / admin123</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;