from datetime import datetime
from app.models import db

class ParkingLot(db.Model):
    __tablename__ = 'parking_lots'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    address = db.Column(db.Text, nullable=False)
    pin_code = db.Column(db.String(10), nullable=False)
    total_spots = db.Column(db.Integer, nullable=False)
    price_per_hour = db.Column(db.Float, nullable=False, default=50.0)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    parking_spots = db.relationship('ParkingSpot', backref='parking_lot', lazy=True, cascade='all, delete-orphan')
    
    def __init__(self, name, address, pin_code, total_spots, price_per_hour=50.0):
        self.name = name
        self.address = address
        self.pin_code = pin_code
        self.total_spots = total_spots
        self.price_per_hour = price_per_hour
    
    @property
    def available_spots_count(self):
        return len([spot for spot in self.parking_spots if not spot.is_occupied and spot.is_active])
    
    @property
    def occupied_spots_count(self):
        return len([spot for spot in self.parking_spots if spot.is_occupied])
    
    @property
    def occupancy_rate(self):
        if self.total_spots == 0:
            return 0
        return round((self.occupied_spots_count / self.total_spots) * 100, 2)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'address': self.address,
            'pin_code': self.pin_code,
            'total_spots': self.total_spots,
            'price_per_hour': self.price_per_hour,
            'available_spots': self.available_spots_count,
            'occupied_spots': self.occupied_spots_count,
            'occupancy_rate': self.occupancy_rate,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    def __repr__(self):
        return f'<ParkingLot {self.name}>'
