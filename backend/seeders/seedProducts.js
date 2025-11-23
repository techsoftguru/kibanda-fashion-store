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
    image_url: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
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
    original_price: 7500,
    category: "Sneakers",
    subcategory: "Running",
    brand: "RunPro",
    image_url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    sizes: JSON.stringify(["40", "41", "42", "43", "44"]),
    colors: JSON.stringify(["#1e40af", "#dc2626", "#000000"]),
    stock_quantity: 18,
    featured: true,
    badge: "hot",
    rating: 4.8
  },
  {
    name: "Women's Fashion Sneakers",
    description: "Trendy sneakers for women with comfortable design and stylish look.",
    price: 3800,
    category: "Sneakers",
    subcategory: "Women",
    brand: "StyleSteps",
    image_url: "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    sizes: JSON.stringify(["36", "37", "38", "39", "40"]),
    colors: JSON.stringify(["#f472b6", "#8b5cf6", "#000000"]),
    stock_quantity: 30,
    featured: false,
    badge: "sale",
    rating: 4.3
  },
  {
    name: "Classic Denim Jacket",
    description: "Versatile denim jacket perfect for any casual outfit.",
    price: 3200,
    category: "Clothing",
    subcategory: "Jackets",
    brand: "DenimCo",
    image_url: "https://images.unsplash.com/photo-1551028719-00167b16eac5?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    sizes: JSON.stringify(["S", "M", "L", "XL"]),
    colors: JSON.stringify(["#1e40af", "#000000"]),
    stock_quantity: 15,
    featured: true,
    badge: "new",
    rating: 4.6
  },
  {
    name: "Cotton T-Shirt Pack",
    description: "Comfortable 3-pack cotton t-shirts for everyday wear.",
    price: 1800,
    category: "Clothing",
    subcategory: "T-Shirts",
    brand: "ComfortWear",
    image_url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    sizes: JSON.stringify(["S", "M", "L", "XL"]),
    colors: JSON.stringify(["#FFFFFF", "#000000", "#dc2626", "#1e40af"]),
    stock_quantity: 50,
    featured: false,
    badge: "",
    rating: 4.2
  },
  {
    name: "Basketball High-Tops",
    description: "Professional basketball shoes with ankle support and superior grip.",
    price: 7800,
    original_price: 8900,
    category: "Sneakers",
    subcategory: "Basketball",
    brand: "JumpMax",
    image_url: "https://images.unsplash.com/photo-1600269452121-4f2416e55c28?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    sizes: JSON.stringify(["40", "41", "42", "43", "44", "45"]),
    colors: JSON.stringify(["#dc2626", "#000000", "#1e40af"]),
    stock_quantity: 12,
    featured: true,
    badge: "new",
    rating: 4.7
  },
  {
    name: "Summer Floral Dress",
    description: "Light and comfortable floral dress perfect for summer occasions.",
    price: 2800,
    category: "Clothing",
    subcategory: "Dresses",
    brand: "SummerBreeze",
    image_url: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    sizes: JSON.stringify(["S", "M", "L"]),
    colors: JSON.stringify(["#f472b6", "#fbbf24", "#a3e635"]),
    stock_quantity: 20,
    featured: false,
    badge: "sale",
    rating: 4.4
  },
  {
    name: "Limited Edition Collectors",
    description: "Exclusive limited edition sneakers for collectors.",
    price: 12000,
    category: "Sneakers",
    subcategory: "Limited",
    brand: "EliteFootwear",
    image_url: "https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    sizes: JSON.stringify(["40", "41", "42", "43"]),
    colors: JSON.stringify(["#000000", "#f59e0b"]),
    stock_quantity: 5,
    featured: true,
    badge: "hot",
    rating: 4.9
  }
];

async function seedProducts() {
  try {
    console.log('🌱 Seeding sample products...');
    
    // Clear existing products
    await db.execute('DELETE FROM products');
    
    for (const product of sampleProducts) {
      await db.execute(
        `INSERT INTO products (name, description, price, original_price, category, subcategory, brand, image_url, sizes, colors, stock_quantity, featured, badge, rating) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          product.name, 
          product.description, 
          product.price, 
          product.original_price,
          product.category, 
          product.subcategory, 
          product.brand, 
          product.image_url,
          product.sizes, 
          product.colors, 
          product.stock_quantity, 
          product.featured,
          product.badge, 
          product.rating
        ]
      );
      console.log(`✅ Added: ${product.name}`);
    }
    
    console.log('🎉 Sample products seeded successfully!');
    console.log('📊 Total products in database: ' + sampleProducts.length);
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

// Run seeder if this file is executed directly
if (require.main === module) {
  seedProducts();
}

module.exports = seedProducts;