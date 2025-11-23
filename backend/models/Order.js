const db = require('../config/database');

class Order {
  // Create new order
  static async create(orderData) {
    const {
      orderNumber,
      userId,
      customerEmail,
      customerName,
      customerPhone,
      shippingAddress,
      items,
      subtotal,
      shippingFee,
      totalAmount,
      paymentMethod = 'cash_on_delivery'
    } = orderData;

    const sql = `
      INSERT INTO orders 
      (order_number, user_id, customer_email, customer_name, customer_phone, shipping_address, items, subtotal, shipping_fee, total_amount, payment_method)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.execute(sql, [
      orderNumber,
      userId,
      customerEmail,
      customerName,
      customerPhone,
      shippingAddress,
      JSON.stringify(items),
      subtotal,
      shippingFee,
      totalAmount,
      paymentMethod
    ]);

    return result.insertId;
  }

  // Get order by ID
  static async getById(id) {
    const sql = 'SELECT * FROM orders WHERE id = ?';
    const [orders] = await db.execute(sql, [id]);
    
    if (orders.length === 0) return null;
    
    const order = orders[0];
    // Parse JSON fields
    if (order.items && typeof order.items === 'string') {
      order.items = JSON.parse(order.items);
    }
    if (order.shipping_address && typeof order.shipping_address === 'string') {
      try {
        order.shipping_address = JSON.parse(order.shipping_address);
      } catch {
        // Keep as string if not valid JSON
      }
    }
    
    return order;
  }

  // Get orders by user ID
  static async getByUserId(userId, { page = 1, limit = 10, status = '' } = {}) {
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE user_id = ?';
    const params = [userId];
    
    if (status) {
      whereClause += ' AND status = ?';
      params.push(status);
    }
    
    // Get orders
    const ordersSQL = `
      SELECT * FROM orders 
      ${whereClause} 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `;
    
    // Get total count
    const countSQL = `SELECT COUNT(*) as total FROM orders ${whereClause}`;
    
    const [orders] = await db.execute(ordersSQL, [...params, limit, offset]);
    const [countResult] = await db.execute(countSQL, params);
    
    // Parse JSON fields for each order
    const parsedOrders = orders.map(order => {
      if (order.items && typeof order.items === 'string') {
        order.items = JSON.parse(order.items);
      }
      if (order.shipping_address && typeof order.shipping_address === 'string') {
        try {
          order.shipping_address = JSON.parse(order.shipping_address);
        } catch {
          // Keep as string if not valid JSON
        }
      }
      return order;
    });
    
    return {
      orders: parsedOrders,
      total: countResult[0].total,
      page: parseInt(page),
      totalPages: Math.ceil(countResult[0].total / limit)
    };
  }

  // Get all orders (admin)
  static async getAll({ page = 1, limit = 20, status = '', startDate = '', endDate = '' } = {}) {
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE 1=1';
    const params = [];
    
    if (status) {
      whereClause += ' AND status = ?';
      params.push(status);
    }
    
    if (startDate) {
      whereClause += ' AND DATE(created_at) >= ?';
      params.push(startDate);
    }
    
    if (endDate) {
      whereClause += ' AND DATE(created_at) <= ?';
      params.push(endDate);
    }
    
    // Get orders with user information
    const ordersSQL = `
      SELECT o.*, u.name as customer_name, u.email as customer_email 
      FROM orders o 
      LEFT JOIN users u ON o.user_id = u.id 
      ${whereClause} 
      ORDER BY o.created_at DESC 
      LIMIT ? OFFSET ?
    `;
    
    // Get total count
    const countSQL = `SELECT COUNT(*) as total FROM orders o ${whereClause}`;
    
    const [orders] = await db.execute(ordersSQL, [...params, limit, offset]);
    const [countResult] = await db.execute(countSQL, params);
    
    // Parse JSON fields for each order
    const parsedOrders = orders.map(order => {
      if (order.items && typeof order.items === 'string') {
        order.items = JSON.parse(order.items);
      }
      if (order.shipping_address && typeof order.shipping_address === 'string') {
        try {
          order.shipping_address = JSON.parse(order.shipping_address);
        } catch {
          // Keep as string if not valid JSON
        }
      }
      return order;
    });
    
    return {
      orders: parsedOrders,
      total: countResult[0].total,
      page: parseInt(page),
      totalPages: Math.ceil(countResult[0].total / limit)
    };
  }

  // Update order status
  static async updateStatus(id, status) {
    const sql = 'UPDATE orders SET status = ? WHERE id = ?';
    const [result] = await db.execute(sql, [status, id]);
    return result.affectedRows > 0;
  }

  // Update payment status
  static async updatePaymentStatus(id, paymentStatus) {
    const sql = 'UPDATE orders SET payment_status = ? WHERE id = ?';
    const [result] = await db.execute(sql, [paymentStatus, id]);
    return result.affectedRows > 0;
  }

  // Get orders by status
  static async getByStatus(status, limit = 50) {
    const sql = 'SELECT * FROM orders WHERE status = ? ORDER BY created_at DESC LIMIT ?';
    const [orders] = await db.execute(sql, [status, limit]);
    
    // Parse JSON fields for each order
    return orders.map(order => {
      if (order.items && typeof order.items === 'string') {
        order.items = JSON.parse(order.items);
      }
      return order;
    });
  }

  // Get total sales statistics
  static async getSalesStats(timeframe = 'month') {
    let dateFilter = '';
    const params = [];
    
    switch (timeframe) {
      case 'today':
        dateFilter = 'AND DATE(created_at) = CURDATE()';
        break;
      case 'week':
        dateFilter = 'AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
        break;
      case 'month':
        dateFilter = 'AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
        break;
      case 'year':
        dateFilter = 'AND created_at >= DATE_SUB(NOW(), INTERVAL 1 YEAR)';
        break;
    }
    
    const sql = `
      SELECT 
        COUNT(*) as total_orders,
        SUM(total_amount) as total_revenue,
        AVG(total_amount) as average_order_value,
        SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as completed_orders
      FROM orders 
      WHERE payment_status = 'paid' ${dateFilter}
    `;
    
    const [stats] = await db.execute(sql, params);
    return stats[0];
  }
}

module.exports = Order;