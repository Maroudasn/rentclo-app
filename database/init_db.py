import sqlite3
import os
from datetime import datetime
import hashlib  # Add this import

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

def init_db():
    # Create database directory
    database_dir = os.path.dirname(os.path.abspath(__file__))
    os.makedirs(database_dir, exist_ok=True)
    
    db_path = os.path.join(database_dir, 'shop.db')
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Tables that match your FastAPI models
    cursor.executescript('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,  -- Changed from password to password_hash
            phone TEXT,
            full_name TEXT,
            is_active BOOLEAN DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            price REAL NOT NULL,
            description TEXT,
            size TEXT,
            category TEXT,
            image_url TEXT,
            is_available BOOLEAN DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            total REAL NOT NULL,
            status TEXT DEFAULT 'pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        );

        CREATE TABLE IF NOT EXISTS cart_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            quantity INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id),
            FOREIGN KEY (product_id) REFERENCES products (id)
        );
    ''')

    # Seed products
    cursor.execute("SELECT COUNT(*) FROM products")
    if cursor.fetchone()[0] == 0:
        sample_products = [
            ('Designer Evening Gown', 89.99, 'Elegant black evening gown', 'M', 'Dresses', '/images/gown.jpg'),
            ('Men\'s Business Suit', 69.99, 'Classic navy blue suit', 'L', 'Suits', '/images/suit.jpg'),
            ('Designer Handbag', 39.99, 'Luxury leather handbag', 'One Size', 'Accessories', '/images/handbag.jpg')
        ]
        
        cursor.executemany(
            'INSERT INTO products (name, price, description, size, category, image_url) VALUES (?, ?, ?, ?, ?, ?)',
            sample_products
        )

    # Add sample users if none exist
    cursor.execute("SELECT COUNT(*) FROM users")
    if cursor.fetchone()[0] == 0:
        sample_users = [
            ('john_tenant', 'john@example.com', hash_password('password123'), '+1234567890', 'John Tenant'),
            ('jane_lessor', 'jane@example.com', hash_password('password123'), '+0987654321', 'Jane Lessor'),
            ('mike_both', 'mike@rentclo.com', hash_password('admin123'), '+1111111111', 'Mike Both')
        ]
        
        cursor.executemany(
            'INSERT INTO users (username, email, password_hash, phone, full_name) VALUES (?, ?, ?, ?, ?)',
            sample_users
        )
        print(f"Inserted {len(sample_users)} sample users")

    conn.commit()
    conn.close()
    print("Database initialized successfully!")

if __name__ == '__main__':
    init_db()