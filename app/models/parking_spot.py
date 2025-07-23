from datetime import datetime
from app.models import db

class ParkingSpot(db.Model):
    __tablename__ = 'parking_spots'
    
    id = db.Column(db.Integer, primary_key=True)
    lot_id = db.Column(db.Integer, db.ForeignKey('parking_lots.id'), nullable=False)
    spot_number = db.Column(db.String(10), nullable=False)
    is_occupied = db.Column(db.Boolean, default=False, nullable=False)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    vehicle_number = db.Column(db.String(20), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    reservations = db.relationship('Reservation', backref='parking_spot', lazy=True)
    
    def occupy_spot(self, vehicle_number):
        self.is_occupied = True
        self.vehicle_number = vehicle_number
        self.updated_at = datetime.utcnow()
    
    def release_spot(self):
        self.is_occupied = False
        self.vehicle_number = None
        self.updated_at = datetime.utcnow()
    
    def to_dict(self):
        return {
            'id': self.id,
            'lot_id': self.lot_id,
            'spot_number': self.spot_number,
            'is_occupied': self.is_occupied,
            'is_active': self.is_active,
            'vehicle_number': self.vehicle_number,
            'lot_name': self.parking_lot.name if self.parking_lot else None
        }
    
    def __repr__(self):
        return f'<ParkingSpot {self.spot_number}>'