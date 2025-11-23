// Create this at: kibanda-fashion-store/api/index.js
const express = require('express');
const app = express();

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ 
    message: '🎉 Kibanda API is finally working!',
    status: 'success',
    timestamp: new Date().toISOString(),
    version: '1.0'
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'kibanda-api' });
});

app.get('/products', (req, res) => {
  res.json({ products: ['Dress', 'Shirt', 'Pants'] });
});

module.exports = app;