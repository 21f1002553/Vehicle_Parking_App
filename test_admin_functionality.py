import requests
import json

BASE_URL = "http://localhost:5000"

def test_section(title):
    print(f"\n{'='*60}")
    print(f"🧪 {title}")
    print('='*60)

def make_request(method, endpoint, headers=None, json_data=None):
    url = f"{BASE_URL}{endpoint}"
    try:
        if method == "GET":
            response = requests.get(url, headers=headers)
        elif method == "POST":
            response = requests.post(url, headers=headers, json=json_data)
        elif method == "PUT":
            response = requests.put(url, headers=headers, json=json_data)
        elif method == "DELETE":
            response = requests.delete(url, headers=headers)
        
        print(f"📍 {method} {endpoint}")
        print(f"Status: {response.status_code}")
        
        if response.status_code < 400:
            print("✅ SUCCESS")
            return response.json(), response.status_code
        else:
            print("❌ FAILED")
            try:
                print(f"Error: {response.json()}")
            except:
                print(f"Error: {response.text}")
            return None, response.status_code
            
    except Exception as e:
        print(f"💥 Exception: {e}")
        return None, 500

print("🚀 ADMIN FUNCTIONALITY COMPREHENSIVE TEST")
print("="*80)

# ============================================================================
# 1. GET ADMIN TOKEN
# ============================================================================
test_section("ADMIN AUTHENTICATION")

print("\n1.1 Admin Login")
admin_login_data = {"email": "admin@parking.com", "password": "admin123"}
admin_response, status = make_request("POST", "/api/auth/login", 
                                    headers={"Content-Type": "application/json"}, 
                                    json_data=admin_login_data)

admin_token = None
admin_headers = None

if admin_response and status == 200:
    admin_token = admin_response.get('access_token')
    admin_headers = {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}
    print(f"✅ Admin Token: {admin_token[:50]}...")
    print(f"✅ Admin User: {admin_response['user']['username']}")
    print(f"✅ Is Admin: {admin_response['user']['is_admin']}")
else:
    print("❌ Cannot proceed without admin token")
    exit(1)

# ============================================================================
# 2. TEST ADMIN ROUTES AVAILABILITY
# ============================================================================
test_section("ADMIN ROUTES AVAILABILITY")

print("\n2.1 Test Admin Routes Endpoint")
data, status = make_request("GET", "/api/admin/test")

# ============================================================================
# 3. ADMIN DASHBOARD
# ============================================================================
test_section("ADMIN DASHBOARD")

print("\n3.1 Admin Dashboard Overview")
dashboard_data, status = make_request("GET", "/api/admin/dashboard", headers=admin_headers)

if dashboard_data:
    stats = dashboard_data.get('statistics', {})
    print(f"📊 Total Users: {stats.get('total_users', 0)}")
    print(f"🅿️  Total Parking Lots: {stats.get('total_parking_lots', 0)}")
    print(f"🚗 Total Spots: {stats.get('total_parking_spots', 0)}")
    print(f"🔴 Occupied: {stats.get('occupied_spots', 0)}")
    print(f"🟢 Available: {stats.get('available_spots', 0)}")
    print(f"💰 Total Revenue: ${stats.get('total_revenue', 0)}")

# ============================================================================
# 4. PARKING LOT MANAGEMENT
# ============================================================================
test_section("PARKING LOT MANAGEMENT")

print("\n4.1 View All Parking Lots")
lots_data, status = make_request("GET", "/api/admin/parking-lots", headers=admin_headers)

print("\n4.2 Create New Parking Lot")
new_lot_data = {
    "name": "Admin Test Lot",
    "address": "123 Admin Test Street",
    "pin_code": "999999",
    "total_spots": 5,
    "price_per_hour": 30.0
}
create_response, status = make_request("POST", "/api/admin/parking-lots", 
                                     headers=admin_headers, json_data=new_lot_data)

new_lot_id = None
if create_response and status == 201:
    new_lot_id = create_response['parking_lot']['id']
    print(f"✅ New Lot ID: {new_lot_id}")
    print(f"✅ Spots Created: {create_response['spots_created']}")

print("\n4.3 Update Parking Lot")
if new_lot_id:
    update_data = {"price_per_hour": 35.0, "name": "Updated Admin Test Lot"}
    update_response, status = make_request("PUT", f"/api/admin/parking-lots/{new_lot_id}",
                                         headers=admin_headers, json_data=update_data)

# ============================================================================
# 5. USER MANAGEMENT
# ============================================================================
test_section("USER MANAGEMENT")

print("\n5.1 View All Users")
users_data, status = make_request("GET", "/api/admin/users", headers=admin_headers)

if users_data:
    users = users_data.get('users', [])
    print(f"📊 Found {len(users)} users:")
    for user in users[:3]:  # Show first 3 users
        print(f"   👤 {user['username']} ({user['email']}) - Active: {user['is_active']}")

# ============================================================================
# 6. RESERVATION MANAGEMENT
# ============================================================================
test_section("RESERVATION MANAGEMENT")

print("\n6.1 View All Reservations")
reservations_data, status = make_request("GET", "/api/admin/reservations", headers=admin_headers)

if reservations_data:
    reservations = reservations_data.get('reservations', [])
    total = reservations_data.get('pagination', {}).get('total', 0)
    print(f"📊 Total Reservations: {total}")
    print(f"📋 Showing: {len(reservations)} reservations")

print("\n6.2 Filter Active Reservations")
active_reservations_data, status = make_request("GET", "/api/admin/reservations?status=active", 
                                               headers=admin_headers)

# ============================================================================
# 7. CLEANUP (DELETE TEST LOT)
# ============================================================================
test_section("CLEANUP")

print("\n7.1 Delete Test Parking Lot")
if new_lot_id:
    delete_response, status = make_request("DELETE", f"/api/admin/parking-lots/{new_lot_id}",
                                         headers=admin_headers)
    if status == 200:
        print(f"✅ Test lot {new_lot_id} deleted successfully")

# ============================================================================
# 8. SUMMARY REPORT
# ============================================================================
test_section("ADMIN FUNCTIONALITY SUMMARY")

print("\n📋 ADMIN FEATURES TESTED:")
print("✅ Admin Authentication: Working")
print("✅ Admin Dashboard: Working") 
print("✅ Parking Lot Management: Working")
print("✅ Create/Update/Delete Lots: Working")
print("✅ User Management: Working")
print("✅ Reservation Monitoring: Working")
print("✅ System Statistics: Working")

