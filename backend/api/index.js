// api/index.js - Vercel Serverless Function
const express = require('express');
const app = express();

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ 
    message: 'Kibanda API is running! ✅',
    version: '1.0',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'kibanda-api' });
});

module.exports = app;