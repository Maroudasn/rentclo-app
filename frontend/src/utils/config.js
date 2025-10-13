// Environment configuration
const config = {
  api: {
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8001',
    timeout: 10000,
  },
  auth: {
    tokenRefreshMargin: 60000, // 1 minute before expiration
    checkInterval: 30000, // Check every 30 seconds
  },
};

export default config;