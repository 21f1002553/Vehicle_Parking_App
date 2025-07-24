import requests
import json

# Use fresh admin token here (copy from step 1)
ADMIN_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmcmVzaCI6ZmFsc2UsImlhdCI6MTc1MzM3OTQyOCwianRpIjoiMTFjM2Q4NDgtMzA5OS00YzNkLTkzNDMtMDYzMDI4M2FmM2YzIiwidHlwZSI6ImFjY2VzcyIsInN1YiI6IjEiLCJuYmYiOjE3NTMzNzk0MjgsImV4cCI6MTc1MzQ2NTgyOH0.Ls65ar5Fxge40QtPDzspS-IvylSrW7P--ieebLUgxtE"

headers = {"Authorization": f"Bearer {ADMIN_TOKEN}", "Content-Type": "application/json"}

print("🛡️  Testing Admin API Endpoints...")
print("=" * 50)

# Test 1: Admin Routes Available
print("\n1. Testing Admin Routes:")
try:
    response = requests.get("http://localhost:5000/api/admin/test")
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        print("✅ Admin routes are available")
    else:
        print("❌ Admin routes not available")
except Exception as e:
    print(f"Error: {e}")

# Test 2: Admin Dashboard
print("\n2. Testing Admin Dashboard:")
try:
    response = requests.get("http://localhost:5000/api/admin/dashboard", headers=headers)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        stats = data.get('statistics', {})
        print("✅ Dashboard working!")
        print(f"   📊 Total Users: {stats.get('total_users', 0)}")
        print(f"   🅿️  Parking Lots: {stats.get('total_parking_lots', 0)}")
        print(f"   🚗 Total Spots: {stats.get('total_parking_spots', 0)}")
        print(f"   💰 Revenue: ${stats.get('total_revenue', 0)}")
    else:
        print(f"❌ Dashboard failed: {response.json()}")
except Exception as e:
    print(f"Error: {e}")

# Test 3: View All Parking Lots
print("\n3. Testing View All Parking Lots:")
try:
    response = requests.get("http://localhost:5000/api/admin/parking-lots", headers=headers)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        lots = data.get('parking_lots', [])
        print(f"✅ Found {len(lots)} parking lots")
        for lot in lots:
            print(f"   🅿️  {lot['name']}: {lot['available_spots']}/{lot['total_spots']} spots")
    else:
        print(f"❌ Failed: {response.json()}")
except Exception as e:
    print(f"Error: {e}")

# Test 4: View All Users
print("\n4. Testing View All Users:")
try:
    response = requests.get("http://localhost:5000/api/admin/users", headers=headers)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        users = data.get('users', [])
        print(f"✅ Found {len(users)} users")
        for user in users[:3]:  # Show first 3
            print(f"   👤 {user['username']} - Active: {user['is_active']}")
    else:
        print(f"❌ Failed: {response.json()}")
except Exception as e:
    print(f"Error: {e}")

# Test 5: Create New Parking Lot
print("\n5. Testing Create Parking Lot:")
try:
    new_lot = {
        "name": "Test Admin Lot",
        "address": "123 Test Admin Street", 
        "pin_code": "999999",
        "total_spots": 3,
        "price_per_hour": 25.0
    }
    response = requests.post("http://localhost:5000/api/admin/parking-lots", 
                           headers=headers, json=new_lot)
    print(f"Status: {response.status_code}")
    if response.status_code == 201:
        data = response.json()
        print("✅ Parking lot created!")
        print(f"   🆔 Lot ID: {data['parking_lot']['id']}")
        print(f"   🅿️  Name: {data['parking_lot']['name']}")
        print(f"   🔢 Spots Created: {data['spots_created']}")
    else:
        print(f"❌ Failed: {response.json()}")
except Exception as e:
    print(f"Error: {e}")

print("\n🎯 Admin API Test Complete!")

