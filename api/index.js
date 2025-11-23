// api/index.js
module.exports = (req, res) => {
  const { path } = req;
  
  if (path === '/api' || path === '/') {
    return res.status(200).json({ 
      message: '🎉 Kibanda API is finally working!',
      status: 'success',
      timestamp: new Date().toISOString(),
      path: path
    });
  }
  
  if (path === '/api/health' || path === '/health') {
    return res.status(200).json({ 
      status: 'healthy', 
      service: 'kibanda-api',
      timestamp: new Date().toISOString()
    });
  }
  
  // Handle 404
  res.status(404).json({
    error: 'Endpoint not found',
    path: path,
    message: 'Available endpoints: /api, /health'
  });
};