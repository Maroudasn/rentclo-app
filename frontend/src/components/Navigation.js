import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from './protected/AuthContext';
import './Navigation.css';

const Navigation = () => {
  const { logout, user } = useAuth();
  const location = useLocation();

  return (
    <nav className="navigation">
      <div className="nav-brand">
        <Link to="/home" className="nav-logo">RENTCLO</Link>
      </div>
      
      <div className="nav-links">
        <Link 
          to="/home" 
          className={`nav-link ${location.pathname === '/home' ? 'active' : ''}`}
        >
          Home
        </Link>
        
        <Link 
          to="/profile" 
          className={`nav-link ${location.pathname === '/profile' ? 'active' : ''}`}
        >
          Profile
        </Link>
        
        <Link 
          to="/support" 
          className={`nav-link ${location.pathname === '/support' ? 'active' : ''}`}
        >
          Support
        </Link>
        
        {user?.user_type !== 'tenant' && (
          <Link 
            to="/add-item" 
            className={`nav-link ${location.pathname === '/add-item' ? 'active' : ''}`}
          >
            Add Item
          </Link>
        )}
      </div>
      
      <div className="nav-user">
        <span className="user-greeting">Hello, {user?.first_name}</span>
        <button onClick={logout} className="logout-btn">Logout</button>
      </div>
    </nav>
  );
};

export default Navigation;