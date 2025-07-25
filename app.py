from flask import Flask, jsonify
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from datetime import timedelta
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize extensions (but don't bind to app yet)
from app.models import db
jwt = JWTManager()

def create_app():
    """Application factory pattern"""
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
    CORS(app, resources={r"/api/*": {"origins": "*"}}, 
         methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
         allow_headers=['Content-Type', 'Authorization'])
    print("✅ Extensions initialized")
    
    # Register blueprints
    register_blueprints(app)
    
    # Main application routes (keep these minimal)
    @app.route('/')
    def index():
        return jsonify({
            'message': 'Vehicle Parking App API',
            'status': 'running',
            'version': '4.0',
            'endpoints': {
                'health': '/api/health',
                'auth': '/api/auth/*',
                'user': '/api/user/*',
                'admin': '/api/admin/*',
                'parking': '/api/parking/*'
            }
        })
    
    @app.route('/api/health')
    def health_check():
        return jsonify({
            'status': 'healthy', 
            'message': 'Vehicle Parking API is running',
            'version': '4.0'
        })
    
    @app.route('/debug')
    def debug():
        return jsonify({
            'message': 'DEBUG: User routes now active!',
            'total_routes': len(app.url_map._rules),
            'registered_blueprints': [bp.name for bp in app.blueprints.values()]
        })
    
    print("✅ All routes registered")
    print(f"📊 Total routes: {len(app.url_map._rules)}")
    
    return app

def register_blueprints(app):
    """Register all application blueprints"""
    print("📋 Registering blueprints...")
    
    # Import blueprints
    from app.routes.auth import auth_bp
    from app.routes.user import user_bp
    from app.routes.admin import admin_bp
    
    # Register blueprints with URL prefixes
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(user_bp, url_prefix='/api/user')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    
    print("✅ Blueprints registered")

def init_database(app):
    """Initialize database with tables and sample data"""
    with app.app_context():
        try:
            # Import all models to ensure they're registered
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
            
            sample_lots = [
            {
                'name': 'Downtown Mall',
                'address': 'Forum Mall, Koramangala, Bangalore',
                'pin_code': '560034',
                'total_spots': 50,
                'price_per_hour': 50.0    # ₹50/hour (typical mall parking)
            },
            {
                'name': 'Airport Parking',
                'address': 'Kempegowda International Airport, Bangalore',
                'pin_code': '560300',
                'total_spots': 100,
                'price_per_hour': 100.0   # ₹100/hour (airport premium)
            },
            {
                'name': 'Metro Station',
                'address': 'MG Road Metro Station, Bangalore',
                'pin_code': '560001',
                'total_spots': 30,
                'price_per_hour': 20.0    # ₹20/hour (government metro parking)
            },
            {
                'name': 'IT Park',
                'address': 'Electronic City, Bangalore',
                'pin_code': '560100',
                'total_spots': 200,
                'price_per_hour': 30.0    # ₹30/hour (office complex)
            },
            {
                'name': 'Commercial Street',
                'address': 'Commercial Street, Brigade Road, Bangalore',
                'pin_code': '560001',
                'total_spots': 25,
                'price_per_hour': 40.0    # ₹40/hour (premium shopping area)
            }
        ]
            
            
            
            for lot_data in sample_lots:
                existing_lot = ParkingLot.query.filter_by(name=lot_data['name']).first()
                if not existing_lot:
                    lot = ParkingLot(
                        name=lot_data['name'],
                        address=lot_data['address'],
                        pin_code=lot_data['pin_code'],
                        total_spots=lot_data['total_spots'],
                        price_per_hour=lot_data['price_per_hour']
                    )
                    db.session.add(lot)
                    db.session.commit()
                    
                    # Auto-generate parking spots for each lot
                    for i in range(1, lot.total_spots + 1):
                        spot = ParkingSpot(
                            lot_id=lot.id,
                            spot_number=f"{lot.name[0]}{i:03d}"  # e.g., D001, A001, M001
                        )
                        db.session.add(spot)
                    
                    print(f"✅ Created {lot_data['name']} with {lot_data['total_spots']} spots!")
            
            db.session.commit()
            print("✅ Database initialization complete!")
            
        except Exception as e:
            print(f"⚠️  Database initialization error: {e}")
            db.session.rollback()

# Create app instance
app = create_app()

if __name__ == '__main__':
    print("🔄 Initializing Vehicle Parking App...")
    
    # Initialize database
    init_database(app)
    
    print("🚀 Starting Vehicle Parking App...")
    print("🌐 Admin credentials: admin@parking.com / admin123")
    print("👤 Test user: user@test.com / user123")
    print("📍 Access: http://localhost:5000")
    print("🧪 Auth Test: http://localhost:5000/api/auth/test")
    print("👤 User Test: http://localhost:5000/api/user/test")
    print("🐛 Debug: http://localhost:5000/debug")
    
    app.run(debug=True, host='0.0.0.0', port=5000)