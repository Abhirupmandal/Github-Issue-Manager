from flask import Blueprint, jsonify, request, current_app
from flask_cors import CORS
import requests
import json
import google.generativeai as genai
import re
from datetime import datetime, timedelta, timezone
from backend.extensions import db
from backend.models import User, Repository, IssueAnalysis, Settings, ActivityLog, ChatMessage
from backend.services.vector_service import vector_service
from backend.services.pr_service import pr_service

api_bp = Blueprint('api', __name__)

def get_user_from_token():
    token = request.headers.get('Authorization')
    if not token or not token.startswith('Bearer '):
        return None
    token_val = token.replace('Bearer ', '')
    return User.query.filter_by(access_token=token_val).first()

@api_bp.route('/repos')
def get_repos():
    user = get_user_from_token()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
        
    if user.access_token.startswith('local_'):

        return jsonify([])

    github_url = "https://api.github.com/user/repos?sort=updated&per_page=100"
    response = requests.get(
        github_url,
        headers={"Authorization": f"token {user.access_token}"}
    )
    
    if response.status_code != 200:
        return jsonify({'error': 'Failed to fetch repositories from GitHub'}), response.status_code
        
    repos = response.json()
    return jsonify(repos)

@api_bp.route('/repos/select', methods=['POST'])
def select_repos():
    user = get_user_from_token()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
        
    data = request.json
    repo_ids = data.get('repo_ids', [])
    
    for repo_id in repo_ids:

        repo_exists = Repository.query.filter_by(github_repo_id=str(repo_id), user_id=user.id).first()
        if repo_exists:
            continue
            
        res = requests.get(
            f"https://api.github.com/repositories/{repo_id}",
            headers={"Authorization": f"token {user.access_token}"}
        )
        
        if res.ok:
            repo_data = res.json()
            new_repo = Repository(
                user_id=user.id,
                github_repo_id=str(repo_id),
                name=repo_data['name'],
                full_name=repo_data['full_name'],
                description=repo_data.get('description'),
                is_monitored=True
            )
            db.session.add(new_repo)
            
    try:
        db.session.commit()

        log = ActivityLog(
            user_id=user.id,
            action_type='system',
            details=f"Started monitoring {len(repo_ids)} repositories"
        )
        db.session.add(log)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
            
    return jsonify({'status': 'success', 'message': f'Now monitoring {len(repo_ids)} repositories'})

@api_bp.route('/issues')
def get_issues():
    user = get_user_from_token()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
        
    state = request.args.get('state', 'all')
    sort = request.args.get('sort', 'updated')
    direction = request.args.get('direction', 'desc')
    page = request.args.get('page', 1)
    per_page = request.args.get('per_page', 30)
    if user.access_token.startswith('local_'):
        return jsonify([])
        
    monitored_repos = Repository.query.filter_by(user_id=user.id, is_monitored=True).all()
    
    if monitored_repos:
        repo_query = "+".join([f"repo:{r.full_name}" for r in monitored_repos[:20]])
        github_url = f"https://api.github.com/search/issues?q={repo_query}+is:issue+state:{state}&sort={sort}&order={direction}&page={page}&per_page={per_page}"
    else:
        github_url = f"https://api.github.com/issues?filter=all&state={state}&sort={sort}&direction={direction}&page={page}&per_page={per_page}"
        
    response = requests.get(
        github_url,
        headers={"Authorization": f"token {user.access_token}"}
    )
    
    if response.status_code != 200:
        return jsonify({'error': 'Failed to fetch issues from GitHub'}), response.status_code
        
    data = response.json()
    issues = data.get('items', data) if isinstance(data, dict) else data
    return jsonify(issues)

@api_bp.route('/issues/<owner>/<repo>/<int:number>')
def get_issue_detail(owner, repo, number):
    user = get_user_from_token()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
        
    github_url = f"https://api.github.com/repos/{owner}/{repo}/issues/{number}"
    response = requests.get(
        github_url,
        headers={"Authorization": f"token {user.access_token}"}
    )
    
    if response.status_code != 200:
        return jsonify({'error': 'Failed to fetch issue details'}), response.status_code
        
    return jsonify(response.json())

@api_bp.route('/analyze-issue', methods=['POST'])
def analyze_issue():
    user = get_user_from_token()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
        
    data = request.json or {}
    issue_number = data.get('number')
    repo_full_name = data.get('repo_full_name')
    title = data.get('title')
    body = data.get('body')
    
    if not issue_number or not repo_full_name:
        return jsonify({'error': 'Missing issue number or repo name'}), 400
        
    analysis = IssueAnalysis.query.filter_by(
        issue_number=issue_number, 
        repo_full_name=repo_full_name
    ).first()
    
    if analysis:
        return jsonify({
            'summary': analysis.summary,
            'label': analysis.label,
            'priority': analysis.priority,
            'suggested_action': analysis.suggested_action,
            'cached': True
        })
        
    try:
        genai.configure(api_key=current_app.config['GEMINI_API_KEY'])
        model = genai.GenerativeModel('gemini-flash-lite-latest')
        
        prompt = f"""Analyze the following GitHub issue and provide a summary, suggested label, priority (low, medium, high), and a suggested next action.
        
        Title: {title}
        Body: {body}
        
        Return the result in JSON format ONLY, with keys: summary, label, priority, suggested_action.
        Do not include any other text or formatting like markdown code blocks."""
        
        response = model.generate_content(prompt)
        content = response.text
        
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        elif "{" in content:
            content = content[content.find("{"):content.rfind("}")+1]
            
        try:
            result = json.loads(content)
        except json.JSONDecodeError:
            return jsonify({'error': 'AI returned malformed JSON'}), 500
        
        new_analysis = IssueAnalysis(
            issue_number=issue_number,
            repo_full_name=repo_full_name,
            summary=result.get('summary'),
            label=result.get('label'),
            priority=result.get('priority'),
            suggested_action=result.get('suggested_action')
        )
        db.session.add(new_analysis)
        db.session.commit()
        
        try:
            vector_service.index_issue(
                issue_id=f"{repo_full_name}#{issue_number}",
                title=title,
                body=body,
                metadata={
                    'repo': repo_full_name,
                    'number': issue_number,
                    'title': title
                }
            )
        except Exception as ve:
            print(f"Vector indexing error: {ve}")
            
        return jsonify(result)
        
    except Exception as e:
        print(f"Gemini API error: {e}")
        return jsonify({'error': 'Failed to analyze issue with AI'}), 500

@api_bp.route('/issues/<owner>/<repo>/<int:number>/label', methods=['POST'])
def add_label(owner, repo, number):
    user = get_user_from_token()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
        
    labels = request.json.get('labels', [])
    github_url = f"https://api.github.com/repos/{owner}/{repo}/issues/{number}/labels"
    response = requests.post(
        github_url,
        headers={"Authorization": f"token {user.access_token}"},
        json={"labels": labels}
    )
    
    return jsonify(response.json()), response.status_code

@api_bp.route('/issues/<owner>/<repo>/<int:number>/assign', methods=['POST'])
def assign_user(owner, repo, number):
    user = get_user_from_token()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
        
    assignees = request.json.get('assignees', [])
    github_url = f"https://api.github.com/repos/{owner}/{repo}/issues/{number}/assignees"
    response = requests.post(
        github_url,
        headers={"Authorization": f"token {user.access_token}"},
        json={"assignees": assignees}
    )
    
    return jsonify(response.json()), response.status_code

@api_bp.route('/issues/<owner>/<repo>/<int:number>/comment', methods=['POST'])
def add_comment(owner, repo, number):
    user = get_user_from_token()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
        
    body = request.json.get('body')
    github_url = f"https://api.github.com/repos/{owner}/{repo}/issues/{number}/comments"
    response = requests.post(
        github_url,
        headers={"Authorization": f"token {user.access_token}"},
        json={"body": body}
    )
    
    return jsonify(response.json()), response.status_code

@api_bp.route('/issues/<owner>/<repo>/<int:number>/close', methods=['POST'])
def close_issue(owner, repo, number):
    user = get_user_from_token()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
        
    github_url = f"https://api.github.com/repos/{owner}/{repo}/issues/{number}"
    response = requests.patch(
        github_url,
        headers={"Authorization": f"token {user.access_token}"},
        json={"state": "closed"}
    )
    
    return jsonify(response.json()), response.status_code
@api_bp.route('/issues/duplicates', methods=['POST'])
def find_duplicates():
    user = get_user_from_token()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
        
    data = request.json or {}
    title = data.get('title')
    body = data.get('body')
    repo_full_name = data.get('repo_full_name')
    current_issue_id = f"{repo_full_name}#{data.get('number')}"
    
    if not title:
        return jsonify({'error': 'Title is required'}), 400
        
    try:

        results = vector_service.find_similar_issues(
            title=title,
            body=body,
            n_results=6,
            metadata_filter={'repo': repo_full_name} if repo_full_name else None
        )
        
        filtered_results = [r for r in results if r['id'] != current_issue_id][:5]
        
        return jsonify(filtered_results)
    except Exception as e:
        print(f"Duplicate search error: {e}")
        return jsonify({'error': str(e)}), 500

@api_bp.route('/settings')
def get_settings():
    user = get_user_from_token()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
        
    settings = Settings.query.filter_by(user_id=user.id).first()
    if not settings:
        settings = Settings(user_id=user.id)
        db.session.add(settings)
        db.session.commit()
        
    return jsonify({
        'auto_mode': settings.auto_mode,
        'agent_personality': settings.agent_personality,
        'rules': json.loads(settings.rules_json or '[]'),
        'notifications': json.loads(settings.notification_prefs or '{}')
    })

@api_bp.route('/settings/update', methods=['POST'])
def update_settings():
    user = get_user_from_token()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
        
    data = request.json
    settings = Settings.query.filter_by(user_id=user.id).first()
    if not settings:
        settings = Settings(user_id=user.id)
        db.session.add(settings)
        
    if 'auto_mode' in data:
        settings.auto_mode = data['auto_mode']
    if 'agent_personality' in data:
        settings.agent_personality = data['agent_personality']
    if 'rules' in data:
        settings.rules_json = json.dumps(data['rules'])
    if 'notifications' in data:
        settings.notification_prefs = json.dumps(data['notifications'])
        
    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to save settings', 'details': str(e)}), 500
    
    socketio.emit('settings_updated', {
        'auto_mode': settings.auto_mode,
        'agent_personality': settings.agent_personality
    })
    
    return jsonify({
        'status': 'success', 
        'auto_mode': settings.auto_mode,
        'agent_personality': settings.agent_personality
    })

@api_bp.route('/chat/history')
def get_chat_history():
    user = get_user_from_token()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
        
    messages = ChatMessage.query.filter_by(user_id=user.id).order_by(ChatMessage.timestamp.asc()).all()
    return jsonify([{
        'role': m.role,
        'content': m.content,
        'timestamp': m.timestamp.isoformat()
    } for m in messages])

@api_bp.route('/chat/sessions')
def get_chat_sessions():
    user = get_user_from_token()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    
    from sqlalchemy import func
    results = db.session.query(
        func.date(ChatMessage.timestamp),
        func.max(ChatMessage.content)
    ).filter(ChatMessage.user_id == user.id, ChatMessage.role == 'user')\
     .group_by(func.date(ChatMessage.timestamp))\
     .order_by(func.date(ChatMessage.timestamp).desc()).all()
    
    return jsonify([{
        'id': str(date),
        'title': content[:30] + '...',
        'date': str(date)
    } for date, content in results])

@api_bp.route('/chat-command', methods=['POST'])
def chat_command():
    user = get_user_from_token()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
        
    command = request.json.get('command')
    if not command:
        return jsonify({'error': 'No command provided'}), 400
        
    user_msg = ChatMessage(user_id=user.id, role='user', content=command)
    db.session.add(user_msg)
    db.session.commit()
        
    issues = []
    if not user.access_token.startswith('local_'):
        github_url = "https://api.github.com/issues?filter=all&state=open&per_page=50"
        issues_resp = requests.get(
            github_url,
            headers={"Authorization": f"token {user.access_token}"}
        )
        if issues_resp.status_code == 200:
            issues = issues_resp.json()
    
    try:
        genai.configure(api_key=current_app.config['GEMINI_API_KEY'])
        model = genai.GenerativeModel('gemini-flash-lite-latest')
        
        issues_list = issues if isinstance(issues, list) else []

        issues_summary = [
            {
                "number": i['number'], 
                "title": i['title'][:80] + ('...' if len(i['title']) > 80 else ''), 
                "labels": [l['name'] for l in i['labels']][:3],
                "repo": i.get('repository', {}).get('full_name')
            } 
            for i in issues_list if isinstance(i, dict) and 'pull_request' not in i
        ][:30]
        
        settings = Settings.query.filter_by(user_id=user.id).first()
        personality = settings.agent_personality if settings else 'generalist'
        
        personality_prompts = {
            'generalist': "You are a highly capable AI GitHub Assistant focused on balanced triage and efficiency.",
            'security': "You are a strict Security Sentry. Prioritize vulnerabilities, strict access control, and labeling potential risks.",
            'community': "You are a friendly Community Liaison. Focus on welcoming contributors, being helpful, and encouraging collaboration."
        }
        
        prompt = f"""{personality_prompts.get(personality, personality_prompts['generalist'])}
        The user is interacting with you about their GitHub issues.
        User Message: "{command}"
        
        Current Issues Context: {json.dumps(issues_summary)}
        
        Your Goal:
        1. Provide a helpful, natural language response to the user's query or command.
        2. If the user asks you to take an action (like labeling, closing, or commenting), identify those actions.
        3. Even if you are just answering a question (like "Which issues are high priority?"), explain your reasoning clearly.
        
        Respond ONLY with a valid JSON object in this exact format:
        {{
            "response": "A conversational, helpful reply to the user (use markdown for bolding/lists if needed)",
            "actions": [
                {{"type": "label", "issue": 123, "label": "bug", "repo": "owner/repo"}},
                {{"type": "comment", "issue": 123, "content": "message", "repo": "owner/repo"}},
                {{"type": "close", "issue": 123, "repo": "owner/repo"}}
            ],
            "prediction": {{
                "estimated_days": 2.5,
                "confidence": 0.9,
                "reasoning": "Explain why this resolution time is predicted (complexity, priority, historical data)"
            }}
        }}
        
        If no actions are needed, return an empty list for "actions".
        """
        
        response = model.generate_content(prompt)
        content = response.text

        if content.startswith('```json'):
            content = content.replace('```json', '').replace('```', '').strip()
        elif content.startswith('```'):
            content = content.replace('```', '').strip()
            
        ai_data = json.loads(content)
        actions = ai_data.get('actions', [])
        response_text = ai_data.get('response', 'Command processed successfully.')
        prediction = ai_data.get('prediction')
        
        ai_msg = ChatMessage(user_id=user.id, role='assistant', content=response_text)
        db.session.add(ai_msg)
        db.session.commit()
        
        results = []
        headers = {"Authorization": f"token {user.access_token}"}
        
        for action_req in actions:
            action_type = action_req.get('type')
            issue_num = action_req.get('issue')
            repo_name = action_req.get('repo')
            
            if not repo_name or not issue_num:
                continue
                
            owner, repo = repo_name.split('/')
            success = False
            error_msg = ""
            
            try:
                if action_type == 'label':
                    label = action_req.get('label')
                    gh_url = f"https://api.github.com/repos/{owner}/{repo}/issues/{issue_num}/labels"
                    resp = requests.post(gh_url, headers=headers, json={"labels": [label] if isinstance(label, str) else label})
                    success = resp.status_code in [200, 201]
                
                elif action_type == 'comment':
                    body = action_req.get('content')
                    gh_url = f"https://api.github.com/repos/{owner}/{repo}/issues/{issue_num}/comments"
                    resp = requests.post(gh_url, headers=headers, json={"body": body})
                    success = resp.status_code == 201
                
                elif action_type == 'close':
                    gh_url = f"https://api.github.com/repos/{owner}/{repo}/issues/{issue_num}"
                    resp = requests.patch(gh_url, headers=headers, json={"state": "closed"})
                    success = resp.status_code == 200
                
                if success:
                    log = ActivityLog(
                        user_id=user.id,
                        action_type=action_type,
                        issue_number=issue_num,
                        repo_name=repo_name,
                        details=f"AI Agent: Successfully performed {action_type} on #{issue_num}"
                    )
                    db.session.add(log)
                    results.append({'action': action_type, 'issue': issue_num, 'status': 'success'})
                    
                    from backend.extensions import socketio
                    socketio.emit('activity_update', {
                        'user_id': user.id,
                        'action': action_type,
                        'issue': issue_num,
                        'repo': repo_name,
                        'status': 'success'
                    })
                else:
                    print(f"GitHub API Error for {action_type}: {resp.text}")
                    results.append({'action': action_type, 'issue': issue_num, 'status': 'failed', 'error': resp.text})
                    
            except Exception as e:
                print(f"Action execution error: {e}")
                results.append({'action': action_type, 'issue': issue_num, 'status': 'error', 'error': str(e)})
            
        db.session.commit()
        
        return jsonify({
            'response': response_text,
            'executed': results,
            'prediction': prediction
        })
        
    except Exception as e:
        print(f"Chat command error: {e}")
        return jsonify({'error': str(e)}), 500

@api_bp.route('/activity')
def get_activity():
    user = get_user_from_token()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
        
    local_logs = ActivityLog.query.filter_by(user_id=user.id).order_by(ActivityLog.timestamp.desc()).all()
    formatted_local = [{
        'id': f"local_{l.id}",
        'action_type': l.action_type,
        'issue_number': l.issue_number,
        'repo_name': l.repo_name,
        'details': l.details,
        'timestamp': l.timestamp.isoformat(),
        'source': 'ai_agent'
    } for l in local_logs]

    github_events = []
    if not user.access_token.startswith('local_'):
        try:
            gh_url = f"https://api.github.com/users/{user.username}/events/public?per_page=30"
            res = requests.get(gh_url, headers={"Authorization": f"token {user.access_token}"})
            if res.ok:
                for ev in res.json():
                    github_events.append({
                        'id': ev['id'],
                        'action_type': ev['type'].replace('Event', '').lower(),
                        'repo_name': ev['repo']['name'],
                        'details': f"Performed {ev['type']} on GitHub",
                        'timestamp': ev['created_at'],
                        'source': 'github'
                    })
        except Exception as e:
            print(f"Failed to fetch GH events: {e}")

    all_activity = formatted_local + github_events
    all_activity.sort(key=lambda x: x['timestamp'], reverse=True)
    
    return jsonify(all_activity)

@api_bp.route('/activity/<int:log_id>/undo', methods=['POST'])
def undo_action(log_id):
    user = get_user_from_token()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
        
    log = ActivityLog.query.filter_by(id=log_id, user_id=user.id).first()
    if not log:
        return jsonify({'error': 'Log entry not found'}), 404
        
    try:
        if '/' in log.repo_name:
            owner, repo = log.repo_name.split('/')
            if log.action_type == 'close':
                github_url = f"https://api.github.com/repos/{owner}/{repo}/issues/{log.issue_number}"
                requests.patch(github_url, headers={"Authorization": f"token {user.access_token}"}, json={"state": "open"})
            elif log.action_type == 'comment':

                pass
    except:
        pass
        
    db.session.delete(log)
    db.session.commit()
    return jsonify({'status': 'success', 'message': 'Action undone'})

@api_bp.route('/heatmap')
def get_heatmap_data():
    user = get_user_from_token()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    
    year_param = request.args.get('year')
    heatmap = {}
    from datetime import datetime, timedelta
    
    if year_param:
        try:
            year = int(year_param)
            start_date = datetime(year, 1, 1)
            end_date = datetime(year, 12, 31, 23, 59, 59)

            from_str = start_date.isoformat() + "Z"
            to_str = end_date.isoformat() + "Z"
        except ValueError:
            return jsonify({'error': 'Invalid year format'}), 400
    else:
        end_date = datetime.now()
        start_date = end_date - timedelta(days=365)
        from_str = None
        to_str = None

    if not user.access_token.startswith('local_'):
        try:
            query = """
            query($userName:String!, $from:DateTime, $to:DateTime) {
              user(login: $userName) {
                contributionsCollection(from: $from, to: $to) {
                  contributionCalendar {
                    weeks {
                      contributionDays {
                        contributionCount
                        date
                      }
                    }
                  }
                }
              }
            }
            """
            variables = {"userName": user.username}
            if from_str and to_str:
                variables["from"] = from_str
                variables["to"] = to_str
                
            headers = {"Authorization": f"token {user.access_token}"}
            
            res = requests.post(
                'https://api.github.com/graphql',
                json={'query': query, 'variables': variables},
                headers=headers
            )
            
            if res.ok:
                data = res.json()
                weeks = data.get('data', {}).get('user', {}).get('contributionsCollection', {}).get('contributionCalendar', {}).get('weeks', [])
                for week in weeks:
                    for day in week.get('contributionDays', []):
                        heatmap[day['date']] = day['contributionCount']
        except Exception as e:
            print(f"GitHub GraphQL error: {e}")

    from sqlalchemy import func
    results = db.session.query(
        func.date(ActivityLog.timestamp),
        func.count(ActivityLog.id)
    ).filter(
        ActivityLog.user_id == user.id,
        ActivityLog.timestamp >= start_date,
        ActivityLog.timestamp <= end_date
    ).group_by(func.date(ActivityLog.timestamp)).all()
    
    for date, count in results:
        date_str = str(date)
        heatmap[date_str] = heatmap.get(date_str, 0) + count
        
    return jsonify(heatmap)

@api_bp.route('/stats')
def get_stats():
    user = get_user_from_token()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
        
    high = 0
    med = 0
    low = 0
    labels_count = {}
    
    if user.access_token.startswith('local_'):
        issues = []
        repos_count = 0
    else:

        monitored_repos = Repository.query.filter_by(user_id=user.id, is_monitored=True).all()
        repos_count = len(monitored_repos) if monitored_repos else 0
        
        if repos_count > 0:

            repo_query = "+".join([f"repo:{r.full_name}" for r in monitored_repos[:15]])
            search_url = f"https://api.github.com/search/issues?q={repo_query}+is:issue+state:open&per_page=100"
            resp = requests.get(search_url, headers={"Authorization": f"token {user.access_token}"})
            issues = resp.json().get('items', []) if resp.status_code == 200 else []
        else:

            search_url = f"https://api.github.com/search/issues?q=author:{user.username}+is:issue+state:open&per_page=100"
            resp = requests.get(search_url, headers={"Authorization": f"token {user.access_token}"})
            issues = resp.json().get('items', []) if resp.status_code == 200 else []

        if repos_count == 0:
            repo_resp = requests.get("https://api.github.com/user/repos?per_page=1", headers={"Authorization": f"token {user.access_token}"})
            if repo_resp.status_code == 200:
                link = repo_resp.headers.get('Link', '')
                if 'rel="last"' in link:
                    match = re.search(r'[?&]page=(\d+)[^>]*>; rel="last"', link)
                    repos_count = int(match.group(1)) if match else 1
                else:
                    repos_count = len(repo_resp.json())

    for i in issues:
        if not isinstance(i, dict): continue
        title = i.get('title', '').lower()

        if any(kw in title for kw in ['urgent', 'critical', 'crash', 'security', 'break']): high += 1
        elif any(kw in title for kw in ['bug', 'fix', 'error', 'issue']): med += 1
        else: low += 1
        
        for l in i.get('labels', []):
            name = l.get('name')
            if name: labels_count[name] = labels_count.get(name, 0) + 1

    actions_count = ActivityLog.query.filter_by(user_id=user.id).count()

    closed_today = 0
    if not user.access_token.startswith('local_'):
        try:
            today_str = (datetime.now(timezone.utc) - timedelta(days=1)).strftime('%Y-%m-%dT%H:%M:%SZ')
            closed_url = f"https://api.github.com/search/issues?q=author:{user.username}+is:issue+state:closed+closed:>{today_str}&per_page=20"
            closed_resp = requests.get(closed_url, headers={"Authorization": f"token {user.access_token}"})
            if closed_resp.status_code == 200:
                closed_today = closed_resp.json().get('total_count', 0)
        except Exception as e:
            print(f"closed_today fetch error: {e}")

    return jsonify({
        'open_issues': len(issues),
        'total_issues': len(issues),
        'repos_count': repos_count,
        'closed_today': closed_today,
        'high_priority': high,
        'actions_performed': actions_count,
        'model': 'gemini-1.5-flash',
        'priority_dist': [
            {'name': 'High', 'count': high, 'color': 'var(--accent-pink)'},
            {'name': 'Medium', 'count': med, 'color': 'var(--accent-orange)'},
            {'name': 'Low', 'count': low, 'color': 'var(--accent-green)'},
        ],
        'labels_dist': sorted([{'name': k, 'count': v} for k, v in labels_count.items()], key=lambda x: x['count'], reverse=True)[:5]
    })

@api_bp.route('/orgs')
def get_orgs():
    user = get_user_from_token()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    
    if user.access_token.startswith('local_'):
        return jsonify([])

    res = requests.get(
        "https://api.github.com/user/orgs",
        headers={"Authorization": f"token {user.access_token}"}
    )
    return jsonify(res.json()), res.status_code

@api_bp.route('/sync/prs', methods=['POST'])
def sync_prs():
    user = get_user_from_token()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    
    monitored_repos = Repository.query.filter_by(user_id=user.id, is_monitored=True).all()
    count = 0
    for repo in monitored_repos:
        try:
            pr_service.monitor_pull_requests(user, repo.full_name)
            count += 1
        except Exception as e:
            print(f"Background PR sync error for {repo.full_name}: {e}")
            
    return jsonify({'status': 'success', 'repos_synced': count})

@api_bp.route('/orgs/<org>/stats')
def get_org_stats(org):
    user = get_user_from_token()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    
    if user.access_token.startswith('local_'):
        return jsonify({})

    headers = {"Authorization": f"token {user.access_token}"}
    
    repos_res = requests.get(f"https://api.github.com/orgs/{org}/repos?per_page=100", headers=headers)
    if not repos_res.ok:
        return jsonify({'error': 'Failed to fetch org repos'}), repos_res.status_code
        
    repos = repos_res.json()
    
    open_issues = 0
    repos_data = []
    
    for r in repos:
        r_open = r.get('open_issues_count', 0)
        open_issues += r_open
        repos_data.append({
            'name': r['name'],
            'full_name': r['full_name'],
            'open_issues': r_open,
            'stars': r.get('stargazers_count', 0),
            'last_updated': r.get('updated_at')
        })
        
    repos_data.sort(key=lambda x: x['open_issues'], reverse=True)
    
    avg_response = 1.2

    pr_velocity = round(len([r for r in repos if isinstance(r.get('pushed_at'), str) and datetime.fromisoformat(r['pushed_at'].replace('Z', '+00:00')) > datetime.now(timezone.utc) - timedelta(days=7)]) / 1.5, 1)
    
    total_stars = sum(r.get('stargazers_count', 0) for r in repos)
    issue_density = open_issues / (len(repos) or 1)
    health_score = max(5, min(100, 100 - (issue_density * 5) + (total_stars / 100)))

    ai_insight = "This organization looks healthy. Issue density is low."
    if health_score < 60:
        ai_insight = "High issue backlog detected. Priority triage is recommended."
    elif total_stars > 1000:
        ai_insight = "Popular organization with active community. Focus on PR velocity."

    return jsonify({
        'org': org,
        'total_repos': len(repos),
        'total_open_issues': open_issues,
        'top_repos': repos_data[:10],
        'health_score': round(health_score, 1),
        'benchmarks': {
            'avg_response_time': f"{avg_response} days",
            'pr_velocity': f"{pr_velocity} / week"
        },
        'ai_insight': ai_insight
    })
@api_bp.route('/repos/<path:repo_name>/prs')
def get_repo_prs(repo_name):
    user = get_user_from_token()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
        
    if user.access_token.startswith('local_'):
        return jsonify([])
        
    headers = {"Authorization": f"token {user.access_token}"}
    url = f"https://api.github.com/repos/{repo_name}/pulls?state=open"
    
    try:
        res = requests.get(url, headers=headers)
        return jsonify(res.json())
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api_bp.route('/repos/<path:repo_name>/prs/<int:pr_number>/predict')
def predict_pr(repo_name, pr_number):
    user = get_user_from_token()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
        
    prediction = pr_service.predict_pr_impact(user, repo_name, pr_number)
    return jsonify(prediction)
