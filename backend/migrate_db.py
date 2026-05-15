from backend.app import create_app
from backend.extensions import db
from sqlalchemy import text

app = create_app()
with app.app_context():
    try:

        db.session.execute(text("SELECT agent_personality FROM settings LIMIT 1"))
        print("Column 'agent_personality' already exists.")
    except Exception:
        print("Adding 'agent_personality' column to 'settings' table...")
        db.session.execute(text("ALTER TABLE settings ADD COLUMN agent_personality VARCHAR(50) DEFAULT 'generalist'"))
        db.session.commit()
        print("Column added successfully.")
    
    try:
        db.session.execute(text("SELECT notification_prefs FROM settings LIMIT 1"))
        print("Column 'notification_prefs' already exists.")
    except Exception:
        print("Adding 'notification_prefs' column to 'settings' table...")
        db.session.execute(text("ALTER TABLE settings ADD COLUMN notification_prefs TEXT DEFAULT '{}'"))
        db.session.commit()
        print("Column added successfully.")

    print("Database migration completed.")
