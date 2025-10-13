import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './components/protected/AuthContext';
import ProtectedRoute from './components/protected/ProtectedRoute';
import Navigation from './components/Navigation';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import HomePage from './components/home/HomePage';
import ClothingDetail from './components/ClothingDetail';
import Booking from './components/Booking';
import UserProfile from './components/UserProfile';
import AddItem from './components/AddItem';
import Support from './components/Support';

function App() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="App">
      {isAuthenticated && <Navigation />}
      
      <Routes>
        {/* Public routes */}
        <Route 
          path="/login" 
          element={isAuthenticated ? <Navigate to="/home" replace /> : <Login />} 
        />
        
        <Route 
          path="/register" 
          element={isAuthenticated ? <Navigate to="/home" replace /> : <Register />} 
        />
        
        {/* Protected routes */}
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/item/:itemId"
          element={
            <ProtectedRoute>
              <ClothingDetail />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/item/:itemId/book"
          element={
            <ProtectedRoute>
              <Booking />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <UserProfile />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/add-item"
          element={
            <ProtectedRoute>
              <AddItem />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/support"
          element={
            <ProtectedRoute>
              <Support />
            </ProtectedRoute>
          }
        />
        
        {/* Default route */}
        <Route 
          path="/" 
          element={<Navigate to={isAuthenticated ? "/home" : "/login"} replace />} 
        />
        
        {/* 404 page */}
        <Route 
          path="*" 
          element={
            <div style={{ padding: '2rem', textAlign: 'center' }}>
              <h2>404 - Page Not Found</h2>
              <Navigate to={isAuthenticated ? "/home" : "/login"} replace />
            </div>
          } 
        />
      </Routes>
    </div>
  );
}

export default App;