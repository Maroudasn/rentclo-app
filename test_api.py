import requests
import json

# Test API endpoints
BASE_URL = "http://localhost:8001"

def test_endpoint(method, endpoint, data=None):
    try:
        if method == "GET":
            response = requests.get(f"{BASE_URL}{endpoint}")
        elif method == "POST":
            response = requests.post(f"{BASE_URL}{endpoint}", json=data)
        
        print(f"✅ {method} {endpoint}")
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            if isinstance(result, list):
                print(f"   Results: {len(result)} items")
                if result:
                    print(f"   Sample: {result[0] if isinstance(result[0], str) else json.dumps(result[0], indent=2)[:100]}...")
            elif isinstance(result, dict):
                print(f"   Keys: {list(result.keys())}")
        else:
            print(f"   Error: {response.text}")
            
    except Exception as e:
        print(f"❌ {method} {endpoint}")
        print(f"   Error: {e}")
    
    print()

if __name__ == "__main__":
    print("🧪 Testing RentClo API Endpoints\n")
    
    # Test basic endpoints
    test_endpoint("GET", "/health")
    test_endpoint("GET", "/items/categories") 
    test_endpoint("GET", "/search/filters")
    test_endpoint("POST", "/search", {"limit": 5})
    test_endpoint("GET", "/items/13")
    test_endpoint("GET", "/items/13/similar")
    
    print("✅ API testing complete!")