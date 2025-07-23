from datetime import datetime
from app import db

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
        self.status = 'active'
        self.parking_start_time = datetime.utcnow()
    
    def end_parking(self):
        if self.parking_start_time:
            self.parking_end_time = datetime.utcnow()
            self.status = 'completed'
            
            duration = self.parking_end_time - self.parking_start_time
            hours = max(duration.total_seconds() / 3600, 1)  # Minimum 1 hour
            self.total_cost = round(hours * self.hourly_rate, 2)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'spot_id': self.spot_id,
            'vehicle_number': self.vehicle_number,
            'status': self.status,
            'reservation_time': self.reservation_time.isoformat() if self.reservation_time else None,
            'parking_start_time': self.parking_start_time.isoformat() if self.parking_start_time else None,
            'parking_end_time': self.parking_end_time.isoformat() if self.parking_end_time else None,
            'hourly_rate': self.hourly_rate,
            'total_cost': self.total_cost
        }