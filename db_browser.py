#!/usr/bin/env python3
"""
Simple SQLite Database Browser for RentClo
Usage: python db_browser.py
"""

import sqlite3
import sys

def show_tables(cursor):
    """Show all tables in the database"""
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = cursor.fetchall()
    print("Tables in database:")
    for table in tables:
        cursor.execute(f"SELECT COUNT(*) FROM {table[0]}")
        count = cursor.fetchone()[0]
        print(f"  - {table[0]} ({count} rows)")
    print()

def show_users(cursor):
    """Show all users"""
    cursor.execute("SELECT id, username, email, first_name, last_name, user_type, is_active FROM users")
    users = cursor.fetchall()
    print("Users:")
    print("ID | Username | Email | Name | Type | Active")
    print("-" * 60)
    for user in users:
        active = "Yes" if user[6] else "No"
        print(f"{user[0]} | {user[1]} | {user[2]} | {user[3]} {user[4]} | {user[5]} | {active}")
    print()

def show_bookings(cursor):
    """Show all bookings with details"""
    cursor.execute("""
        SELECT b.id, u1.username as renter, u2.username as owner, 
               i.title, b.start_date, b.end_date, b.total_amount, b.status
        FROM bookings b
        JOIN users u1 ON b.user_id = u1.id
        JOIN users u2 ON b.owner_id = u2.id  
        JOIN items i ON b.item_id = i.id
        ORDER BY b.created_at DESC
    """)
    bookings = cursor.fetchall()
    print("Bookings:")
    if bookings:
        print("ID | Renter | Owner | Item | Dates | Amount | Status")
        print("-" * 70)
        for booking in bookings:
            print(f"{booking[0]} | {booking[1][:10]} | {booking[2][:10]} | {booking[3][:15]} | {booking[4]} to {booking[5]} | ${booking[6]:.2f} | {booking[7]}")
    else:
        print("No bookings found")
    print()

def show_user_stats(cursor):
    """Show user statistics"""
    cursor.execute("""
        SELECT u.username, us.total_bookings, us.items_listed, 
               us.total_spent, us.total_earned, us.avg_rating
        FROM user_stats us 
        JOIN users u ON us.user_id = u.id
        ORDER BY us.total_bookings DESC, us.total_earned DESC
    """)
    stats = cursor.fetchall()
    print("User Statistics:")
    print("Username | Bookings | Items | Spent | Earned | Rating")
    print("-" * 60)
    for stat in stats:
        print(f"{stat[0][:15]:<15} | {stat[1]:8} | {stat[2]:5} | ${stat[3]:6.2f} | ${stat[4]:6.2f} | {stat[5]:.1f}")
    print()

def show_addresses(cursor):
    """Show all user addresses"""
    cursor.execute("""
        SELECT u.username, ua.address_line1, ua.address_line2, 
               ua.city, ua.state, ua.zip_code, ua.country
        FROM user_addresses ua
        JOIN users u ON ua.user_id = u.id
        ORDER BY u.username
    """)
    addresses = cursor.fetchall()
    print("User Addresses:")
    for addr in addresses:
        print(f"User: {addr[0]}")
        print(f"  Address: {addr[1]}")
        if addr[2]:
            print(f"           {addr[2]}")
        print(f"           {addr[3]}, {addr[4]} {addr[5]}")
        print(f"           {addr[6]}")
        print()

def show_schema(cursor, table_name):
    """Show table schema"""
    try:
        cursor.execute(f"PRAGMA table_info({table_name})")
        columns = cursor.fetchall()
        print(f"Schema for table '{table_name}':")
        print("Column | Type | Not Null | Default | Primary Key")
        print("-" * 50)
        for col in columns:
            not_null = "Yes" if col[3] else "No"
            pk = "Yes" if col[5] else "No"
            default = col[4] if col[4] is not None else ""
            print(f"{col[1]} | {col[2]} | {not_null} | {default} | {pk}")
        print()
    except sqlite3.Error as e:
        print(f"Error: {e}")

def execute_sql(cursor, conn, query):
    """Execute custom SQL query"""
    try:
        cursor.execute(query)
        
        if query.strip().lower().startswith('select'):
            results = cursor.fetchall()
            if results:
                # Print column headers
                if cursor.description:
                    headers = [desc[0] for desc in cursor.description]
                    print(" | ".join(headers))
                    print("-" * (len(" | ".join(headers)) + len(headers) * 2))
                
                # Print results
                for row in results:
                    print(" | ".join(str(val) if val is not None else "NULL" for val in row))
            else:
                print("No results found.")
        else:
            conn.commit()
            print(f"Query executed successfully. Rows affected: {cursor.rowcount}")
        print()
    except sqlite3.Error as e:
        print(f"SQL Error: {e}")

def main():
    """Main interactive loop"""
    print("=== RentClo Database Browser ===")
    print("Connecting to backend/rentclo.db...")
    
    try:
        conn = sqlite3.connect("backend/rentclo.db")
        cursor = conn.cursor()
        print("Connected successfully!\n")
        
        print("Available commands:")
        print("  tables    - Show all tables")
        print("  users     - Show all users")
        print("  addresses - Show all addresses")
        print("  bookings  - Show all bookings")
        print("  stats     - Show user statistics")
        print("  schema <table> - Show table structure")
        print("  sql <query> - Execute SQL query")
        print("  help      - Show this help")
        print("  quit      - Exit")
        print()
        
        while True:
            try:
                command = input("rentclo> ").strip()
                
                if not command:
                    continue
                    
                parts = command.split(' ', 1)
                cmd = parts[0].lower()
                
                if cmd in ['quit', 'exit', 'q']:
                    break
                elif cmd == 'tables':
                    show_tables(cursor)
                elif cmd == 'users':
                    show_users(cursor)
                elif cmd == 'addresses':
                    show_addresses(cursor)
                elif cmd == 'bookings':
                    show_bookings(cursor)
                elif cmd == 'stats':
                    show_user_stats(cursor)
                elif cmd == 'schema':
                    if len(parts) > 1:
                        show_schema(cursor, parts[1])
                    else:
                        print("Usage: schema <table_name>")
                elif cmd == 'sql':
                    if len(parts) > 1:
                        execute_sql(cursor, conn, parts[1])
                    else:
                        print("Usage: sql <query>")
                elif cmd == 'help':
                    print("Available commands:")
                    print("  tables    - Show all tables")
                    print("  users     - Show all users") 
                    print("  addresses - Show all addresses")
                    print("  bookings  - Show all bookings")
                    print("  stats     - Show user statistics")
                    print("  schema <table> - Show table structure")
                    print("  sql <query> - Execute SQL query")
                    print("  help      - Show this help")
                    print("  quit      - Exit")
                    print()
                else:
                    print(f"Unknown command: {cmd}. Type 'help' for available commands.")
                    
            except KeyboardInterrupt:
                print("\nUse 'quit' to exit.")
            except EOFError:
                break
                
    except sqlite3.Error as e:
        print(f"Database error: {e}")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        if 'conn' in locals():
            conn.close()
            print("Database connection closed.")

if __name__ == "__main__":
    main()