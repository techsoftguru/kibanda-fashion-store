const express = require('express');
const router = express.Router();
const ProductController = require('../controllers/productController');
const OrderController = require('../controllers/orderController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { uploadSingle } = require('../middleware/upload');

// All admin routes require authentication and admin role
router.use(authenticateToken);
router.use(requireAdmin);

// Product Management
router.post('/products', uploadSingle, ProductController.createProduct);
router.put('/products/:id', uploadSingle, ProductController.updateProduct);
router.delete('/products/:id', ProductController.deleteProduct);

// Order Management
router.get('/orders', OrderController.getAllOrders);
router.put('/orders/:id/status', OrderController.updateOrderStatus);

// Dashboard Statistics
router.get('/stats', async (req, res) => {
  try {
    const db = require('../config/database');
    
    // Get total products
    const [productResult] = await db.execute('SELECT COUNT(*) as total FROM products');
    
    // Get total orders
    const [orderResult] = await db.execute('SELECT COUNT(*) as total FROM orders');
    
    // Get total revenue
    const [revenueResult] = await db.execute('SELECT SUM(total_amount) as revenue FROM orders WHERE payment_status = "paid"');
    
    // Get recent orders
    const [recentOrders] = await db.execute(`
      SELECT o.*, u.name as customer_name 
      FROM orders o 
      LEFT JOIN users u ON o.user_id = u.id 
      ORDER BY o.created_at DESC 
      LIMIT 5
    `);
    
    res.json({
      success: true,
      data: {
        totalProducts: productResult[0].total,
        totalOrders: orderResult[0].total,
        totalRevenue: revenueResult[0].revenue || 0,
        recentOrders: recentOrders
      }
    });
    
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch dashboard statistics' 
    });
  }
});

module.exports = router;