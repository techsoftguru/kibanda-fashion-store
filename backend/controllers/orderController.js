const Order = require('../models/order');
const Product = require('../models/Product');

class OrderController {
  // Create new order
  static async createOrder(req, res) {
    try {
      const { items, shippingAddress, paymentMethod, customerInfo } = req.body;
      const userId = req.user.id;

      // Validate required fields
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Order items are required'
        });
      }

      if (!shippingAddress) {
        return res.status(400).json({
          success: false,
          error: 'Shipping address is required'
        });
      }

      // Calculate totals and validate stock
      let subtotal = 0;
      const orderItems = [];

      for (const item of items) {
        const product = await Product.getById(item.productId);
        
        if (!product) {
          return res.status(404).json({
            success: false,
            error: `Product with ID ${item.productId} not found`
          });
        }

        if (product.stock_quantity < item.quantity) {
          return res.status(400).json({
            success: false,
            error: `Insufficient stock for ${product.name}. Available: ${product.stock_quantity}`
          });
        }

        const itemTotal = product.price * item.quantity;
        subtotal += itemTotal;

        orderItems.push({
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity: item.quantity,
          image: product.image_url,
          itemTotal: itemTotal
        });
      }

      // Calculate shipping fee (example: free over 5000, otherwise 300)
      const shippingFee = subtotal > 5000 ? 0 : 300;
      const totalAmount = subtotal + shippingFee;

      // Generate order number
      const orderNumber = 'KF' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();

      // Create order data
      const orderData = {
        orderNumber,
        userId,
        customerEmail: customerInfo?.email || req.user.email,
        customerName: customerInfo?.name || req.user.name,
        customerPhone: customerInfo?.phone || req.user.phone,
        shippingAddress: typeof shippingAddress === 'string' ? shippingAddress : JSON.stringify(shippingAddress),
        items: orderItems,
        subtotal,
        shippingFee,
        totalAmount,
        paymentMethod: paymentMethod || 'cash_on_delivery'
      };

      const orderId = await Order.create(orderData);

      // Update product stock quantities
      for (const item of items) {
        await Product.update(item.productId, {
          stock_quantity: await getUpdatedStock(item.productId, item.quantity)
        });
      }

      res.status(201).json({
        success: true,
        message: 'Order created successfully',
        orderId,
        orderNumber,
        totalAmount
      });

    } catch (error) {
      console.error('Create order error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create order'
      });
    }
  }

  // Get user's orders
  static async getUserOrders(req, res) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 10, status } = req.query;

      const orders = await Order.getByUserId(userId, { page, limit, status });

      res.json({
        success: true,
        data: orders.orders,
        pagination: {
          page: orders.page,
          limit: parseInt(limit),
          total: orders.total,
          totalPages: orders.totalPages
        }
      });

    } catch (error) {
      console.error('Get user orders error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch orders'
      });
    }
  }

  // Get order by ID
  static async getOrderById(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const userRole = req.user.role;

      const order = await Order.getById(id);

      if (!order) {
        return res.status(404).json({
          success: false,
          error: 'Order not found'
        });
      }

      // Users can only view their own orders unless admin
      if (userRole !== 'admin' && order.user_id !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }

      res.json({
        success: true,
        data: order
      });

    } catch (error) {
      console.error('Get order error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch order'
      });
    }
  }

  // Get all orders (admin only)
  static async getAllOrders(req, res) {
    try {
      const { page = 1, limit = 20, status, startDate, endDate } = req.query;

      const orders = await Order.getAll({ page, limit, status, startDate, endDate });

      res.json({
        success: true,
        data: orders.orders,
        pagination: {
          page: orders.page,
          limit: parseInt(limit),
          total: orders.total,
          totalPages: orders.totalPages
        }
      });

    } catch (error) {
      console.error('Get all orders error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch orders'
      });
    }
  }

  // Update order status
  static async updateOrderStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status || !['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'].includes(status)) {
        return res.status(400).json({
          success: false,
          error: 'Valid status is required'
        });
      }

      const updated = await Order.updateStatus(id, status);

      if (!updated) {
        return res.status(404).json({
          success: false,
          error: 'Order not found'
        });
      }

      res.json({
        success: true,
        message: `Order status updated to ${status}`
      });

    } catch (error) {
      console.error('Update order status error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update order status'
      });
    }
  }

  // Cancel order
  static async cancelOrder(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const userRole = req.user.role;

      const order = await Order.getById(id);

      if (!order) {
        return res.status(404).json({
          success: false,
          error: 'Order not found'
        });
      }

      // Users can only cancel their own orders unless admin
      if (userRole !== 'admin' && order.user_id !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }

      // Only pending orders can be cancelled by users
      if (userRole !== 'admin' && order.status !== 'pending') {
        return res.status(400).json({
          success: false,
          error: 'Only pending orders can be cancelled'
        });
      }

      const updated = await Order.updateStatus(id, 'cancelled');

      // Restore product stock if order is cancelled
      if (updated && order.items) {
        const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
        
        for (const item of items) {
          const product = await Product.getById(item.productId);
          if (product) {
            await Product.update(item.productId, {
              stock_quantity: product.stock_quantity + item.quantity
            });
          }
        }
      }

      res.json({
        success: true,
        message: 'Order cancelled successfully'
      });

    } catch (error) {
      console.error('Cancel order error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to cancel order'
      });
    }
  }
}

// Helper function to get updated stock
async function getUpdatedStock(productId, quantity) {
  const product = await Product.getById(productId);
  return product.stock_quantity - quantity;
}

module.exports = OrderController;