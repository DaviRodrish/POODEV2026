import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export function ClienteDashboard() {
  const [veiculos, setVeiculos] = useState([]);
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  // Se o contexto não tiver o usuário carregado imediatamente, tentamos ler do localStorage
  const usuarioLogado = user || JSON.parse(localStorage.getItem('user')) || { nome: 'Cliente' };

  useEffect(() => {
    // Buscar veículos disponíveis do catálogo
    fetch('http://localhost:8000/api/catalogo/veiculos')
      .then(res => res.json())
      .then(data => setVeiculos(data))
      .catch(err => console.error("Erro ao carregar veículos", err));
  }, []);

  const handleReservar = (veiculoId) => {
    alert(`Funcionalidade de reserva para o veículo ID ${veiculoId} acionada!`);
  };

  const handleAcionarSeguro = () => {
    const tipo = prompt("Qual o tipo de emergência? (ex: Acidente, Pane Elétrica, Pneu Furado)");
    if (!tipo) return;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const localizacao = `Lat: ${position.coords.latitude}, Lng: ${position.coords.longitude}`;
        alert(`Emergência acionada com sucesso! Localização: ${localizacao}. O seguro foi notificado.`);
      }, () => {
        alert("Emergência acionada, mas não foi possível obter a localização exata.");
      });
    }
  };

  const handleSair = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Barra superior de navegação com o nome do utilizador logado */}
      <nav className="bg-white shadow px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <span className="bg-blue-600 text-white font-bold p-2 rounded-lg text-sm">Cliente</span>
          <h1 className="text-xl font-bold text-gray-800">Aluguel de Carros</h1>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-gray-900">{usuarioLogado.nome}</p>
            <p className="text-xs text-gray-500 capitalize">{usuarioLogado.tipoPerfil || 'Cliente'}</p>
          </div>
          
          <div className="h-8 w-px bg-gray-200"></div>

          <button 
            onClick={handleSair}
            className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            Sair
          </button>
        </div>
      </nav>

      <div className="p-6 max-w-7xl mx-auto">
        {/* Botão de Emergência / Seguro */}
        <section className="mb-8 bg-red-50 border border-red-200 p-6 rounded-xl flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm">
          <div>
            <h3 className="text-red-700 font-bold text-lg">Precisa de Ajuda URGENTE?</h3>
            <p className="text-sm text-red-600">Acione o botão de emergência para notificar o seguro e enviar sua localização em tempo real.</p>
          </div>
          <button 
            onClick={handleAcionarSeguro}
            className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-lg shadow animate-pulse transition whitespace-nowrap"
          >
            🚨 Botão de Emergência
          </button>
        </section>

        {/* Catálogo de Veículos Disponíveis */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Veículos Disponíveis para Locação</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {veiculos.length === 0 ? (
              <p className="text-gray-500">Nenhum veículo disponível no momento.</p>
            ) : (
              veiculos.map(v => (
                <div key={v.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition">
                  <h3 className="font-bold text-lg text-gray-900">{v.marca} {v.modelo}</h3>
                  <p className="text-sm text-gray-600 mt-1">Placa: <span className="font-mono bg-gray-100 px-1 rounded">{v.placa}</span></p>
                  <p className="text-sm text-gray-600">Ano: {v.ano}</p>
                  <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                    <div>
                      <span className="text-xs text-gray-500">Diária</span>
                      <p className="text-lg font-bold text-blue-600">R$ {v.valor_diaria}</p>
                    </div>
                    <button 
                      onClick={() => handleReservar(v.id)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition shadow-sm"
                    >
                      Reservar
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}