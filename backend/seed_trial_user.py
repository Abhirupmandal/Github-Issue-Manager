from backend.app import create_app
from backend.extensions import db
from backend.models import User
import uuid

def seed():
    app = create_app()
    with app.app_context():

        email = "test@gmail.com"
        user = User.query.filter_by(email=email).first()
        
        if not user:
            print(f"Creating trial user: {email}")
            user = User(
                email=email,
                username="trial_tester",
                name="Trial Tester",
                is_trial=True,
                access_token=f"local_{uuid.uuid4().hex}"
            )
            user.set_password("password123")
            db.session.add(user)
            db.session.commit()
            print("Trial user created successfully!")
        else:
            print(f"Trial user {email} already exists.")

            user.set_password("password123")
            user.is_trial = True
            db.session.commit()
            print("Trial user updated.")

if __name__ == '__main__':
    seed()
