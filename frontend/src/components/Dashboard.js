import React from 'react';
import { useAuth } from './protected/AuthContext';

const Dashboard = () => {
  const { user, logout } = useAuth();

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome, {user?.first_name} {user?.last_name}!</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

export default Dashboard;