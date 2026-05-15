import pytest
import json
from app import create_app, db
from models import User, Repository, Settings

@pytest.fixture
def app():
    app = create_app()
    app.config.update({
        "TESTING": True,
        "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",
        "GEMINI_API_KEY": "test-key"
    })

    with app.app_context():
        db.create_all()
        yield app
        db.drop_all()

@pytest.fixture
def client(app):
    return app.test_client()

def test_health_check(client):
    response = client.get('/health')
    assert response.status_code == 200
    assert response.json['status'] == 'healthy'

def test_unauthorized_access(client):
    response = client.get('/api/issues')
    assert response.status_code == 401

def test_settings_initialization(app, client):
    with app.app_context():
        user = User(username='testuser', access_token='test-token')
        db.session.add(user)
        db.session.commit()
        
    response = client.get('/api/settings', headers={'Authorization': 'Bearer test-token'})
    assert response.status_code == 200
    assert response.json['auto_mode'] == False

def test_toggle_auto_mode(app, client):
    with app.app_context():
        user = User(username='testuser', access_token='test-token')
        db.session.add(user)
        db.session.commit()
        
    response = client.post('/api/settings/auto-mode', 
                           headers={'Authorization': 'Bearer test-token'},
                           json={'auto_mode': True})
    assert response.status_code == 200
    assert response.json['auto_mode'] == True
