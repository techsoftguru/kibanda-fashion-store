const Product = require('../models/Product');
const path = require('path');

class ProductController {
  // Get all products with filtering and pagination
  static async getProducts(req, res) {
    try {
      const { 
        page = 1, 
        limit = 12, 
        category, 
        search, 
        sort = 'newest',
        featured,
        badge 
      } = req.query;

      const filters = { page, limit, category, search, sort };
      
      if (featured) filters.featured = featured === 'true';
      if (badge) filters.badge = badge;

      const result = await Product.getAll(filters);
      
      res.json({
        success: true,
        data: result.products,
        pagination: {
          page: result.page,
          limit: parseInt(limit),
          total: result.total,
          totalPages: result.totalPages
        }
      });
    } catch (error) {
      console.error('Get products error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to fetch products' 
      });
    }
  }

  // Get single product
  static async getProduct(req, res) {
    try {
      const { id } = req.params;
      const product = await Product.getById(id);
      
      if (!product) {
        return res.status(404).json({ 
          success: false,
          error: 'Product not found' 
        });
      }
      
      res.json({
        success: true,
        data: product
      });
    } catch (error) {
      console.error('Get product error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to fetch product' 
      });
    }
  }

  // Get products by category
  static async getProductsByCategory(req, res) {
    try {
      const { category } = req.params;
      const { limit = 12 } = req.query;
      
      const products = await Product.getByCategory(category, limit);
      
      res.json({
        success: true,
        data: products,
        category: category
      });
    } catch (error) {
      console.error('Get products by category error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to fetch category products' 
      });
    }
  }

  // Get featured products
  static async getFeaturedProducts(req, res) {
    try {
      const { limit = 8 } = req.query;
      const products = await Product.getFeatured(limit);
      
      res.json({
        success: true,
        data: products
      });
    } catch (error) {
      console.error('Get featured products error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to fetch featured products' 
      });
    }
  }

  // Get new arrivals
  static async getNewArrivals(req, res) {
    try {
      const { limit = 12 } = req.query;
      const products = await Product.getNewArrivals(limit);
      
      res.json({
        success: true,
        data: products
      });
    } catch (error) {
      console.error('Get new arrivals error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to fetch new arrivals' 
      });
    }
  }

  // Get sale products
  static async getSaleProducts(req, res) {
    try {
      const { limit = 12 } = req.query;
      const products = await Product.getSaleProducts(limit);
      
      res.json({
        success: true,
        data: products
      });
    } catch (error) {
      console.error('Get sale products error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to fetch sale products' 
      });
    }
  }

  // Search products
  static async searchProducts(req, res) {
    try {
      const { q, limit = 20 } = req.query;
      
      if (!q || q.trim() === '') {
        return res.json({
          success: true,
          data: [],
          query: q
        });
      }
      
      const products = await Product.search(q.trim(), limit);
      
      res.json({
        success: true,
        data: products,
        query: q
      });
    } catch (error) {
      console.error('Search products error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Search failed' 
      });
    }
  }

  // Create product (Admin only)
  static async createProduct(req, res) {
    try {
      const productData = req.body;
      
      // Handle image upload
      if (req.file) {
        productData.image_url = `/uploads/products/${req.file.filename}`;
      }
      
      // Parse JSON fields if they are strings
      if (typeof productData.image_gallery === 'string') {
        productData.image_gallery = JSON.parse(productData.image_gallery);
      }
      if (typeof productData.sizes === 'string') {
        productData.sizes = JSON.parse(productData.sizes);
      }
      if (typeof productData.colors === 'string') {
        productData.colors = JSON.parse(productData.colors);
      }
      
      const productId = await Product.create(productData);
      
      res.status(201).json({
        success: true,
        message: 'Product created successfully',
        productId: productId
      });
    } catch (error) {
      console.error('Create product error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to create product' 
      });
    }
  }

  // Update product (Admin only)
  static async updateProduct(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      // Handle image upload
      if (req.file) {
        updateData.image_url = `/uploads/products/${req.file.filename}`;
      }
      
      // Parse JSON fields if they are strings
      if (typeof updateData.image_gallery === 'string') {
        updateData.image_gallery = JSON.parse(updateData.image_gallery);
      }
      if (typeof updateData.sizes === 'string') {
        updateData.sizes = JSON.parse(updateData.sizes);
      }
      if (typeof updateData.colors === 'string') {
        updateData.colors = JSON.parse(updateData.colors);
      }
      
      const updated = await Product.update(id, updateData);
      
      if (!updated) {
        return res.status(404).json({ 
          success: false,
          error: 'Product not found' 
        });
      }
      
      res.json({
        success: true,
        message: 'Product updated successfully'
      });
    } catch (error) {
      console.error('Update product error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to update product' 
      });
    }
  }

  // Delete product (Admin only)
  static async deleteProduct(req, res) {
    try {
      const { id } = req.params;
      const deleted = await Product.delete(id);
      
      if (!deleted) {
        return res.status(404).json({ 
          success: false,
          error: 'Product not found' 
        });
      }
      
      res.json({
        success: true,
        message: 'Product deleted successfully'
      });
    } catch (error) {
      console.error('Delete product error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to delete product' 
      });
    }
  }
}

module.exports = ProductController;