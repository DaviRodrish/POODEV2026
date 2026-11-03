import { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (cpfOuEmail, senha) => {
    try {
      // Como o FastAPI espera dados de formulário (Form), usamos FormData
      const formData = new FormData();
      formData.append('identificador', cpfOuEmail);
      formData.append('senha', senha);

      // Alterado para '/api/login' para bater certinho com a rota do FastAPI
      const response = await api.post('/api/login', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const data = response.data;

      // Salvamos o utilizador e o tipo de perfil retornado pelo backend
      const usuarioLogado = { ...data.usuario, tipoPerfil: data.tipoPerfil };

      localStorage.setItem('token', 'fake-token-jwt'); // ou data.token se o backend retornar
      localStorage.setItem('user', JSON.stringify(usuarioLogado));
      setUser(usuarioLogado);

      return { 
        success: true, 
        tipoPerfil: data.tipoPerfil // Retornamos para redirecionar na página de Login
      };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.detail || 'Erro ao realizar login. Verifique suas credenciais.' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ authenticated: !!user, user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}