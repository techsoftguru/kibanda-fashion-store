const db = require('../config/database');

class Product {
  // Get all products with pagination and filtering
  static async getAll({ page = 1, limit = 12, category = '', search = '', sort = 'newest' }) {
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE 1=1';
    const params = [];
    
    if (category) {
      whereClause += ' AND category = ?';
      params.push(category);
    }
    
    if (search) {
      whereClause += ' AND (name LIKE ? OR description LIKE ? OR brand LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }
    
    let orderBy = 'ORDER BY ';
    switch (sort) {
      case 'price-low':
        orderBy += 'price ASC';
        break;
      case 'price-high':
        orderBy += 'price DESC';
        break;
      case 'rating':
        orderBy += 'rating DESC';
        break;
      case 'featured':
        orderBy += 'featured DESC, created_at DESC';
        break;
      default:
        orderBy += 'created_at DESC';
    }
    
    // Get products
    const productsSQL = `
      SELECT * FROM products 
      ${whereClause} 
      ${orderBy} 
      LIMIT ? OFFSET ?
    `;
    
    // Get total count
    const countSQL = `SELECT COUNT(*) as total FROM products ${whereClause}`;
    
    const [products] = await db.execute([...params, limit, offset]);
    const [countResult] = await db.execute(countSQL, params);
    
    return {
      products,
      total: countResult[0].total,
      page: parseInt(page),
      totalPages: Math.ceil(countResult[0].total / limit)
    };
  }
  
  // Get product by ID
  static async getById(id) {
    const sql = 'SELECT * FROM products WHERE id = ?';
    const [products] = await db.execute(sql, [id]);
    return products[0];
  }
  
  // Get products by category
  static async getByCategory(category, limit = 12) {
    const sql = 'SELECT * FROM products WHERE category = ? ORDER BY created_at DESC LIMIT ?';
    const [products] = await db.execute(sql, [category, limit]);
    return products;
  }
  
  // Get featured products
  static async getFeatured(limit = 8) {
    const sql = 'SELECT * FROM products WHERE featured = TRUE ORDER BY created_at DESC LIMIT ?';
    const [products] = await db.execute(sql, [limit]);
    return products;
  }
  
  // Get new arrivals
  static async getNewArrivals(limit = 12) {
    const sql = 'SELECT * FROM products WHERE badge = "new" OR created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) ORDER BY created_at DESC LIMIT ?';
    const [products] = await db.execute(sql, [limit]);
    return products;
  }
  
  // Get sale products
  static async getSaleProducts(limit = 12) {
    const sql = 'SELECT * FROM products WHERE badge = "sale" OR original_price IS NOT NULL ORDER BY created_at DESC LIMIT ?';
    const [products] = await db.execute(sql, [limit]);
    return products;
  }
  
  // Search products
  static async search(query, limit = 20) {
    const sql = `
      SELECT * FROM products 
      WHERE name LIKE ? OR description LIKE ? OR category LIKE ? OR brand LIKE ?
      ORDER BY 
        CASE 
          WHEN name LIKE ? THEN 1
          WHEN brand LIKE ? THEN 2
          ELSE 3
        END,
        created_at DESC
      LIMIT ?
    `;
    const searchTerm = `%${query}%`;
    const [products] = await db.execute(sql, [
      searchTerm, searchTerm, searchTerm, searchTerm,
      searchTerm, searchTerm,
      limit
    ]);
    return products;
  }
  
  // Create new product
  static async create(productData) {
    const {
      name, description, price, original_price, category, subcategory, brand,
      image_url, image_gallery, sizes, colors, stock_quantity, featured, badge
    } = productData;
    
    const sql = `
      INSERT INTO products 
      (name, description, price, original_price, category, subcategory, brand, image_url, image_gallery, sizes, colors, stock_quantity, featured, badge)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const [result] = await db.execute(sql, [
      name, description, price, original_price, category, subcategory, brand,
      image_url, JSON.stringify(image_gallery || []),
      JSON.stringify(sizes || []),
      JSON.stringify(colors || []),
      stock_quantity, featured, badge
    ]);
    
    return result.insertId;
  }
  
  // Update product
  static async update(id, productData) {
    const fields = [];
    const values = [];
    
    Object.keys(productData).forEach(key => {
      if (productData[key] !== undefined) {
        if (['image_gallery', 'sizes', 'colors'].includes(key)) {
          fields.push(`${key} = ?`);
          values.push(JSON.stringify(productData[key]));
        } else {
          fields.push(`${key} = ?`);
          values.push(productData[key]);
        }
      }
    });
    
    if (fields.length === 0) {
      throw new Error('No fields to update');
    }
    
    values.push(id);
    const sql = `UPDATE products SET ${fields.join(', ')} WHERE id = ?`;
    const [result] = await db.execute(sql, values);
    
    return result.affectedRows > 0;
  }
  
  // Delete product
  static async delete(id) {
    const sql = 'DELETE FROM products WHERE id = ?';
    const [result] = await db.execute(sql, [id]);
    return result.affectedRows > 0;
  }
  
  // Update product rating
  static async updateRating(productId, newRating) {
    const sql = `
      UPDATE products 
      SET rating = ?, review_count = review_count + 1 
      WHERE id = ?
    `;
    const [result] = await db.execute(sql, [newRating, productId]);
    return result.affectedRows > 0;
  }
}

module.exports = Product;