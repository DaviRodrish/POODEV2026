import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export function ClienteDashboard() {
  const [veiculos, setVeiculos] = useState([]);
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const usuarioLogado = user || JSON.parse(localStorage.getItem('user')) || { nome: 'Cliente', status: 'ATIVO' };
  const isBloqueado = (usuarioLogado.status || '').toUpperCase() === 'BLOQUEADO';

  useEffect(() => {
    fetch('http://localhost:8000/api/catalogo/veiculos')
      .then(res => res.json())
      .then(data => setVeiculos(data))
      .catch(err => console.error("Erro ao carregar veículos", err));
  }, []);

  const handleReservar = (veiculo) => {
    if (isBloqueado) {
      alert(`Locação Bloqueada: Sua conta possui pendências ativas (${usuarioLogado.motivo || 'regularize com a agência'}).`);
      return;
    }

    if (veiculo.precisa_revisao || veiculo.status === 'manutenção') {
      alert(`Este veículo atingiu o limite de quilometragem para revisão preventiva e está temporariamente indisponível.`);
      return;
    }

    const dias = prompt("Quantos dias deseja alugar?", "1");
    if (!dias) return;

    const form = new FormData();
    form.append("cliente_id", usuarioLogado.id);
    form.append("veiculo_id", veiculo.id);
    form.append("dias", dias);

    fetch("http://localhost:8000/api/reservas", { method: "POST", body: form })
      .then(() => alert(`Pedido de reserva enviado para a agência!`));
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
      {isBloqueado && (
        <div className="bg-red-600 text-white px-6 py-3 shadow-md flex flex-col sm:flex-row justify-between items-center gap-2">
          <div className="flex items-center space-x-2">
            <span className="text-xl">⚠️</span>
            <p className="text-sm font-semibold">
              Conta com Restrição Ativa: <span className="font-normal underline">{usuarioLogado.motivo || 'Pendência financeira ou cadastral'}</span>. Novas reservas estão suspensas.
            </p>
          </div>
          <span className="text-xs bg-red-800 uppercase px-2.5 py-1 rounded-full font-bold tracking-wider">
            Bloqueado
          </span>
        </div>
      )}

      <nav className="bg-white shadow px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <span className="bg-blue-600 text-white font-bold p-2 rounded-lg text-sm">Cliente</span>
          <h1 className="text-xl font-bold text-gray-800">Aluguel de Carros</h1>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-gray-900">{usuarioLogado.nome}</p>
            <p className="text-xs text-gray-500 capitalize">
              {usuarioLogado.tipoPerfil || 'Cliente'} {isBloqueado && <span className="text-red-500 font-bold">(Restrito)</span>}
            </p>
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

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Veículos Disponíveis para Locação</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {veiculos.length === 0 ? (
              <p className="text-gray-500">Nenhum veículo disponível no momento.</p>
            ) : (
              veiculos.map(v => {
                const combustivelPct = Math.round((v.combustivel_nivel ?? 1.0) * 100);
                const kmAtual = v.quilometragem || 0;
                const emRevisao = v.precisa_revisao || v.status === 'manutenção';
                const alugado = v.status === 'alugado';
                const bloqueadoParaAluguel = isBloqueado || emRevisao || alugado;

                return (
                  <div key={v.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition">
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-lg text-gray-900">{v.marca} {v.modelo}</h3>
                      {emRevisao && (
                        <span className="px-2 py-0.5 text-xs font-semibold rounded bg-amber-100 text-amber-800">
                          Revisão
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-gray-600 mt-1">Placa: <span className="font-mono bg-gray-100 px-1 rounded">{v.placa}</span></p>
                    <p className="text-sm text-gray-600">Ano: {v.ano}</p>
                    
                    <div className="mt-3 flex items-center gap-3 text-xs text-gray-600 bg-gray-50 p-2 rounded-lg">
                      <span className="font-medium text-emerald-700">⛽ Tanque: {combustivelPct}%</span>
                      <span>•</span>
                      <span>Odômetro: {kmAtual} km</span>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                      <div>
                        <span className="text-xs text-gray-500">Diária</span>
                        <p className="text-lg font-bold text-blue-600">R$ {v.valor_diaria}</p>
                      </div>

                      <button 
                        onClick={() => handleReservar(v)}
                        disabled={bloqueadoParaAluguel}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition shadow-sm ${
                          bloqueadoParaAluguel
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                        title={
                          isBloqueado ? `Conta com restrições: ${usuarioLogado.motivo}` :
                          emRevisao ? 'Veículo aguardando revisão preventiva' : 'Clique para reservar'
                        }
                      >
                        {isBloqueado ? 'Conta Bloqueada' : alugado ? 'Alugado' : emRevisao ? 'Em Revisão' : 'Reservar'}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
