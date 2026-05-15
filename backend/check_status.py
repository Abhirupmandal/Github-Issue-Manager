from backend.app import create_app
from backend.models import User, Repository
app = create_app()
with app.app_context():
    users = User.query.all()
    print(f"Users: {[u.username for u in users]}")
    for u in users:
        repos = Repository.query.filter_by(user_id=u.id).all()
        print(f"User {u.username} has {len(repos)} monitored repos")
