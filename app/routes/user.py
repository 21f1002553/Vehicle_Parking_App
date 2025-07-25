from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from sqlalchemy import func, desc
from app.models import db
from app.models.user import User
from app.models.parking_lot import ParkingLot
from app.models.parking_spot import ParkingSpot
from app.models.reservation import Reservation

user_bp = Blueprint('user', __name__)

def require_user():
    """Helper function to get current user and verify they're not admin"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return None, jsonify({'error': 'User not found'}), 404
    
    if not user.is_active:
        return None, jsonify({'error': 'Account is inactive'}), 401
    
    return user, None, None

@user_bp.route('/dashboard', methods=['GET'])
@jwt_required()
def dashboard():
    """Get user dashboard data"""
    try:
        user, error_response, status_code = require_user()
        if error_response:
            return error_response, status_code
        
        # Get user's active reservations
        active_reservations = Reservation.query.filter_by(
            user_id=user.id, 
            status='active'
        ).all()
        
        # Get user's recent reservation history
        recent_reservations = Reservation.query.filter_by(
            user_id=user.id
        ).order_by(Reservation.created_at.desc()).limit(5).all()
        
        # Get available parking lots
        available_lots = ParkingLot.query.filter_by(is_active=True).all()
        
        return jsonify({
            'user': user.to_dict(),
            'active_reservations': [res.to_dict() for res in active_reservations],
            'recent_reservations': [res.to_dict() for res in recent_reservations],
            'available_lots': [lot.to_dict() for lot in available_lots]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@user_bp.route('/parking-lots', methods=['GET'])
@jwt_required()
def get_available_lots():
    """Get all available parking lots with spot availability"""
    try:
        user, error_response, status_code = require_user()
        if error_response:
            return error_response, status_code
        
        lots = ParkingLot.query.filter_by(is_active=True).all()
        
        lots_data = []
        for lot in lots:
            lot_dict = lot.to_dict()
            lot_dict['available_spots_details'] = [
                spot.to_dict() for spot in lot.parking_spots 
                if not spot.is_occupied and spot.is_active
            ]
            lots_data.append(lot_dict)
        
        return jsonify({
            'parking_lots': lots_data,
            'total_lots': len(lots_data)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@user_bp.route('/reserve-spot', methods=['POST'])
@jwt_required()
def reserve_spot():
    """Reserve a parking spot (auto-allocation)"""
    try:
        user, error_response, status_code = require_user()
        if error_response:
            return error_response, status_code
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        lot_id = data.get('lot_id')
        vehicle_number = data.get('vehicle_number')
        
        if not lot_id or not vehicle_number:
            return jsonify({'error': 'lot_id and vehicle_number are required'}), 400
        
        # Check if user has active reservation
        active_reservation = Reservation.query.filter_by(
            user_id=user.id, 
            status='active'
        ).first()
        
        if active_reservation:
            return jsonify({'error': 'You already have an active reservation'}), 400
        
        # Find parking lot
        lot = ParkingLot.query.get(lot_id)
        if not lot or not lot.is_active:
            return jsonify({'error': 'Parking lot not found or inactive'}), 404
        
        # Auto-allocate first available spot
        available_spot = ParkingSpot.query.filter_by(
            lot_id=lot_id,
            is_occupied=False,
            is_active=True
        ).first()
        
        if not available_spot:
            return jsonify({'error': 'No available spots in this parking lot'}), 400
        
        # Create reservation
        reservation = Reservation(
            user_id=user.id,
            spot_id=available_spot.id,
            vehicle_number=vehicle_number,
            status='reserved',
            hourly_rate=lot.price_per_hour
        )
        
        db.session.add(reservation)
        db.session.commit()
        
        return jsonify({
            'message': 'Spot reserved successfully',
            'reservation': reservation.to_dict(),
            'spot': available_spot.to_dict(),
            'lot': lot.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@user_bp.route('/occupy-spot/<int:reservation_id>', methods=['POST'])
@jwt_required()
def occupy_spot(reservation_id):
    """Mark spot as occupied (start parking)"""
    try:
        user, error_response, status_code = require_user()
        if error_response:
            return error_response, status_code
        
        # Find reservation
        reservation = Reservation.query.filter_by(
            id=reservation_id,
            user_id=user.id,
            status='reserved'
        ).first()
        
        if not reservation:
            return jsonify({'error': 'Reservation not found or not in reserved status'}), 404
        
        # Get parking spot
        spot = ParkingSpot.query.get(reservation.spot_id)
        if not spot:
            return jsonify({'error': 'Parking spot not found'}), 404
        
        # Start parking
        reservation.start_parking()
        spot.occupy_spot(reservation.vehicle_number)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Parking started successfully',
            'reservation': reservation.to_dict(),
            'spot': spot.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@user_bp.route('/release-spot/<int:reservation_id>', methods=['POST'])
@jwt_required()
def release_spot(reservation_id):
    """Release spot (end parking and calculate cost)"""
    try:
        user, error_response, status_code = require_user()
        if error_response:
            return error_response, status_code
        
        # Find active reservation
        reservation = Reservation.query.filter_by(
            id=reservation_id,
            user_id=user.id,
            status='active'
        ).first()
        
        if not reservation:
            return jsonify({'error': 'Active reservation not found'}), 404
        
        # Get parking spot
        spot = ParkingSpot.query.get(reservation.spot_id)
        if not spot:
            return jsonify({'error': 'Parking spot not found'}), 404
        
        # End parking
        reservation.end_parking()
        spot.release_spot()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Parking ended successfully',
            'reservation': reservation.to_dict(),
            'total_cost': reservation.total_cost,
            'duration_hours': round(
                (reservation.parking_end_time - reservation.parking_start_time).total_seconds() / 3600, 2
            ) if reservation.parking_end_time and reservation.parking_start_time else 0
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@user_bp.route('/parking-history', methods=['GET'])
@jwt_required()
def parking_history():
    """Get user's complete parking history"""
    try:
        user, error_response, status_code = require_user()
        if error_response:
            return error_response, status_code
        
        # Get pagination parameters
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        
        # Get user's reservations with pagination
        reservations = Reservation.query.filter_by(
            user_id=user.id
        ).order_by(Reservation.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        # Calculate total cost and statistics
        all_reservations = Reservation.query.filter_by(user_id=user.id).all()
        total_cost = sum(res.total_cost for res in all_reservations if res.total_cost)
        total_sessions = len(all_reservations)
        completed_sessions = len([res for res in all_reservations if res.status == 'completed'])
        
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
            'statistics': {
                'total_cost': total_cost,
                'total_sessions': total_sessions,
                'completed_sessions': completed_sessions,
                'active_sessions': total_sessions - completed_sessions
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@user_bp.route('/parking-history/detailed', methods=['GET'])
@jwt_required()
def detailed_parking_history():
    """Get user's detailed parking history with cost breakdown"""
    try:
        user, error_response, status_code = require_user()
        if error_response:
            return error_response, status_code
        
        # Get pagination and filter parameters
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        status_filter = request.args.get('status')  # completed, active, reserved
        lot_id = request.args.get('lot_id', type=int)
        
        # Build query
        query = Reservation.query.filter_by(user_id=user.id)
        
        if status_filter:
            query = query.filter_by(status=status_filter)
        
        if lot_id:
            query = query.join(ParkingSpot).filter(ParkingSpot.lot_id == lot_id)
        
        # Get paginated results with lot and spot details
        reservations = query.order_by(desc(Reservation.created_at)).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        # Enhanced reservation data with cost breakdown
        detailed_reservations = []
        for res in reservations.items:
            spot = ParkingSpot.query.get(res.spot_id)
            lot = ParkingLot.query.get(spot.lot_id) if spot else None
            
            # Calculate detailed cost breakdown
            cost_breakdown = calculate_cost_breakdown(res)
            
            reservation_data = {
                **res.to_dict(),
                'spot_details': spot.to_dict() if spot else None,
                'lot_details': lot.to_dict() if lot else None,
                'cost_breakdown': cost_breakdown,
                'duration_formatted': format_duration(res.parking_start_time, res.parking_end_time)
            }
            detailed_reservations.append(reservation_data)
        
        # Calculate comprehensive statistics
        stats = calculate_user_statistics(user.id)
        
        return jsonify({
            'reservations': detailed_reservations,
            'pagination': {
                'page': page,
                'pages': reservations.pages,
                'per_page': per_page,
                'total': reservations.total,
                'has_next': reservations.has_next,
                'has_prev': reservations.has_prev
            },
            'statistics': stats,
            'filters': {
                'status': status_filter,
                'lot_id': lot_id
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@user_bp.route('/cost-summary', methods=['GET'])
@jwt_required()
def cost_summary():
    """Get detailed cost summary for user"""
    try:
        user, error_response, status_code = require_user()
        if error_response:
            return error_response, status_code
        
        # Get date range parameters
        days = request.args.get('days', 30, type=int)  # Last 30 days by default
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # Get reservations in date range
        reservations = Reservation.query.filter(
            Reservation.user_id == user.id,
            Reservation.created_at >= start_date,
            Reservation.status == 'completed'
        ).all()
        
        # Calculate cost summary
        cost_summary = {
            'period': f'Last {days} days',
            'start_date': start_date.isoformat(),
            'end_date': datetime.utcnow().isoformat(),
            'total_sessions': len(reservations),
            'total_cost': sum(res.total_cost for res in reservations if res.total_cost),
            'average_cost_per_session': 0,
            'total_hours_parked': 0,
            'average_hourly_rate': 0,
            'cost_by_lot': {},
            'daily_breakdown': {}
        }
        
        if reservations:
            # Calculate averages
            valid_costs = [res.total_cost for res in reservations if res.total_cost]
            if valid_costs:
                cost_summary['average_cost_per_session'] = round(sum(valid_costs) / len(valid_costs), 2)
            
            # Calculate total hours
            total_hours = 0
            for res in reservations:
                if res.parking_start_time and res.parking_end_time:
                    duration = res.parking_end_time - res.parking_start_time
                    hours = duration.total_seconds() / 3600
                    total_hours += hours
            
            cost_summary['total_hours_parked'] = round(total_hours, 2)
            
            if total_hours > 0:
                cost_summary['average_hourly_rate'] = round(cost_summary['total_cost'] / total_hours, 2)
            
            # Cost breakdown by lot
            for res in reservations:
                spot = ParkingSpot.query.get(res.spot_id)
                if spot:
                    lot = ParkingLot.query.get(spot.lot_id)
                    if lot:
                        lot_name = lot.name
                        if lot_name not in cost_summary['cost_by_lot']:
                            cost_summary['cost_by_lot'][lot_name] = {
                                'sessions': 0,
                                'total_cost': 0,
                                'total_hours': 0
                            }
                        
                        cost_summary['cost_by_lot'][lot_name]['sessions'] += 1
                        cost_summary['cost_by_lot'][lot_name]['total_cost'] += res.total_cost or 0
                        
                        if res.parking_start_time and res.parking_end_time:
                            duration = res.parking_end_time - res.parking_start_time
                            hours = duration.total_seconds() / 3600
                            cost_summary['cost_by_lot'][lot_name]['total_hours'] += hours
            
            # Daily breakdown
            daily_costs = {}
            for res in reservations:
                if res.parking_start_time:
                    date_key = res.parking_start_time.strftime('%Y-%m-%d')
                    if date_key not in daily_costs:
                        daily_costs[date_key] = {'sessions': 0, 'cost': 0}
                    daily_costs[date_key]['sessions'] += 1
                    daily_costs[date_key]['cost'] += res.total_cost or 0
            
            cost_summary['daily_breakdown'] = daily_costs
        
        return jsonify(cost_summary), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@user_bp.route('/active-reservation', methods=['GET'])
@jwt_required()
def get_active_reservation():
    """Get user's current active reservation"""
    try:
        user, error_response, status_code = require_user()
        if error_response:
            return error_response, status_code
        
        # Find active reservation
        active_reservation = Reservation.query.filter_by(
            user_id=user.id,
            status='active'
        ).first()
        
        if not active_reservation:
            # Check for reserved status too
            reserved_reservation = Reservation.query.filter_by(
                user_id=user.id,
                status='reserved'
            ).first()
            
            if reserved_reservation:
                spot = ParkingSpot.query.get(reserved_reservation.spot_id)
                return jsonify({
                    'reservation': reserved_reservation.to_dict(),
                    'spot': spot.to_dict() if spot else None,
                    'status': 'reserved'
                }), 200
            
            return jsonify({'message': 'No active reservation found'}), 404
        
        # Get spot and lot details
        spot = ParkingSpot.query.get(active_reservation.spot_id)
        lot = ParkingLot.query.get(spot.lot_id) if spot else None
        
        return jsonify({
            'reservation': active_reservation.to_dict(),
            'spot': spot.to_dict() if spot else None,
            'lot': lot.to_dict() if lot else None,
            'status': 'active'
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@user_bp.route('/test', methods=['GET'])
def test_user_routes():
    """Test endpoint to verify user routes are working"""
    return jsonify({
        'message': 'User routes are working!',
        'available_endpoints': [
            'GET /api/user/dashboard',
            'GET /api/user/parking-lots',
            'POST /api/user/reserve-spot',
            'POST /api/user/occupy-spot/<id>',
            'POST /api/user/release-spot/<id>',
            'GET /api/user/parking-history',
            'GET /api/user/parking-history/detailed',
            'GET /api/user/cost-summary',
            'GET /api/user/active-reservation',
            'GET /api/user/test'
        ]
    }), 200

# Helper functions
def calculate_cost_breakdown(reservation):
    """Calculate detailed cost breakdown for a reservation"""
    if not reservation.parking_start_time or not reservation.parking_end_time:
        return {
            'base_cost': 0,
            'duration_hours': 0,
            'hourly_rate': reservation.hourly_rate,
            'total_cost': 0,
            'breakdown_text': "Parking session not completed"
        }
    
    duration = reservation.parking_end_time - reservation.parking_start_time
    hours = duration.total_seconds() / 3600
    
    # Minimum 1 hour charge
    billable_hours = max(hours, 1.0)
    
    breakdown = {
        'actual_duration_hours': round(hours, 2),
        'billable_hours': round(billable_hours, 2),
        'hourly_rate': reservation.hourly_rate,
        'base_cost': round(billable_hours * reservation.hourly_rate, 2),
        'total_cost': reservation.total_cost,
        'minimum_charge_applied': hours < 1.0,
        'breakdown_text': f"{billable_hours:.2f} hours × ₨{reservation.hourly_rate}/hour = ₨{reservation.total_cost}"
    }
    
    return breakdown

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

def calculate_user_statistics(user_id):
    """Calculate comprehensive user statistics"""
    try:
        # Get all user reservations
        all_reservations = Reservation.query.filter_by(user_id=user_id).all()
        completed_reservations = [r for r in all_reservations if r.status == 'completed']
        
        stats = {
            'total_reservations': len(all_reservations),
            'completed_reservations': len(completed_reservations),
            'active_reservations': len([r for r in all_reservations if r.status == 'active']),
            'reserved_reservations': len([r for r in all_reservations if r.status == 'reserved']),
            'total_cost': sum(r.total_cost for r in completed_reservations if r.total_cost),
            'total_hours_parked': 0,
            'average_session_cost': 0,
            'average_session_duration': 0,
            'most_used_lot': None,
            'first_parking_date': None,
            'last_parking_date': None
        }
        
        if completed_reservations:
            # Calculate total hours and averages
            total_hours = 0
            valid_durations = []
            
            for res in completed_reservations:
                if res.parking_start_time and res.parking_end_time:
                    duration = res.parking_end_time - res.parking_start_time
                    hours = duration.total_seconds() / 3600
                    total_hours += hours
                    valid_durations.append(hours)
            
            stats['total_hours_parked'] = round(total_hours, 2)
            
            # Average session cost
            valid_costs = [r.total_cost for r in completed_reservations if r.total_cost]
            if valid_costs:
                stats['average_session_cost'] = round(sum(valid_costs) / len(valid_costs), 2)
            
            # Average session duration
            if valid_durations:
                stats['average_session_duration'] = round(sum(valid_durations) / len(valid_durations), 2)
            
            # Most used lot
            lot_usage = {}
            for res in all_reservations:
                spot = ParkingSpot.query.get(res.spot_id)
                if spot:
                    lot = ParkingLot.query.get(spot.lot_id)
                    if lot:
                        lot_name = lot.name
                        lot_usage[lot_name] = lot_usage.get(lot_name, 0) + 1
            
            if lot_usage:
                stats['most_used_lot'] = max(lot_usage, key=lot_usage.get)
            
            # First and last parking dates
            dates = [r.created_at for r in all_reservations if r.created_at]
            if dates:
                stats['first_parking_date'] = min(dates).isoformat()
                stats['last_parking_date'] = max(dates).isoformat()
        
        return stats
        
    except Exception as e:
        return {'error': f'Failed to calculate statistics: {str(e)}'}