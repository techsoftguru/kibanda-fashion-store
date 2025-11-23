const mysql = require('mysql2');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true
});

// Convert pool to use promises
const promisePool = pool.promise();

// Database initialization function
const initializeDatabase = async () => {
  try {
    // Create database if it doesn't exist
    const createDBSQL = `CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`;
    await promisePool.execute(createDBSQL);
    
    // Use the database
    await promisePool.execute(`USE ${process.env.DB_NAME}`);
    
    // Create products table
    const productsTableSQL = `
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        original_price DECIMAL(10, 2),
        category VARCHAR(100) NOT NULL,
        subcategory VARCHAR(100),
        brand VARCHAR(100),
        image_url VARCHAR(500),
        image_gallery JSON,
        sizes JSON,
        colors JSON,
        stock_quantity INT DEFAULT 0,
        featured BOOLEAN DEFAULT FALSE,
        badge ENUM('new', 'sale', 'hot', '') DEFAULT '',
        rating DECIMAL(2,1) DEFAULT 0.0,
        review_count INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX category_idx (category),
        INDEX featured_idx (featured),
        INDEX badge_idx (badge)
      )
    `;
    await promisePool.execute(productsTableSQL);
    
    // Create users table
    const usersTableSQL = `
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        address TEXT,
        role ENUM('customer', 'admin') DEFAULT 'customer',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `;
    await promisePool.execute(usersTableSQL);
    
    // Create admin user
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
    
    const adminSQL = `
      INSERT IGNORE INTO users (name, email, password, role) 
      VALUES (?, ?, ?, 'admin')
    `;
    await promisePool.execute(adminSQL, ['Admin User', process.env.ADMIN_EMAIL, hashedPassword]);
    
    // Create orders table
    const ordersTableSQL = `
      CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_number VARCHAR(50) UNIQUE NOT NULL,
        user_id INT,
        customer_email VARCHAR(255) NOT NULL,
        customer_name VARCHAR(100) NOT NULL,
        customer_phone VARCHAR(20),
        shipping_address TEXT NOT NULL,
        items JSON NOT NULL,
        subtotal DECIMAL(10, 2) NOT NULL,
        shipping_fee DECIMAL(10, 2) DEFAULT 0,
        total_amount DECIMAL(10, 2) NOT NULL,
        status ENUM('pending', 'confirmed', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
        payment_method VARCHAR(50),
        payment_status ENUM('pending', 'paid', 'failed') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `;
    await promisePool.execute(ordersTableSQL);
    
    // Create wishlist table
    const wishlistTableSQL = `
      CREATE TABLE IF NOT EXISTS wishlist (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        product_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        UNIQUE KEY unique_wishlist (user_id, product_id)
      )
    `;
    await promisePool.execute(wishlistTableSQL);
    
    console.log('✅ Database initialized successfully');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
};

// Initialize database when module loads
initializeDatabase();

module.exports = promisePool;