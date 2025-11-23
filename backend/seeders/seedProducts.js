const db = require('../config/database');

const sampleProducts = [
  {
    name: "Premium White Sneakers",
    description: "Classic white sneakers with premium leather finish. Perfect for casual and semi-formal occasions.",
    price: 4500,
    original_price: 5500,
    category: "Sneakers",
    subcategory: "Casual",
    brand: "Urban Steps",
    image_url: "/uploads/products/sneaker-white.jpg",
    sizes: JSON.stringify(["38", "39", "40", "41", "42", "43"]),
    colors: JSON.stringify(["#FFFFFF", "#000000"]),
    stock_quantity: 25,
    featured: true,
    badge: "new",
    rating: 4.5
  },
  {
    name: "Men's Running Shoes",
    description: "High-performance running shoes with advanced cushioning technology.",
    price: 6200,
    category: "Sneakers", 
    subcategory: "Running",
    brand: "RunPro",
    image_url: "/uploads/products/running-shoes.jpg",
    sizes: JSON.stringify(["40", "41", "42", "43", "44"]),
    colors: JSON.stringify(["#1e40af", "#dc2626", "#000000"]),
    stock_quantity: 18,
    featured: true,
    badge: "hot",
    rating: 4.8
  },
  // Add more sample products...
];

async function seedProducts() {
  try {
    for (const product of sampleProducts) {
      await db.execute(
        `INSERT INTO products (name, description, price, original_price, category, subcategory, brand, image_url, sizes, colors, stock_quantity, featured, badge, rating) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          product.name, product.description, product.price, product.original_price,
          product.category, product.subcategory, product.brand, product.image_url,
          product.sizes, product.colors, product.stock_quantity, product.featured,
          product.badge, product.rating
        ]
      );
    }
    console.log('✅ Sample products seeded successfully');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  }
}

// Run seeder if this file is executed directly
if (require.main === module) {
  seedProducts();
}

module.exports = seedProducts;