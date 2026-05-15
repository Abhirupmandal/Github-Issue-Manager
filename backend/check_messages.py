from backend.app import create_app
from backend.models import ChatMessage
app = create_app()
with app.app_context():
    messages = ChatMessage.query.order_by(ChatMessage.timestamp.desc()).limit(5).all()
    print("Recent Messages:")
    for m in messages:
        print(f"[{m.role}] {m.content[:50]}... ({m.timestamp})")
