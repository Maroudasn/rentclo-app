import sqlite3
import hashlib
import os

# Get the directory where this file is located
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, 'rentclo.db')

def get_db_connection():
    """Get a database connection with foreign key support"""
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON")
        return conn
    except sqlite3.Error as e:
        print(f"Database connection error: {e}")
        raise

def init_database():
    """Initialize database - simple verification"""
    try:
        if not os.path.exists(DB_PATH):
            raise Exception(f"Database file does not exist at {DB_PATH}. Please run database_recreate.py first")
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Verify essential tables exist
        tables = ['users', 'user_addresses', 'login_sessions']
        for table in tables:
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name=?", (table,))
            if not cursor.fetchone():
                raise Exception(f"Table {table} does not exist")
        
        print("Database verification passed")
        conn.close()
        
    except Exception as e:
        print(f"Database error: {e}")
        raise

def hash_password(password: str) -> str:
    """Hash password using SHA-256"""
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash"""
    return hash_password(plain_password) == hashed_password

def test_connection():
    """Test database connection"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM users")
        count = cursor.fetchone()[0]
        conn.close()
        return f"Database OK - {count} users found"
    except Exception as e:
        return f"Database error: {e}"
