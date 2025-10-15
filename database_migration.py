#!/usr/bin/env python3
"""
Database Migration Script - Add Bookings and User Stats Tables
This script adds the necessary tables to track bookings and user statistics.
"""

import sqlite3
import sys
from datetime import datetime

def create_bookings_table(cursor):
    """Create bookings table to track all user rentals"""
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS bookings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            item_id INTEGER NOT NULL,
            owner_id INTEGER NOT NULL,
            booking_date DATE NOT NULL,
            start_date DATE NOT NULL,
            end_date DATE NOT NULL,
            total_days INTEGER NOT NULL,
            price_per_day DECIMAL(10, 2) NOT NULL,
            total_amount DECIMAL(10, 2) NOT NULL,
            status VARCHAR(20) DEFAULT 'pending',
            payment_status VARCHAR(20) DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            notes TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (item_id) REFERENCES items(id),
            FOREIGN KEY (owner_id) REFERENCES users(id)
        )
    """)
    print("✅ Created bookings table")

def create_user_stats_table(cursor):
    """Create user_stats table to store aggregated statistics"""
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_stats (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER UNIQUE NOT NULL,
            total_bookings INTEGER DEFAULT 0,
            total_spent DECIMAL(10, 2) DEFAULT 0.00,
            total_earned DECIMAL(10, 2) DEFAULT 0.00,
            items_listed INTEGER DEFAULT 0,
            items_rented_out INTEGER DEFAULT 0,
            avg_rating DECIMAL(3, 2) DEFAULT 0.00,
            total_reviews INTEGER DEFAULT 0,
            last_booking_date DATE,
            last_listing_date DATE,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)
    print("✅ Created user_stats table")

def create_booking_reviews_table(cursor):
    """Create table for booking reviews and ratings"""
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS booking_reviews (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            booking_id INTEGER NOT NULL,
            reviewer_id INTEGER NOT NULL,
            reviewed_user_id INTEGER NOT NULL,
            rating INTEGER CHECK (rating >= 1 AND rating <= 5),
            review_text TEXT,
            review_type VARCHAR(10) CHECK (review_type IN ('renter', 'owner')),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (booking_id) REFERENCES bookings(id),
            FOREIGN KEY (reviewer_id) REFERENCES users(id),
            FOREIGN KEY (reviewed_user_id) REFERENCES users(id)
        )
    """)
    print("✅ Created booking_reviews table")

def initialize_user_stats(cursor):
    """Initialize user_stats for existing users"""
    # Get all existing users
    cursor.execute("SELECT id FROM users")
    users = cursor.fetchall()
    
    for user in users:
        user_id = user[0]
        
        # Count existing items for this user
        cursor.execute("SELECT COUNT(*) FROM items WHERE user_id = ?", (user_id,))
        items_count = cursor.fetchone()[0]
        
        # Insert initial stats
        cursor.execute("""
            INSERT OR IGNORE INTO user_stats (
                user_id, total_bookings, items_listed, updated_at
            ) VALUES (?, 0, ?, CURRENT_TIMESTAMP)
        """, (user_id, items_count))
    
    print(f"✅ Initialized user_stats for {len(users)} users")

def create_indexes(cursor):
    """Create database indexes for better performance"""
    indexes = [
        "CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id)",
        "CREATE INDEX IF NOT EXISTS idx_bookings_item_id ON bookings(item_id)",
        "CREATE INDEX IF NOT EXISTS idx_bookings_owner_id ON bookings(owner_id)",
        "CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status)",
        "CREATE INDEX IF NOT EXISTS idx_bookings_dates ON bookings(start_date, end_date)",
        "CREATE INDEX IF NOT EXISTS idx_user_stats_user_id ON user_stats(user_id)",
        "CREATE INDEX IF NOT EXISTS idx_booking_reviews_booking_id ON booking_reviews(booking_id)",
    ]
    
    for index_sql in indexes:
        cursor.execute(index_sql)
    
    print("✅ Created database indexes")

def main():
    """Run the database migration"""
    print("=== RentClo Database Migration ===")
    print("Adding bookings and user statistics tables...")
    print()
    
    db_path = "backend/rentclo.db"
    
    try:
        # Connect to database
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        print(f"Connected to database: {db_path}")
        print()
        
        # Run migrations
        create_bookings_table(cursor)
        create_user_stats_table(cursor)
        create_booking_reviews_table(cursor)
        create_indexes(cursor)
        initialize_user_stats(cursor)
        
        # Commit changes
        conn.commit()
        
        print()
        print("=== Migration Summary ===")
        
        # Show table counts
        tables = ['bookings', 'user_stats', 'booking_reviews']
        for table in tables:
            cursor.execute(f"SELECT COUNT(*) FROM {table}")
            count = cursor.fetchone()[0]
            print(f"  {table}: {count} rows")
        
        print()
        print("✅ Database migration completed successfully!")
        print()
        print("New features available:")
        print("  - Booking system with full tracking")
        print("  - User statistics with real data")
        print("  - Review and rating system")
        print("  - Performance optimized with indexes")
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        if 'conn' in locals():
            conn.rollback()
        sys.exit(1)
    
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    main()