import axios from 'axios';

const api = axios.create({
  // Altere para a porta em que o teu backend Python (FastAPI/Flask) estiver a rodar (ex: 8000)
  baseURL: 'http://localhost:8000', 
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor opcional para injetar o token de autenticação automaticamente nas rotas protegidas
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;