from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from backend.extensions import db

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    github_id = db.Column(db.String(100), unique=True, nullable=True)
    username = db.Column(db.String(100), unique=True, nullable=False)
    name = db.Column(db.String(100))
    email = db.Column(db.String(120), unique=True)
    avatar_url = db.Column(db.String(255))
    password_hash = db.Column(db.String(255))
    is_trial = db.Column(db.Boolean, default=False)
    access_token = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
        
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    repositories = db.relationship('Repository', backref='owner', lazy=True)
    settings = db.relationship('Settings', backref='user', uselist=False, lazy=True)

class Repository(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    github_repo_id = db.Column(db.String(100), unique=True, nullable=False)
    name = db.Column(db.String(100), nullable=False)
    full_name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    language = db.Column(db.String(50))
    is_private = db.Column(db.Boolean, default=False)
    is_monitored = db.Column(db.Boolean, default=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

class IssueAnalysis(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    issue_number = db.Column(db.Integer, nullable=False)
    repo_full_name = db.Column(db.String(200), nullable=False)
    summary = db.Column(db.Text)
    label = db.Column(db.String(50))
    priority = db.Column(db.String(20))
    suggested_action = db.Column(db.Text)
    ai_score = db.Column(db.Integer)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class ActivityLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    action_type = db.Column(db.String(50), nullable=False)
    issue_number = db.Column(db.String(20))
    repo_name = db.Column(db.String(100))
    details = db.Column(db.Text)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

class Settings(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    auto_mode = db.Column(db.Boolean, default=False)
    agent_personality = db.Column(db.String(50), default='generalist')
    rules_json = db.Column(db.Text)
    notification_prefs = db.Column(db.Text)

class ChatMessage(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    role = db.Column(db.String(20), nullable=False)
    content = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
