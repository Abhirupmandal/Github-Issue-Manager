import requests
from backend.extensions import db
from backend.models import ActivityLog
import re

class PRService:
    def monitor_pull_requests(self, user, repo_full_name):
        if user.access_token.startswith('local_'):
            return
            
        headers = {"Authorization": f"token {user.access_token}"}
        url = f"https://api.github.com/repos/{repo_full_name}/pulls?state=open"
        
        try:
            res = requests.get(url, headers=headers)
            if not res.ok:
                return
                
            prs = res.json()
            if not isinstance(prs, list):
                return
                
            for pr in prs:
                self._process_pr(user, repo_full_name, pr)
        except Exception as e:
            print(f"PR monitoring error: {e}")

    def _process_pr(self, user, repo_full_name, pr):
        body = pr.get('body', '') or ''

        title = pr.get('title', '') or ''
        combined_text = f"{title} {body}"
            
        issue_refs = re.findall(r'#(\d+)', combined_text)
        for issue_num_str in issue_refs:
            issue_num = int(issue_num_str)

            managed_log = ActivityLog.query.filter_by(
                user_id=user.id,
                repo_name=repo_full_name,
                issue_number=issue_num
            ).first()
            
            if managed_log:

                self._comment_on_pr(user, repo_full_name, pr['number'], issue_num)

    def _comment_on_pr(self, user, repo_full_name, pr_number, issue_number):

        marker = f"AI Agent: Noticed PR #{pr_number} fixes #{issue_number}"
        comment_log = ActivityLog.query.filter_by(
            user_id=user.id,
            action_type='pr_comment',
            details=marker
        ).first()
        
        if comment_log:
            return

        headers = {"Authorization": f"token {user.access_token}"}
        url = f"https://api.github.com/repos/{repo_full_name}/issues/{pr_number}/comments"
        
        comment_body = f"🤖 **IssueAgent Notification**: I noticed this PR references issue #{issue_number}, which I am currently managing. I'll keep an eye on this PR and update the issue status once it's merged! \n\n*Action tracked in Audit Trail.*"
        
        try:
            res = requests.post(url, headers=headers, json={"body": comment_body})
            if res.status_code == 201:
                log = ActivityLog(
                    user_id=user.id,
                    action_type='pr_comment',
                    repo_name=repo_full_name,
                    issue_number=pr_number,
                    details=marker
                )
                db.session.add(log)
                db.session.commit()
                print(f"Commented on PR #{pr_number} for issue #{issue_number}")
        except Exception as e:
            print(f"Error commenting on PR: {e}")

    def predict_pr_impact(self, user, repo_full_name, pr_number):
        if user.access_token.startswith('local_'):
            return {"error": "PR prediction requires a real GitHub connection."}
            
        import google.generativeai as genai
        import os
        
        headers = {
            "Authorization": f"token {user.access_token}",
            "Accept": "application/vnd.github.v3.diff"
        }
        url = f"https://api.github.com/repos/{repo_full_name}/pulls/{pr_number}"
        
        try:

            res = requests.get(url, headers=headers)
            if not res.ok:
                return {"error": "Could not fetch PR diff."}
            diff_text = res.text[:15000]
            
            genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))
            model = genai.GenerativeModel('gemini-1.5-flash')
            
            prompt = f"""
            Analyze this GitHub Pull Request diff and predict the impact on the build and code health.
            Return a JSON object with:
            - risk_level: "low", "medium", or "high"
            - break_probability: percentage (0-100)
            - summary: 1-2 sentence overview
            - predicted_issues: array of specific issues found
            - confidence: 0.0 to 1.0
            
            PR Diff:
            {diff_text}
            """
            
            ai_res = model.generate_content(prompt)

            json_match = re.search(r'\{.*\}', ai_res.text, re.DOTALL)
            if json_match:
                import json
                return json.loads(json_match.group())
            return {"error": "AI failed to generate a valid prediction."}
            
        except Exception as e:
            print(f"PR Prediction error: {e}")
            return {"error": str(e)}

pr_service = PRService()
