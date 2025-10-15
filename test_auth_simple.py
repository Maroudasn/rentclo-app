import urllib.request
import urllib.parse
import json

# Test login first
login_data = {
    "username": "john@example.com",
    "password": "password123"
}

try:
    # Login request
    url = "http://localhost:8001/login"
    data = json.dumps(login_data).encode('utf-8')
    
    req = urllib.request.Request(url)
    req.add_header('Content-Type', 'application/json')
    req.data = data
    
    print("Testing login...")
    with urllib.request.urlopen(req) as response:
        response_data = response.read().decode('utf-8')
        print(f"Login response status: {response.status}")
        print(f"Login response: {response_data}")
        
        if response.status == 200:
            data = json.loads(response_data)
            token = data.get('access_token')
            print(f"Token received: {token[:50] if token else 'No token'}...")
            
            # Test authenticated request
            print("\nTesting authenticated request...")
            fav_url = "http://localhost:8001/items/1/favorite"
            fav_req = urllib.request.Request(fav_url, method='POST')
            fav_req.add_header('Authorization', f'Bearer {token}')
            
            try:
                with urllib.request.urlopen(fav_req) as fav_response:
                    fav_data = fav_response.read().decode('utf-8')
                    print(f"Favorite response status: {fav_response.status}")
                    print(f"Favorite response: {fav_data}")
            except urllib.error.HTTPError as e:
                print(f"Favorite request failed with status: {e.code}")
                print(f"Error response: {e.read().decode('utf-8')}")

except urllib.error.HTTPError as e:
    print(f"Login failed with status: {e.code}")
    print(f"Error response: {e.read().decode('utf-8')}")
except Exception as e:
    print(f"Error: {e}")