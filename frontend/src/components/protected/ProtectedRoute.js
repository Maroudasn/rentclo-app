import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading, getValidToken } = useAuth();
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [checkingToken, setCheckingToken] = useState(true);

  useEffect(() => {
    const verifyToken = async () => {
      if (isAuthenticated) {
        const validToken = await getValidToken();
        setIsTokenValid(!!validToken);
      }
      setCheckingToken(false);
    };

    verifyToken();
  }, [isAuthenticated, getValidToken]);

  if (isLoading || checkingToken) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div>Verifying authentication...</div>
      </div>
    );
  }

  if (!isAuthenticated || !isTokenValid) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;