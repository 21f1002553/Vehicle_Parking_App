"""
Helper functions for the Vehicle Parking App
Shared utilities for cost calculations, formatting, and statistics
"""

from datetime import datetime
from app.models import db
from app.models.user import User
from app.models.parking_lot import ParkingLot
from app.models.parking_spot import ParkingSpot
from app.models.reservation import Reservation


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


def calculate_admin_cost_breakdown(reservation):
    """Calculate detailed cost breakdown for admin view"""
    breakdown = calculate_cost_breakdown(reservation)
    
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