import requests

TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmcmVzaCI6ZmFsc2UsImlhdCI6MTc1MzM1MzY2MCwianRpIjoiM2E5OWYyZWMtYTk0My00ZDA3LWJiNWUtNjc3MWQ1MDRlNzYxIiwidHlwZSI6ImFjY2VzcyIsInN1YiI6MiwibmJmIjoxNzUzMzUzNjYwLCJleHAiOjE3NTM0NDAwNjB9.yIo7WYby2bdXmjhNbtWcKlURtacsYBid6-XKgBVIA5A"

headers = {"Authorization": f"Bearer {TOKEN}"}

# Test profile
response = requests.get("http://localhost:5000/api/auth/profile", headers=headers)
print("Profile:", response.json())

# Test dashboard
response = requests.get("http://localhost:5000/api/user/dashboard", headers=headers)
print("Dashboard:", response.json())
