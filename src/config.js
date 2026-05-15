

export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const CONFIG = {
  API_BASE,
  GITHUB_AUTH_URL: `${API_BASE}/auth/github`,
  SOCKET_URL: API_BASE,
  DEFAULT_ANIMATION_DURATION: 0.3,
};

export default CONFIG;
