import sqlite3
import os
import hashlib
from datetime import datetime

def get_db_connection():
    db_path = os.path.join(os.path.dirname(__file__), 'rentclo.db')
    try:
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        return conn
    except sqlite3.Error as e:
        print(f"Database connection error: {e}")
        raise

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password: str, password_hash: str) -> bool:
    """Verify a password against its hash"""
    return hash_password(password) == password_hash

def get_user_by_username(username: str) -> dict:
    """Get user by username"""
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
        user = cursor.fetchone()
        if user:
            return dict(user)
        return None
    except Exception as e:
        print(f"Error getting user by username: {e}")
        return None
    finally:
        if conn:
            conn.close()

def get_user_by_email(email: str) -> dict:
    """Get user by email"""
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
        user = cursor.fetchone()
        if user:
            return dict(user)
        return None
    except Exception as e:
        print(f"Error getting user by email: {e}")
        return None
    finally:
        if conn:
            conn.close()

def create_user(username: str, email: str, password: str, phone: str, 
                user_type: str, first_name: str, last_name: str) -> dict:
    """Create a new user"""
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        password_hash = hash_password(password)
        
        cursor.execute('''
            INSERT INTO users (username, email, password_hash, phone, 
                             user_type, first_name, last_name)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (username, email, password_hash, phone, user_type, first_name, last_name))
        
        user_id = cursor.lastrowid
        conn.commit()
        
        # Return the created user
        cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        user = cursor.fetchone()
        return dict(user) if user else None
        
    except Exception as e:
        print(f"Error creating user: {e}")
        if conn:
            conn.rollback()
        return None
    finally:
        if conn:
            conn.close()

def create_session(user_id: int, session_token: str, expires_at) -> bool:
    """Create a new login session"""
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO login_sessions (user_id, session_token, expires_at)
            VALUES (?, ?, ?)
        ''', (user_id, session_token, expires_at))
        
        conn.commit()
        return True
        
    except Exception as e:
        print(f"Error creating session: {e}")
        if conn:
            conn.rollback()
        return False
    finally:
        if conn:
            conn.close()

def get_session(session_token: str) -> dict:
    """Get session by token"""
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT s.*, u.username, u.email 
            FROM login_sessions s 
            JOIN users u ON s.user_id = u.id 
            WHERE s.session_token = ? AND s.expires_at > datetime('now')
        ''', (session_token,))
        session = cursor.fetchone()
        if session:
            return dict(session)
        return None
    except Exception as e:
        print(f"Error getting session: {e}")
        return None
    finally:
        if conn:
            conn.close()

def delete_session(session_token: str) -> bool:
    """Delete a session (logout)"""
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM login_sessions WHERE session_token = ?", (session_token,))
        conn.commit()
        return cursor.rowcount > 0
    except Exception as e:
        print(f"Error deleting session: {e}")
        if conn:
            conn.rollback()
        return False
    finally:
        if conn:
            conn.close()

def init_database():
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Create tables with the correct schema
        cursor.executescript('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL UNIQUE,
                email TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                phone TEXT,
                user_type TEXT CHECK(user_type IN ('tenant', 'lessor', 'both')) NOT NULL,
                first_name TEXT NOT NULL,
                last_name TEXT NOT NULL,
                is_verified BOOLEAN DEFAULT 0,
                is_active BOOLEAN DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS login_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                session_token TEXT NOT NULL UNIQUE,
                expires_at TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            );

            CREATE TABLE IF NOT EXISTS user_addresses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                address_line1 TEXT NOT NULL,
                address_line2 TEXT,
                city TEXT NOT NULL,
                state TEXT NOT NULL,
                zip_code TEXT NOT NULL,
                country TEXT NOT NULL DEFAULT 'USA',
                is_primary BOOLEAN DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            );
        ''')

        # Check if users table is empty
        cursor.execute("SELECT COUNT(*) FROM users")
        if cursor.fetchone()[0] == 0:
            print("Inserting sample users...")
            # Insert sample users
            sample_users = [
                ('john@example.com', 'john@example.com', hash_password('password123'), 
                 '+1234567890', 'tenant', 'John', 'Doe'),
                ('jane@example.com', 'jane@example.com', hash_password('password123'), 
                 '+0987654321', 'lessor', 'Jane', 'Smith'),
                ('mike@rentclo.com', 'mike@rentclo.com', hash_password('admin123'), 
                 '+1111111111', 'both', 'Mike', 'Admin')
            ]
            
            # Insert users
            for user in sample_users:
                cursor.execute('''
                    INSERT INTO users (username, email, password_hash, phone, 
                                     user_type, first_name, last_name)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                ''', user)
                
                # Get the user_id of the inserted user
                user_id = cursor.lastrowid
                
                # Insert a default address for each user
                cursor.execute('''
                    INSERT INTO user_addresses (user_id, address_line1, city, 
                                              state, zip_code)
                    VALUES (?, ?, ?, ?, ?)
                ''', (user_id, '123 Main St', 'Anytown', 'CA', '12345'))
            
            print(f"Inserted {len(sample_users)} sample users with addresses")
        
        conn.commit()
        print("Database initialized successfully!")
        
    except Exception as e:
        print(f"Database initialization failed: {e}")
        if conn:
            conn.rollback()
        raise
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    init_database()
