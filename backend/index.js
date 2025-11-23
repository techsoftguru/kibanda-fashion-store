const express = require('express');
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root route - THIS MUST EXIST
app.get('/', (req, res) => {
  res.json({ 
    message: 'Kibanda Backend API is working! 🚀',
    status: 'success',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Health check route
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK',
    service: 'Kibanda Fashion Store API',
    timestamp: new Date().toISOString()
  });
});

// Test other routes
app.get('/api', (req, res) => {
  res.json({ message: 'API root endpoint' });
});

app.get('/api/products', (req, res) => {
  res.json({ products: ['Product 1', 'Product 2', 'Product 3'] });
});

// 404 handler for API routes
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.path,
    method: req.method,
    message: 'Check your URL or API documentation'
  });
});

// Export the app for Vercel
module.exports = app;