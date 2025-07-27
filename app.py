from flask import Flask, jsonify, render_template
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
    
    # Register blueprints for API routes
    register_blueprints(app)
    
    # Register frontend routes
    register_frontend_routes(app)
    
    print("✅ All routes registered")
    print(f"📊 Total routes: {len(app.url_map._rules)}")
    
    return app

def register_blueprints(app):
    """Register all API blueprints"""
    print("📋 Registering API blueprints...")
    
    # Import blueprints
    from app.routes.auth import auth_bp
    from app.routes.user import user_bp
    from app.routes.admin import admin_bp
    
    # Register blueprints with URL prefixes
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(user_bp, url_prefix='/api/user')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    
    print("✅ API Blueprints registered")

def register_frontend_routes(app):
    """Register frontend routes for the Vue.js SPA"""
    print("🌐 Registering frontend routes...")
    
    @app.route('/')
    def index():
        """Main application entry point"""
        return render_template('index.html')
    
    @app.route('/login')
    def login_page():
        """Login page route"""
        return render_template('index.html')
    
    @app.route('/register')
    def register_page():
        """Registration page route"""
        return render_template('index.html')
    
    @app.route('/user/<path:path>')
    def user_routes(path):
        """User dashboard routes"""
        return render_template('index.html')
    
    @app.route('/admin/<path:path>')
    def admin_routes(path):
        """Admin dashboard routes"""
        return render_template('index.html')
    
    # API health check endpoint
    @app.route('/api/health')
    def health_check():
        return jsonify({
            'status': 'healthy', 
            'message': 'Vehicle Parking API is running',
            'version': '4.0',
            'frontend': 'enabled'
        })
    
    # Debug endpoint
    @app.route('/debug')
    def debug():
        return jsonify({
            'message': 'DEBUG: Vehicle Parking App with Frontend!',
            'total_routes': len(app.url_map._rules),
            'registered_blueprints': [bp.name for bp in app.blueprints.values()],
            'api_endpoints': {
                'health': '/api/health',
                'auth': '/api/auth/*',
                'user': '/api/user/*',
                'admin': '/api/admin/*'
            },
            'frontend_routes': {
                'main': '/',
                'login': '/login',
                'register': '/register',
                'user_dashboard': '/user/*',
                'admin_dashboard': '/admin/*'
            }
        })
    
    # API info endpoint
    @app.route('/api')
    def api_info():
        return jsonify({
            'message': 'Vehicle Parking App API',
            'status': 'running',
            'version': '4.0',
            'endpoints': {
                'health': '/api/health',
                'auth': {
                    'login': 'POST /api/auth/login',
                    'register': 'POST /api/auth/register',
                    'profile': 'GET /api/auth/profile'
                },
                'user': {
                    'dashboard': 'GET /api/user/dashboard',
                    'parking_lots': 'GET /api/user/parking-lots',
                    'reserve_spot': 'POST /api/user/reserve-spot',
                    'occupy_spot': 'POST /api/user/occupy-spot/<id>',
                    'release_spot': 'POST /api/user/release-spot/<id>',
                    'parking_history': 'GET /api/user/parking-history',
                    'active_reservation': 'GET /api/user/active-reservation',
                    'analytics': 'GET /api/user/analytics/charts/personal'
                },
                'admin': {
                    'dashboard': 'GET /api/admin/dashboard',
                    'parking_lots': 'GET /api/admin/parking-lots',
                    'create_lot': 'POST /api/admin/parking-lots',
                    'users': 'GET /api/admin/users',
                    'reservations': 'GET /api/admin/reservations',
                    'analytics': 'GET /api/admin/analytics/revenue'
                }
            }
        })
    
    print("✅ Frontend routes registered")

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
            
            # Create sample parking lots with Indian locations
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

# Error handlers
@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors - redirect to frontend for SPA routing"""
    if request.path.startswith('/api/'):
        # API endpoints should return JSON 404
        return jsonify({'error': 'API endpoint not found'}), 404
    else:
        # Frontend routes should serve the SPA
        return render_template('index.html')

@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    if request.path.startswith('/api/'):
        return jsonify({'error': 'Internal server error'}), 500
    else:
        return render_template('index.html')

# Context processor to inject configuration into templates
@app.context_processor
def inject_config():
    """Inject configuration variables into templates"""
    return {
        'APP_NAME': 'Vehicle Parking System',
        'VERSION': '4.0',
        'API_BASE_URL': '/api',
        'DEBUG': app.debug
    }

if __name__ == '__main__':
    print("🔄 Initializing Vehicle Parking App with Frontend...")
    
    # Initialize database
    init_database(app)
    
    print("\n" + "="*60)
    print("🚀 VEHICLE PARKING SYSTEM - READY TO LAUNCH!")
    print("="*60)
    print("🌐 Frontend Access:")
    print("   Main App:        http://localhost:5000")
    print("   Login:           http://localhost:5000/login")
    print("   Register:        http://localhost:5000/register")
    print("")
    print("🔐 Demo Credentials:")
    print("   Admin:   admin@parking.com / admin123")
    print("   User:    user@test.com / user123")
    print("")
    print("🔌 API Endpoints:")
    print("   Health Check:    http://localhost:5000/api/health")
    print("   API Info:        http://localhost:5000/api")
    print("   Auth Test:       http://localhost:5000/api/auth/test")
    print("   User Test:       http://localhost:5000/api/user/test")
    print("   Admin Test:      http://localhost:5000/api/admin/test")
    print("")
    print("🐛 Debug Info:")
    print("   Debug Endpoint:  http://localhost:5000/debug")
    print("")
    print("🎯 Next Steps:")
    print("   1. Open http://localhost:5000 in your browser")
    print("   2. You'll be redirected to the login page")
    print("   3. Use demo credentials to test authentication")
    print("   4. Verify the beautiful UI and smooth functionality!")
    print("="*60)
    
    # Import request for error handlers
    from flask import request
    
    app.run(debug=True, host='0.0.0.0', port=5000)