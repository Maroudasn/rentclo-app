import sqlite3
import os

# Connect to database
os.chdir(r"C:\Users\30693\Downloads\rentclo-app\backend")
conn = sqlite3.connect('rentclo.db')
conn.row_factory = sqlite3.Row
cursor = conn.cursor()

print("Checking tables in database:")
cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = cursor.fetchall()
for table in tables:
    print(f"- {table['name']}")

print("\nChecking login_sessions table:")
try:
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='login_sessions'")
    if cursor.fetchone():
        print("login_sessions table exists")
        cursor.execute("SELECT * FROM login_sessions")
        sessions = cursor.fetchall()
        print(f"Found {len(sessions)} sessions:")
        for session in sessions:
            print(f"  User ID: {session['user_id']}, Token: {session['session_token'][:20]}..., Active: {session['is_active']}")
    else:
        print("login_sessions table does not exist!")
except Exception as e:
    print(f"Error checking login_sessions: {e}")

conn.close()