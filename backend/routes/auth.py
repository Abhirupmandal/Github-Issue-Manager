from flask import Blueprint, jsonify, request, redirect, current_app, session
from flask_cors import CORS
import requests
import uuid
from backend.extensions import db
from backend.models import User

auth_bp = Blueprint('auth', __name__)

GITHUB_AUTH_URL = "https://github.com/login/oauth/authorize"
GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token"
GITHUB_USER_URL = "https://api.github.com/user"

@auth_bp.route('/github')
def github_login():
    client_id = current_app.config['GITHUB_CLIENT_ID']
    redirect_uri = current_app.config['GITHUB_REDIRECT_URI']
    scope = "user:email repo"
    
    auth_url = f"{GITHUB_AUTH_URL}?client_id={client_id}&redirect_uri={redirect_uri}&scope={scope}"
    return jsonify({'url': auth_url})

@auth_bp.route('/callback')
def github_callback():
    code = request.args.get('code')
    if not code:
        return jsonify({'error': 'No code provided'}), 400
        
    token_response = requests.post(
        GITHUB_TOKEN_URL,
        headers={"Accept": "application/json"},
        data={
            "client_id": current_app.config['GITHUB_CLIENT_ID'],
            "client_secret": current_app.config['GITHUB_CLIENT_SECRET'],
            "code": code,
            "redirect_uri": current_app.config['GITHUB_REDIRECT_URI']
        }
    )
    
    token_data = token_response.json()
    access_token = token_data.get('access_token')
    
    if not access_token:
        return jsonify({'error': 'Failed to obtain access token', 'details': token_data}), 401
        
    user_response = requests.get(
        GITHUB_USER_URL,
        headers={"Authorization": f"token {access_token}"}
    )
    user_data = user_response.json()
    
    user = User.query.filter_by(github_id=str(user_data['id'])).first()
    if not user:
        user = User(
            github_id=str(user_data['id']),
            username=user_data['login'],
            name=user_data.get('name'),
            email=user_data.get('email'),
            avatar_url=user_data.get('avatar_url'),
            access_token=access_token
        )
        db.session.add(user)
    else:
        user.access_token = access_token
        user.username = user_data['login']
        user.avatar_url = user_data.get('avatar_url')
        
    db.session.commit()
    
    frontend_url = "http://localhost:5173/repos"

    return redirect(f"{frontend_url}?token={access_token}&username={user.username}")

@auth_bp.route('/logout', methods=['POST'])
def logout():
    return jsonify({'message': 'Logged out successfully'})

@auth_bp.route('/me')
def get_me():

    token = request.headers.get('Authorization')
    if not token:
        return jsonify({'error': 'Unauthorized'}), 401
        
    user = User.query.filter_by(access_token=token.replace('Bearer ', '')).first()
    if not user:
        return jsonify({'error': 'User not found'}), 404
        
    return jsonify({
        'username': user.username,
        'name': user.name,
        'avatar_url': user.avatar_url,
        'email': user.email,
    })

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    username = data.get('username')
    
    if not email or not password or not username:
        return jsonify({'error': 'Missing required fields'}), 400
        
    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already exists'}), 400
        
    if User.query.filter_by(username=username).first():
        return jsonify({'error': 'Username already exists'}), 400
        
    user = User(email=email, username=username)
    user.set_password(password)

    user.access_token = f"local_{uuid.uuid4().hex}"
    
    db.session.add(user)
    db.session.commit()
    
    return jsonify({
        'message': 'User registered successfully',
        'token': user.access_token,
        'username': user.username
    }), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({'error': 'Email and password required'}), 400
        
    user = User.query.filter_by(email=email).first()
    
    if not user or not user.check_password(password):
        return jsonify({'error': 'Invalid email or password'}), 401
        
    if not user.access_token:
        user.access_token = f"local_{uuid.uuid4().hex}"
        db.session.commit()
    return jsonify({
        'token': user.access_token,
        'username': user.username,
        'name': user.name,
        'avatar_url': user.avatar_url,
        'is_trial': user.is_trial
    })
