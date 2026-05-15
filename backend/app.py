import os
from flask import Flask, jsonify, request, make_response
from flask_cors import CORS
from backend.extensions import db, socketio
from backend.config import Config
from backend.services.vector_service import vector_service

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    db.init_app(app)
    socketio.init_app(app)
    vector_service.init_app(app)
    
    allowed_origins = os.environ.get('ALLOWED_ORIGINS', '*').split(',')
    CORS(app, resources={r"/*": {"origins": allowed_origins}}, supports_credentials=True)
    
    from backend.routes.health import health_bp
    from backend.routes.auth import auth_bp
    from backend.routes.api import api_bp
    
    app.register_blueprint(health_bp)
    app.register_blueprint(auth_bp, url_prefix='/auth')
    app.register_blueprint(api_bp, url_prefix='/api')
    
    with app.app_context():
        db.create_all()
    
    return app

if __name__ == '__main__':
    app = create_app()

    socketio.run(app, debug=True, port=5000, host='0.0.0.0', allow_unsafe_werkzeug=True)
