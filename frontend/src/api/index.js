import axios from 'axios';

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

// В продакшене BACKEND_URL берётся из переменной окружения VITE_API_URL
// В разработке запросы проксируются через vite на localhost:8000
const BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(config => {
  const csrfToken = getCookie('csrftoken');
  if (csrfToken) {
    config.headers['X-CSRFToken'] = csrfToken;
  }
  return config;
});

// Auth
export const registerStep1 = (data) => api.post('/auth/register/step1/', data);
export const registerStep2 = (data) => api.post('/auth/register/step2/', data);
export const loginStep1 = (data) => api.post('/auth/login/step1/', data);
export const loginStep2 = (data) => api.post('/auth/login/step2/', data);
export const logout = () => api.post('/auth/logout/');
export const checkAuth = () => api.get('/auth/check/');
export const getProfile = () => api.get('/auth/profile/');
export const getLeaderboard = () => api.get('/auth/leaderboard/');

// Game
export const createGame = () => api.post('/game/create/');
export const listGames = () => api.get('/game/list/');
export const joinGame = (id) => api.post(`/game/${id}/join/`);
export const makeMove = (id, position) => api.post(`/game/${id}/move/`, { position });
export const getGame = (id) => api.get(`/game/${id}/`);
export const myGames = () => api.get('/game/my/');

// AI Game
export const createAIGame = (difficulty, player_symbol) =>
  api.post('/game/ai/create/', { difficulty, player_symbol });
export const makeAIMove = (id, position) => api.post(`/game/ai/${id}/move/`, { position });
export const getAIGame = (id) => api.get(`/game/ai/${id}/`);

export default api;
