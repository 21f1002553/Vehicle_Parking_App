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
        
        
        active_reservations = Reservation.query.filter_by(
            user_id=user.id, 
            status='active'
        ).all()
        
       
        recent_reservations = Reservation.query.filter_by(
            user_id=user.id
        ).order_by(Reservation.created_at.desc()).limit(5).all()
        
        

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
        
        
        active_reservation = Reservation.query.filter_by(
            user_id=user.id, 
            status='active'
        ).first()
        
        if active_reservation:
            return jsonify({'error': 'You already have an active reservation'}), 400
        
        
        lot = ParkingLot.query.get(lot_id)
        if not lot or not lot.is_active:
            return jsonify({'error': 'Parking lot not found or inactive'}), 404
        
        
        available_spot = ParkingSpot.query.filter_by(
            lot_id=lot_id,
            is_occupied=False,
            is_active=True
        ).first()
        
        if not available_spot:
            return jsonify({'error': 'No available spots in this parking lot'}), 400
        


        
        # reservation
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
        
        
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        

        reservations = Reservation.query.filter_by(
            user_id=user.id
        ).order_by(Reservation.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        # StatisticzZZZ
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
        
     
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        status_filter = request.args.get('status')   
        lot_id = request.args.get('lot_id', type=int)
        
      
        query = Reservation.query.filter_by(user_id=user.id)
        
        if status_filter:
            query = query.filter_by(status=status_filter)
        
        if lot_id:
            query = query.join(ParkingSpot).filter(ParkingSpot.lot_id == lot_id)
        
      
        reservations = query.order_by(desc(Reservation.created_at)).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
       
        detailed_reservations = []
        for res in reservations.items:
            spot = ParkingSpot.query.get(res.spot_id)
            lot = ParkingLot.query.get(spot.lot_id) if spot else None
            
            
            cost_breakdown = calculate_cost_breakdown(res)
            
            reservation_data = {
                **res.to_dict(),
                'spot_details': spot.to_dict() if spot else None,
                'lot_details': lot.to_dict() if lot else None,
                'cost_breakdown': cost_breakdown,
                'duration_formatted': format_duration(res.parking_start_time, res.parking_end_time)
            }
            detailed_reservations.append(reservation_data)
        
     
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
        
     
        days = request.args.get('days', 30, type=int)  
        start_date = datetime.utcnow() - timedelta(days=days)
        
        
        reservations = Reservation.query.filter(
            Reservation.user_id == user.id,
            Reservation.created_at >= start_date,
            Reservation.status == 'completed'
        ).all()
        
        #Cost summary
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
            # AverageZzzzzzz
            valid_costs = [res.total_cost for res in reservations if res.total_cost]
            if valid_costs:
                cost_summary['average_cost_per_session'] = round(sum(valid_costs) / len(valid_costs), 2)
            
            # Total hourszzz
            total_hours = 0
            for res in reservations:
                if res.parking_start_time and res.parking_end_time:
                    duration = res.parking_end_time - res.parking_start_time
                    hours = duration.total_seconds() / 3600
                    total_hours += hours
            
            cost_summary['total_hours_parked'] = round(total_hours, 2)
            
            if total_hours > 0:
                cost_summary['average_hourly_rate'] = round(cost_summary['total_cost'] / total_hours, 2)
            
            # Cost by lot
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
        
        
        active_reservation = Reservation.query.filter_by(
            user_id=user.id,
            status='active'
        ).first()
        
        if not active_reservation:
         
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



@user_bp.route('/analytics/charts/personal', methods=['GET'])
@jwt_required()
def get_personal_charts():
    """Get personal parking analytics charts for user dashboard"""
    try:
        user, error_response, status_code = require_user()
        if error_response:
            return error_response, status_code
        
       
        days = request.args.get('days', 90, type=int)
        start_date = datetime.utcnow() - timedelta(days=days)
        
  
        reservations = Reservation.query.filter(
            Reservation.user_id == user.id,
            Reservation.status == 'completed',
            Reservation.parking_end_time >= start_date
        ).all()
        
        # 1. Personal Spending Over Time 
        spending_by_day = {}
        sessions_by_day = {}
        for res in reservations:
            if res.parking_end_time:
                date_key = res.parking_end_time.strftime('%Y-%m-%d')
                spending_by_day[date_key] = spending_by_day.get(date_key, 0) + (res.total_cost or 0)
                sessions_by_day[date_key] = sessions_by_day.get(date_key, 0) + 1
        
      
        current_date = start_date
        while current_date <= datetime.utcnow():
            date_key = current_date.strftime('%Y-%m-%d')
            if date_key not in spending_by_day:
                spending_by_day[date_key] = 0
                sessions_by_day[date_key] = 0
            current_date += timedelta(days=1)
        

        sorted_spending = sorted(spending_by_day.items())
        
        # 2. Parking Lot Usage
        lot_usage = {}
        lot_spending = {}
        for res in reservations:
            spot = ParkingSpot.query.get(res.spot_id)
            if spot:
                lot = ParkingLot.query.get(spot.lot_id)
                if lot:
                    lot_name = lot.name
                    lot_usage[lot_name] = lot_usage.get(lot_name, 0) + 1
                    lot_spending[lot_name] = lot_spending.get(lot_name, 0) + (res.total_cost or 0)
        
        # 3. Parking Duration Distribution
        duration_brackets = {
            '0-1 hours': 0, '1-2 hours': 0, '2-4 hours': 0, 
            '4-8 hours': 0, '8+ hours': 0
        }
        
        for res in reservations:
            if res.parking_start_time and res.parking_end_time:
                duration = res.parking_end_time - res.parking_start_time
                hours = duration.total_seconds() / 3600
                
                if hours <= 1:
                    duration_brackets['0-1 hours'] += 1
                elif hours <= 2:
                    duration_brackets['1-2 hours'] += 1
                elif hours <= 4:
                    duration_brackets['2-4 hours'] += 1
                elif hours <= 8:
                    duration_brackets['4-8 hours'] += 1
                else:
                    duration_brackets['8+ hours'] += 1
        
        # 4. Weekly Pattern
        weekday_usage = {i: 0 for i in range(7)}  # 0=Monday, 6=Sunday
        weekday_spending = {i: 0 for i in range(7)}
        
        for res in reservations:
            if res.parking_start_time:
                weekday = res.parking_start_time.weekday()
                weekday_usage[weekday] += 1
                weekday_spending[weekday] += res.total_cost or 0
        
        weekday_names = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        
        # 5. Monthly Spending Trend 
        monthly_spending = {}
        for i in range(6):  # Last 6 months
            month_start = datetime.utcnow().replace(day=1) - timedelta(days=30 * i)
            month_key = month_start.strftime('%Y-%m')
            monthly_spending[month_key] = 0
        
        for res in reservations:
            if res.parking_end_time:
                month_key = res.parking_end_time.strftime('%Y-%m')
                if month_key in monthly_spending:
                    monthly_spending[month_key] += res.total_cost or 0
        
        # 6. Hourly Usage Pattern
        hourly_usage = {}
        for hour in range(24):
            hourly_usage[hour] = 0
        
        for res in reservations:
            if res.parking_start_time:
                hour = res.parking_start_time.hour
                hourly_usage[hour] += 1
        
       
        charts_data = {
            'spending_timeline': {
                'type': 'line',
                'title': 'My Parking Spending Over Time',
                'labels': [date for date, _ in sorted_spending],
                'datasets': [
                    {
                        'label': 'Daily Spending (₹)',
                        'data': [spending for _, spending in sorted_spending],
                        'borderColor': 'rgb(75, 192, 192)',
                        'backgroundColor': 'rgba(75, 192, 192, 0.2)',
                        'tension': 0.1,
                        'fill': True
                    }
                ]
            },
            
            'lot_usage': {
                'type': 'doughnut',
                'title': 'My Parking Lot Usage',
                'labels': list(lot_usage.keys()),
                'datasets': [
                    {
                        'label': 'Sessions',
                        'data': list(lot_usage.values()),
                        'backgroundColor': [
                            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
                            '#9966FF', '#FF9F40', '#FF6384', '#36A2EB'
                        ],
                        'borderWidth': 2
                    }
                ]
            },
            
            'duration_distribution': {
                'type': 'bar',
                'title': 'My Parking Duration Patterns',
                'labels': list(duration_brackets.keys()),
                'datasets': [
                    {
                        'label': 'Number of Sessions',
                        'data': list(duration_brackets.values()),
                        'backgroundColor': 'rgba(54, 162, 235, 0.8)',
                        'borderColor': 'rgb(54, 162, 235)',
                        'borderWidth': 1
                    }
                ]
            },
            
            'weekly_pattern': {
                'type': 'radar',
                'title': 'My Weekly Parking Pattern',
                'labels': weekday_names,
                'datasets': [
                    {
                        'label': 'Sessions per Day',
                        'data': [weekday_usage[i] for i in range(7)],
                        'borderColor': 'rgb(255, 99, 132)',
                        'backgroundColor': 'rgba(255, 99, 132, 0.2)',
                        'pointBackgroundColor': 'rgb(255, 99, 132)',
                        'pointBorderColor': '#fff'
                    }
                ]
            },
            
            'monthly_trend': {
                'type': 'line',
                'title': 'Monthly Spending Trend',
                'labels': sorted(monthly_spending.keys()),
                'datasets': [
                    {
                        'label': 'Monthly Spending (₹)',
                        'data': [monthly_spending[month] for month in sorted(monthly_spending.keys())],
                        'borderColor': 'rgb(153, 102, 255)',
                        'backgroundColor': 'rgba(153, 102, 255, 0.3)',
                        'fill': True,
                        'tension': 0.4
                    }
                ]
            },
            
            'hourly_pattern': {
                'type': 'bar',
                'title': 'My Parking Hours Preference',
                'labels': [f"{hour:02d}:00" for hour in range(24)],
                'datasets': [
                    {
                        'label': 'Sessions Started',
                        'data': [hourly_usage[hour] for hour in range(24)],
                        'backgroundColor': 'rgba(255, 206, 86, 0.8)',
                        'borderColor': 'rgb(255, 206, 86)',
                        'borderWidth': 1
                    }
                ]
            }
        }
        
        #statistics
        total_spent = sum(res.total_cost for res in reservations)
        total_sessions = len(reservations)
        avg_session_cost = round(total_spent / total_sessions, 2) if total_sessions > 0 else 0
        
        # total hours parked
        total_hours = 0
        for res in reservations:
            if res.parking_start_time and res.parking_end_time:
                duration = res.parking_end_time - res.parking_start_time
                total_hours += duration.total_seconds() / 3600
        
        # Most used lot
        most_used_lot = max(lot_usage, key=lot_usage.get) if lot_usage else None
        
        # Peak parking hour
        peak_hour = max(hourly_usage, key=hourly_usage.get) if any(hourly_usage.values()) else None
        
        # Favorite day
        favorite_day = max(weekday_usage, key=weekday_usage.get) if any(weekday_usage.values()) else None
        favorite_day_name = weekday_names[favorite_day] if favorite_day is not None else None
        
        summary_stats = {
            'total_spent': total_spent,
            'total_sessions': total_sessions,
            'avg_session_cost': avg_session_cost,
            'total_hours_parked': round(total_hours, 1),
            'avg_session_duration': round(total_hours / total_sessions, 1) if total_sessions > 0 else 0,
            'most_used_lot': most_used_lot,
            'most_used_lot_sessions': lot_usage[most_used_lot] if most_used_lot else 0,
            'peak_parking_hour': f"{peak_hour:02d}:00" if peak_hour is not None else None,
            'favorite_day': favorite_day_name,
            'period_days': days
        }
        
        return jsonify({
            'charts': charts_data,
            'summary': summary_stats,
            'period': f'Last {days} days',
            'generated_at': datetime.utcnow().isoformat()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@user_bp.route('/analytics/charts/cost-analysis', methods=['GET'])
@jwt_required()
def get_cost_analysis_charts():
    """Get detailed cost analysis charts for user"""
    try:
        user, error_response, status_code = require_user()
        if error_response:
            return error_response, status_code
        
        # Time period
        days = request.args.get('days', 90, type=int)
        start_date = datetime.utcnow() - timedelta(days=days)
        
        reservations = Reservation.query.filter(
            Reservation.user_id == user.id,
            Reservation.status == 'completed',
            Reservation.parking_end_time >= start_date
        ).all()
        
        # 1. Cost vs Duration Scatter Plot
        cost_duration_data = []
        for res in reservations:
            if res.parking_start_time and res.parking_end_time and res.total_cost:
                duration = res.parking_end_time - res.parking_start_time
                hours = duration.total_seconds() / 3600
                cost_duration_data.append({
                    'x': round(hours, 2),
                    'y': res.total_cost
                })
        
        # 2. Cost by Time of Day
        time_cost = {}
        for hour in range(24):
            time_cost[hour] = {'total_cost': 0, 'sessions': 0}
        
        for res in reservations:
            if res.parking_start_time and res.total_cost:
                hour = res.parking_start_time.hour
                time_cost[hour]['total_cost'] += res.total_cost
                time_cost[hour]['sessions'] += 1
        
        # average cost per hour
        avg_cost_by_hour = {}
        for hour in range(24):
            if time_cost[hour]['sessions'] > 0:
                avg_cost_by_hour[hour] = round(time_cost[hour]['total_cost'] / time_cost[hour]['sessions'], 2)
            else:
                avg_cost_by_hour[hour] = 0
        
        # 3. Efficiency Analysis
        lot_efficiency = {}
        for res in reservations:
            spot = ParkingSpot.query.get(res.spot_id)
            if spot and res.parking_start_time and res.parking_end_time:
                lot = ParkingLot.query.get(spot.lot_id)
                if lot:
                    lot_name = lot.name
                    if lot_name not in lot_efficiency:
                        lot_efficiency[lot_name] = {'total_cost': 0, 'total_hours': 0}
                    
                    duration = res.parking_end_time - res.parking_start_time
                    hours = max(duration.total_seconds() / 3600, 1)  
                    
                    lot_efficiency[lot_name]['total_cost'] += res.total_cost or 0
                    lot_efficiency[lot_name]['total_hours'] += hours
        
   
        for lot_name in lot_efficiency:
            if lot_efficiency[lot_name]['total_hours'] > 0:
                cost_per_hour = lot_efficiency[lot_name]['total_cost'] / lot_efficiency[lot_name]['total_hours']
                lot_efficiency[lot_name]['cost_per_hour'] = round(cost_per_hour, 2)
            else:
                lot_efficiency[lot_name]['cost_per_hour'] = 0
        
        # 4. Weekly Cost Comparison
        weekly_costs = {}
        for i in range(4):  
            week_start = datetime.utcnow() - timedelta(weeks=i+1)
            week_end = week_start + timedelta(days=7)
            week_key = f"Week {i+1}"
            weekly_costs[week_key] = 0
            
            for res in reservations:
                if res.parking_end_time and week_start <= res.parking_end_time <= week_end:
                    weekly_costs[week_key] += res.total_cost or 0
        
        charts_data = {
            'cost_vs_duration': {
                'type': 'scatter',
                'title': 'Cost vs Duration Analysis',
                'datasets': [
                    {
                        'label': 'Cost vs Hours',
                        'data': cost_duration_data,
                        'backgroundColor': 'rgba(255, 99, 132, 0.6)',
                        'borderColor': 'rgb(255, 99, 132)',
                        'pointRadius': 5
                    }
                ]
            },
            
            'cost_by_time': {
                'type': 'line',
                'title': 'Average Cost by Time of Day',
                'labels': [f"{hour:02d}:00" for hour in range(24)],
                'datasets': [
                    {
                        'label': 'Avg Cost per Session (₹)',
                        'data': [avg_cost_by_hour[hour] for hour in range(24)],
                        'borderColor': 'rgb(54, 162, 235)',
                        'backgroundColor': 'rgba(54, 162, 235, 0.2)',
                        'fill': True,
                        'tension': 0.4
                    }
                ]
            },
            
            'lot_efficiency': {
                'type': 'horizontalBar',
                'title': 'Cost Efficiency by Parking Lot',
                'labels': list(lot_efficiency.keys()),
                'datasets': [
                    {
                        'label': 'Cost per Hour (₹)',
                        'data': [lot_efficiency[lot]['cost_per_hour'] for lot in lot_efficiency],
                        'backgroundColor': 'rgba(75, 192, 192, 0.8)',
                        'borderColor': 'rgb(75, 192, 192)',
                        'borderWidth': 1
                    }
                ]
            },
            
            'weekly_comparison': {
                'type': 'bar',
                'title': 'Weekly Spending Comparison',
                'labels': list(reversed(list(weekly_costs.keys()))),
                'datasets': [
                    {
                        'label': 'Weekly Spending (₹)',
                        'data': list(reversed(list(weekly_costs.values()))),
                        'backgroundColor': [
                            'rgba(255, 206, 86, 0.8)',
                            'rgba(75, 192, 192, 0.8)', 
                            'rgba(153, 102, 255, 0.8)',
                            'rgba(255, 159, 64, 0.8)'
                        ],
                        'borderWidth': 1
                    }
                ]
            }
        }
        
        return jsonify({
            'charts': charts_data,
            'period': f'Last {days} days'
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
            'GET /api/user/analytics/charts/personal',
            'GET /api/user/analytics/charts/cost-analysis',
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