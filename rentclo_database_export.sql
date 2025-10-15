-- RentClo Database Schema and Data Export
-- Generated on: 2025-10-13 22:00:57
-- SQLite Database Export

-- Database file size: 36.0 KB
-- Last modified: 2025-09-22 18:21:46.892536

-- =====================================================
-- TABLE SCHEMAS
-- =====================================================

-- Table: users
CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        user_type TEXT DEFAULT 'renter',
        first_name TEXT,
        last_name TEXT,
        phone TEXT UNIQUE,
        is_verified BOOLEAN DEFAULT 0,
        is_active BOOLEAN DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

-- Table: login_sessions
CREATE TABLE login_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        session_token TEXT UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    );

-- Table: user_addresses
CREATE TABLE user_addresses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        address_line1 TEXT NOT NULL,
        address_line2 TEXT,
        city TEXT NOT NULL,
        state TEXT NOT NULL,
        zip_code TEXT NOT NULL,
        country TEXT DEFAULT 'USA',
        is_primary BOOLEAN DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    );


-- =====================================================
-- TABLE DATA
-- =====================================================

-- Data for table: users (3 rows)
INSERT INTO users (id, username, email, password_hash, user_type, first_name, last_name, phone, is_verified, is_active, created_at, updated_at) VALUES (1, 'testuser', 'test@example.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'renter', 'Test', 'User', '+1234567890', 1, 1, '2025-09-22 15:21:46', '2025-09-22 15:21:46');
INSERT INTO users (id, username, email, password_hash, user_type, first_name, last_name, phone, is_verified, is_active, created_at, updated_at) VALUES (2, 'admin', 'admin@rentclo.com', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'admin', 'Admin', 'User', '+1987654321', 1, 1, '2025-09-22 15:21:46', '2025-09-22 15:21:46');
INSERT INTO users (id, username, email, password_hash, user_type, first_name, last_name, phone, is_verified, is_active, created_at, updated_at) VALUES (3, 'owner1', 'owner@example.com', '43a0d17178a9d26c9e0fe9a74b0b45e38d32f27aed887a008a54bf6e033bf7b9', 'owner', 'Owner', 'Smith', '+1555666777', 1, 1, '2025-09-22 15:21:46', '2025-09-22 15:21:46');

-- Data for table: login_sessions (0 rows)
-- No data in this table

-- Data for table: user_addresses (3 rows)
INSERT INTO user_addresses (id, user_id, address_line1, address_line2, city, state, zip_code, country, is_primary, created_at) VALUES (1, 1, 'Test Street 123', NULL, 'Sample City', 'CA', '90210', 'USA', 1, '2025-09-22 15:21:46');
INSERT INTO user_addresses (id, user_id, address_line1, address_line2, city, state, zip_code, country, is_primary, created_at) VALUES (2, 2, 'Admin Street 123', NULL, 'Sample City', 'CA', '90210', 'USA', 1, '2025-09-22 15:21:46');
INSERT INTO user_addresses (id, user_id, address_line1, address_line2, city, state, zip_code, country, is_primary, created_at) VALUES (3, 3, 'Owner Street 123', NULL, 'Sample City', 'CA', '90210', 'USA', 1, '2025-09-22 15:21:46');
