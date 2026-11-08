import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export function ClienteDashboard() {
  const [abaAtiva, setAbaAtiva] = useState('catalogo');
  const [veiculos, setVeiculos] = useState([]);
  const [minhasReservas, setMinhasReservas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [mensagemFeedback, setMensagemFeedback] = useState('');

  // Estados para simulação de dias de reserva por veículo
  const [diasReserva, setDiasReserva] = useState({});

  // Estados para a Central SOS
  const [tipoEmergencia, setTipoEmergencia] = useState('ACIDENTE');
  const [descricaoEmergencia, setDescricaoEmergencia] = useState('');
  const [minhasEmergencias, setMinhasEmergencias] = useState([]);

  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const usuarioLogado = user || JSON.parse(localStorage.getItem('user')) || { id: 1, nome: 'Cliente', status: 'ATIVO' };
  const isBloqueado = (usuarioLogado.status || '').toUpperCase() === 'BLOQUEADO';

  // Carrega dados iniciais e sincroniza as reservas e emergências a cada 10 segundos
  useEffect(() => {
    if (!usuarioLogado?.id) return;
    carregarDadosIniciais();

    const intervaloReservas = setInterval(() => {
      carregarMinhasReservas();
      carregarMinhasEmergencias();
    }, 10000);

    return () => clearInterval(intervaloReservas);
  }, [usuarioLogado?.id]);

  const carregarDadosIniciais = async () => {
    setCarregando(true);
    await Promise.all([
      carregarCatalogo(),
      carregarMinhasReservas(),
      carregarMinhasEmergencias()
    ]);
    setCarregando(false);
  };

  const carregarCatalogo = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/catalogo/veiculos');
      if (res.ok) {
        const data = await res.json();
        setVeiculos(data);
      }
    } catch (err) {
      console.error("Erro ao carregar veículos:", err);
    }
  };

  const carregarMinhasReservas = async () => {
    if (!usuarioLogado?.id) return;
    try {
      const res = await fetch(`http://localhost:8000/api/clientes/${usuarioLogado.id}/reservas`);
      if (res.ok) {
        const dados = await res.json();
        setMinhasReservas(dados);
      }
    } catch (err) {
      console.error("Erro ao carregar reservas do cliente:", err);
    }
  };

  const carregarMinhasEmergencias = async () => {
    if (!usuarioLogado?.id) return;
    try {
      const res = await fetch(`http://localhost:8000/api/clientes/${usuarioLogado.id}/emergencias`);
      if (res.ok) {
        const dados = await res.json();
        setMinhasEmergencias(dados);
      }
    } catch (err) {
      console.error("Erro ao carregar emergências do cliente:", err);
    }
  };

  const handleConfirmarAtendimento = async (emergenciaId) => {
    setMensagemFeedback('');
    try {
      const formData = new FormData();
      formData.append('novo_status', 'RESOLVIDO');
      formData.append('status', 'RESOLVIDO');

      const res = await fetch(`http://localhost:8000/api/emergencias/${emergenciaId}/status`, {
        method: 'PUT',
        body: formData
      });

      if (res.ok) {
        setMensagemFeedback({
          tipo: 'sucesso',
          texto: 'Atendimento confirmado com sucesso! Ocorrência encerrada.'
        });
        carregarMinhasEmergencias();
      } else {
        const erroJson = await res.json();
        const msgErro = typeof erroJson.detail === 'string'
          ? erroJson.detail
          : Array.isArray(erroJson.detail)
            ? erroJson.detail.map(e => e.msg || JSON.stringify(e)).join(', ')
            : (erroJson.detail ? JSON.stringify(erroJson.detail) : 'Erro ao confirmar atendimento.');
        setMensagemFeedback({
          tipo: 'erro',
          texto: msgErro
        });
      }
    } catch (err) {
      setMensagemFeedback({
        tipo: 'erro',
        texto: 'Erro de conexão com o servidor ao confirmar atendimento.'
      });
    }
  };

  const handleReservar = async (veiculo) => {
    setMensagemFeedback('');

    if (isBloqueado) {
      setMensagemFeedback({ tipo: 'erro', texto: `Locação Bloqueada: Sua conta possui pendências ativas (${usuarioLogado.motivo || 'regularize com a agência'}).` });
      return;
    }

    if (veiculo.precisa_revisao || veiculo.status === 'manutenção') {
      setMensagemFeedback({ tipo: 'erro', texto: `Este veículo atingiu o limite de quilometragem para revisão preventiva e está temporariamente indisponível.` });
      return;
    }

    const dias = diasReserva[veiculo.id] || 1;

    const form = new FormData();
    form.append("cliente_id", usuarioLogado.id);
    form.append("veiculo_id", veiculo.id);
    form.append("dias", dias);

    try {
      const res = await fetch("http://localhost:8000/api/reservas", { method: "POST", body: form });
      if (res.ok) {
        setMensagemFeedback({ tipo: 'sucesso', texto: 'Pedido de reserva enviado com sucesso para a agência!' });
        carregarMinhasReservas();
      } else {
        const erroJson = await res.json();
        setMensagemFeedback({ tipo: 'erro', texto: erroJson.detail || 'Erro ao efetuar reserva.' });
      }
    } catch (err) {
      setMensagemFeedback({ tipo: 'erro', texto: 'Erro de conexão com o servidor.' });
    }
  };

  const handleDevolver = async (reservaId) => {
    setMensagemFeedback('');
    try {
      const res = await fetch(`http://localhost:8000/api/reservas/${reservaId}/devolver`, {
        method: 'PUT'
      });
      if (res.ok) {
        setMensagemFeedback({ tipo: 'sucesso', texto: 'Veículo devolvido com sucesso à agência!' });
        carregarMinhasReservas();
        carregarCatalogo();
      } else {
        const erroJson = await res.json();
        setMensagemFeedback({ tipo: 'erro', texto: erroJson.detail || 'Erro ao devolver veículo.' });
      }
    } catch (err) {
      setMensagemFeedback({ tipo: 'erro', texto: 'Erro de conexão com o servidor ao devolver veículo.' });
    }
  };

  const enviarSos = async (e) => {
    e.preventDefault();
    setMensagemFeedback('');

    // Procura por uma locação aprovada para emitir o SOS
    const locacaoAtiva = minhasReservas.find(r => r.status === 'APROVADA' || r.status === 'RETIRADO');
    
    if (!locacaoAtiva) {
      setMensagemFeedback({ tipo: 'erro', texto: 'Não possui nenhuma locação Aprovada/Ativa para disparar o SOS.' });
      return;
    }

    const executarEnvio = (lat, lng) => {
      const formData = new FormData();
      formData.append('locacao_id', locacaoAtiva.id);
      formData.append('tipo', tipoEmergencia);
      formData.append('descricao', descricaoEmergencia);
      formData.append('latitude', lat);
      formData.append('longitude', lng);

      fetch('http://localhost:8000/api/emergencias', {
        method: 'POST',
        body: formData
      })
      .then(async (res) => {
        if (res.ok) {
          setMensagemFeedback({ tipo: 'sucesso', texto: 'Alerta SOS acionado com sucesso com a sua localização GPS atual! O seguro foi notificado.' });
          setDescricaoEmergencia('');
          carregarMinhasEmergencias();
        } else {
          const erroJson = await res.json();
          setMensagemFeedback({ tipo: 'erro', texto: erroJson.detail || 'Erro ao enviar SOS.' });
        }
      })
      .catch(() => setMensagemFeedback({ tipo: 'erro', texto: 'Erro de conexão com o servidor.' }));
    };

    // Geolocation API automática
    if (navigator.geolocation) {
      setMensagemFeedback({ tipo: 'sucesso', texto: 'A obter localização GPS atual...' });
      navigator.geolocation.getCurrentPosition(
        (position) => {
          executarEnvio(position.coords.latitude.toString(), position.coords.longitude.toString());
        },
        () => {
          executarEnvio('-21.7633', '-41.3236');
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      executarEnvio('-21.7633', '-41.3236');
    }
  };

  const handleSair = () => {
    logout();
    navigate('/login');
  };

  const totalReservasAtivas = Array.isArray(minhasReservas) 
    ? minhasReservas.filter(r => r.status === 'PENDENTE' || r.status === 'APROVADA').length 
    : 0;

  return (
    <div className="min-h-screen bg-slate-100 flex font-sans">
      
      {/* SIDEBAR LATERAL DO CLIENTE */}
      <aside className="w-72 bg-slate-900 text-slate-300 flex flex-col justify-between p-6 border-r border-slate-800 shadow-xl hidden md:flex">
        <div className="space-y-8">
          <div className="flex items-center gap-3 px-2">
            <div className="h-10 w-12 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow">
              {usuarioLogado?.nome ? usuarioLogado.nome.charAt(0).toUpperCase() : 'C'}
            </div>
            <div className="overflow-hidden">
              <h2 className="text-white font-bold text-sm truncate">{usuarioLogado?.nome}</h2>
              <p className="text-xs text-slate-400 truncate">{usuarioLogado?.email || 'Cliente'}</p>
            </div>
          </div>

          <nav className="space-y-2">
            <button
              onClick={() => setAbaAtiva('catalogo')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition ${
                abaAtiva === 'catalogo' ? 'bg-emerald-600 text-white shadow-lg' : 'hover:bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3"><span>🚗</span> Catálogo de Veículos</div>
            </button>

            <button
              onClick={() => setAbaAtiva('minhas-reservas')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition ${
                abaAtiva === 'minhas-reservas' ? 'bg-emerald-600 text-white shadow-lg' : 'hover:bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3"><span>📋</span> Minhas Reservas</div>
              {totalReservasAtivas > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] text-white font-bold">
                  {totalReservasAtivas}
                </span>
              )}
            </button>

            <button
              onClick={() => setAbaAtiva('sos')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition ${
                abaAtiva === 'sos' ? 'bg-rose-600 text-white shadow-lg' : 'hover:bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3"><span>🚨</span> Emergência</div>
            </button>
          </nav>
        </div>

        <div>
          <button 
            onClick={handleSair}
            className="w-full bg-slate-800 hover:bg-rose-600/20 hover:border-rose-500 hover:text-rose-400 border border-slate-700 text-slate-300 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
          >
            🚪 Terminar Sessão
          </button>
        </div>
      </aside>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {isBloqueado && (
          <div className="bg-rose-600 text-white px-6 py-3 shadow-md flex flex-col sm:flex-row justify-between items-center gap-2">
            <div className="flex items-center space-x-2">
              <span className="text-xl">⚠️</span>
              <p className="text-sm font-semibold">
                Conta com Restrição Ativa: <span className="font-normal underline">{usuarioLogado.motivo || 'Pendência financeira ou cadastral'}</span>. Novas reservas suspensas.
              </p>
            </div>
            <span className="text-xs bg-rose-800 uppercase px-2.5 py-1 rounded-full font-bold tracking-wider">Bloqueado</span>
          </div>
        )}

        <header className="bg-white border-b border-slate-200 px-8 py-5 flex justify-between items-center shadow-sm">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 capitalize">
              {abaAtiva === 'catalogo' && 'Catálogo de Veículos Disponíveis'}
              {abaAtiva === 'minhas-reservas' && 'As Minhas Reservas e Alocações'}
              {abaAtiva === 'sos' && 'Solicitar Emergência'}
            </h1>
            <p className="text-xs text-slate-500">Painel do Cliente • Rent-a-Car</p>
          </div>
          <button onClick={handleSair} className="md:hidden bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs font-bold">Sair</button>
        </header>

        <div className="p-8 max-w-7xl mx-auto w-full space-y-6">

          {mensagemFeedback && (
            <div className={`p-4 rounded-xl text-sm font-medium ${mensagemFeedback.tipo === 'sucesso' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
              {mensagemFeedback.texto}
            </div>
          )}

          {/* ABA 1: CATÁLOGO */}
          {abaAtiva === 'catalogo' && (
            <section className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Escolha o seu Veículo</h2>
                  <p className="text-xs text-slate-500">Selecione os dias pretendidos e envie a solicitação de reserva</p>
                </div>
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-xl text-xs font-bold">
                  Total na Frota: {veiculos.length}
                </span>
              </div>

              {carregando ? (
                <div className="py-12 text-center text-slate-400 text-sm">A carregar catálogo...</div>
              ) : veiculos.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-2xl bg-white">
                  Nenhum veículo disponível no momento.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {veiculos.map(v => {
                    const combustivelPct = Math.round((v.combustivel_nivel ?? 1.0) * 100);
                    const emRevisao = v.precisa_revisao || v.status === 'manutenção';
                    const alugado = v.status === 'alugado';
                    
                    const minhaReservaDoVeiculo = minhasReservas.find(r => r.veiculo_id === v.id && (r.status === 'PENDENTE' || r.status === 'APROVADA'));
                    const statusReserva = minhaReservaDoVeiculo ? minhaReservaDoVeiculo.status : null;
                    const bloqueadoParaAluguel = isBloqueado || emRevisao || (alugado && !minhaReservaDoVeiculo) || statusReserva;

                    return (
                      <div key={v.id} className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition">
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <h3 className="font-bold text-base text-slate-900">{v.marca} {v.modelo}</h3>
                            {emRevisao && (
                              <span className="px-2 py-0.5 text-xs font-semibold rounded bg-amber-100 text-amber-800">Revisão</span>
                            )}
                          </div>

                          <div className="flex items-center justify-between text-xs text-slate-600">
                            <p>Placa: <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">{v.placa}</span> • Ano: {v.ano}</p>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              (v.quilometragem || 0) <= 10000
                                ? 'bg-purple-100 text-purple-700 border border-purple-300'
                                : 'bg-blue-100 text-blue-700 border border-blue-300'
                            }`}>
                              {(v.quilometragem || 0) <= 10000 ? 'Novo' : 'Usado'}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-3 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                            <span className="font-medium text-emerald-700">⛽ Tanque: {combustivelPct}%</span>
                            <span>•</span>
                            <span>Odômetro: {v.quilometragem || 0} km</span>
                          </div>

                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-2">
                            <label className="block text-xs font-bold text-slate-700 uppercase">Quantidade de Dias</label>
                            <input 
                              type="number" 
                              min="1" 
                              value={diasReserva[v.id] || 1}
                              onChange={(e) => setDiasReserva({ ...diasReserva, [v.id]: parseInt(e.target.value) || 1 })}
                              className="w-full bg-white border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                            />
                            <p className="text-xs font-semibold text-slate-600">
                              Total estimado: <span className="text-emerald-600 font-bold">R$ {((v.valor_diaria || 0) * (diasReserva[v.id] || 1)).toFixed(2)}</span>
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
                          <div>
                            <span className="text-xs text-slate-500">Diária</span>
                            <p className="text-base font-bold text-blue-600">R$ {v.valor_diaria}</p>
                          </div>

                          <button 
                            onClick={() => handleReservar(v)}
                            disabled={!!bloqueadoParaAluguel}
                            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-sm ${
                              statusReserva === 'PENDENTE' ? 'bg-amber-100 text-amber-800 cursor-not-allowed' :
                              statusReserva === 'APROVADA' ? 'bg-emerald-100 text-emerald-800 cursor-not-allowed' :
                              bloqueadoParaAluguel ? 'bg-slate-200 text-slate-500 cursor-not-allowed' :
                              'bg-blue-600 hover:bg-blue-700 text-white'
                            }`}
                          >
                            {statusReserva === 'PENDENTE' ? 'Solicitado ⏳' : 
                             statusReserva === 'APROVADA' ? 'Reservado ✅' : 
                             isBloqueado ? 'Bloqueado' : 
                             emRevisao ? 'Em Revisão' : 
                             alugado ? 'Alugado' : 'Reservar 📋'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* ABA 2: MINHAS RESERVAS */}
          {abaAtiva === 'minhas-reservas' && (
            <section className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Histórico de Reservas</h2>
                <p className="text-xs text-slate-500">Acompanhe em tempo real o estado de aprovação das suas solicitações</p>
              </div>

              {minhasReservas.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-sm border-2 border-dashed border-slate-100 rounded-xl">
                  Ainda não efetuou nenhuma reserva.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {minhasReservas.map(reserva => (
                    <div key={reserva.id} className="border border-slate-200 rounded-xl p-5 flex flex-col justify-between gap-4 shadow-sm bg-slate-50/50">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-slate-900">Reserva #{reserva.id}</span>
                          <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase ${
                            reserva.status === 'APROVADA' || reserva.status === 'ATIVA' ? 'bg-emerald-100 text-emerald-800' :
                            reserva.status === 'RECUSADA' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {reserva.status}
                          </span>
                        </div>

                        <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1 text-xs">
                          <p className="text-slate-800 font-bold">🚗 Veículo ID: {reserva.veiculo_id}</p>
                          <p className="text-slate-600">Período: {reserva.dias} dia(s)</p>
                          <p className="text-slate-800 font-semibold">Valor Total: R$ {reserva.valor_total}</p>
                        </div>
                      </div>

                      {(reserva.status === 'APROVADA' || reserva.status === 'ATIVA') && (
                        <button 
                          onClick={() => handleDevolver(reserva.id)}
                          className="w-full mt-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <span>🏁</span> Devolver Veículo à Agência
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* ABA 3: CENTRAL SOS */}
          {abaAtiva === 'sos' && (
            <div className="max-w-2xl mx-auto space-y-6">
              {/* BANNER DE CONFIRMAÇÃO DE ATENDIMENTO */}
              {minhasEmergencias.filter(e => e.status === 'AGUARDANDO_CLIENTE').map(em => (
                <div key={em.id} className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4 animate-in fade-in">
                  <div className="space-y-1">
                    <span className="bg-amber-600 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded">
                      Confirmação Solicitada
                    </span>
                    <h3 className="text-sm font-bold text-amber-900">
                      A equipe de socorro informou que o atendimento foi concluído!
                    </h3>
                    <p className="text-xs text-amber-700">
                      Chamado #{em.id} ({em.tipo}) • Confirme que você foi socorrido para encerrar o protocolo.
                    </p>
                  </div>
                  <button
                    onClick={() => handleConfirmarAtendimento(em.id)}
                    className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition shadow flex items-center justify-center gap-1.5 whitespace-nowrap"
                  >
                    <span>👍</span> Confirmar que Fui Atendido
                  </button>
                </div>
              ))}

              <section className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6">
                <div className="mb-6 border-b border-slate-100 pb-4">
                  <h2 className="text-lg font-bold text-rose-600">
                    Solicitar Emergência
                  </h2>
                  <p className="text-xs text-slate-500">A localização GPS atual será recolhida e enviada automaticamente à agência</p>
                </div>

                <form onSubmit={enviarSos} className="space-y-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700 uppercase">Tipo de Ocorrência</label>
                    <select 
                      value={tipoEmergencia} 
                      onChange={(e) => setTipoEmergencia(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    >
                      <option value="ACIDENTE">Acidente Rodoviário</option>
                      <option value="PANE_MECANICA">Pane Mecânica</option>
                      <option value="ROUBO">Roubo / Furto</option>
                      <option value="OUTRO">Outro Motivo</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700 uppercase">Descrição Opcional</label>
                    <textarea 
                      rows="3"
                      placeholder="Descreva brevemente o que aconteceu..." 
                      value={descricaoEmergencia} 
                      onChange={(e) => setDescricaoEmergencia(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    ></textarea>
                  </div>

                  <button 
                    type="submit" 
                    className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-xl text-sm transition shadow-lg mt-4"
                  >
                    Enviar Alerta
                  </button>
                </form>

                {/* HISTÓRICO DE CHAMADOS SOS DO CLIENTE */}
                {minhasEmergencias.length > 0 && (
                  <div className="mt-8 pt-6 border-t border-slate-100 space-y-3">
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Histórico de Chamados SOS</h3>
                    <div className="space-y-2">
                      {minhasEmergencias.map(item => (
                        <div key={item.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex justify-between items-center text-xs">
                          <div>
                            <p className="font-bold text-slate-900">Chamado #{item.id} • {item.tipo}</p>
                            <p className="text-slate-500">Data: {item.data_hora} {item.protocolo_seguro && `• Seguro: ${item.protocolo_seguro}`}</p>
                          </div>
                          <div>
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              item.status === 'ABERTO' ? 'bg-rose-100 text-rose-700' :
                              item.status === 'EM_ATENDIMENTO' ? 'bg-blue-100 text-blue-700' :
                              item.status === 'AGUARDANDO_CLIENTE' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                              'bg-emerald-100 text-emerald-700'
                            }`}>
                              {item.status === 'ABERTO' ? 'Aberto ⏳' :
                               item.status === 'EM_ATENDIMENTO' ? 'Em Atendimento 📞' :
                               item.status === 'AGUARDANDO_CLIENTE' ? 'Aguardando Sua Confirmação ⚠️' :
                               'Resolvido ✅'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}