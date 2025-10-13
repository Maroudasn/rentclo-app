import sqlite3
import hashlib
import os
from datetime import datetime, timedelta

def create_database():
    """Create a fresh database with proper table structures"""
    
    # Remove existing database file if it exists
    if os.path.exists('rentclo.db'):
        os.remove('rentclo.db')
        print("Removed corrupted database file")
    
    # Create new database connection
    conn = sqlite3.connect('rentclo.db')
    conn.row_factory = sqlite3.Row
    
    # Enable foreign key support
    conn.execute("PRAGMA foreign_keys = ON")
    
    cursor = conn.cursor()
    
    try:
        print("Creating new database with proper table structures...")
        
        # Users table
        cursor.execute('''
            CREATE TABLE users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                user_type VARCHAR(10) NOT NULL CHECK(user_type IN ('tenant', 'lessor', 'both')),
                first_name VARCHAR(50) NOT NULL,
                last_name VARCHAR(50) NOT NULL,
                phone VARCHAR(20) UNIQUE NOT NULL,
                is_active BOOLEAN DEFAULT 1,
                is_verified BOOLEAN DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        print("✓ Created users table")
        
        # User addresses table
        cursor.execute('''
            CREATE TABLE user_addresses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                address_line1 VARCHAR(255) NOT NULL,
                address_line2 VARCHAR(255),
                city VARCHAR(100) NOT NULL,
                state VARCHAR(100) NOT NULL,
                zip_code VARCHAR(20) NOT NULL,
                country VARCHAR(100) DEFAULT 'USA',
                is_primary BOOLEAN DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            )
        ''')
        print("✓ Created user_addresses table")
        
        # Login sessions table
        cursor.execute('''
            CREATE TABLE login_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                session_token VARCHAR(255) UNIQUE NOT NULL,
                ip_address VARCHAR(45),
                user_agent TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP NOT NULL,
                is_active BOOLEAN DEFAULT 1,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            )
        ''')
        print("✓ Created login_sessions table")
        
        # Categories table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name VARCHAR(50) UNIQUE NOT NULL,
                description TEXT
            )
        ''')
        print("✓ Created categories table")

        # Items table (clothing items)
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                price_per_day DECIMAL(10, 2) NOT NULL,
                category_id INTEGER,
                gender VARCHAR(10) CHECK(gender IN ('men', 'women', 'unisex')),
                occasion VARCHAR(50),
                size VARCHAR(20),
                condition VARCHAR(20) CHECK(condition IN ('new', 'excellent', 'good', 'fair')),
                brand VARCHAR(100),
                color VARCHAR(50),
                location_area VARCHAR(100),
                is_available BOOLEAN DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
                FOREIGN KEY (category_id) REFERENCES categories (id)
            )
        ''')
        print("✓ Created items table")

        # Item images table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS item_images (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                item_id INTEGER NOT NULL,
                image_url TEXT NOT NULL,
                is_primary BOOLEAN DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (item_id) REFERENCES items (id) ON DELETE CASCADE
            )
        ''')
        print("✓ Created item_images table")

        # Availability periods table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS item_availability (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                item_id INTEGER NOT NULL,
                start_date DATE NOT NULL,
                end_date DATE NOT NULL,
                is_available BOOLEAN DEFAULT 1,
                FOREIGN KEY (item_id) REFERENCES items (id) ON DELETE CASCADE
            )
        ''')
        print("✓ Created item_availability table")

        # Sizes table for standardized sizing
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS sizes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                category VARCHAR(50) NOT NULL,
                size_value VARCHAR(20) NOT NULL,
                display_name VARCHAR(20) NOT NULL
            )
        ''')
        print("✓ Created sizes table")

        # Favorites table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS favorites (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                item_id INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
                FOREIGN KEY (item_id) REFERENCES items (id) ON DELETE CASCADE,
                UNIQUE(user_id, item_id)
            )
        ''')
        print("✓ Created favorites table")

        # Item specifications table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS item_specifications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                item_id INTEGER NOT NULL,
                material VARCHAR(100),
                care_instructions TEXT,
                measurements TEXT,
                tags TEXT,
                FOREIGN KEY (item_id) REFERENCES items (id) ON DELETE CASCADE
            )
        ''')
        print("✓ Created item_specifications table")
        
        # Insert sample data
        insert_sample_data(cursor, conn)
        
        conn.commit()
        print("✓ Database created successfully with sample data")
        
    except Exception as e:
        print(f"✗ Error creating database: {e}")
        conn.rollback()
        raise
    finally:
        conn.close()

def hash_password(password: str) -> str:
    """Hash password using SHA-256"""
    return hashlib.sha256(password.encode()).hexdigest()

def insert_sample_data(cursor, conn):
    """Insert sample data into the database"""
    
    print("Inserting sample data...")
    
    try:
        # Sample users (usernames set to emails)
        sample_users = [
            ('john@example.com', 'john@example.com', hash_password('password123'), 
             'tenant', 'John', 'Doe', '+1234567890'),
            ('jane@example.com', 'jane@example.com', hash_password('password123'), 
             'lessor', 'Jane', 'Smith', '+0987654321'),
            ('mike@rentclo.com', 'mike@rentclo.com', hash_password('admin123'), 
             'both', 'Mike', 'Johnson', '+1111111111')
        ]
        
        cursor.executemany('''
            INSERT INTO users (username, email, password_hash, user_type, first_name, last_name, phone)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', sample_users)
        print("✓ Inserted 3 sample users")
        
        # Sample addresses
        sample_addresses = [
            (1, '123 Main Street', 'Apt 4B', 'New York', 'NY', '10001', 'USA', 1),
            (2, '456 Oak Avenue', 'Suite 200', 'Los Angeles', 'CA', '90001', 'USA', 1),
            (3, '789 Pine Road', None, 'Chicago', 'IL', '60601', 'USA', 1)
        ]
        
        cursor.executemany('''
            INSERT INTO user_addresses (user_id, address_line1, address_line2, city, state, zip_code, country, is_primary)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', sample_addresses)
        print("✓ Inserted sample addresses")
        
        # Insert sample categories
        sample_categories = [
            ('Dresses', 'Beautiful dresses for all occasions'),
            ('Tops', 'Shirts, blouses, and tops'),
            ('Bottoms', 'Pants, skirts, and shorts'),
            ('Outerwear', 'Jackets, coats, and sweaters'),
            ('Accessories', 'Bags, jewelry, and accessories'),
            ('Shoes', 'Footwear for every style'),
            ('Formal Wear', 'Elegant clothing for special events'),
            ('Casual Wear', 'Comfortable everyday clothing')
        ]

        cursor.executemany(
            "INSERT OR IGNORE INTO categories (name, description) VALUES (?, ?)",
            sample_categories
        )
        print("✓ Inserted sample categories")

        # Insert standardized sizes
        sizes_data = [
            # Clothing Sizes
            ('clothing', 'XS', 'XS'),
            ('clothing', 'S', 'S'),
            ('clothing', 'M', 'M'),
            ('clothing', 'L', 'L'),
            ('clothing', 'XL', 'XL'),
            ('clothing', 'XXL', 'XXL'),
            
            # Shoe Sizes (European)
            ('shoes', '36', '36'),
            ('shoes', '37', '37'),
            ('shoes', '38', '38'),
            ('shoes', '39', '39'),
            ('shoes', '40', '40'),
            ('shoes', '41', '41'),
            ('shoes', '42', '42'),
            ('shoes', '43', '43'),
            ('shoes', '44', '44'),
            ('shoes', '45', '45'),
            
            # One Size items
            ('accessories', 'ONESIZE', 'One Size')
        ]

        cursor.executemany(
            "INSERT OR IGNORE INTO sizes (category, size_value, display_name) VALUES (?, ?, ?)",
            sizes_data
        )
        print("✓ Inserted standardized sizes")

        # Insert sample items with proper category IDs and diverse data
        sample_items = [
            # Women's Formal Wear
            (2, 'Elegant Black Dress', 'Perfect for formal occasions and evening events', 25.99, 1, 'women', 'formal', 'M', 'excellent', 'FashionBrand', 'Black', 'Downtown', 1),
            (2, 'Evening Gown', 'Stunning gown for special occasions', 45.00, 1, 'women', 'formal', 'L', 'new', 'Elegance', 'Red', 'Uptown', 1),
            
            # Women's Casual Wear
            (3, 'Casual Summer Dress', 'Light and comfortable dress for summer days', 18.75, 1, 'women', 'casual', 'S', 'good', 'SummerStyle', 'Blue', 'Beach Area', 1),
            (2, 'Winter Coat', 'Warm coat for cold weather', 22.50, 4, 'women', 'casual', 'M', 'excellent', 'WinterStyle', 'Beige', 'North Area', 1),
            
            # Men's Wear
            (2, 'Business Suit', 'Professional suit for business meetings', 35.00, 7, 'men', 'formal', 'L', 'excellent', 'ProfessionalWear', 'Navy', 'Business District', 1),
            (3, 'Men Casual Shirt', 'Comfortable cotton shirt for everyday wear', 12.99, 2, 'men', 'casual', 'L', 'good', 'CasualBrand', 'White', 'City Center', 1),
            
            # Unisex Items
            (3, 'Vintage Denim Jacket', 'Classic denim jacket with vintage wash', 12.99, 4, 'unisex', 'casual', 'M', 'good', 'VintageCo', 'Blue', 'Arts District', 1),
            (3, 'Sports Sneakers', 'Comfortable sneakers for active wear', 8.99, 6, 'unisex', 'sports', '42', 'good', 'Sporty', 'White', 'Sports Complex', 1),
            
            # Accessories
            (2, 'Designer Handbag', 'Luxury leather handbag with gold accents', 15.50, 5, 'women', 'casual', 'One Size', 'excellent', 'LuxuryBrand', 'Brown', 'Uptown', 1),
            (3, 'Leather Wallet', 'Genuine leather wallet for men', 7.99, 5, 'men', 'casual', 'One Size', 'good', 'LeatherCo', 'Black', 'Shopping District', 1),
            
            # More diverse items
            (2, 'Cocktail Dress', 'Elegant dress for parties and events', 28.99, 1, 'women', 'formal', 'S', 'excellent', 'PartyWear', 'Navy', 'Downtown', 1),
            (3, 'Men Sports Jacket', 'Lightweight jacket for outdoor activities', 16.75, 4, 'men', 'sports', 'XL', 'good', 'OutdoorGear', 'Green', 'Park Area', 1),
            (2, 'Summer Skirt', 'Flowery skirt perfect for summer', 14.50, 3, 'women', 'casual', 'M', 'excellent', 'SummerCollection', 'Floral', 'Beach Area', 1),
            (3, 'Formal Shoes', 'Classic leather shoes for formal occasions', 11.99, 6, 'men', 'formal', '43', 'good', 'ShoeMaster', 'Black', 'Business District', 1)
        ]

        cursor.executemany('''
            INSERT INTO items (user_id, title, description, price_per_day, category_id, gender, occasion, size, condition, brand, color, location_area, is_available)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', sample_items)
        print("✅ Added sample items with diverse categories and filters")

        # Insert sample images for all items
        cursor.execute('''
            INSERT INTO item_images (item_id, image_url, is_primary)
            VALUES 
            (1, 'https://picsum.photos/400/300?random=1', 1),
            (2, 'https://picsum.photos/400/300?random=2', 1),
            (3, 'https://picsum.photos/400/300?random=3', 1),
            (4, 'https://picsum.photos/400/300?random=4', 1),
            (5, 'https://picsum.photos/400/300?random=5', 1),
            (6, 'https://picsum.photos/400/300?random=6', 1),
            (7, 'https://picsum.photos/400/300?random=7', 1),
            (8, 'https://picsum.photos/400/300?random=8', 1),
            (9, 'https://picsum.photos/400/300?random=9', 1),
            (10, 'https://picsum.photos/400/300?random=10', 1),
            (11, 'https://picsum.photos/400/300?random=11', 1),
            (12, 'https://picsum.photos/400/300?random=12', 1),
            (13, 'https://picsum.photos/400/300?random=13', 1),
            (14, 'https://picsum.photos/400/300?random=14', 1)
        ''')
        print("✓ Inserted sample images for all items")
        
        # Insert sample availability periods for all items
        from datetime import datetime, timedelta
        today = datetime.now().date()
        end_date = today + timedelta(days=90)  # Available for next 3 months
        
        availability_data = [(i, today, end_date) for i in range(1, 15)]  # For items 1-14
        
        cursor.executemany('''
            INSERT INTO item_availability (item_id, start_date, end_date)
            VALUES (?, ?, ?)
        ''', availability_data)
        print("✓ Inserted sample availability periods for all items")
        
        # Insert sample specifications for existing items
        sample_specifications = [
            (1, 'Polyester, Spandex', 'Dry clean only', 'Length: 100cm, Waist: 70cm', 'elegant,formal,evening'),
            (2, 'Silk, Chiffon', 'Dry clean only', 'Length: 120cm, Waist: 68cm', 'elegant,formal,gown'),
            (3, 'Cotton, Linen', 'Machine wash cold', 'Length: 85cm, Waist: 65cm', 'summer,casual,comfortable'),
            (4, 'Wool, Polyester', 'Dry clean only', 'Chest: 105cm, Length: 75cm', 'business,professional,coat'),
            (5, 'Wool Blend, Cotton', 'Dry clean only', 'Chest: 110cm, Length: 70cm', 'business,professional,suit'),
            (6, 'Cotton Blend', 'Machine wash', 'Chest: 100cm, Length: 65cm', 'casual,comfortable,shirt'),
            (7, 'Denim, Cotton', 'Machine wash', 'Chest: 100cm, Length: 65cm', 'vintage,casual,denim'),
            (8, 'Mesh, Rubber', 'Wipe clean', 'EU 42', 'sports,comfortable,sneakers'),
            (9, 'Genuine Leather', 'Wipe with damp cloth', 'Width: 30cm, Height: 20cm', 'luxury,designer,handbag'),
            (10, 'Genuine Leather', 'Wipe clean', 'Length: 11cm, Width: 8cm', 'classic,accessories,wallet'),
            (11, 'Polyester, Spandex', 'Dry clean only', 'Length: 95cm, Waist: 68cm', 'party,elegant,cocktail'),
            (12, 'Nylon, Polyester', 'Machine wash', 'Chest: 115cm, Length: 75cm', 'sports,outdoor,jacket'),
            (13, 'Cotton, Modal', 'Machine wash cold', 'Length: 60cm, Waist: 70cm', 'summer,casual,skirt'),
            (14, 'Genuine Leather', 'Wipe clean', 'EU 43', 'formal,business,shoes')
        ]

        cursor.executemany('''
            INSERT OR IGNORE INTO item_specifications (item_id, material, care_instructions, measurements, tags)
            VALUES (?, ?, ?, ?, ?)
        ''', sample_specifications)
        print("✓ Inserted sample item specifications")
        
        # Verify data
        cursor.execute("SELECT COUNT(*) FROM users")
        user_count = cursor.fetchone()[0]
        print(f"✓ Total users in database: {user_count}")
        
        cursor.execute("SELECT COUNT(*) FROM items")
        item_count = cursor.fetchone()[0]
        print(f"✓ Total items in database: {item_count}")
        
    except Exception as e:
        print(f"✗ Error inserting sample data: {e}")
        raise

def verify_database_integrity():
    """Verify database integrity and foreign key relationships"""
    
    conn = sqlite3.connect('rentclo.db')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    try:
        # Check foreign key constraints
        cursor.execute("PRAGMA foreign_key_check")
        fk_issues = cursor.fetchall()
        
        if fk_issues:
            print("✗ Foreign key issues found:")
            for issue in fk_issues:
                print(f"  - {issue}")
        else:
            print("✓ No foreign key issues")
        
        # Check table structures
        tables = ['users', 'user_addresses', 'login_sessions']
        for table in tables:
            cursor.execute(f"PRAGMA table_info({table})")
            columns = cursor.fetchall()
            print(f"✓ Table {table} has {len(columns)} columns")
            
        # Test foreign key relationship
        try:
            cursor.execute('''
                INSERT INTO user_addresses (user_id, address_line1, city, state, zip_code)
                VALUES (999, 'Test Address', 'Test City', 'TS', '00000')
            ''')
            print("✗ Foreign key constraint failed to prevent invalid user_id")
            conn.rollback()
        except sqlite3.IntegrityError:
            print("✓ Foreign key constraint working correctly")
            conn.rollback()
            
    except Exception as e:
        print(f"✗ Integrity check failed: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    print("=== Recreating RENTCLO Database ===")
    create_database()
    print("\n=== Verifying Database Integrity ===")
    verify_database_integrity()
    print("\n=== Database recreation completed ===")
    print("\nSample login credentials:")
    print("Tenant: john@example.com / password123")
    print("Lessor: jane@example.com / password123")
    print("Both: mike@rentclo.com / admin123")
