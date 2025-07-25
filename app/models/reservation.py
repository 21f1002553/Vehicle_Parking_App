from datetime import datetime
from app.models import db

class Reservation(db.Model):
    __tablename__ = 'reservations'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    spot_id = db.Column(db.Integer, db.ForeignKey('parking_spots.id'), nullable=False)
    vehicle_number = db.Column(db.String(20), nullable=False)
    status = db.Column(db.String(20), default='reserved', nullable=False)
    
    reservation_time = db.Column(db.DateTime, default=datetime.utcnow)
    parking_start_time = db.Column(db.DateTime, nullable=True)
    parking_end_time = db.Column(db.DateTime, nullable=True)
    
    hourly_rate = db.Column(db.Float, nullable=False)
    total_cost = db.Column(db.Float, default=0.0)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', backref='reservations', lazy=True)
    
    def start_parking(self):
        """Start parking session"""
        self.status = 'active'
        self.parking_start_time = datetime.utcnow()
        self.updated_at = datetime.utcnow()
    
    def end_parking(self):
        """End parking session with cost calculation"""
        if self.parking_start_time:
            self.parking_end_time = datetime.utcnow()
            self.status = 'completed'
            self.updated_at = datetime.utcnow()
            
            # Calculate cost
            duration = self.parking_end_time - self.parking_start_time
            hours = max(duration.total_seconds() / 3600, 1)  # Minimum 1 hour
            self.total_cost = round(hours * self.hourly_rate, 2)
    
    def get_duration_hours(self):
        """Calculate duration in hours"""
        if not self.parking_start_time or not self.parking_end_time:
            return 0.0
        duration = self.parking_end_time - self.parking_start_time
        return round(duration.total_seconds() / 3600, 2)
    
    def get_duration_minutes(self):
        """Calculate duration in minutes"""
        if not self.parking_start_time or not self.parking_end_time:
            return 0
        duration = self.parking_end_time - self.parking_start_time
        return int(duration.total_seconds() / 60)
    
    def get_base_cost(self):
        """Get base hourly rate"""
        return self.hourly_rate
    
    def format_duration(self):
        """Format duration in human-readable format"""
        if not self.parking_start_time or not self.parking_end_time:
            return "N/A"
        
        total_minutes = self.get_duration_minutes()
        hours = total_minutes // 60
        minutes = total_minutes % 60
        
        if hours > 0:
            return f"{hours}h {minutes}m"
        else:
            return f"{minutes}m"
    
    def get_cost_breakdown(self):
        """Get detailed cost breakdown for display"""
        if self.status != 'completed':
            return {
                'status': self.status,
                'message': 'Cost breakdown available only for completed reservations'
            }
        
        duration_hours = self.get_duration_hours()
        billable_hours = max(duration_hours, 1.0)
        
        return {
            'reservation_id': self.id,
            'vehicle_number': self.vehicle_number,
            'parking_details': {
                'start_time': self.parking_start_time.strftime('%Y-%m-%d %H:%M:%S') if self.parking_start_time else None,
                'end_time': self.parking_end_time.strftime('%Y-%m-%d %H:%M:%S') if self.parking_end_time else None,
                'duration': self.format_duration(),
                'duration_hours': duration_hours,
                'duration_minutes': self.get_duration_minutes()
            },
            'cost_breakdown': {
                'hourly_rate': self.hourly_rate,
                'billable_hours': billable_hours,
                'base_cost': self.get_base_cost(),
                'total_cost': self.total_cost,
                'billing_note': 'Minimum 1 hour billing applies'
            },
            'payment_summary': {
                'subtotal': self.total_cost,
                'tax': 0.0,
                'total_amount': self.total_cost,
                'currency': 'INR'
            }
        }
    
    def get_admin_summary(self):
        """Get summary for admin view"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'user_name': self.user.username if self.user else 'Unknown',
            'spot_id': self.spot_id,
            'vehicle_number': self.vehicle_number,
            'status': self.status,
            'reservation_time': self.reservation_time.isoformat() if self.reservation_time else None,
            'parking_duration': self.format_duration(),
            'total_cost': self.total_cost,
            'hourly_rate': self.hourly_rate,
            'revenue_generated': self.total_cost if self.status == 'completed' else 0.0
        }
    
    def to_dict(self):
        """Enhanced to_dict with calculated cost breakdown"""
        base_dict = {
            'id': self.id,
            'user_id': self.user_id,
            'spot_id': self.spot_id,
            'vehicle_number': self.vehicle_number,
            'status': self.status,
            'reservation_time': self.reservation_time.isoformat() if self.reservation_time else None,
            'parking_start_time': self.parking_start_time.isoformat() if self.parking_start_time else None,
            'parking_end_time': self.parking_end_time.isoformat() if self.parking_end_time else None,
            'hourly_rate': self.hourly_rate,
            'total_cost': self.total_cost,
            'duration_formatted': self.format_duration(),
            'duration_hours': self.get_duration_hours(),
            'duration_minutes': self.get_duration_minutes()
        }
        
        # Add cost breakdown for completed reservations
        if self.status == 'completed':
            base_dict['cost_breakdown'] = self.get_cost_breakdown()
        
        return base_dict