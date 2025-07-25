import requests
import json
import time

# Your working token
TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.YOUR_CURRENT_TOKEN_HERE"
headers = {"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"}

print("🚗 Testing Complete Reservation Flow...")
print("=" * 50)

# Step 1: Reserve a spot in Downtown Mall (lot_id=1)
print("\n1. 🎫 Reserving a parking spot...")
reserve_data = {
    "lot_id": 1,
    "vehicle_number": "ABC123"
}

response = requests.post("http://localhost:5000/api/user/reserve-spot", 
                        headers=headers, json=reserve_data)
print(f"Status: {response.status_code}")
if response.status_code == 201:
    reservation = response.json()
    reservation_id = reservation['reservation']['id']
    print(f"✅ Reservation successful! ID: {reservation_id}")
    print(f"Spot: {reservation['spot']['spot_number']}")
    
    # Step 2: Occupy the spot
    print(f"\n2. 🚙 Occupying spot {reservation_id}...")
    response = requests.post(f"http://localhost:5000/api/user/occupy-spot/{reservation_id}", 
                           headers=headers)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        print("✅ Spot occupied successfully!")
        
        # Wait a moment for time difference
        print("\n⏰ Waiting 3 seconds for parking duration...")
        time.sleep(3)
        
        # Step 3: Release the spot
        print(f"\n3. 🚗 Releasing spot {reservation_id}...")
        response = requests.post(f"http://localhost:5000/api/user/release-spot/{reservation_id}", 
                               headers=headers)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print("✅ Spot released successfully!")
            print(f"💰 Total Cost: ₨{result['total_cost']}")
            print(f"⏱️  Duration: {result.get('duration_hours', 0)} hours")
        else:
            print(f"❌ Release failed: {response.json()}")
    else:
        print(f"❌ Occupy failed: {response.json()}")
else:
    print(f"❌ Reservation failed: {response.json()}")

# Step 4: Check parking history
print("\n4. 📜 Checking parking history...")
response = requests.get("http://localhost:5000/api/user/parking-history", headers=headers)
print(f"Status: {response.status_code}")
if response.status_code == 200:
    history = response.json()
    print(f"✅ Total sessions: {history['statistics']['total_sessions']}")
    print(f"💰 Total spent: ₨{history['statistics']['total_cost']}")
else:
    print(f"❌ History failed: {response.json()}")

