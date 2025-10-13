import React from 'react';
import { apiGet, apiPost, loginUser, fetchUserData } from '../utils/api';

const ExampleComponent = () => {
  const handleLogin = async () => {
    try {
      const result = await loginUser({ username: 'test', password: 'test' });
      console.log('Login successful:', result);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const fetchData = async () => {
    try {
      const userData = await fetchUserData();
      console.log('User data:', userData);
      
      // Or use generic methods
      const posts = await apiGet('/posts');
      console.log('Posts:', posts);
    } catch (error) {
      console.error('Fetch error:', error);
    }
  };

  return (
    <div>
      <button onClick={handleLogin}>Login</button>
      <button onClick={fetchData}>Fetch Data</button>
    </div>
  );
};

export default ExampleComponent;