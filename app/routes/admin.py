from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from app.models import db
from app.models.user import User
from app.models.parking_lot import ParkingLot
from app.models.parking_spot import ParkingSpot
from app.models.reservation import Reservation

admin_bp = Blueprint('admin', __name__)

def require_admin():
    """Helper function to get current user and verify admin privileges"""
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    
    if not user:
        return None, jsonify({'error': 'User not found'}), 404
    
    if not user.is_active:
        return None, jsonify({'error': 'Account is inactive'}), 401
    
    if not user.is_admin:
        return None, jsonify({'error': 'Admin access required'}), 403
    
    return user, None, None

@admin_bp.route('/dashboard', methods=['GET'])
@jwt_required()
def admin_dashboard():
    """Get admin dashboard with system overview"""
    try:
        admin, error_response, status_code = require_admin()
        if error_response:
            return error_response, status_code
        
        # Get system statistics
        total_users = User.query.filter_by(is_admin=False).count()
        total_lots = ParkingLot.query.filter_by(is_active=True).count()
        total_spots = ParkingSpot.query.filter_by(is_active=True).count()
        occupied_spots = ParkingSpot.query.filter_by(is_occupied=True, is_active=True).count()
        total_reservations = Reservation.query.count()
        active_reservations = Reservation.query.filter_by(status='active').count()
        
        # Get recent reservations
        recent_reservations = Reservation.query.order_by(
            Reservation.created_at.desc()
        ).limit(10).all()
        
        # Calculate total revenue
        completed_reservations = Reservation.query.filter_by(status='completed').all()
        total_revenue = sum(res.total_cost for res in completed_reservations if res.total_cost)
        
        return jsonify({
            'admin': admin.to_dict(),
            'statistics': {
                'total_users': total_users,
                'total_parking_lots': total_lots,
                'total_parking_spots': total_spots,
                'occupied_spots': occupied_spots,
                'available_spots': total_spots - occupied_spots,
                'occupancy_rate': round((occupied_spots / total_spots * 100), 2) if total_spots > 0 else 0,
                'total_reservations': total_reservations,
                'active_reservations': active_reservations,
                'total_revenue': total_revenue
            },
            'recent_reservations': [res.to_dict() for res in recent_reservations]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/parking-lots', methods=['GET'])
@jwt_required()
def get_all_parking_lots():
    """Get all parking lots with detailed information"""
    try:
        admin, error_response, status_code = require_admin()
        if error_response:
            return error_response, status_code
        
        lots = ParkingLot.query.all()
        
        lots_data = []
        for lot in lots:
            lot_dict = lot.to_dict()
            # Add detailed spot statistics
            total_spots = len(lot.parking_spots)
            active_spots = len([s for s in lot.parking_spots if s.is_active])
            occupied_spots = len([s for s in lot.parking_spots if s.is_occupied and s.is_active])
            
            lot_dict.update({
                'total_spots_actual': total_spots,
                'active_spots': active_spots,
                'occupied_spots_actual': occupied_spots,
                'revenue_today': 0,  # TODO: Calculate daily revenue
                'spot_details': [spot.to_dict() for spot in lot.parking_spots]
            })
            lots_data.append(lot_dict)
        
        return jsonify({
            'parking_lots': lots_data,
            'total_lots': len(lots_data)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/parking-lots', methods=['POST'])
@jwt_required()
def create_parking_lot():
    """Create a new parking lot with auto-generated spots"""
    try:
        admin, error_response, status_code = require_admin()
        if error_response:
            return error_response, status_code
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        required_fields = ['name', 'address', 'pin_code', 'total_spots', 'price_per_hour']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Check if parking lot name already exists
        existing_lot = ParkingLot.query.filter_by(name=data['name']).first()
        if existing_lot:
            return jsonify({'error': 'Parking lot with this name already exists'}), 400
        
        # Create parking lot
        parking_lot = ParkingLot(
            name=data['name'],
            address=data['address'],
            pin_code=data['pin_code'],
            total_spots=int(data['total_spots']),
            price_per_hour=float(data['price_per_hour'])
        )
        
        db.session.add(parking_lot)
        db.session.commit()
        
        # Auto-generate parking spots
        spot_prefix = parking_lot.name[0].upper()  # First letter of name
        spots_created = []
        
        for i in range(1, parking_lot.total_spots + 1):
            spot = ParkingSpot(
                lot_id=parking_lot.id,
                spot_number=f"{spot_prefix}{i:03d}"  # e.g., M001, M002
            )
            db.session.add(spot)
            spots_created.append(spot.spot_number)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Parking lot created successfully',
            'parking_lot': parking_lot.to_dict(),
            'spots_created': len(spots_created),
            'spot_numbers': spots_created[:5] + ['...'] if len(spots_created) > 5 else spots_created
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/parking-lots/<int:lot_id>', methods=['PUT'])
@jwt_required()
def update_parking_lot(lot_id):
    """Update an existing parking lot"""
    try:
        admin, error_response, status_code = require_admin()
        if error_response:
            return error_response, status_code
        
        lot = ParkingLot.query.get(lot_id)
        if not lot:
            return jsonify({'error': 'Parking lot not found'}), 404
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Update allowed fields
        updateable_fields = ['name', 'address', 'pin_code', 'price_per_hour', 'is_active']
        updated_fields = []
        
        for field in updateable_fields:
            if field in data:
                setattr(lot, field, data[field])
                updated_fields.append(field)
        
        lot.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Parking lot updated successfully',
            'parking_lot': lot.to_dict(),
            'updated_fields': updated_fields
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/parking-lots/<int:lot_id>', methods=['DELETE'])
@jwt_required()
def delete_parking_lot(lot_id):
    """Delete a parking lot (only if all spots are empty)"""
    try:
        admin, error_response, status_code = require_admin()
        if error_response:
            return error_response, status_code
        
        lot = ParkingLot.query.get(lot_id)
        if not lot:
            return jsonify({'error': 'Parking lot not found'}), 404
        
        # Check if any spots are occupied
        occupied_spots = ParkingSpot.query.filter_by(
            lot_id=lot_id, 
            is_occupied=True
        ).count()
        
        if occupied_spots > 0:
            return jsonify({
                'error': f'Cannot delete parking lot. {occupied_spots} spots are currently occupied.'
            }), 400
        
        # Delete all spots first (cascade should handle this, but being explicit)
        ParkingSpot.query.filter_by(lot_id=lot_id).delete()
        
        # Delete the parking lot
        db.session.delete(lot)
        db.session.commit()
        
        return jsonify({
            'message': 'Parking lot deleted successfully',
            'deleted_lot_id': lot_id
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/users', methods=['GET'])
@jwt_required()
def get_all_users():
    """Get all users with their activity details"""
    try:
        admin, error_response, status_code = require_admin()
        if error_response:
            return error_response, status_code
        
        users = User.query.filter_by(is_admin=False).all()
        
        users_data = []
        for user in users:
            user_dict = user.to_dict()
            
            # Add user statistics
            total_reservations = Reservation.query.filter_by(user_id=user.id).count()
            active_reservation = Reservation.query.filter_by(
                user_id=user.id, 
                status='active'
            ).first()
            
            completed_reservations = Reservation.query.filter_by(
                user_id=user.id, 
                status='completed'
            ).all()
            total_spent = sum(res.total_cost for res in completed_reservations if res.total_cost)
            
            user_dict.update({
                'total_reservations': total_reservations,
                'active_reservation': active_reservation.to_dict() if active_reservation else None,
                'total_spent': total_spent,
                'last_activity': user.updated_at.isoformat() if user.updated_at else None
            })
            users_data.append(user_dict)
        
        return jsonify({
            'users': users_data,
            'total_users': len(users_data)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/users/<int:user_id>/toggle-status', methods=['POST'])
@jwt_required()
def toggle_user_status(user_id):
    """Activate/deactivate a user account"""
    try:
        admin, error_response, status_code = require_admin()
        if error_response:
            return error_response, status_code
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        if user.is_admin:
            return jsonify({'error': 'Cannot modify admin user status'}), 400
        
        # Toggle status
        user.is_active = not user.is_active
        user.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': f'User {"activated" if user.is_active else "deactivated"} successfully',
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/reservations', methods=['GET'])
@jwt_required()
def get_all_reservations():
    """Get all reservations with filtering options"""
    try:
        admin, error_response, status_code = require_admin()
        if error_response:
            return error_response, status_code
        
        # Get query parameters for filtering
        status = request.args.get('status')  # active, completed, reserved
        lot_id = request.args.get('lot_id', type=int)
        user_id = request.args.get('user_id', type=int)
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        # Build query
        query = Reservation.query
        
        if status:
            query = query.filter_by(status=status)
        if lot_id:
            query = query.join(ParkingSpot).filter(ParkingSpot.lot_id == lot_id)
        if user_id:
            query = query.filter_by(user_id=user_id)
        
        # Paginate results
        reservations = query.order_by(Reservation.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'reservations': [res.to_dict() for res in reservations.items],
            'pagination': {
                'page': page,
                'pages': reservations.pages,
                'per_page': per_page,
                'total': reservations.total,
                'has_next': reservations.has_next,
                'has_prev': reservations.has_prev
            },
            'filters_applied': {
                'status': status,
                'lot_id': lot_id,
                'user_id': user_id
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/spots/<int:spot_id>/force-release', methods=['POST'])
@jwt_required()
def force_release_spot(spot_id):
    """Admin force release a parking spot"""
    try:
        admin, error_response, status_code = require_admin()
        if error_response:
            return error_response, status_code
        
        spot = ParkingSpot.query.get(spot_id)
        if not spot:
            return jsonify({'error': 'Parking spot not found'}), 404
        
        if not spot.is_occupied:
            return jsonify({'error': 'Spot is not currently occupied'}), 400
        
        # Find active reservation for this spot
        active_reservation = Reservation.query.filter_by(
            spot_id=spot_id,
            status='active'
        ).first()
        
        if active_reservation:
            # End the reservation
            active_reservation.end_parking()
            
        # Release the spot
        spot.release_spot()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Spot force released successfully',
            'spot': spot.to_dict(),
            'reservation': active_reservation.to_dict() if active_reservation else None
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/test', methods=['GET'])
def test_admin_routes():
    """Test endpoint to verify admin routes are working"""
    return jsonify({
        'message': 'Admin routes are working!',
        'available_endpoints': [
            'GET /api/admin/dashboard',
            'GET /api/admin/parking-lots',
            'POST /api/admin/parking-lots',
            'PUT /api/admin/parking-lots/<id>',
            'DELETE /api/admin/parking-lots/<id>',
            'GET /api/admin/users',
            'POST /api/admin/users/<id>/toggle-status',
            'GET /api/admin/reservations',
            'POST /api/admin/spots/<id>/force-release',
            'GET /api/admin/test'
        ]
    }), 200