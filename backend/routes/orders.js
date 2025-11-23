const express = require('express');
const router = express.Router();
const OrderController = require('../controllers/orderController');
const { authenticateToken } = require('../middleware/auth');

// All order routes require authentication
router.use(authenticateToken);

// Create new order
router.post('/', OrderController.createOrder);

// Get user's orders
router.get('/my-orders', OrderController.getUserOrders);

// Get order by ID
router.get('/:id', OrderController.getOrderById);

// Update order status (for admin)
router.put('/:id/status', OrderController.updateOrderStatus);

// Cancel order
router.put('/:id/cancel', OrderController.cancelOrder);

// Get all orders (admin only)
router.get('/', OrderController.getAllOrders);

module.exports = router;