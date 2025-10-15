from fastapi import FastAPI, HTTPException, status, Depends, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, EmailStr, validator
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
import database
import uuid
import re
import os
import time

app = FastAPI(title="RENTCLO API", version="1.0.0")

# OAuth2 scheme for authentication
oauth2_scheme = HTTPBearer()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001", "http://127.0.0.1:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure uploads directory exists
os.makedirs('uploads/items', exist_ok=True)

# Serve uploaded images
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Initialize database (verifies schema/file presence)
database.init_database()

# Utility functions for user stats
def update_user_stats(user_id, stat_type, value=1, conn=None):
    """Update user statistics in database"""
    should_close = False
    if conn is None:
        conn = database.get_db_connection()
        should_close = True
    
    try:
        cursor = conn.cursor()
        
        if stat_type == "items_listed":
            cursor.execute("""
                UPDATE user_stats 
                SET items_listed = items_listed + ?, updated_at = CURRENT_TIMESTAMP
                WHERE user_id = ?
            """, (value, user_id))
        elif stat_type == "total_bookings":
            cursor.execute("""
                UPDATE user_stats 
                SET total_bookings = total_bookings + ?, updated_at = CURRENT_TIMESTAMP
                WHERE user_id = ?
            """, (value, user_id))
        elif stat_type == "total_spent":
            cursor.execute("""
                UPDATE user_stats 
                SET total_spent = total_spent + ?, updated_at = CURRENT_TIMESTAMP
                WHERE user_id = ?
            """, (value, user_id))
        elif stat_type == "total_earned":
            cursor.execute("""
                UPDATE user_stats 
                SET total_earned = total_earned + ?, updated_at = CURRENT_TIMESTAMP
                WHERE user_id = ?
            """, (value, user_id))
        
        if should_close:
            conn.commit()
    finally:
        if should_close and conn:
            conn.close()

def refresh_user_stats(user_id):
    """Recalculate all user statistics from scratch"""
    conn = database.get_db_connection()
    try:
        cursor = conn.cursor()
        
        # Count items
        cursor.execute("SELECT COUNT(*) FROM items WHERE user_id = ?", (user_id,))
        items_count = cursor.fetchone()[0]
        
        # Count bookings
        cursor.execute("SELECT COUNT(*) FROM bookings WHERE user_id = ?", (user_id,))
        bookings_count = cursor.fetchone()[0]
        
        # Calculate total spent
        cursor.execute("""
            SELECT COALESCE(SUM(total_amount), 0) 
            FROM bookings 
            WHERE user_id = ? AND status = 'completed'
        """, (user_id,))
        total_spent = cursor.fetchone()[0]
        
        # Calculate total earned (as item owner)
        cursor.execute("""
            SELECT COALESCE(SUM(total_amount), 0) 
            FROM bookings 
            WHERE owner_id = ? AND status = 'completed'
        """, (user_id,))
        total_earned = cursor.fetchone()[0]
        
        # Update stats
        cursor.execute("""
            UPDATE user_stats 
            SET items_listed = ?, total_bookings = ?, total_spent = ?, 
                total_earned = ?, updated_at = CURRENT_TIMESTAMP
            WHERE user_id = ?
        """, (items_count, bookings_count, total_spent, total_earned, user_id))
        
        conn.commit()
    finally:
        conn.close()

# Pydantic models
class LoginRequest(BaseModel):
    username: str
    password: str

class AddressCreate(BaseModel):
    address_line1: str
    address_line2: Optional[str] = None
    city: str
    state: str
    zip_code: str
    country: str = "USA"

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    confirm_password: str
    user_type: str
    first_name: str
    last_name: str
    phone: str
    address: AddressCreate

    @validator('user_type')
    def validate_user_type(cls, v):
        if v not in ['tenant', 'lessor', 'both']:
            raise ValueError('User type must be tenant, lessor, or both')
        return v

    @validator('username')
    def validate_username(cls, v):
        if len(v) < 3:
            raise ValueError('Username must be at least 3 characters long')
        if not re.match(r'^[a-zA-Z0-9_]+$', v):
            raise ValueError('Username can only contain letters, numbers, and underscores')
        return v

    @validator('password')
    def validate_password(cls, v):
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters long')
        return v

    @validator('confirm_password')
    def validate_confirm_password(cls, v, values):
        if 'password' in values and v != values['password']:
            raise ValueError('Passwords do not match')
        return v

    @validator('phone')
    def validate_phone(cls, v):
        # Basic phone validation
        if not re.match(r'^\+?[0-9\s\-\(\)]{10,}$', v):
            raise ValueError('Invalid phone number format')
        return v

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    phone: str
    user_type: str
    first_name: str
    last_name: str
    is_verified: bool
    created_at: datetime

# Simplified registration model without address for now
class SimpleUserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    confirm_password: str
    user_type: str
    first_name: str
    last_name: str
    phone: str

    @validator('user_type')
    def validate_user_type(cls, v):
        if v not in ['tenant', 'lessor', 'both']:
            raise ValueError('User type must be tenant, lessor, or both')
        return v

    @validator('confirm_password')
    def validate_confirm_password(cls, v, values):
        if 'password' in values and v != values['password']:
            raise ValueError('Passwords do not match')
        return v

class LoginResponse(BaseModel):
    message: str
    session_token: str
    user: UserResponse

# Profile update models
class ProfileUpdate(BaseModel):
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    address: Optional[Dict[str, Any]] = None

class PasswordChange(BaseModel):
    current_password: str
    new_password: str

# Booking models
class BookingRequest(BaseModel):
    item_id: int
    start_date: str  # YYYY-MM-DD format
    end_date: str    # YYYY-MM-DD format
    notes: Optional[str] = None

class BookingResponse(BaseModel):
    id: int
    item_id: int
    item_title: str
    owner_name: str
    start_date: str
    end_date: str
    total_days: int
    price_per_day: float
    total_amount: float
    status: str
    payment_status: str
    created_at: str
    notes: Optional[str]

# Search request model
class SearchRequest(BaseModel):
    query: Optional[str] = None
    category: Optional[str] = None
    gender: Optional[str] = None
    occasion: Optional[str] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    distance: Optional[str] = None  # Add this line
    page: int = 1
    limit: int = 20

# Search response model
class ItemResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    price_per_day: float
    category: str
    gender: str
    occasion: Optional[str]
    size: Optional[str]
    condition: str
    brand: Optional[str]
    color: Optional[str]
    location_area: Optional[str]
    image_url: str
    owner_name: str

# Add Item Request Model
class AddItemRequest(BaseModel):
    title: str
    description: Optional[str] = None
    price_per_day: float
    category: str
    gender: str
    occasion: str
    size: str
    condition: str
    brand: Optional[str] = None
    color: Optional[str] = None
    location_area: str
    availability_start: str
    availability_end: str

# Item Detail Response Model
class ItemDetailResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    price_per_day: float
    category: str
    gender: str
    occasion: Optional[str]
    size: Optional[str]
    condition: str
    brand: Optional[str]
    color: Optional[str]
    location_area: Optional[str]
    images: List[str]
    user_id: int
    owner_name: str
    owner_joined: str
    owner_rating: Optional[float]
    material: Optional[str]
    care_instructions: Optional[str]
    measurements: Optional[str]
    tags: Optional[List[str]]
    is_favorited: bool
    availability_start: str
    availability_end: str

# Helper function for authentication
def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(oauth2_scheme)):
    """Get current user from token"""
    try:
        token = credentials.credentials
        print(f"🔑 Received token: {token[:20]}...")
        
        conn = database.get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT u.id, u.username, u.email, u.user_type, u.first_name, u.last_name
            FROM users u 
            JOIN login_sessions ls ON u.id = ls.user_id 
            WHERE ls.session_token = ? AND ls.expires_at > datetime('now') AND ls.is_active = 1
        """, (token,))
        
        user = cursor.fetchone()
        conn.close()
        
        if not user:
            print(f"❌ No user found for token")
            raise HTTPException(status_code=401, detail="Invalid or expired token")
        
        print(f"✅ User authenticated: {dict(user)}")
        return dict(user)
        
    except Exception as e:
        print(f"❌ Authentication error: {e}")
        raise HTTPException(status_code=401, detail="Invalid authentication")

# Optional authentication helper for public endpoints
def get_current_user_optional(credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False))):
    """Get current user from token - returns None if not authenticated"""
    if not credentials:
        return None
    
    try:
        token = credentials.credentials
        conn = database.get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT u.id, u.username, u.email, u.user_type, u.first_name, u.last_name
            FROM users u 
            JOIN login_sessions ls ON u.id = ls.user_id 
            WHERE ls.session_token = ? AND ls.expires_at > datetime('now') AND ls.is_active = 1
        """, (token,))
        
        user = cursor.fetchone()
        conn.close()
        
        if user:
            return dict(user)
        return None
        
    except Exception:
        return None

@app.get("/")
async def root():
    return {"message": "RENTCLO API Server - Database Connected"}

@app.post("/register-debug")
async def register_debug(user_data: dict):
    """Debug endpoint to see what data is being sent"""
    print("📨 Received registration data:")
    print(f"Raw data: {user_data}")
    
    # Check each field
    required_fields = ['username', 'email', 'password', 'confirm_password', 'user_type', 'first_name', 'last_name', 'phone']
    
    for field in required_fields:
        if field in user_data:
            print(f"✅ {field}: {user_data[field]}")
        else:
            print(f"❌ {field}: MISSING")
    
    # Check address structure
    if 'address' in user_data:
        print("📍 Address data:", user_data['address'])
    else:
        print("❌ Address: MISSING")
    
    return {"message": "Debug data received", "received_data": user_data}

# REPLACED login endpoint to use a single query string then execute
@app.post("/login", response_model=LoginResponse)
async def login(login_data: LoginRequest):
    conn = None
    try:
        conn = database.get_db_connection()
        cursor = conn.cursor()
        
        # Check if username is email or phone
        query = ""
        if '@' in login_data.username:
            query = "SELECT * FROM users WHERE email = ? AND is_active = 1"
        elif any(char.isdigit() for char in login_data.username):
            query = "SELECT * FROM users WHERE phone = ? AND is_active = 1"
        else:
            query = "SELECT * FROM users WHERE username = ? AND is_active = 1"
        
        cursor.execute(query, (login_data.username,))
        user = cursor.fetchone()
        
        if user is None:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # Verify password
        if not database.verify_password(login_data.password, user['password_hash']):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # Create session token
        session_token = str(uuid.uuid4())
        expires_at = datetime.now() + timedelta(days=7)
        
        cursor.execute(
            "INSERT INTO login_sessions (user_id, session_token, expires_at) VALUES (?, ?, ?)",
            (user['id'], session_token, expires_at)
        )
        
        conn.commit()
        
        return LoginResponse(
            message="Login successful",
            session_token=session_token,
            user=UserResponse(
                id=user['id'],
                username=user['username'],
                email=user['email'],
                phone=user['phone'],
                user_type=user['user_type'],
                first_name=user['first_name'],
                last_name=user['last_name'],
                is_verified=bool(user['is_verified']),
                created_at=user['created_at']
            )
        )
        
    except Exception as e:
        print(f"Login error: {e}")
        raise HTTPException(status_code=500, detail="Login failed")
    finally:
        if conn:
            conn.close()

# UPDATED register to avoid removed helpers and work with the new database.py
@app.post("/register")
async def register(user_data: SimpleUserCreate):
    conn = None
    try:
        print("📝 Registration attempt:")
        print(f"Username: {user_data.username}")
        print(f"Email: {user_data.email}")
        print(f"User Type: {user_data.user_type}")
        
        conn = database.get_db_connection()
        cursor = conn.cursor()
        
        # Check for existing user
        checks = [
            ("username", user_data.username),
            ("email", user_data.email),
            ("phone", user_data.phone)
        ]
        
        existing_fields = []
        for field, value in checks:
            cursor.execute(f"SELECT id FROM users WHERE {field} = ?", (value,))
            if cursor.fetchone():
                existing_fields.append(field)
        
        if existing_fields:
            error_msg = f"{', '.join(existing_fields)} already exist(s)"
            print(f"❌ Registration failed: {error_msg}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error_msg
            )
        
        # Insert new user (without address for now)
        hashed_password = database.hash_password(user_data.password)
        cursor.execute(
            """INSERT INTO users (username, email, password_hash, user_type, 
               first_name, last_name, phone) 
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (user_data.username, user_data.email, hashed_password,
             user_data.user_type, user_data.first_name, user_data.last_name, user_data.phone)
        )
        
        user_id = cursor.lastrowid
        
        # Create simple address entry
        cursor.execute(
            """INSERT INTO user_addresses (user_id, address_line1, city, state, zip_code, country) 
               VALUES (?, ?, ?, ?, ?, ?)""",
            (user_id, "Address not provided", "City not provided", "State not provided", "00000", "USA")
        )
        
        conn.commit()
        
        print(f"✅ User created successfully: {user_data.username} (ID: {user_id})")
        
        return {
            "message": "User created successfully",
            "user_id": user_id,
            "username": user_data.username
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"💥 Registration error: {str(e)}")
        if conn:
            conn.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating user: {str(e)}"
        )
    finally:
        if conn:
            conn.close()

@app.get("/users", response_model=List[UserResponse])
async def get_users():
    conn = database.get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, username, email, phone, user_type, first_name, last_name, 
               is_verified, created_at 
        FROM users 
        WHERE is_active = TRUE
    """)
    users = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return users

@app.get("/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: int):
    conn = database.get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, username, email, phone, user_type, first_name, last_name, 
               is_verified, created_at 
        FROM users 
        WHERE id = ? AND is_active = TRUE
    """, (user_id,))
    
    user = cursor.fetchone()
    conn.close()
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return dict(user)

@app.get("/users/{user_id}/address")
async def get_user_address(user_id: int):
    conn = database.get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT address_line1, address_line2, city, state, zip_code, country 
        FROM user_addresses 
        WHERE user_id = ? AND is_primary = TRUE
    """, (user_id,))
    
    address = cursor.fetchone()
    conn.close()
    
    if address is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Address not found"
        )
    
    return dict(address)

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now()}

# REPLACED /test-db endpoint
@app.get("/test-db")
async def test_db_connection():
    """Test database connection and return status"""
    try:
        conn = database.get_db_connection()
        cursor = conn.cursor()
        
        # Test users table
        cursor.execute("SELECT COUNT(*) as count FROM users")
        user_count = cursor.fetchone()['count']
        
        # Test addresses table
        cursor.execute("SELECT COUNT(*) as count FROM user_addresses")
        address_count = cursor.fetchone()['count']
        
        # Test foreign keys
        cursor.execute("PRAGMA foreign_key_check")
        fk_issues = cursor.fetchall()
        
        conn.close()
        
        return {
            "status": "success",
            "users_count": user_count,
            "addresses_count": address_count,
            "foreign_key_issues": len(fk_issues) == 0,
            "message": "Database connection successful"
        }
        
    except Exception as e:
        return {
            "status": "error",
            "message": f"Database connection failed: {str(e)}"
        }

# REPLACED /db-stats endpoint to loop tables only
@app.get("/db-stats")
async def get_db_stats():
    """Get database statistics"""
    try:
        conn = database.get_db_connection()
        cursor = conn.cursor()
        
        # Get all data
        results = []
        tables = ['users', 'user_addresses', 'login_sessions']
        
        for table in tables:
            cursor.execute(f"SELECT COUNT(*) as count FROM {table}")
            count = cursor.fetchone()['count']
            results.append({"table": table, "count": count})
        
        conn.close()
        
        return {
            "status": "success",
            "stats": results,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        return {
            "status": "error",
            "message": f"Failed to get stats: {str(e)}"
        }

# UPDATED /stats to not depend on removed helpers (keeps frontend working)
@app.get("/stats")
async def get_stats():
    try:
        conn = database.get_db_connection()
        cursor = conn.cursor()

        # Users by type
        cursor.execute("SELECT user_type, COUNT(*) as count FROM users GROUP BY user_type")
        rows = cursor.fetchall()
        user_stats = {row['user_type']: row['count'] for row in rows}

        # Sessions
        cursor.execute("SELECT COUNT(*) as count FROM login_sessions")
        total_sessions = cursor.fetchone()['count']
        cursor.execute("SELECT COUNT(*) as count FROM login_sessions WHERE expires_at > datetime('now') AND is_active = 1")
        active_sessions = cursor.fetchone()['count']

        conn.close()
        return {
            "users_by_type": user_stats,
            "total_sessions": total_sessions,
            "active_sessions": active_sessions,
            "timestamp": datetime.now()
        }
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error fetching stats: {str(e)}")

# Get user profile endpoint
@app.get("/profile")
async def get_user_profile(current_user: dict = Depends(get_current_user)):
    """Get current user's profile"""
    try:
        conn = database.get_db_connection()
        cursor = conn.cursor()
        
        # Get user data
        cursor.execute("""
            SELECT id, username, email, phone, user_type, first_name, last_name, 
                   is_verified, created_at 
            FROM users 
            WHERE id = ? AND is_active = 1
        """, (current_user['id'],))
        
        user = cursor.fetchone()
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Get user address
        cursor.execute("""
            SELECT address_line1, address_line2, city, state, zip_code, country 
            FROM user_addresses 
            WHERE user_id = ? AND is_primary = 1
        """, (current_user['id'],))
        
        address = cursor.fetchone()
        
        conn.close()
        
        profile_data = {
            "id": user['id'],
            "username": user['username'],
            "email": user['email'],
            "phone": user['phone'],
            "user_type": user['user_type'],
            "first_name": user['first_name'],
            "last_name": user['last_name'],
            "is_verified": bool(user['is_verified']),
            "member_since": user['created_at'],
            "address": {
                "address_line1": address['address_line1'] if address else "",
                "address_line2": address['address_line2'] if address else "",
                "city": address['city'] if address else "",
                "state": address['state'] if address else "",
                "zip_code": address['zip_code'] if address else "",
                "country": address['country'] if address else "USA"
            } if address else {
                "address_line1": "",
                "address_line2": "",
                "city": "",
                "state": "",
                "zip_code": "",
                "country": "USA"
            }
        }
        
        return profile_data
        
    except Exception as e:
        print(f"Error getting profile: {e}")
        raise HTTPException(status_code=500, detail="Failed to get profile")

# Update user profile endpoint
@app.put("/profile")
async def update_user_profile(profile_data: ProfileUpdate, current_user: dict = Depends(get_current_user)):
    """Update user profile"""
    conn = None
    try:
        conn = database.get_db_connection()
        cursor = conn.cursor()
        
        # Build update query dynamically based on provided fields
        update_fields = []
        update_values = []
        
        if profile_data.email is not None:
            # Check if email is already taken by another user
            cursor.execute("SELECT id FROM users WHERE email = ? AND id != ?", 
                         (profile_data.email, current_user['id']))
            if cursor.fetchone():
                raise HTTPException(status_code=400, detail="Email already taken")
            update_fields.append("email = ?")
            update_values.append(profile_data.email)
        
        if profile_data.phone is not None:
            # Check if phone is already taken by another user
            cursor.execute("SELECT id FROM users WHERE phone = ? AND id != ?", 
                         (profile_data.phone, current_user['id']))
            if cursor.fetchone():
                raise HTTPException(status_code=400, detail="Phone number already taken")
            update_fields.append("phone = ?")
            update_values.append(profile_data.phone)
        
        if profile_data.first_name is not None:
            update_fields.append("first_name = ?")
            update_values.append(profile_data.first_name)
        
        if profile_data.last_name is not None:
            update_fields.append("last_name = ?")
            update_values.append(profile_data.last_name)
        
        # Only update if there are fields to update
        if update_fields:
            update_values.append(current_user['id'])
            update_query = f"UPDATE users SET {', '.join(update_fields)} WHERE id = ?"
            cursor.execute(update_query, update_values)
        
        # Update address if provided
        if profile_data.address:
            address = profile_data.address
            
            # Check if user already has an address
            cursor.execute("SELECT id FROM user_addresses WHERE user_id = ? AND is_primary = 1", (current_user['id'],))
            existing_address = cursor.fetchone()
            
            if existing_address:
                # Update existing address
                cursor.execute("""
                    UPDATE user_addresses 
                    SET address_line1 = ?, address_line2 = ?, city = ?, state = ?, 
                        zip_code = ?, country = ?
                    WHERE user_id = ? AND is_primary = 1
                """, (
                    address.get('address_line1', ''),
                    address.get('address_line2', ''),
                    address.get('city', ''),
                    address.get('state', ''),
                    address.get('zip_code', ''),
                    address.get('country', 'USA'),
                    current_user['id']
                ))
            else:
                # Insert new address
                cursor.execute("""
                    INSERT INTO user_addresses 
                    (user_id, address_line1, address_line2, city, state, zip_code, country, is_primary)
                    VALUES (?, ?, ?, ?, ?, ?, ?, 1)
                """, (
                    current_user['id'],
                    address.get('address_line1', ''),
                    address.get('address_line2', ''),
                    address.get('city', ''),
                    address.get('state', ''),
                    address.get('zip_code', ''),
                    address.get('country', 'USA')
                ))
        
        conn.commit()
        
        return {"message": "Profile updated successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"Error updating profile: {e}")
        raise HTTPException(status_code=500, detail="Failed to update profile")
    finally:
        if conn:
            conn.close()

# Change password endpoint
@app.post("/change-password")
async def change_password(password_data: PasswordChange, current_user: dict = Depends(get_current_user)):
    """Change user password"""
    conn = None
    try:
        conn = database.get_db_connection()
        cursor = conn.cursor()
        
        # Get current user with password hash
        cursor.execute("SELECT password_hash FROM users WHERE id = ?", (current_user['id'],))
        user = cursor.fetchone()
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Verify current password
        if not database.verify_password(password_data.current_password, user['password_hash']):
            raise HTTPException(status_code=400, detail="Current password is incorrect")
        
        # Update to new password
        new_password_hash = database.hash_password(password_data.new_password)
        cursor.execute("UPDATE users SET password_hash = ? WHERE id = ?", 
                      (new_password_hash, current_user['id']))
        
        conn.commit()
        
        return {"message": "Password changed successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"Error changing password: {e}")
        raise HTTPException(status_code=500, detail="Failed to change password")
    finally:
        if conn:
            conn.close()

# Get user stats endpoint
@app.get("/user-stats")
async def get_user_stats(current_user: dict = Depends(get_current_user)):
    """Get user statistics from database"""
    conn = None
    try:
        conn = database.get_db_connection()
        cursor = conn.cursor()
        
        # Get user creation date for member since
        cursor.execute("SELECT created_at FROM users WHERE id = ?", (current_user['id'],))
        user_data = cursor.fetchone()
        
        # Get user stats from user_stats table
        cursor.execute("""
            SELECT total_bookings, items_listed, total_spent, total_earned, 
                   avg_rating, total_reviews
            FROM user_stats 
            WHERE user_id = ?
        """, (current_user['id'],))
        
        stats_data = cursor.fetchone()
        
        if stats_data:
            total_bookings = stats_data[0]
            items_listed = stats_data[1]
            total_spent = float(stats_data[2]) if stats_data[2] else 0.0
            total_earned = float(stats_data[3]) if stats_data[3] else 0.0
            avg_rating = float(stats_data[4]) if stats_data[4] else 0.0
            total_reviews = stats_data[5]
        else:
            # Initialize stats if not found (shouldn't happen after migration)
            cursor.execute("SELECT COUNT(*) FROM items WHERE user_id = ?", (current_user['id'],))
            items_count = cursor.fetchone()[0]
            
            cursor.execute("""
                INSERT INTO user_stats (user_id, total_bookings, items_listed)
                VALUES (?, 0, ?)
            """, (current_user['id'], items_count))
            conn.commit()
            
            total_bookings = 0
            items_listed = items_count
            total_spent = 0.0
            total_earned = 0.0
            avg_rating = 0.0
            total_reviews = 0
        
        # Extract year from created_at for member since
        created_at = user_data['created_at']
        if created_at:
            member_since_year = created_at.split('-')[0] if isinstance(created_at, str) else str(created_at.year)
        else:
            member_since_year = "2025"
        
        stats = {
            "totalBookings": total_bookings,
            "itemsListed": items_listed,
            "memberSince": member_since_year,
            "totalSpent": total_spent,
            "totalEarned": total_earned,
            "avgRating": avg_rating,
            "totalReviews": total_reviews
        }
        
        return stats
        
    except Exception as e:
        print(f"Error getting user stats: {e}")
        raise HTTPException(status_code=500, detail="Failed to get user stats")
    finally:
        if conn:
            conn.close()

# Booking endpoints
@app.post("/bookings", response_model=BookingResponse)
async def create_booking(booking_data: BookingRequest, current_user: dict = Depends(get_current_user)):
    """Create a new booking"""
    conn = None
    try:
        conn = database.get_db_connection()
        cursor = conn.cursor()
        
        # Get item details
        cursor.execute("""
            SELECT id, user_id, title, price_per_day, is_available 
            FROM items WHERE id = ?
        """, (booking_data.item_id,))
        item = cursor.fetchone()
        
        if not item:
            raise HTTPException(status_code=404, detail="Item not found")
        
        if not item[4]:  # is_available
            raise HTTPException(status_code=400, detail="Item is not available")
        
        if item[1] == current_user['id']:
            raise HTTPException(status_code=400, detail="Cannot book your own item")
        
        # Calculate booking details
        from datetime import datetime
        start_date = datetime.strptime(booking_data.start_date, '%Y-%m-%d')
        end_date = datetime.strptime(booking_data.end_date, '%Y-%m-%d')
        total_days = (end_date - start_date).days + 1
        
        if total_days <= 0:
            raise HTTPException(status_code=400, detail="Invalid date range")
        
        price_per_day = float(item[3])
        total_amount = price_per_day * total_days
        
        # Create booking
        cursor.execute("""
            INSERT INTO bookings (
                user_id, item_id, owner_id, booking_date, start_date, end_date,
                total_days, price_per_day, total_amount, status, payment_status, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'pending', ?)
        """, (
            current_user['id'], booking_data.item_id, item[1],
            datetime.now().strftime('%Y-%m-%d'),
            booking_data.start_date, booking_data.end_date,
            total_days, price_per_day, total_amount, booking_data.notes
        ))
        
        booking_id = cursor.lastrowid
        
        # Update user stats for the renter
        update_user_stats(current_user['id'], "total_bookings", 1, conn)
        
        conn.commit()
        
        # Get owner name for response
        cursor.execute("SELECT first_name, last_name FROM users WHERE id = ?", (item[1],))
        owner = cursor.fetchone()
        owner_name = f"{owner[0]} {owner[1]}" if owner else "Unknown"
        
        return BookingResponse(
            id=booking_id,
            item_id=booking_data.item_id,
            item_title=item[2],
            owner_name=owner_name,
            start_date=booking_data.start_date,
            end_date=booking_data.end_date,
            total_days=total_days,
            price_per_day=price_per_day,
            total_amount=total_amount,
            status="pending",
            payment_status="pending",
            created_at=datetime.now().isoformat(),
            notes=booking_data.notes
        )
        
    except HTTPException:
        raise
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"Error creating booking: {e}")
        raise HTTPException(status_code=500, detail="Failed to create booking")
    finally:
        if conn:
            conn.close()

@app.get("/bookings")
async def get_user_bookings(current_user: dict = Depends(get_current_user)):
    """Get all bookings for the current user with automatic status updates"""
    conn = None
    try:
        conn = database.get_db_connection()
        cursor = conn.cursor()
        
        # First, update statuses based on dates
        from datetime import datetime, date
        today = date.today().isoformat()
        
        # Update completed bookings (end_date has passed and status is pending)
        cursor.execute("""
            UPDATE bookings 
            SET status = 'completed', payment_status = 'paid', updated_at = CURRENT_TIMESTAMP
            WHERE end_date < ? AND status = 'pending' AND user_id = ?
        """, (today, current_user['id']))
        
        conn.commit()
        
        # Get bookings where user is the renter
        cursor.execute("""
            SELECT b.id, b.item_id, i.title, u.first_name, u.last_name,
                   b.start_date, b.end_date, b.total_days, b.price_per_day,
                   b.total_amount, b.status, b.payment_status, b.created_at, b.notes
            FROM bookings b
            JOIN items i ON b.item_id = i.id
            JOIN users u ON b.owner_id = u.id
            WHERE b.user_id = ?
            ORDER BY b.created_at DESC
        """, (current_user['id'],))
        
        bookings = cursor.fetchall()
        
        return [
            BookingResponse(
                id=booking[0],
                item_id=booking[1],
                item_title=booking[2],
                owner_name=f"{booking[3]} {booking[4]}",
                start_date=booking[5],
                end_date=booking[6],
                total_days=booking[7],
                price_per_day=float(booking[8]),
                total_amount=float(booking[9]),
                status=booking[10],
                payment_status=booking[11],
                created_at=booking[12],
                notes=booking[13]
            )
            for booking in bookings
        ]
        
    except Exception as e:
        print(f"Error getting bookings: {e}")
        raise HTTPException(status_code=500, detail="Failed to get bookings")
    finally:
        if conn:
            conn.close()

@app.post("/bookings/{booking_id}/complete")
async def complete_booking(booking_id: int, current_user: dict = Depends(get_current_user)):
    """Mark a booking as completed (for item owners)"""
    conn = None
    try:
        conn = database.get_db_connection()
        cursor = conn.cursor()
        
        # Get booking details
        cursor.execute("""
            SELECT user_id, owner_id, total_amount, status 
            FROM bookings WHERE id = ?
        """, (booking_id,))
        booking = cursor.fetchone()
        
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
        
        if booking[1] != current_user['id']:  # owner_id
            raise HTTPException(status_code=403, detail="Not authorized to complete this booking")
        
        if booking[3] == 'completed':
            raise HTTPException(status_code=400, detail="Booking already completed")
        
        # Update booking status
        cursor.execute("""
            UPDATE bookings 
            SET status = 'completed', payment_status = 'paid', updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        """, (booking_id,))
        
        # Update user stats
        renter_id = booking[0]
        owner_id = booking[1]
        amount = float(booking[2])
        
        # Add to renter's total spent
        update_user_stats(renter_id, "total_spent", amount, conn)
        # Add to owner's total earned
        update_user_stats(owner_id, "total_earned", amount, conn)
        
        conn.commit()
        
        return {"message": "Booking completed successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"Error completing booking: {e}")
        raise HTTPException(status_code=500, detail="Failed to complete booking")
    finally:
        if conn:
            conn.close()

@app.post("/bookings/{booking_id}/cancel")
async def cancel_booking(booking_id: int, current_user: dict = Depends(get_current_user)):
    """Cancel a future booking (only allowed for future bookings)"""
    conn = None
    try:
        conn = database.get_db_connection()
        cursor = conn.cursor()
        
        # Get booking details and verify ownership
        cursor.execute("""
            SELECT user_id, status, start_date, end_date 
            FROM bookings 
            WHERE id = ?
        """, (booking_id,))
        
        booking = cursor.fetchone()
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
        
        user_id, status, start_date, end_date = booking
        
        # Verify user owns this booking
        if user_id != current_user['id']:
            raise HTTPException(status_code=403, detail="Not authorized to cancel this booking")
        
        # Check if booking is already cancelled or completed
        if status in ['cancelled', 'completed']:
            raise HTTPException(status_code=400, detail=f"Cannot cancel a {status} booking")
        
        # Check if booking is for future dates
        from datetime import date
        today = date.today().isoformat()
        if start_date <= today:
            raise HTTPException(status_code=400, detail="Cannot cancel a booking that has already started")
        
        # Cancel the booking
        cursor.execute("""
            UPDATE bookings 
            SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        """, (booking_id,))
        
        conn.commit()
        
        return {"message": "Booking cancelled successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"Error cancelling booking: {e}")
        raise HTTPException(status_code=500, detail="Failed to cancel booking")
    finally:
        if conn:
            conn.close()

@app.post("/search")
async def search_items(search_data: SearchRequest):
    """Search items with filters"""
    conn = None
    try:
        conn = database.get_db_connection()
        cursor = conn.cursor()
        
        # Base query with joins
        base_query = """
            SELECT 
                i.id,
                i.title,
                i.description,
                i.price_per_day,
                c.name as category,
                i.gender,
                i.occasion,
                i.size,
                i.condition,
                i.brand,
                i.color,
                i.location_area,
                ii.image_url,
                u.first_name || ' ' || u.last_name as owner_name
            FROM items i
            LEFT JOIN categories c ON i.category_id = c.id
            LEFT JOIN item_images ii ON i.id = ii.item_id AND ii.is_primary = 1
            LEFT JOIN users u ON i.user_id = u.id
            WHERE i.is_available = 1
        """
        
        # Build WHERE conditions dynamically
        conditions = []
        params = []
        
        # Text search
        if search_data.query:
            conditions.append("(i.title LIKE ? OR i.description LIKE ? OR i.brand LIKE ?)")
            search_term = f"%{search_data.query}%"
            params.extend([search_term, search_term, search_term])
        
        # Category filter
        if search_data.category:
            conditions.append("c.name = ?")
            params.append(search_data.category)
        
        # Gender filter
        if search_data.gender:
            conditions.append("i.gender = ?")
            params.append(search_data.gender)
        
        # Occasion filter
        if search_data.occasion:
            conditions.append("i.occasion = ?")
            params.append(search_data.occasion)
        
        # Price range filter
        if search_data.min_price is not None:
            conditions.append("i.price_per_day >= ?")
            params.append(search_data.min_price)
        
        if search_data.max_price is not None:
            conditions.append("i.price_per_day <= ?")
            params.append(search_data.max_price)
        
        # Distance filter - for demo purposes, we'll simulate distance-based filtering
        # In a real app, you'd use actual coordinates and calculate distances
        if search_data.distance:
            # This is a simplified simulation - in reality you'd use geolocation
            # We'll filter by location_area for now as a demo
            distance_locations = {
                '5': ['Downtown', 'City Center'],
                '10': ['Downtown', 'City Center', 'Uptown', 'Business District'],
                '20': ['Downtown', 'City Center', 'Uptown', 'Business District', 'Arts District', 'Shopping District'],
                '30': ['Downtown', 'City Center', 'Uptown', 'Business District', 'Arts District', 'Shopping District', 'Park Area'],
                '50': ['Downtown', 'City Center', 'Uptown', 'Business District', 'Arts District', 'Shopping District', 'Park Area', 'Beach Area', 'Sports Complex', 'North Area']
            }
            
            locations = distance_locations.get(search_data.distance, [])
            if locations:
                placeholders = ','.join(['?' for _ in locations])
                conditions.append(f"i.location_area IN ({placeholders})")
                params.extend(locations)
        
        # Combine conditions
        if conditions:
            base_query += " AND " + " AND ".join(conditions)
        
        # Add ordering and pagination
        base_query += " ORDER BY i.created_at DESC LIMIT ? OFFSET ?"
        params.extend([search_data.limit, (search_data.page - 1) * search_data.limit])
        
        print(f"🔍 Executing query: {base_query}")
        print(f"🔍 With params: {params}")
        
        # Execute query
        cursor.execute(base_query, params)
        items = cursor.fetchall()
        
        # Get total count for pagination
        count_query = """
            SELECT COUNT(*) 
            FROM items i
            LEFT JOIN categories c ON i.category_id = c.id
            WHERE i.is_available = 1
        """
        if conditions:
            count_query += " AND " + " AND ".join(conditions)
        
        cursor.execute(count_query, params[:-2])  # Remove limit and offset params
        total_count = cursor.fetchone()[0]
        
        conn.close()
        
        return {
            "items": [dict(item) for item in items],
            "total_count": total_count,
            "page": search_data.page,
            "limit": search_data.limit,
            "total_pages": (total_count + search_data.limit - 1) // search_data.limit
        }
        
    except Exception as e:
        print(f"Search error: {e}")
        raise HTTPException(status_code=500, detail="Search failed")
    finally:
        if conn:
            conn.close()

@app.get("/search/filters")
async def get_filter_options():
    """Get available filter options"""
    conn = None
    try:
        conn = database.get_db_connection()
        cursor = conn.cursor()
        
        # Debug: Check what's in the categories table
        cursor.execute("SELECT id, name FROM categories")
        all_categories = cursor.fetchall()
        print(f"📊 All categories in database: {[dict(cat) for cat in all_categories]}")
        
        # Get categories - ensure we get all categories from the categories table
        cursor.execute("SELECT DISTINCT name FROM categories ORDER BY name")
        categories = [row['name'] for row in cursor.fetchall()]
        print(f"📊 Categories found: {categories}")
        
        # If no categories found, add default ones
        if not categories:
            categories = ['Dresses', 'Tops', 'Bottoms', 'Outerwear', 'Accessories', 'Shoes', 'Formal Wear', 'Casual Wear']
            print("⚠️ No categories found in database, using defaults")
        
        # Get genders - ensure we have all three options
        cursor.execute("""
            SELECT DISTINCT gender FROM items 
            WHERE gender IS NOT NULL AND gender != '' 
            ORDER BY gender
        """)
        db_genders = [row['gender'] for row in cursor.fetchall()]
        
        # Ensure we have all expected genders, add missing ones
        expected_genders = ['men', 'women', 'unisex']
        genders = list(set(db_genders + expected_genders))
        genders.sort()
        print(f"🚻 Genders found: {genders}")
        
        # Get occasions
        cursor.execute("""
            SELECT DISTINCT occasion FROM items 
            WHERE occasion IS NOT NULL AND occasion != '' 
            ORDER BY occasion
        """)
        occasions = [row['occasion'] for row in cursor.fetchall()]
        print(f"🎉 Occasions found: {occasions}")
        
        # Get max price for the price range
        cursor.execute("SELECT MAX(price_per_day) FROM items WHERE is_available = 1")
        max_price_result = cursor.fetchone()
        max_price = float(max_price_result[0]) if max_price_result[0] else 100.0
        
        conn.close()
        
        return {
            "categories": categories,
            "genders": genders,
            "occasions": occasions,
            "price_range": {
                "min": 0,
                "max": max_price
            }
        }
        
    except Exception as e:
        print(f"Filter options error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get filter options")
    finally:
        if conn:
            conn.close()

@app.post("/items/add")
async def add_item(
    title: str = Form(...),
    description: str = Form(None),
    price_per_day: float = Form(...),
    category: str = Form(...),
    gender: str = Form(...),
    occasion: str = Form(...),
    size: str = Form(...),
    condition: str = Form(...),
    brand: str = Form(None),
    color: str = Form(None),
    location_area: str = Form(...),
    availability_start: str = Form(...),
    availability_end: str = Form(...),
    images: List[UploadFile] = File(...),
    current_user: dict = Depends(get_current_user_optional)
):
    """Add a new item for rent"""
    # Require authentication for adding items
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required to add items")
    
    # Debug logging
    print(f"📝 Add item request from user {current_user['id']}")
    print(f"Title: {title}")
    print(f"Category: {category}")
    print(f"Gender: {gender}")
    print(f"Occasion: {occasion}")
    print(f"Images count: {len(images)}")
    
    conn = None
    try:
        conn = database.get_db_connection()
        cursor = conn.cursor()
        
        # Get category ID
        cursor.execute("SELECT id FROM categories WHERE name = ?", (category,))
        category_result = cursor.fetchone()
        
        if not category_result:
            raise HTTPException(status_code=400, detail="Invalid category")
        
        category_id = category_result['id']
        
        # Insert the item
        cursor.execute('''
            INSERT INTO items (
                user_id, title, description, price_per_day, category_id,
                gender, occasion, size, condition, brand, color, location_area
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            current_user['id'], title, description, price_per_day, category_id,
            gender, occasion, size, condition, brand, color, location_area
        ))
        
        item_id = cursor.lastrowid
        
        # Save uploaded images
        saved_images = []
        
        # Ensure uploads directory exists
        uploads_dir = "uploads/items"
        os.makedirs(uploads_dir, exist_ok=True)
        
        for i, image in enumerate(images):
            if image.content_type and image.content_type.startswith('image/'):
                # Generate unique filename
                file_extension = os.path.splitext(image.filename)[1]
                unique_filename = f"{uuid.uuid4()}{file_extension}"
                file_path = f"{uploads_dir}/{unique_filename}"
                
                # Create full URL path for database
                image_url = f"http://localhost:8001/uploads/items/{unique_filename}"
                
                # Save file
                with open(file_path, "wb") as buffer:
                    content = await image.read()
                    buffer.write(content)
                
                print(f"📸 Saved image: {file_path} -> {image_url}")
                
                # Insert image record
                cursor.execute('''
                    INSERT INTO item_images (item_id, image_url, is_primary)
                    VALUES (?, ?, ?)
                ''', (item_id, image_url, i == 0))
                
                saved_images.append(file_path)
        
        # Insert availability period
        cursor.execute('''
            INSERT INTO item_availability (item_id, start_date, end_date)
            VALUES (?, ?, ?)
        ''', (item_id, availability_start, availability_end))
        
        conn.commit()
        
        return {
            "message": "Item added successfully",
            "item_id": item_id,
            "images_saved": len(saved_images)
        }
        
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"Error adding item: {e}")
        raise HTTPException(status_code=500, detail="Failed to add item")
    finally:
        if conn:
            conn.close()

@app.get("/items/categories")
async def get_categories():
    """Get all available categories"""
    try:
        conn = database.get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT id, name, description FROM categories ORDER BY name")
        categories = [dict(row) for row in cursor.fetchall()]
        
        conn.close()
        return categories
        
    except Exception as e:
        print(f"Error getting categories: {e}")
        raise HTTPException(status_code=500, detail="Failed to get categories")

@app.get("/items/sizes/{category}")
async def get_sizes_by_category(category: str):
    """Get available sizes for a category"""
    try:
        conn = database.get_db_connection()
        cursor = conn.cursor()
        
        # Map category names to size categories
        size_category_map = {
            'Dresses': 'clothing',
            'Tops': 'clothing',
            'Bottoms': 'clothing',
            'Outerwear': 'clothing',
            'Formal Wear': 'clothing',
            'Casual Wear': 'clothing',
            'Shoes': 'shoes',
            'Accessories': 'accessories'
        }
        
        size_category = size_category_map.get(category, 'clothing')
        
        cursor.execute('''
            SELECT size_value, display_name 
            FROM sizes 
            WHERE category = ? 
            ORDER BY 
                CASE 
                    WHEN size_value = 'ONESIZE' THEN 0
                    WHEN category = 'shoes' THEN CAST(size_value AS INTEGER)
                    ELSE 
                        CASE size_value
                            WHEN 'XS' THEN 1
                            WHEN 'S' THEN 2
                            WHEN 'M' THEN 3
                            WHEN 'L' THEN 4
                            WHEN 'XL' THEN 5
                            WHEN 'XXL' THEN 6
                            ELSE 7
                        END
                END
        ''', (size_category,))
        
        sizes = [dict(row) for row in cursor.fetchall()]
        
        conn.close()
        return sizes
        
    except Exception as e:
        print(f"Error getting sizes: {e}")
        raise HTTPException(status_code=500, detail="Failed to get sizes")

# Get user's own items - Must be before /items/{item_id} route
@app.get("/items/my-items")
async def get_my_items(current_user: dict = Depends(get_current_user)):
    """Get all items belonging to the current user"""
    print(f"🔐 User authenticated: {current_user}")
    
    conn = None
    try:
        conn = database.get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT 
                i.id,
                i.title,
                i.description,
                i.price_per_day,
                c.name as category,
                i.gender,
                i.occasion,
                i.size,
                i.condition,
                i.brand,
                i.color,
                i.location_area,
                i.is_available,
                i.created_at,
                ii.image_url,
                ia.start_date,
                ia.end_date
            FROM items i
            LEFT JOIN categories c ON i.category_id = c.id
            LEFT JOIN item_images ii ON i.id = ii.item_id AND ii.is_primary = 1
            LEFT JOIN item_availability ia ON i.id = ia.item_id
            WHERE i.user_id = ?
            ORDER BY i.created_at DESC
        ''', (current_user['id'],))
        
        items = cursor.fetchall()
        print(f"📦 Found {len(items)} items for user {current_user['id']}")
        
        return {"items": [dict(item) for item in items]}
        
    except Exception as e:
        print(f"❌ Error getting user items: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve your items")
    finally:
        if conn:
            conn.close()

@app.get("/items/{item_id}")
async def get_item_detail(item_id: int, current_user: Optional[dict] = Depends(get_current_user_optional)):
    """Get detailed information about a specific item"""
    conn = None
    try:
        conn = database.get_db_connection()
        cursor = conn.cursor()
        
        # Get item details with owner information
        cursor.execute('''
            SELECT 
                i.id,
                i.title,
                i.description,
                i.price_per_day,
                c.name as category,
                i.gender,
                i.occasion,
                i.size,
                i.condition,
                i.brand,
                i.color,
                i.location_area,
                i.user_id,
                u.first_name || ' ' || u.last_name as owner_name,
                u.created_at as owner_joined,
                ia.start_date as availability_start,
                ia.end_date as availability_end
            FROM items i
            LEFT JOIN categories c ON i.category_id = c.id
            LEFT JOIN users u ON i.user_id = u.id
            LEFT JOIN item_availability ia ON i.id = ia.item_id
            WHERE i.id = ? AND i.is_available = 1
        ''', (item_id,))
        
        item = cursor.fetchone()
        
        if not item:
            raise HTTPException(status_code=404, detail="Item not found")
        
        # Get all images for the item
        cursor.execute('''
            SELECT image_url 
            FROM item_images 
            WHERE item_id = ? 
            ORDER BY is_primary DESC, id ASC
        ''', (item_id,))
        images = [row['image_url'] for row in cursor.fetchall()]
        
        # Get specifications
        cursor.execute('''
            SELECT material, care_instructions, measurements, tags
            FROM item_specifications
            WHERE item_id = ?
        ''', (item_id,))
        specs = cursor.fetchone()
        
        # Check if item is in user's favorites (only if user is authenticated)
        is_favorited = False
        if current_user:
            cursor.execute('''
                SELECT 1 FROM favorites 
                WHERE user_id = ? AND item_id = ?
            ''', (current_user['id'], item_id))
            is_favorited = cursor.fetchone() is not None
        
        # Calculate owner rating (mock for now)
        owner_rating = 4.8
        
        conn.close()
        
        return ItemDetailResponse(
            id=item['id'],
            title=item['title'],
            description=item['description'],
            price_per_day=float(item['price_per_day']),
            category=item['category'],
            gender=item['gender'],
            occasion=item['occasion'],
            size=item['size'],
            condition=item['condition'],
            brand=item['brand'],
            color=item['color'],
            location_area=item['location_area'],
            images=images,
            user_id=item['user_id'],
            owner_name=item['owner_name'],
            owner_joined=item['owner_joined'],
            owner_rating=owner_rating,
            material=specs['material'] if specs else None,
            care_instructions=specs['care_instructions'] if specs else None,
            measurements=specs['measurements'] if specs else None,
            tags=specs['tags'].split(',') if specs and specs['tags'] else [],
            is_favorited=is_favorited,
            availability_start=item['availability_start'],
            availability_end=item['availability_end']
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting item detail: {e}")
        raise HTTPException(status_code=500, detail="Failed to get item details")
    finally:
        if conn:
            conn.close()

@app.post("/items/{item_id}/favorite")
async def toggle_favorite(item_id: int, current_user: dict = Depends(get_current_user_optional)):
    """Add or remove item from favorites"""
    # Require authentication for favorites
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required to manage favorites")
    
    conn = None
    try:
        conn = database.get_db_connection()
        cursor = conn.cursor()
        
        # Check if item exists
        cursor.execute("SELECT id FROM items WHERE id = ? AND is_available = 1", (item_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Item not found")
        
        # Check if already favorited
        cursor.execute('''
            SELECT id FROM favorites 
            WHERE user_id = ? AND item_id = ?
        ''', (current_user['id'], item_id))
        
        existing_favorite = cursor.fetchone()
        
        if existing_favorite:
            # Remove from favorites
            cursor.execute('''
                DELETE FROM favorites 
                WHERE user_id = ? AND item_id = ?
            ''', (current_user['id'], item_id))
            action = "removed from"
        else:
            # Add to favorites
            cursor.execute('''
                INSERT INTO favorites (user_id, item_id)
                VALUES (?, ?)
            ''', (current_user['id'], item_id))
            action = "added to"
        
        conn.commit()
        conn.close()
        
        return {
            "message": f"Item {action} favorites",
            "is_favorited": not existing_favorite
        }
        
    except HTTPException:
        raise
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"Error toggling favorite: {e}")
        raise HTTPException(status_code=500, detail="Failed to update favorites")
    finally:
        if conn:
            conn.close()

# Get user's favorites
@app.get("/user/{user_id}/favorites")
async def get_user_favorites(user_id: int, current_user: dict = Depends(get_current_user)):
    """Get all favorited items for a user"""
    # Users can only see their own favorites
    if current_user['id'] != user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    conn = None
    try:
        conn = database.get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT 
                i.id,
                i.title as name,
                i.description,
                i.price_per_day,
                c.name as category,
                i.location_area as location,
                i.is_available as available,
                ii.image_url,
                u.first_name || ' ' || u.last_name as owner_name,
                f.created_at
            FROM favorites f
            JOIN items i ON f.item_id = i.id
            LEFT JOIN categories c ON i.category_id = c.id
            LEFT JOIN item_images ii ON i.id = ii.item_id AND ii.is_primary = 1
            LEFT JOIN users u ON i.user_id = u.id
            WHERE f.user_id = ?
            ORDER BY f.created_at DESC
        ''', (user_id,))
        
        favorites = cursor.fetchall()
        return {"favorites": [dict(fav) for fav in favorites]}
        
    except Exception as e:
        print(f"❌ Error getting user favorites: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve favorites")
    finally:
        if conn:
            conn.close()

# Remove from favorites
@app.delete("/user/{user_id}/favorites/{item_id}")
async def remove_favorite(user_id: int, item_id: int, current_user: dict = Depends(get_current_user)):
    """Remove item from user's favorites"""
    # Users can only manage their own favorites
    if current_user['id'] != user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    conn = None
    try:
        conn = database.get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            DELETE FROM favorites 
            WHERE user_id = ? AND item_id = ?
        ''', (user_id, item_id))
        
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Favorite not found")
        
        conn.commit()
        return {"message": "Item removed from favorites"}
        
    except HTTPException:
        raise
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"❌ Error removing favorite: {e}")
        raise HTTPException(status_code=500, detail="Failed to remove favorite")
    finally:
        if conn:
            conn.close()

# Add simple POST /items endpoint for AddNewItem component
@app.post("/items")
async def create_item(
    name: str = Form(...),
    description: str = Form(...),
    category: str = Form(...),
    price_per_day: float = Form(...),
    location: str = Form(...),
    image_url: str = Form(None),
    current_user: dict = Depends(get_current_user)
):
    """Create a new item listing"""
    conn = None
    try:
        conn = database.get_db_connection()
        cursor = conn.cursor()
        
        # Get category ID
        cursor.execute('SELECT id FROM categories WHERE name = ?', (category,))
        category_row = cursor.fetchone()
        if not category_row:
            raise HTTPException(status_code=400, detail="Invalid category")
        
        category_id = category_row[0]
        
        # Insert item
        cursor.execute('''
            INSERT INTO items (
                title, description, category_id, price_per_day, 
                location_area, user_id, is_available, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, 1, ?)
        ''', (
            name, description, category_id, price_per_day,
            location, current_user['id'], datetime.now().isoformat()
        ))
        
        item_id = cursor.lastrowid
        
        # Add image if provided
        if image_url:
            cursor.execute('''
                INSERT INTO item_images (item_id, image_url, is_primary, created_at)
                VALUES (?, ?, 1, ?)
            ''', (item_id, image_url, datetime.now().isoformat()))
        
        # Update user stats
        update_user_stats(current_user['id'], "items_listed", 1, conn)
        
        conn.commit()
        
        return {
            "message": "Item created successfully",
            "item_id": item_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"❌ Error creating item: {e}")
        raise HTTPException(status_code=500, detail="Failed to create item")
    finally:
        if conn:
            conn.close()

# Toggle item availability
@app.put("/items/{item_id}/availability")
async def toggle_item_availability(
    item_id: int, 
    is_available: bool = Form(...),
    current_user: dict = Depends(get_current_user)
):
    """Toggle item availability status"""
    conn = None
    try:
        conn = database.get_db_connection()
        cursor = conn.cursor()
        
        # Check if user owns the item
        cursor.execute('SELECT user_id FROM items WHERE id = ?', (item_id,))
        item = cursor.fetchone()
        if not item:
            raise HTTPException(status_code=404, detail="Item not found")
        
        if item[0] != current_user['id']:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Update availability
        cursor.execute('''
            UPDATE items 
            SET is_available = ?
            WHERE id = ?
        ''', (is_available, item_id))
        
        conn.commit()
        
        return {
            "message": f"Item {'enabled' if is_available else 'disabled'}",
            "is_available": is_available
        }
        
    except HTTPException:
        raise
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"❌ Error updating availability: {e}")
        raise HTTPException(status_code=500, detail="Failed to update availability")
    finally:
        if conn:
            conn.close()

@app.get("/items/{item_id}/similar")
async def get_similar_items(item_id: int):
    """Get similar items based on category and occasion"""
    conn = None
    try:
        conn = database.get_db_connection()
        cursor = conn.cursor()
        
        # Get current item's category and occasion
        cursor.execute('''
            SELECT c.name as category, i.occasion 
            FROM items i
            LEFT JOIN categories c ON i.category_id = c.id
            WHERE i.id = ?
        ''', (item_id,))
        
        current_item = cursor.fetchone()
        if not current_item:
            return {"items": []}
        
        # Find similar items (same category, different items)
        cursor.execute('''
            SELECT 
                i.id,
                i.title,
                i.price_per_day,
                ii.image_url,
                i.condition
            FROM items i
            LEFT JOIN item_images ii ON i.id = ii.item_id AND ii.is_primary = 1
            WHERE i.category_id = (
                SELECT category_id FROM items WHERE id = ?
            )
            AND i.id != ?
            AND i.is_available = 1
            ORDER BY i.created_at DESC
            LIMIT 4
        ''', (item_id, item_id))
        
        similar_items = [dict(row) for row in cursor.fetchall()]
        
        conn.close()
        return {"items": similar_items}
        
    except Exception as e:
        print(f"Error getting similar items: {e}")
        return {"items": []}
    finally:
        if conn:
            conn.close()

# Edit item endpoint
@app.put("/items/{item_id}/edit")
async def edit_item(
    item_id: int,
    title: str = Form(...),
    description: str = Form(None),
    price_per_day: float = Form(...),
    category: str = Form(...),
    gender: str = Form(...),
    occasion: str = Form(...),
    size: str = Form(...),
    condition: str = Form(...),
    brand: str = Form(None),
    color: str = Form(None),
    location_area: str = Form(...),
    availability_start: str = Form(...),
    availability_end: str = Form(...),
    images: List[UploadFile] = File(None),
    current_user: dict = Depends(get_current_user_optional)
):
    """Edit an existing item (only by the owner)"""
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required to edit items")
    
    print(f"🔧 Edit request for item {item_id} by user {current_user['id']}")
    print(f"📝 Form data - Title: {title}, Category: {category}, Price: {price_per_day}")
    print(f"📷 Images received: {len(images) if images else 0}")
    
    conn = None
    try:
        conn = database.get_db_connection()
        cursor = conn.cursor()
        
        # Check if item exists and belongs to current user
        cursor.execute("SELECT user_id FROM items WHERE id = ?", (item_id,))
        item = cursor.fetchone()
        
        if not item:
            raise HTTPException(status_code=404, detail="Item not found")
        
        if item['user_id'] != current_user['id']:
            raise HTTPException(status_code=403, detail="You can only edit your own items")
        
        # Get category ID
        cursor.execute("SELECT id FROM categories WHERE name = ?", (category,))
        category_result = cursor.fetchone()
        
        if not category_result:
            raise HTTPException(status_code=400, detail="Invalid category")
        
        category_id = category_result['id']
        
        # Update the item
        cursor.execute('''
            UPDATE items SET
                title = ?, description = ?, price_per_day = ?, category_id = ?,
                gender = ?, occasion = ?, size = ?, condition = ?, brand = ?, color = ?, 
                location_area = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        ''', (
            title, description, price_per_day, category_id,
            gender, occasion, size, condition, brand, color, location_area, item_id
        ))
        
        # Update availability
        cursor.execute('''
            UPDATE item_availability SET
                start_date = ?, end_date = ?
            WHERE item_id = ?
        ''', (availability_start, availability_end, item_id))
        
        # Handle image uploads if provided
        images_saved = 0
        if images and any(img.filename for img in images):
            # Setup uploads directory
            uploads_dir = "uploads/items"
            os.makedirs(uploads_dir, exist_ok=True)
            
            # Delete existing images if new ones are provided
            cursor.execute("SELECT image_url FROM item_images WHERE item_id = ?", (item_id,))
            existing_images = cursor.fetchall()
            
            # Delete from database
            cursor.execute("DELETE FROM item_images WHERE item_id = ?", (item_id,))
            
            # Delete from filesystem (extract filename from URL)
            for img_record in existing_images:
                try:
                    # Extract filename from URL like "http://localhost:8001/uploads/items/filename.jpg"
                    img_url = img_record['image_url']
                    if '/uploads/items/' in img_url:
                        filename = img_url.split('/uploads/items/')[-1]
                        img_path = os.path.join(uploads_dir, filename)
                        if os.path.exists(img_path):
                            os.remove(img_path)
                except Exception as e:
                    print(f"Warning: Could not delete old image file: {e}")
            
            # Save new images
            for i, image in enumerate(images):
                if image.filename and image.content_type and image.content_type.startswith('image/'):
                    # Generate unique filename
                    file_extension = os.path.splitext(image.filename)[1]
                    unique_filename = f"{uuid.uuid4()}{file_extension}"
                    file_path = f"{uploads_dir}/{unique_filename}"
                    
                    # Create full URL path for database
                    image_url = f"http://localhost:8001/uploads/items/{unique_filename}"
                    
                    # Save file
                    content = await image.read()
                    with open(file_path, "wb") as f:
                        f.write(content)
                    
                    print(f"📸 Updated image: {file_path} -> {image_url}")
                    
                    # Save to database
                    cursor.execute('''
                        INSERT INTO item_images (item_id, image_url, is_primary)
                        VALUES (?, ?, ?)
                    ''', (item_id, image_url, i == 0))
                    
                    images_saved += 1
        
        conn.commit()
        
        print(f"✏️ Item {item_id} updated by user {current_user['id']} with {images_saved} images")
        
        return {"message": "Item updated successfully", "item_id": item_id, "images_saved": images_saved}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error updating item {item_id}: {e}")
        print(f"Error type: {type(e).__name__}")
        import traceback
        traceback.print_exc()
        if conn:
            conn.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update item: {str(e)}")
    finally:
        if conn:
            conn.close()

# Delete item endpoint
@app.delete("/items/{item_id}")
async def delete_item(
    item_id: int,
    current_user: dict = Depends(get_current_user_optional)
):
    """Delete an item (only by the owner)"""
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required to delete items")
    
    conn = None
    try:
        conn = database.get_db_connection()
        cursor = conn.cursor()
        
        # Check if item exists and belongs to current user
        cursor.execute("SELECT user_id, title FROM items WHERE id = ?", (item_id,))
        item = cursor.fetchone()
        
        if not item:
            raise HTTPException(status_code=404, detail="Item not found")
        
        if item['user_id'] != current_user['id']:
            raise HTTPException(status_code=403, detail="You can only delete your own items")
        
        # Get image files to delete from filesystem
        cursor.execute("SELECT image_url FROM item_images WHERE item_id = ?", (item_id,))
        images = cursor.fetchall()
        
        # Delete related records first (due to foreign key constraints)
        cursor.execute("DELETE FROM item_images WHERE item_id = ?", (item_id,))
        cursor.execute("DELETE FROM item_availability WHERE item_id = ?", (item_id,))
        cursor.execute("DELETE FROM favorites WHERE item_id = ?", (item_id,))
        cursor.execute("DELETE FROM item_specifications WHERE item_id = ?", (item_id,))
        
        # Delete the item itself
        cursor.execute("DELETE FROM items WHERE id = ?", (item_id,))
        
        conn.commit()
        
        # Delete image files from filesystem
        for image in images:
            try:
                # Extract filename from URL
                image_url = image['image_url']
                if 'uploads/items/' in image_url:
                    filename = image_url.split('uploads/items/')[-1]
                    file_path = f"uploads/items/{filename}"
                    if os.path.exists(file_path):
                        os.remove(file_path)
                        print(f"🗑️ Deleted image file: {file_path}")
            except Exception as img_error:
                print(f"Warning: Could not delete image file: {img_error}")
        
        print(f"🗑️ Item '{item['title']}' (ID: {item_id}) deleted by user {current_user['id']}")
        
        return {"message": f"Item '{item['title']}' deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting item: {e}")
        if conn:
            conn.rollback()
        raise HTTPException(status_code=500, detail="Failed to delete item")
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.getenv("PORT", 8001))
    uvicorn.run(app, host="0.0.0.0", port=port)