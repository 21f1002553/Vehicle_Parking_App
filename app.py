from flask import Flask, jsonify, request
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_cors import CORS
from datetime import timedelta
import os
from dotenv import load_dotenv
from app import db

# Load environment variables
load_dotenv()

# Initialize other extensions
jwt = JWTManager()

def create_app():
    print("🔧 Creating Flask app...")
    app = Flask(__name__)
    
    # Configuration
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key-change-this')
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///parking_app.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'jwt-secret-change-this')
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)
    
    # Initialize extensions with app
    db.init_app(app)
    jwt.init_app(app)
    CORS(app)
    print("✅ Extensions initialized")
    
    # Main routes
    @app.route('/')
    def index():
        print("📍 Index route called")
        return jsonify({
            'message': 'Vehicle Parking App API - UPDATED VERSION',
            'status': 'running',
            'version': '2.0',
            'timestamp': 'July 23, 2025 - 23:30',
            'endpoints': {
                'health': '/api/health',
                'login': '/api/auth/login',
                'register': '/api/auth/register',
                'profile': '/api/auth/profile',
                'test_auth': '/api/auth/test',
                'debug': '/debug'
            }
        })
    
    @app.route('/api/health')
    def health_check():
        print("🏥 Health check called")
        return jsonify({
            'status': 'healthy', 
            'message': 'Vehicle Parking API is running',
            'version': '2.0'
        })
    
    @app.route('/debug')
    def debug():
        print("🐛 Debug route called")
        return jsonify({
            'message': 'DEBUG: New code is running!',
            'routes_registered': len(app.url_map._rules),
            'timestamp': 'July 23, 2025 - 23:30'
        })
    
    # AUTH ROUTES (inline for now)
    @app.route('/api/auth/login', methods=['POST'])
    def login():
        print("🔐 Login route called")
        try:
            from app.models.user import User
            
            data = request.get_json()
            
            if not data:
                return jsonify({'error': 'No data provided'}), 400
            
            email = data.get('email')
            password = data.get('password')
            
            if not email or not password:
                return jsonify({'error': 'Email and password required'}), 400
            
            user = User.query.filter_by(email=email).first()
            
            if not user or not user.check_password(password):
                return jsonify({'error': 'Invalid credentials'}), 401
            
            if not user.is_active:
                return jsonify({'error': 'Account is inactive'}), 401
            
            access_token = create_access_token(identity=user.id)
            
            return jsonify({
                'message': 'Login successful',
                'access_token': access_token,
                'user': user.to_dict()
            }), 200
            
        except Exception as e:
            print(f"❌ Login error: {e}")
            return jsonify({'error': str(e)}), 500

    @app.route('/api/auth/register', methods=['POST'])
    def register():
        print("📝 Register route called")
        try:
            from app.models.user import User
            
            data = request.get_json()
            
            if not data:
                return jsonify({'error': 'No data provided'}), 400
            
            required_fields = ['username', 'email', 'password', 'full_name', 'phone', 'address', 'pin_code']
            for field in required_fields:
                if not data.get(field):
                    return jsonify({'error': f'{field} is required'}), 400
            
            if User.query.filter_by(email=data['email']).first():
                return jsonify({'error': 'Email already registered'}), 400
            
            if User.query.filter_by(username=data['username']).first():
                return jsonify({'error': 'Username already taken'}), 400
            
            user = User(
                username=data['username'],
                email=data['email'],
                password=data['password'],
                full_name=data['full_name'],
                phone=data['phone'],
                address=data['address'],
                pin_code=data['pin_code'],
                is_admin=False
            )
            
            db.session.add(user)
            db.session.commit()
            
            return jsonify({
                'message': 'Registration successful',
                'user': user.to_dict()
            }), 201
            
        except Exception as e:
            print(f"❌ Register error: {e}")
            db.session.rollback()
            return jsonify({'error': str(e)}), 500

    @app.route('/api/auth/profile', methods=['GET'])
    @jwt_required()
    def get_profile():
        print("👤 Profile route called")
        try:
            from app.models.user import User
            
            user_id = get_jwt_identity()
            user = User.query.get(user_id)
            
            if not user:
                return jsonify({'error': 'User not found'}), 404
            
            return jsonify({'user': user.to_dict()}), 200
            
        except Exception as e:
            print(f"❌ Profile error: {e}")
            return jsonify({'error': str(e)}), 500

    @app.route('/api/auth/test', methods=['GET'])
    def test_auth_routes():
        print("🧪 Test auth route called")
        return jsonify({
            'message': 'Auth routes are working!',
            'status': 'SUCCESS',
            'timestamp': 'July 23, 2025 - 23:30',
            'available_endpoints': [
                'POST /api/auth/login',
                'POST /api/auth/register', 
                'GET /api/auth/profile',
                'GET /api/auth/test'
            ]
        }), 200
    
    print("✅ All routes registered")
    print(f"📊 Total routes: {len(app.url_map._rules)}")
    
    return app

def init_database(app):
    """Initialize database with sample data"""
    with app.app_context():
        try:
            # Import all models
            from app.models.user import User
            from app.models.parking_lot import ParkingLot
            from app.models.parking_spot import ParkingSpot
            from app.models.reservation import Reservation
            
            # Create all tables
            db.create_all()
            print("✅ All database tables created!")
            
            # Create admin user if doesn't exist
            admin = User.query.filter_by(email='admin@parking.com').first()
            if not admin:
                admin = User(
                    username='admin',
                    email='admin@parking.com',
                    password='admin123',
                    full_name='System Administrator',
                    phone='9999999999',
                    address='Admin Address',
                    pin_code='000000',
                    is_admin=True
                )
                db.session.add(admin)
                print("✅ Admin user created!")
            
            # Create test user if doesn't exist
            test_user = User.query.filter_by(email='user@test.com').first()
            if not test_user:
                test_user = User(
                    username='testuser',
                    email='user@test.com',
                    password='user123',
                    full_name='Test User',
                    phone='8888888888',
                    address='Test User Address',
                    pin_code='123456',
                    is_admin=False
                )
                db.session.add(test_user)
                print("✅ Test user created!")
            
            db.session.commit()
            
        except Exception as e:
            print(f"⚠️  Database initialization error: {e}")

# Create app instance
print("🚀 Starting app creation...")
app = create_app()
print("✅ App created successfully!")

if __name__ == '__main__':
    print("🔄 Initializing Vehicle Parking App...")
    
    # Initialize database
    init_database(app)
    
    print("🚀 Starting Vehicle Parking App...")
    print("🌐 Admin credentials: admin@parking.com / admin123")
    print("👤 Test user: user@test.com / user123")
    print("📍 Access: http://localhost:5000")
    print("🧪 Test: http://localhost:5000/api/auth/test")
    print("🐛 Debug: http://localhost:5000/debug")
    
    app.run(debug=True, host='0.0.0.0', port=5000)