import React, { useEffect } from 'react';
import { healthCheck, getStats } from '../utils/api';

const TestAPI = () => {
  useEffect(() => {
    const testConnection = async () => {
      try {
        console.log('Testing API connection...');
        
        // Test health endpoint
        const health = await healthCheck();
        console.log('Health check:', health);
        
        // Test stats endpoint
        const stats = await getStats();
        console.log('Stats:', stats);
        
      } catch (error) {
        console.error('API test failed:', error);
      }
    };
    
    testConnection();
  }, []);

  return (
    <div>
      <h3>API Connection Test</h3>
      <p>Check browser console for results.</p>
    </div>
  );
};

export default TestAPI;