import requests
import json

# Test login first
login_data = {
    "username": "john@example.com",
    "password": "password123"
}

print("Testing login...")
try:
    response = requests.post("http://localhost:8001/login", json=login_data)
    print(f"Login response status: {response.status_code}")
    print(f"Login response: {response.text}")
    
    if response.status_code == 200:
        data = response.json()
        token = data.get('access_token')
        print(f"Token received: {token[:50]}..." if token else "No token in response")
        
        # Test authenticated request
        headers = {"Authorization": f"Bearer {token}"}
        print("\nTesting authenticated request...")
        fav_response = requests.post("http://localhost:8001/items/1/favorite", headers=headers)
        print(f"Favorite response status: {fav_response.status_code}")
        print(f"Favorite response: {fav_response.text}")
        
except Exception as e:
    print(f"Error: {e}")