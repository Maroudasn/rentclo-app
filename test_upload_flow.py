import urllib.request
import urllib.parse
import json

def test_login_and_add_item():
    base_url = "http://localhost:8001"
    
    # Test login first
    login_data = {
        "username": "john@example.com",
        "password": "password123"
    }
    
    try:
        # Login request
        print("🔐 Testing login...")
        login_url = f"{base_url}/login"
        data = json.dumps(login_data).encode('utf-8')
        
        req = urllib.request.Request(login_url)
        req.add_header('Content-Type', 'application/json')
        req.data = data
        
        with urllib.request.urlopen(req) as response:
            response_data = response.read().decode('utf-8')
            print(f"✅ Login successful! Status: {response.status}")
            
            login_result = json.loads(response_data)
            token = login_result.get('access_token')
            print(f"🎫 Token received: {token[:50] if token else 'No token'}...")
            
            if token:
                # Test authenticated endpoint
                print("\n📝 Testing add item endpoint authentication...")
                add_item_url = f"{base_url}/items/add"
                
                # Create a minimal test request (this will fail due to missing form data, but should show auth works)
                req = urllib.request.Request(add_item_url, method='POST')
                req.add_header('Authorization', f'Bearer {token}')
                req.add_header('Content-Type', 'application/json')
                req.data = b'{"test": "data"}'
                
                try:
                    with urllib.request.urlopen(req) as response:
                        print(f"✅ Add item endpoint accessible! Status: {response.status}")
                except urllib.error.HTTPError as e:
                    error_response = e.read().decode('utf-8')
                    print(f"📋 Add item endpoint response (status {e.code}): {error_response}")
                    
                    # 422 means validation error (expected), 401 means auth issue
                    if e.code == 422:
                        print("✅ Authentication working! (Got validation error as expected)")
                    elif e.code == 401:
                        print("❌ Authentication failed!")
                    else:
                        print(f"🤔 Unexpected error code: {e.code}")
            
    except urllib.error.HTTPError as e:
        error_response = e.read().decode('utf-8')
        print(f"❌ Login failed! Status: {e.code}")
        print(f"Error: {error_response}")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_login_and_add_item()