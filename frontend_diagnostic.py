#!/usr/bin/env python3
"""
Quick Frontend Diagnostic Test
Tests what's currently working and what needs fixing
"""

import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:5000"

def test_section(title):
    print(f"\n{'='*60}")
    print(f"🔍 {title}")
    print('='*60)

def check_endpoint(method, endpoint, description):
    """Check if an endpoint is responding"""
    try:
        url = f"{BASE_URL}{endpoint}"
        if method == "GET":
            response = requests.get(url, timeout=5)
        else:
            response = requests.post(url, timeout=5)
        
        status_code = response.status_code
        if status_code == 200:
            print(f"✅ {description}: Working (200)")
            return True, response
        elif status_code == 404:
            print(f"❌ {description}: Not Found (404)")
            return False, response
        elif status_code == 500:
            print(f"💥 {description}: Server Error (500)")
            return False, response
        else:
            print(f"⚠️  {description}: Status {status_code}")
            return False, response
    except requests.exceptions.ConnectionError:
        print(f"🔌 {description}: Flask server not running")
        return False, None
    except requests.exceptions.Timeout:
        print(f"⏰ {description}: Request timeout")
        return False, None
    except Exception as e:
        print(f"💥 {description}: Error - {e}")
        return False, None

print("🚀 FRONTEND DIAGNOSTIC TEST")
print("="*80)
print(f"🕐 Test Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

# ============================================================================
# 1. BASIC CONNECTIVITY
# ============================================================================
test_section("BASIC CONNECTIVITY")

print("1.1 Testing if Flask server is running...")
server_running, _ = check_endpoint("GET", "/", "Main Route")

print("1.2 Testing API health...")
api_working, _ = check_endpoint("GET", "/api/health", "API Health")

print("1.3 Testing debug endpoint...")
debug_working, _ = check_endpoint("GET", "/debug", "Debug Info")

if not server_running:
    print("\n❌ CRITICAL: Flask server is not running!")
    print("   Please run: python app.py")
    print("   Make sure you're in the project directory")
    exit(1)

# ============================================================================
# 2. FRONTEND FILES CHECK
# ============================================================================
test_section("FRONTEND FILES ACCESSIBILITY")

frontend_files = [
    "/static/css/main.css",
    "/static/js/main.js", 
    "/static/js/api.js",
    "/static/js/auth.js",
    "/static/js/utils.js",
    "/static/components/auth/Login.vue.js",
    "/static/components/auth/Register.vue.js",
    "/static/components/layout/AuthLayout.vue.js",
    "/static/components/shared/ErrorMessage.vue.js"
]

print("2.1 Checking static file accessibility...")
missing_files = []
for file_path in frontend_files:
    working, response = check_endpoint("GET", file_path, f"Static File: {file_path}")
    if not working:
        missing_files.append(file_path)

if missing_files:
    print(f"\n⚠️  Missing {len(missing_files)} frontend files:")
    for file in missing_files:
        print(f"   ❌ {file}")

# ============================================================================
# 3. FRONTEND ROUTES
# ============================================================================
test_section("FRONTEND ROUTES")

frontend_routes = [
    ("/", "Home Page"),
    ("/login", "Login Page"),
    ("/register", "Register Page"),
    ("/user/dashboard", "User Dashboard"),
    ("/admin/dashboard", "Admin Dashboard")
]

print("3.1 Testing frontend route accessibility...")
for route, description in frontend_routes:
    check_endpoint("GET", route, description)

# ============================================================================
# 4. API ENDPOINTS
# ============================================================================
test_section("API ENDPOINTS")

api_endpoints = [
    ("/api/auth/test", "Auth Test"),
    ("/api/user/test", "User Test"), 
    ("/api/admin/test", "Admin Test")
]

print("4.1 Testing API endpoint availability...")
for endpoint, description in api_endpoints:
    check_endpoint("GET", endpoint, description)

# ============================================================================
# 5. AUTHENTICATION TEST
# ============================================================================
test_section("AUTHENTICATION TEST")

print("5.1 Testing user login...")
try:
    login_data = {"email": "user@test.com", "password": "user123"}
    response = requests.post(f"{BASE_URL}/api/auth/login", json=login_data, timeout=5)
    
    if response.status_code == 200:
        print("✅ User authentication: Working")
        token = response.json().get('access_token')
        if token:
            print(f"✅ JWT token generation: Working")
            
            # Test authenticated endpoint
            headers = {"Authorization": f"Bearer {token}"}
            dashboard_response = requests.get(f"{BASE_URL}/api/user/dashboard", headers=headers, timeout=5)
            if dashboard_response.status_code == 200:
                print("✅ Protected endpoint access: Working")
            else:
                print(f"❌ Protected endpoint access: Failed ({dashboard_response.status_code})")
        else:
            print("❌ JWT token generation: Failed")
    else:
        print(f"❌ User authentication: Failed ({response.status_code})")
        
except Exception as e:
    print(f"❌ Authentication test failed: {e}")

# ============================================================================
# 6. DIAGNOSIS SUMMARY
# ============================================================================
test_section("DIAGNOSIS SUMMARY")

print("📋 ISSUE ANALYSIS:")

if not server_running:
    print("🔴 CRITICAL: Flask server not running")
    print("   Solution: Run 'python app.py'")

elif missing_files:
    print("🟡 WARNING: Missing frontend files")
    print("   This could cause Vue.js components to not load properly")
    print("   Check if files exist in the app/static/ directory")

elif not api_working:
    print("🟡 WARNING: API endpoints not responding")
    print("   This could indicate routing issues")

else:
    print("🟢 BASIC SETUP: Appears to be working")
    print("   The issue might be in:")
    print("   1. Vue.js component loading")
    print("   2. JavaScript errors in browser")
    print("   3. Template rendering issues")

print("\n🎯 NEXT STEPS:")
print("1. Open browser to http://localhost:5000")
print("2. Open browser Developer Tools (F12)")
print("3. Check Console tab for JavaScript errors")
print("4. Check Network tab for failed resource loads")
print("5. Report what you see in the browser")

print(f"\n🕐 Test Completed: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
print("="*80)