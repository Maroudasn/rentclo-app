import sqlite3
import os

# Go to backend directory and connect to database
os.chdir(r"C:\Users\30693\Downloads\rentclo-app\backend")

conn = sqlite3.connect('rentclo.db')
conn.row_factory = sqlite3.Row  # This allows accessing columns by name
cursor = conn.cursor()

print("Users in database:")
cursor.execute("SELECT id, username, first_name, last_name, user_type FROM users")
users = cursor.fetchall()

for user in users:
    print(f"ID: {user['id']}, Username: {user['username']}, Name: {user['first_name']} {user['last_name']}, Type: {user['user_type']}")

conn.close()