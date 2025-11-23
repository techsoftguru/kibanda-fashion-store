const db = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  // Find user by ID
  static async findById(id) {
    try {
      const sql = 'SELECT id, name, email, phone, address, role, created_at FROM users WHERE id = ?';
      const [users] = await db.execute(sql, [id]);
      return users[0] || null;
    } catch (error) {
      console.error('Find user by ID error:', error);
      throw error;
    }
  }

  // Find user by email
  static async findByEmail(email) {
    try {
      const sql = 'SELECT * FROM users WHERE email = ?';
      const [users] = await db.execute(sql, [email]);
      return users[0] || null;
    } catch (error) {
      console.error('Find user by email error:', error);
      throw error;
    }
  }

  // Create new user
  static async create(userData) {
    try {
      const { name, email, password, phone, address } = userData;
      
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const sql = `
        INSERT INTO users (name, email, password, phone, address) 
        VALUES (?, ?, ?, ?, ?)
      `;
      
      const [result] = await db.execute(sql, [
        name, 
        email, 
        hashedPassword, 
        phone, 
        address
      ]);
      
      return result.insertId;
    } catch (error) {
      console.error('Create user error:', error);
      throw error;
    }
  }

  // Update user profile
  static async update(id, updateData) {
    try {
      const fields = [];
      const values = [];
      
      // Allowed fields for update
      const allowedFields = ['name', 'phone', 'address'];
      
      Object.keys(updateData).forEach(key => {
        if (allowedFields.includes(key) && updateData[key] !== undefined) {
          fields.push(`${key} = ?`);
          values.push(updateData[key]);
        }
      });
      
      if (fields.length === 0) {
        throw new Error('No valid fields to update');
      }
      
      values.push(id);
      const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
      const [result] = await db.execute(sql, values);
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    }
  }

  // Update user password
  static async updatePassword(id, newPassword) {
    try {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      const sql = 'UPDATE users SET password = ? WHERE id = ?';
      const [result] = await db.execute(sql, [hashedPassword, id]);
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Update password error:', error);
      throw error;
    }
  }

  // Verify user password
  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // Get user wishlist
  static async getWishlist(userId) {
    try {
      const sql = `
        SELECT p.* 
        FROM wishlist w 
        JOIN products p ON w.product_id = p.id 
        WHERE w.user_id = ? 
        ORDER BY w.created_at DESC
      `;
      const [wishlistItems] = await db.execute(sql, [userId]);
      return wishlistItems;
    } catch (error) {
      console.error('Get wishlist error:', error);
      throw error;
    }
  }

  // Add product to wishlist
  static async addToWishlist(userId, productId) {
    try {
      const sql = 'INSERT IGNORE INTO wishlist (user_id, product_id) VALUES (?, ?)';
      const [result] = await db.execute(sql, [userId, productId]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Add to wishlist error:', error);
      throw error;
    }
  }

  // Remove product from wishlist
  static async removeFromWishlist(userId, productId) {
    try {
      const sql = 'DELETE FROM wishlist WHERE user_id = ? AND product_id = ?';
      const [result] = await db.execute(sql, [userId, productId]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Remove from wishlist error:', error);
      throw error;
    }
  }

  // Check if product is in wishlist
  static async isInWishlist(userId, productId) {
    try {
      const sql = 'SELECT 1 FROM wishlist WHERE user_id = ? AND product_id = ? LIMIT 1';
      const [rows] = await db.execute(sql, [userId, productId]);
      return rows.length > 0;
    } catch (error) {
      console.error('Check wishlist error:', error);
      throw error;
    }
  }

  // Get user orders with pagination
  static async getOrders(userId, { page = 1, limit = 10, status = '' } = {}) {
    try {
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
    } catch (error) {
      console.error('Get user orders error:', error);
      throw error;
    }
  }

  // Get user statistics
  static async getUserStats(userId) {
    try {
      const sql = `
        SELECT 
          COUNT(*) as total_orders,
          SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as completed_orders,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_orders,
          (SELECT COUNT(*) FROM wishlist WHERE user_id = ?) as wishlist_count
        FROM orders 
        WHERE user_id = ?
      `;
      
      const [stats] = await db.execute(sql, [userId, userId]);
      return stats[0] || {
        total_orders: 0,
        completed_orders: 0,
        pending_orders: 0,
        wishlist_count: 0
      };
    } catch (error) {
      console.error('Get user stats error:', error);
      throw error;
    }
  }

  // Get all users (admin only)
  static async getAllUsers({ page = 1, limit = 20, search = '' } = {}) {
    try {
      const offset = (page - 1) * limit;
      
      let whereClause = '';
      const params = [];
      
      if (search) {
        whereClause = 'WHERE name LIKE ? OR email LIKE ?';
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm);
      }
      
      // Get users (without passwords)
      const usersSQL = `
        SELECT id, name, email, phone, address, role, created_at 
        FROM users 
        ${whereClause} 
        ORDER BY created_at DESC 
        LIMIT ? OFFSET ?
      `;
      
      // Get total count
      const countSQL = `SELECT COUNT(*) as total FROM users ${whereClause}`;
      
      const [users] = await db.execute(usersSQL, [...params, limit, offset]);
      const [countResult] = await db.execute(countSQL, params);
      
      return {
        users,
        total: countResult[0].total,
        page: parseInt(page),
        totalPages: Math.ceil(countResult[0].total / limit)
      };
    } catch (error) {
      console.error('Get all users error:', error);
      throw error;
    }
  }

  // Update user role (admin only)
  static async updateRole(userId, role) {
    try {
      if (!['customer', 'admin'].includes(role)) {
        throw new Error('Invalid role');
      }
      
      const sql = 'UPDATE users SET role = ? WHERE id = ?';
      const [result] = await db.execute(sql, [role, userId]);
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Update user role error:', error);
      throw error;
    }
  }

  // Delete user (admin only)
  static async delete(userId) {
    try {
      const sql = 'DELETE FROM users WHERE id = ?';
      const [result] = await db.execute(sql, [userId]);
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Delete user error:', error);
      throw error;
    }
  }

  // Check if email exists
  static async emailExists(email, excludeUserId = null) {
    try {
      let sql = 'SELECT 1 FROM users WHERE email = ?';
      const params = [email];
      
      if (excludeUserId) {
        sql += ' AND id != ?';
        params.push(excludeUserId);
      }
      
      sql += ' LIMIT 1';
      
      const [rows] = await db.execute(sql, params);
      return rows.length > 0;
    } catch (error) {
      console.error('Check email exists error:', error);
      throw error;
    }
  }
}

module.exports = User;