from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from sqlalchemy import func, desc
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

@admin_bp.route('/reservations/detailed', methods=['GET'])
@jwt_required()
def get_detailed_reservations():
    """Get all reservations with detailed cost breakdown and analytics"""
    try:
        admin, error_response, status_code = require_admin()
        if error_response:
            return error_response, status_code
        
        # Get query parameters
        status = request.args.get('status')
        lot_id = request.args.get('lot_id', type=int)
        user_id = request.args.get('user_id', type=int)
        date_from = request.args.get('date_from')
        date_to = request.args.get('date_to')
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        # Build query with joins for better performance
        query = db.session.query(Reservation).join(User).join(ParkingSpot).join(ParkingLot)
        
        # Apply filters
        if status:
            query = query.filter(Reservation.status == status)
        if lot_id:
            query = query.filter(ParkingLot.id == lot_id)
        if user_id:
            query = query.filter(Reservation.user_id == user_id)
        
        # Date range filtering
        if date_from:
            try:
                date_from_obj = datetime.fromisoformat(date_from.replace('Z', '+00:00'))
                query = query.filter(Reservation.created_at >= date_from_obj)
            except ValueError:
                return jsonify({'error': 'Invalid date_from format. Use ISO format.'}), 400
        
        if date_to:
            try:
                date_to_obj = datetime.fromisoformat(date_to.replace('Z', '+00:00'))
                query = query.filter(Reservation.created_at <= date_to_obj)
            except ValueError:
                return jsonify({'error': 'Invalid date_to format. Use ISO format.'}), 400
        
        # Paginate results
        reservations_paginated = query.order_by(desc(Reservation.created_at)).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        # Build detailed reservation data
        detailed_reservations = []
        for res in reservations_paginated.items:
            user = User.query.get(res.user_id)
            spot = ParkingSpot.query.get(res.spot_id)
            lot = ParkingLot.query.get(spot.lot_id) if spot else None
            
            reservation_data = {
                **res.to_dict(),
                'user_details': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'full_name': user.full_name,
                    'phone': user.phone
                } if user else None,
                'spot_details': spot.to_dict() if spot else None,
                'lot_details': lot.to_dict() if lot else None,
                'cost_breakdown': calculate_admin_cost_breakdown(res),
                'duration_formatted': format_duration(res.parking_start_time, res.parking_end_time),
                'session_status': get_session_status(res)
            }
            detailed_reservations.append(reservation_data)
        
        return jsonify({
            'reservations': detailed_reservations,
            'pagination': {
                'page': page,
                'pages': reservations_paginated.pages,
                'per_page': per_page,
                'total': reservations_paginated.total,
                'has_next': reservations_paginated.has_next,
                'has_prev': reservations_paginated.has_prev
            },
            'filters_applied': {
                'status': status,
                'lot_id': lot_id,
                'user_id': user_id,
                'date_from': date_from,
                'date_to': date_to
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/analytics/revenue', methods=['GET'])
@jwt_required()
def revenue_analytics():
    """Get comprehensive revenue analytics"""
    try:
        admin, error_response, status_code = require_admin()
        if error_response:
            return error_response, status_code
        
        # Get time period (default: last 30 days)
        days = request.args.get('days', 30, type=int)
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # Get completed reservations in the period
        reservations = Reservation.query.filter(
            Reservation.status == 'completed',
            Reservation.parking_end_time >= start_date
        ).all()
        
        # Calculate revenue analytics
        analytics = {
            'period': f'Last {days} days',
            'start_date': start_date.isoformat(),
            'end_date': datetime.utcnow().isoformat(),
            'total_revenue': 0,
            'total_sessions': len(reservations),
            'average_revenue_per_session': 0,
            'total_hours_sold': 0,
            'revenue_by_lot': {},
            'revenue_by_day': {},
            'hourly_rate_analysis': {},
            'top_users': [],
            'peak_hours': {}
        }
        
        if reservations:
            # Calculate totals
            total_revenue = sum(res.total_cost for res in reservations if res.total_cost)
            analytics['total_revenue'] = round(total_revenue, 2)
            
            if len(reservations) > 0:
                analytics['average_revenue_per_session'] = round(total_revenue / len(reservations), 2)
            
            # Total hours sold
            total_hours = 0
            for res in reservations:
                if res.parking_start_time and res.parking_end_time:
                    duration = res.parking_end_time - res.parking_start_time
                    hours = duration.total_seconds() / 3600
                    total_hours += hours
            
            analytics['total_hours_sold'] = round(total_hours, 2)
            
            # Revenue by lot
            lot_revenue = {}
            lot_sessions = {}
            for res in reservations:
                spot = ParkingSpot.query.get(res.spot_id)
                if spot:
                    lot = ParkingLot.query.get(spot.lot_id)
                    if lot:
                        lot_name = lot.name
                        if lot_name not in lot_revenue:
                            lot_revenue[lot_name] = 0
                            lot_sessions[lot_name] = 0
                        
                        lot_revenue[lot_name] += res.total_cost or 0
                        lot_sessions[lot_name] += 1
            
            for lot_name in lot_revenue:
                analytics['revenue_by_lot'][lot_name] = {
                    'total_revenue': round(lot_revenue[lot_name], 2),
                    'sessions': lot_sessions[lot_name],
                    'average_per_session': round(lot_revenue[lot_name] / lot_sessions[lot_name], 2) if lot_sessions[lot_name] > 0 else 0
                }
            
            # Revenue by day
            daily_revenue = {}
            for res in reservations:
                if res.parking_end_time:
                    date_key = res.parking_end_time.strftime('%Y-%m-%d')
                    if date_key not in daily_revenue:
                        daily_revenue[date_key] = {'revenue': 0, 'sessions': 0}
                    daily_revenue[date_key]['revenue'] += res.total_cost or 0
                    daily_revenue[date_key]['sessions'] += 1
            
            analytics['revenue_by_day'] = daily_revenue
            
            # Top users by revenue
            user_revenue = {}
            for res in reservations:
                user_id = res.user_id
                if user_id not in user_revenue:
                    user_revenue[user_id] = {'revenue': 0, 'sessions': 0}
                user_revenue[user_id]['revenue'] += res.total_cost or 0
                user_revenue[user_id]['sessions'] += 1
            
            # Get top 5 users
            top_user_ids = sorted(user_revenue.keys(), key=lambda x: user_revenue[x]['revenue'], reverse=True)[:5]
            for user_id in top_user_ids:
                user = User.query.get(user_id)
                if user:
                    analytics['top_users'].append({
                        'user_id': user_id,
                        'username': user.username,
                        'email': user.email,
                        'total_revenue': round(user_revenue[user_id]['revenue'], 2),
                        'total_sessions': user_revenue[user_id]['sessions']
                    })
            
            # Peak hours analysis
            hour_usage = {}
            for res in reservations:
                if res.parking_start_time:
                    hour = res.parking_start_time.hour
                    if hour not in hour_usage:
                        hour_usage[hour] = {'sessions': 0, 'revenue': 0}
                    hour_usage[hour]['sessions'] += 1
                    hour_usage[hour]['revenue'] += res.total_cost or 0
            
            analytics['peak_hours'] = hour_usage
        
        return jsonify(analytics), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/analytics/occupancy', methods=['GET'])
@jwt_required()
def occupancy_analytics():
    """Get occupancy and usage analytics"""
    try:
        admin, error_response, status_code = require_admin()
        if error_response:
            return error_response, status_code
        
        # Current system status
        total_spots = ParkingSpot.query.filter_by(is_active=True).count()
        occupied_spots = ParkingSpot.query.filter_by(is_occupied=True, is_active=True).count()
        available_spots = total_spots - occupied_spots
        
        # Occupancy by lot
        lots = ParkingLot.query.filter_by(is_active=True).all()
        lot_occupancy = []
        
        for lot in lots:
            lot_total = len([s for s in lot.parking_spots if s.is_active])
            lot_occupied = len([s for s in lot.parking_spots if s.is_occupied and s.is_active])
            lot_available = lot_total - lot_occupied
            
            occupancy_rate = (lot_occupied / lot_total * 100) if lot_total > 0 else 0
            
            lot_occupancy.append({
                'lot_id': lot.id,
                'lot_name': lot.name,
                'total_spots': lot_total,
                'occupied_spots': lot_occupied,
                'available_spots': lot_available,
                'occupancy_rate': round(occupancy_rate, 2),
                'price_per_hour': lot.price_per_hour
            })
        
        # Historical occupancy (last 7 days)
        days_back = 7
        historical_data = []
        
        for i in range(days_back):
            date = datetime.utcnow() - timedelta(days=i)
            day_start = date.replace(hour=0, minute=0, second=0, microsecond=0)
            day_end = day_start + timedelta(days=1)
            
            # Count active sessions for that day
            active_sessions = Reservation.query.filter(
                Reservation.parking_start_time <= day_end,
                Reservation.parking_end_time >= day_start,
                Reservation.status == 'completed'
            ).count()
            
            historical_data.append({
                'date': day_start.strftime('%Y-%m-%d'),
                'active_sessions': active_sessions
            })
        
        analytics = {
            'current_status': {
                'total_spots': total_spots,
                'occupied_spots': occupied_spots,
                'available_spots': available_spots,
                'system_occupancy_rate': round((occupied_spots / total_spots * 100), 2) if total_spots > 0 else 0
            },
            'lot_breakdown': lot_occupancy,
            'historical_occupancy': list(reversed(historical_data)),  # Most recent first
            'efficiency_metrics': {
                'average_occupancy_rate': round(sum(lot['occupancy_rate'] for lot in lot_occupancy) / len(lot_occupancy), 2) if lot_occupancy else 0,
                'highest_occupancy_lot': max(lot_occupancy, key=lambda x: x['occupancy_rate']) if lot_occupancy else None,
                'lowest_occupancy_lot': min(lot_occupancy, key=lambda x: x['occupancy_rate']) if lot_occupancy else None
            }
        }
        
        return jsonify(analytics), 200
        
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
            'GET /api/admin/reservations/detailed',
            'GET /api/admin/analytics/revenue',
            'GET /api/admin/analytics/occupancy',
            'POST /api/admin/spots/<id>/force-release',
            'GET /api/admin/test'
        ]
    }), 200

# Helper functions for admin analytics
def calculate_admin_cost_breakdown(reservation):
    """Calculate detailed cost breakdown for admin view"""
    from app.routes.user import calculate_cost_breakdown  # Import to avoid circular import
    
    breakdown = calculate_cost_breakdown(reservation)  # Use existing function
    
    # Add admin-specific details
    if reservation.parking_start_time and reservation.parking_end_time:
        breakdown['admin_notes'] = {
            'reservation_created': reservation.reservation_time.isoformat() if reservation.reservation_time else None,
            'parking_started': reservation.parking_start_time.isoformat(),
            'parking_ended': reservation.parking_end_time.isoformat(),
            'time_between_reserve_and_start': str(reservation.parking_start_time - reservation.reservation_time) if reservation.reservation_time else None
        }
    
    return breakdown

def get_session_status(reservation):
    """Get detailed session status for admin view"""
    if reservation.status == 'completed':
        return {
            'status': 'completed',
            'description': 'Parking session completed successfully',
            'color': 'green'
        }
    elif reservation.status == 'active':
        # Check if it's been active for a long time
        if reservation.parking_start_time:
            duration = datetime.utcnow() - reservation.parking_start_time
            if duration.total_seconds() > 24 * 3600:  # More than 24 hours
                return {
                    'status': 'active_long',
                    'description': f'Active for {duration.days} days - may need attention',
                    'color': 'orange'
                }
        return {
            'status': 'active',
            'description': 'Currently parked',
            'color': 'blue'
        }
    elif reservation.status == 'reserved':
        # Check if reservation is old
        if reservation.reservation_time:
            duration = datetime.utcnow() - reservation.reservation_time
            if duration.total_seconds() > 2 * 3600:  # More than 2 hours
                return {
                    'status': 'reserved_stale',
                    'description': 'Reserved but not occupied - may be abandoned',
                    'color': 'red'
                }
        return {
            'status': 'reserved',
            'description': 'Reserved, waiting for occupancy',
            'color': 'yellow'
        }
    else:
        return {
            'status': reservation.status,
            'description': f'Status: {reservation.status}',
            'color': 'gray'
        }

def format_duration(start_time, end_time):
    """Format duration in human-readable format"""
    if not start_time or not end_time:
        return "N/A"
    
    duration = end_time - start_time
    total_seconds = int(duration.total_seconds())
    
    hours = total_seconds // 3600
    minutes = (total_seconds % 3600) // 60
    seconds = total_seconds % 60
    
    if hours > 0:
        return f"{hours}h {minutes}m {seconds}s"
    elif minutes > 0:
        return f"{minutes}m {seconds}s"
    else:
        return f"{seconds}s"