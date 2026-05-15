# Deployment Guide - GitHub Issue Agent

This guide outlines the steps to deploy the application to production.

## 1. Backend (Render)

**Service Type**: Web Service
**Runtime**: Python 3

### Steps:
1. Connect your repository to [Render](https://render.com/).
2. Set the **Build Command**: `pip install -r requirements.txt`
3. Set the **Start Command**: `gunicorn backend.app:app`
4. Add the following **Environment Variables**:
   - `GEMINI_API_KEY`: Your Google AI API Key.
   - `GITHUB_CLIENT_ID`: Your GitHub OAuth App Client ID.
   - `GITHUB_CLIENT_SECRET`: Your GitHub OAuth App Client Secret.
   - `SECRET_KEY`: A long random string for sessions.
   - `DATABASE_URL`: (Optional) If using PostgreSQL. Defaults to SQLite.

## 2. Frontend (Vercel)

**Framework Preset**: Vite

### Steps:
1. Connect your repository to [Vercel](https://vercel.com/).
2. The default build settings for Vite should work.
3. Add the following **Environment Variables**:
   - `VITE_API_BASE_URL`: The URL of your deployed Render backend (e.g., `https://your-app.onrender.com`).
4. Update the GitHub OAuth **Callback URL** in your GitHub Developer Settings to point to your Vercel production URL.

## 3. Production Build Instructions

### Local Production Build Test
```bash
# Frontend
npm run build
npm run preview

# Backend
export FLASK_ENV=production
python backend/app.py
```

## 4. Post-Deployment Checklist
- [ ] Verify GitHub OAuth flow works with the production domain.
- [ ] Ensure `GEMINI_API_KEY` is active and not restricted.
- [ ] Test real issue analysis on a production repository.
- [ ] Check if `ActivityLog` persists correctly in the production database.
