import google.generativeai as genai
import numpy as np
import sqlite3
import os
import json

class VectorService:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(VectorService, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def init_app(self, app):
        if self._initialized:
            return
            
        self.api_key = app.config.get('GEMINI_API_KEY')
        if not self.api_key:
            print("WARNING: GEMINI_API_KEY not found. Vector search disabled.")
            return

        genai.configure(api_key=self.api_key)
        
        self.db_path = os.path.join(app.instance_path, 'embeddings.db')
        os.makedirs(app.instance_path, exist_ok=True)
        
        with sqlite3.connect(self.db_path) as conn:
            conn.execute('''
                CREATE TABLE IF NOT EXISTS issue_embeddings (
                    issue_id TEXT PRIMARY KEY,
                    embedding BLOB,
                    metadata TEXT,
                    text TEXT
                )
            ''')
        
        self._initialized = True
        print(f"VectorService (SQLite Fallback) initialized. Path: {self.db_path}")

    def get_embedding(self, text):
        if not text:
            return np.zeros(768, dtype=np.float32)
            
        try:

            result = genai.embed_content(
                model="models/gemini-embedding-001",
                content=text[:8000],
                task_type="retrieval_document"
            )
            return np.array(result['embedding'], dtype=np.float32)
        except Exception as e:
            print(f"Embedding error: {e}")
            return np.zeros(768, dtype=np.float32)

    def index_issue(self, issue_id, title, body, metadata):
        if not self._initialized:
            return
            
        text = f"{title}\n\n{body}"
        embedding = self.get_embedding(text)
        
        with sqlite3.connect(self.db_path) as conn:
            conn.execute(
                "INSERT OR REPLACE INTO issue_embeddings (issue_id, embedding, metadata, text) VALUES (?, ?, ?, ?)",
                (str(issue_id), embedding.tobytes(), json.dumps(metadata), text)
            )

    def find_similar_issues(self, title, body, n_results=5, metadata_filter=None):
        if not self._initialized:
            return []
            
        text = f"{title}\n\n{body}"
        query_vec = self.get_embedding(text)
        
        results = []
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.execute("SELECT issue_id, embedding, metadata, text FROM issue_embeddings")
                for row in cursor:
                    other_id, other_vec_blob, other_meta, other_text = row
                    other_vec = np.frombuffer(other_vec_blob, dtype=np.float32)
                    
                    norm_a = np.linalg.norm(query_vec)
                    norm_b = np.linalg.norm(other_vec)
                    
                    if norm_a == 0 or norm_b == 0:
                        sim = 0
                    else:
                        sim = np.dot(query_vec, other_vec) / (norm_a * norm_b)
                    
                    meta_data = json.loads(other_meta)
                    
                    if metadata_filter and 'repo' in metadata_filter:
                        if meta_data.get('repo') != metadata_filter['repo']:
                            continue
                            
                    results.append({
                        'id': other_id,
                        'distance': 1 - float(sim),
                        'metadata': meta_data,
                        'document': other_text
                    })
        except Exception as e:
            print(f"Similarity search error: {e}")
            
        results.sort(key=lambda x: x['distance'])
        return results[:n_results]

vector_service = VectorService()
