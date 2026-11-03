import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

export function Login() {
  const [cpfOuEmail, setCpfOuEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');

    const res = await login(cpfOuEmail, senha);
    
    if (res.success) {
      // Redireciona com base no tipo de perfil retornado pela API
      if (res.tipoPerfil === 'agencia') {
        navigate('/agencia/dashboard');
      } else {
        navigate('/cliente/dashboard');
      }
    } else {
      setErro(res.message || "Erro ao efetuar login.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Bem-vindo de volta</h2>
          <p className="text-sm text-gray-500 mt-1">Entre com o seu CPF ou e-mail para continuar</p>
        </div>
        
        {erro && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {erro}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CPF, CNPJ ou E-mail</label>
            <input 
              type="text" 
              value={cpfOuEmail} 
              onChange={(e) => setCpfOuEmail(e.target.value)} 
              placeholder="ex: 12345678900 ou email@exemplo.com"
              required 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
            <input 
              type="password" 
              value={senha} 
              onChange={(e) => setSenha(e.target.value)} 
              placeholder="••••••••"
              required 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
            />
          </div>

          <button 
            type="submit" 
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow transition duration-200 mt-2"
          >
            Entrar
          </button>
        </form>

        <div className="mt-6 flex items-center justify-between text-sm">
          <Link to="/" className="text-blue-600 hover:underline font-medium">
            ← Voltar para a Home
          </Link>
          <Link to="/cadastro" className="text-blue-600 hover:underline font-medium">
            Criar conta →
          </Link>
        </div>
      </div>
    </div>
  );
}