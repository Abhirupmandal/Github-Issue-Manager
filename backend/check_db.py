from backend.app import create_app
from backend.extensions import db
from backend.models import User, Settings

app = create_app()
with app.app_context():
    users = User.query.all()
    for u in users:
        s = Settings.query.filter_by(user_id=u.id).first()
        print(f"User: {u.username} (ID: {u.id})")
        print(f"Token: {u.access_token[:10]}...")
        print(f"Auto Mode: {s.auto_mode if s else 'No Settings'}")
        print("-" * 20)
