import requests
import json

# Fresh token from your login
TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmcmVzaCI6ZmFsc2UsImlhdCI6MTc1MzM3NzIyNCwianRpIjoiNzdmMzg2N2YtOWEyNy00ZDc2LWJlZTktN2Y0ODFkOGViM2M0IiwidHlwZSI6ImFjY2VzcyIsInN1YiI6IjIiLCJuYmYiOjE3NTMzNzcyMjQsImV4cCI6MTc1MzQ2MzYyNH0.9OgYr0fHnNtadHe-9OvSp2qvBTmo_2c-oBq-Hs_XLcw"

headers = {"Authorization": f"Bearer {TOKEN}"}

print("🧪 Testing User API Endpoints...")
print("=" * 50)

# Test 1: Profile
print("\n1. Testing Profile:")
try:
    response = requests.get("http://localhost:5000/api/auth/profile", headers=headers)
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
except Exception as e:
    print(f"Error: {e}")

# Test 2: Dashboard
print("\n2. Testing Dashboard:")
try:
    response = requests.get("http://localhost:5000/api/user/dashboard", headers=headers)
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
except Exception as e:
    print(f"Error: {e}")

# Test 3: Parking Lots
print("\n3. Testing Parking Lots:")
try:
    response = requests.get("http://localhost:5000/api/user/parking-lots", headers=headers)
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
except Exception as e:
    print(f"Error: {e}")

