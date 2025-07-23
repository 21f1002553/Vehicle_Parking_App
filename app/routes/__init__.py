# app/routes/__init__.py
from .auth import auth_bp
from .admin import admin_bp

def register_blueprints(app):
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')