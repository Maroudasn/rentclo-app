import sqlite3
import os
from datetime import datetime

def check_database_status():
    """Check the current database status and structure"""
    
    db_path = 'rentclo.db'
    
    if not os.path.exists(db_path):
        print("❌ Database file 'rentclo.db' does not exist")
        print("Run 'python database_recreate.py' to create a new database")
        return
    
    try:
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        print(f"✅ Database file exists: {db_path}")
        print(f"📅 Last modified: {datetime.fromtimestamp(os.path.getmtime(db_path))}")
        
        # Check foreign key support
        cursor.execute("PRAGMA foreign_keys")
        fk_enabled = cursor.fetchone()[0]
        print(f"🔗 Foreign keys: {'✅ ENABLED' if fk_enabled else '❌ DISABLED'}")
        
        # List all tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = cursor.fetchall()
        print(f"\n📋 Tables ({len(tables)}):")
        for table in tables:
            print(f"  - {table['name']}")
        
        # Check each table structure and data
        for table in tables:
            table_name = table['name']
            
            # Get table info
            cursor.execute(f"PRAGMA table_info({table_name})")
            columns = cursor.fetchall()
            
            # Get row count
            cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
            row_count = cursor.fetchone()[0]
            
            print(f"\n📊 {table_name.upper()} ({row_count} rows, {len(columns)} columns):")
            for col in columns:
                print(f"  - {col['name']}: {col['type']} {'(PK)' if col['pk'] else ''} {'NOT NULL' if col['notnull'] else ''}")
        
        # Show sample data
        print("\n🔍 SAMPLE DATA:")
        
        # Users
        cursor.execute("SELECT username, email, user_type FROM users LIMIT 3")
        users = cursor.fetchall()
        if users:
            print("Users:")
            for user in users:
                print(f"  - {user['username']} ({user['email']}) - {user['user_type']}")
        
        # Addresses
        cursor.execute("SELECT user_id, address_line1, city, state FROM user_addresses LIMIT 3")
        addresses = cursor.fetchall()
        if addresses:
            print("Addresses:")
            for addr in addresses:
                print(f"  - User {addr['user_id']}: {addr['address_line1']}, {addr['city']}, {addr['state']}")
        
        # Check foreign key integrity
        cursor.execute("PRAGMA foreign_key_check")
        fk_violations = cursor.fetchall()
        
        if fk_violations:
            print("\n❌ FOREIGN KEY VIOLATIONS:")
            for violation in fk_violations:
                print(f"  - {violation}")
        else:
            print("\n✅ No foreign key violations found")
        
    except Exception as e:
        print(f"❌ Error checking database: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    print("=== RENTCLO Database Status Check ===")
    check_database_status()
