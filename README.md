# 🤖 IssueAgent - AI-Powered GitHub Issue Manager

IssueAgent is a sophisticated full-stack AI agent designed to automatically triage, analyze, and manage GitHub issues. Powered by **Gemini 3.0 Flash Lite**, it provides real-time insights, natural language command execution, and autonomous issue management.

![Dashboard Preview](https://via.placeholder.com/1200x600/0a0c10/58a6ff?text=IssueAgent+Dashboard+Preview)

## 🚀 Features

- **AI Analysis**: Automatic summarization, priority detection, and labeling using Gemini 3.0.
- **Natural Language Commands**: Bulk manage issues by simply typing "Close all stale issues".
- **Agent Modes**: Toggle between Manual (Human-in-the-loop) and Auto (Autonomous) modes.
- **Audit Trail**: Every action is logged with a functional "Undo" system.
- **Real-time Sync**: Bi-directional integration with the GitHub API.
- **Analytics Dashboard**: Deep insights into repository health and agent performance.

## 🏗️ Architecture

The application follows a modern full-stack architecture:

- **Frontend**: React 18, Vite, Framer Motion, Tailwind CSS.
- **Backend**: Python Flask, SQLAlchemy (SQLite), GitHub OAuth.
- **AI Brain**: Gemini 3.0 Flash Lite.
- **Database**: SQLite (local) / PostgreSQL (production).

## 🛠️ Setup Instructions

### Prerequisites
- Python 3.10+
- Node.js 18+
- GitHub OAuth App (for Client ID/Secret)
- Gemini API Key

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/yourusername/github-issue-agent.git
cd github-issue-agent

npm install

cd backend
pip install -r requirements.txt
```

### 2. Run the Application
```bash
python app.py

npm run dev
```

## 📄 License
MIT License - Copyright (c) 2025 Abhirup Mandal
