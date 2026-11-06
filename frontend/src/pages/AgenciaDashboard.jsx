import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export function AgenciaDashboard({ agenciaLogada: propAgencia, onLogout: propLogout }) {
  const { user, logout } = useContext(AuthContext);
  const agenciaLogada = propAgencia || user;
  const onLogout = propLogout || logout;
  const [abaAtiva, setAbaAtiva] = useState('emergencias');

  const [frota, setFrota] = useState([]);
  const [emergencias, setEmergencias] = useState([]);
  const [reservasPendentes, setReservasPendentes] = useState([]);
  const [carregando, setCarregando] = useState(true);

  // Estados para o cadastro de veículos via FIPE
  const [marcas, setMarcas] = useState([]);
  const [modelos, setModelos] = useState([]);
  const [anos, setAnos] = useState([]);

  const [placa, setPlaca] = useState('');
  const [marcaCodigo, setMarcaCodigo] = useState('');
  const [modeloCodigo, setModeloCodigo] = useState('');
  const [anoCodigo, setAnoCodigo] = useState('');
  const [valorDiaria, setValorDiaria] = useState('');
  const [mensagemFeedback, setMensagemFeedback] = useState('');

  useEffect(() => {
    if (!agenciaLogada?.id) return;
    carregarDadosIniciais();

    const intervaloEmergencias = setInterval(() => {
      carregarEmergencias();
    }, 10000);

    return () => clearInterval(intervaloEmergencias);
  }, [agenciaLogada?.id]);

  const carregarDadosIniciais = async () => {
    setCarregando(true);
    await Promise.all([
      carregarFrota(),
      carregarEmergencias(),
      carregarReservasPendentes(),
      carregarMarcasFipe()
    ]);
    setCarregando(false);
  };

  const carregarFrota = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/catalogo/veiculos');
      if (res.ok) {
        const dados = await res.json();
        const veiculosDaAgencia = dados.filter(v => v.agencia_id === agenciaLogada.id);
        setFrota(veiculosDaAgencia);
      }
    } catch (err) {
      console.error("Erro ao carregar frota:", err);
    }
  };

  const carregarEmergencias = async () => {
    if (!agenciaLogada?.id) return;
    try {
      const res = await fetch(`http://localhost:8000/api/agencias/${agenciaLogada.id}/emergencias`);
      if (res.ok) {
        const dados = await res.json();
        setEmergencias(dados);
      }
    } catch (err) {
      console.error("Erro ao carregar emergências:", err);
    }
  };

  const carregarReservasPendentes = async () => {
    if (!agenciaLogada?.id) return;
    try {
      const res = await fetch(`http://localhost:8000/api/agencias/${agenciaLogada.id}/reservas-pendentes`);
      if (res.ok) {
        const dados = await res.json();
        setReservasPendentes(dados);
      }
    } catch (err) {
      console.error("Erro ao carregar reservas pendentes:", err);
    }
  };

  const responderReserva = async (reservaId, aprovar) => {
    const formData = new FormData();
    formData.append('aprovar', aprovar);

    try {
      const res = await fetch(`http://localhost:8000/api/reservas/${reservaId}/responder`, {
        method: 'PUT',
        body: formData
      });

      if (res.ok) {
        carregarReservasPendentes();
        carregarFrota();
      }
    } catch (err) {
      console.error("Erro ao responder reserva:", err);
    }
  };

  const carregarMarcasFipe = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/fipe/marcas');
      if (res.ok) {
        const dados = await res.json();
        setMarcas(dados);
      }
    } catch (err) {
      console.error("Erro ao carregar marcas FIPE:", err);
    }
  };

  const selecionarMarca = async (e) => {
    const codigo = e.target.value;
    setMarcaCodigo(codigo);
    setModelos([]);
    setAnos([]);
    setModeloCodigo('');
    setAnoCodigo('');

    if (!codigo) return;

    try {
      const res = await fetch(`http://localhost:8000/api/fipe/marcas/${codigo}/modelos`);
      if (res.ok) {
        const dados = await res.json();
        setModelos(dados.modelos || dados);
      }
    } catch (err) {
      console.error("Erro ao carregar modelos FIPE:", err);
    }
  };

  const selecionarModelo = async (e) => {
    const codigo = e.target.value;
    setModeloCodigo(codigo);
    setAnos([]);
    setAnoCodigo('');

    if (!codigo) return;

    try {
      const res = await fetch(`http://localhost:8000/api/fipe/marcas/${marcaCodigo}/modelos/${codigo}/anos`);
      if (res.ok) {
        const dados = await res.json();
        setAnos(dados);
      }
    } catch (err) {
      console.error("Erro ao carregar anos FIPE:", err);
    }
  };

  const cadastrarVeiculo = async (e) => {
    e.preventDefault();
    setMensagemFeedback('');

    const formData = new FormData();
    formData.append('placa', placa);
    formData.append('marca_codigo', marcaCodigo);
    formData.append('modelo_codigo', modeloCodigo);
    formData.append('ano_codigo', anoCodigo);
    formData.append('valor_diaria', valorDiaria);

    try {
      const res = await fetch(`http://localhost:8000/api/agencias/${agenciaLogada.id}/veiculos`, {
        method: 'POST',
        body: formData
      });
      const dados = await res.json();

      if (res.ok) {
        setMensagemFeedback({ tipo: 'sucesso', texto: dados.message });
        setPlaca('');
        setValorDiaria('');
        carregarFrota();
      } else {
        setMensagemFeedback({ tipo: 'erro', texto: dados.detail || 'Erro ao cadastrar veículo.' });
      }
    } catch (err) {
      setMensagemFeedback({ tipo: 'erro', texto: 'Erro de conexão com o servidor.' });
    }
  };

  const totalAlertasAbertos = Array.isArray(emergencias) 
    ? emergencias.filter(e => e.status === 'ABERTO').length 
    : 0;

  const totalReservasPendentes = Array.isArray(reservasPendentes) ? reservasPendentes.length : 0;

  return (
    <div className="min-h-screen bg-slate-100 flex font-sans">
      
      {/* SIDEBAR LATERAL */}
      <aside className="w-72 bg-slate-900 text-slate-300 flex flex-col justify-between p-6 border-r border-slate-800 shadow-xl hidden md:flex">
        <div className="space-y-8">
          {/* Perfil da Agência */}
          <div className="flex items-center gap-3 px-2">
            <div className="h-10 w-25 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow">
              {agenciaLogada?.nome ? agenciaLogada.nome.charAt(0).toUpperCase() : 'Agência'}
            </div>
            <div className="overflow-hidden">
              <h2 className="text-white font-bold text-sm truncate">{agenciaLogada?.nome}</h2>
              <p className="text-xs text-slate-400 truncate">{agenciaLogada?.email}</p>
            </div>
          </div>

          {/* Navegação da Sidebar */}
          <nav className="space-y-2">
            <button
              onClick={() => setAbaAtiva('emergencias')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition ${
                abaAtiva === 'emergencias' 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'hover:bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <span>🚨</span> Alertas SOS
              </div>
              {totalAlertasAbertos > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] text-white font-bold animate-pulse">
                  {totalAlertasAbertos}
                </span>
              )}
            </button>

            <button
              onClick={() => setAbaAtiva('reservas')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition ${
                abaAtiva === 'reservas' 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'hover:bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <span>📋</span> Solicitações
              </div>
              {totalReservasPendentes > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] text-white font-bold">
                  {totalReservasPendentes}
                </span>
              )}
            </button>

            <button
              onClick={() => setAbaAtiva('frota')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition ${
                abaAtiva === 'frota' 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'hover:bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <span>🚗</span> Frota & FIPE
              </div>
            </button>
          </nav>
        </div>

        {/* Rodapé da Sidebar (Terminar Sessão) */}
        <div>
          {onLogout && (
            <button 
              onClick={onLogout}
              className="w-full bg-slate-800 hover:bg-rose-600/20 hover:border-rose-500 hover:text-rose-400 border border-slate-700 text-slate-300 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
            >
              🚪 Terminar Sessão
            </button>
          )}
        </div>
      </aside>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* Header Superior (Mobile & Título da Página) */}
        <header className="bg-white border-b border-slate-200 px-8 py-5 flex justify-between items-center shadow-sm">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 capitalize">
              {abaAtiva === 'emergencias' && 'Central de Emergências & SOS'}
              {abaAtiva === 'reservas' && 'Solicitações de Reserva de Clientes'}
              {abaAtiva === 'frota' && 'Gestão de Frota e Tabela FIPE'}
            </h1>
            <p className="text-xs text-slate-500">Painel de Controlo Administrativo</p>
          </div>

          {/* Botão de Terminar Sessão para Dispositivos Móveis */}
          {onLogout && (
            <button 
              onClick={onLogout}
              className="md:hidden bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs font-bold"
            >
              Sair
            </button>
          )}
        </header>

        {/* Corpo Dinâmico Conforme a Aba Ativa */}
        <div className="p-8 max-w-7xl mx-auto w-full space-y-6">

          {/* ABA 1: EMERGÊNCIAS */}
          {abaAtiva === 'emergencias' && (
            <section className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Monitorização de Ocorrências</h2>
                  <p className="text-xs text-slate-500">Alertas SOS enviados pelos clientes em circulação (Atualização a cada 10s)</p>
                </div>
                {totalAlertasAbertos > 0 && (
                  <span className="bg-rose-100 text-rose-700 border border-rose-200 px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                    🚨 {totalAlertasAbertos} Ativo(s)
                  </span>
                )}
              </div>
              
              {carregando ? (
                <div className="py-12 text-center text-slate-400 text-sm">A carregar alertas...</div>
              ) : !emergencias || emergencias.length === 0 ? (
                <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 p-5 rounded-xl text-sm font-medium flex items-center gap-3">
                  <span className="text-xl">✅</span> Nenhum alerta de emergência registado no momento. Frota segura!
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {emergencias.map((alerta) => (
                    <div key={alerta.id} className="bg-rose-50/60 border border-rose-200 rounded-xl p-5 flex flex-col justify-between gap-4 shadow-sm">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="bg-rose-600 text-white text-[10px] tracking-wider px-2.5 py-1 rounded-md font-bold uppercase">
                            {alerta.tipo}
                          </span>
                          <span className="text-[11px] font-semibold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                            {alerta.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">Recebido em: {alerta.data_hora}</p>
                        
                        <div className="bg-white/80 p-3 rounded-lg border border-rose-100 space-y-1 text-xs">
                          <p className="text-slate-700"><strong>Locação ID:</strong> {alerta.locacao_id}</p>
                          <p className="text-slate-700"><strong>Seguro:</strong> {alerta.protocolo_seguro || "N/A"}</p>
                          {alerta.descricao && (
                            <p className="text-slate-600 italic">"{alerta.descricao}"</p>
                          )}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-rose-200/60 flex justify-between items-center">
                        <span className="text-[11px] text-slate-500 truncate max-w-[150px]">
                          📍 {alerta.latitude}, {alerta.longitude}
                        </span>
                        <a 
                          href={`https://www.google.com/maps?q=${alerta.latitude},${alerta.longitude}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded-lg font-semibold transition shadow-sm inline-flex items-center gap-1.5"
                        >
                          Mapa 🗺️
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* ABA 2: RESERVAS PENDENTES */}
          {abaAtiva === 'reservas' && (
            <section className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6">
              <div className="mb-6">
                <h2 className="text-lg font-bold text-slate-900">Aprovação de Reservas</h2>
                <p className="text-xs text-slate-500">Analise os dados do cliente e autorize ou recuse a alocação</p>
              </div>

              {reservasPendentes.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-sm border-2 border-dashed border-slate-100 rounded-xl">
                  Nenhuma solicitação de reserva pendente no momento.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {reservasPendentes.map((item) => (
                    <div key={item.id} className="bg-amber-50/50 border border-amber-200 rounded-xl p-5 flex flex-col justify-between gap-4 shadow-sm">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="bg-amber-600 text-white text-[10px] uppercase font-bold px-2.5 py-1 rounded-md">
                            Pendente de Aprovação
                          </span>
                          <span className="text-xs font-bold text-emerald-700">
                            Total: R$ {item.valor_total}
                          </span>
                        </div>

                        <div className="bg-white p-3 rounded-lg border border-amber-100 space-y-1 text-xs">
                          <p className="text-slate-900 font-bold">👤 Cliente: {item.cliente.nome}</p>
                          <p className="text-slate-600">E-mail: {item.cliente.email}</p>
                          <p className="text-slate-600">CNH: {item.cliente.cnh || "Não informada"}</p>
                          <hr className="my-1 border-slate-100" />
                          <p className="text-slate-900 font-medium">🚗 Veículo: {item.veiculo.modelo} ({item.veiculo.placa})</p>
                          <p className="text-slate-700 font-semibold">📅 Período solicitado: {item.dias} dia(s)</p>
                        </div>
                      </div>

                      <div className="flex gap-3 pt-2 border-t border-amber-200/60">
                        <button 
                          onClick={() => responderReserva(item.id, true)}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs py-2 rounded-lg font-bold transition shadow-sm"
                        >
                          Aprovar ✅
                        </button>
                        <button 
                          onClick={() => responderReserva(item.id, false)}
                          className="flex-1 bg-rose-600 hover:bg-rose-700 text-white text-xs py-2 rounded-lg font-bold transition shadow-sm"
                        >
                          Recusar ❌
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* ABA 3: GESTÃO DE FROTA & FIPE */}
          {abaAtiva === 'frota' && (
            <div className="space-y-6">
              {/* Cadastro FIPE */}
              <section className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6">
                <div className="mb-6">
                  <h2 className="text-lg font-bold text-slate-900">Adicionar Novo Veículo à Frota</h2>
                  <p className="text-xs text-slate-500">Registo integrado diretamente com a Tabela FIPE</p>
                </div>

                {mensagemFeedback && (
                  <div className={`p-4 mb-6 rounded-xl text-sm font-medium ${mensagemFeedback.tipo === 'sucesso' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
                    {mensagemFeedback.texto}
                  </div>
                )}

                <form onSubmit={cadastrarVeiculo} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Placa do Veículo</label>
                    <input 
                      type="text" 
                      placeholder="Ex: ABC-1234" 
                      value={placa} 
                      onChange={(e) => setPlaca(e.target.value)} 
                      required
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm uppercase focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">1. Marca (FIPE)</label>
                    <select 
                      value={marcaCodigo} 
                      onChange={selecionarMarca} 
                      required
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                    >
                      <option value="">Selecione a Marca...</option>
                      {marcas.map(m => (
                        <option key={m.codigo} value={m.codigo}>{m.nome}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">2. Modelo (FIPE)</label>
                    <select 
                      value={modeloCodigo} 
                      onChange={selecionarModelo} 
                      required
                      disabled={!marcaCodigo}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400 transition"
                    >
                      <option value="">Selecione o Modelo...</option>
                      {modelos.map(mod => (
                        <option key={mod.codigo} value={mod.codigo}>{mod.nome}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">3. Ano / Versão (FIPE)</label>
                    <select 
                      value={anoCodigo} 
                      onChange={(e) => setAnoCodigo(e.target.value)} 
                      required
                      disabled={!modeloCodigo}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400 transition"
                    >
                      <option value="">Selecione o Ano...</option>
                      {anos.map(a => (
                        <option key={a.codigo} value={a.codigo}>{a.nome}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Valor da Diária (R$)</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      placeholder="150.00" 
                      value={valorDiaria} 
                      onChange={(e) => setValorDiaria(e.target.value)} 
                      required
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                    />
                  </div>

                  <div className="flex items-end">
                    <button 
                      type="submit" 
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl text-sm transition shadow-sm hover:shadow"
                    >
                      Cadastrar Veículo 🚗
                    </button>
                  </div>
                </form>
              </section>

              {/* Listagem de Frota */}
              <section className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Frota Registada</h2>
                    <p className="text-xs text-slate-500">Veículos ativos sob gestão desta agência</p>
                  </div>
                  <span className="bg-blue-50 text-blue-700 border border-blue-100 px-3 py-1 rounded-xl text-xs font-bold">
                    Total: {frota.length}
                  </span>
                </div>

                {frota.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-sm border-2 border-dashed border-slate-100 rounded-xl">
                    Ainda não existem veículos registados nesta agência.
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 font-bold uppercase tracking-wider">
                          <th className="p-4">Placa</th>
                          <th className="p-4">Marca / Modelo</th>
                          <th className="p-4">Ano</th>
                          <th className="p-4">Diária</th>
                          <th className="p-4">Combustível</th>
                          <th className="p-4">Status</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm divide-y divide-slate-100">
                        {frota.map(v => (
                          <tr key={v.id} className="hover:bg-slate-50/80 transition">
                            <td className="p-4 font-bold text-slate-900">{v.placa}</td>
                            <td className="p-4 text-slate-700 font-medium">{v.marca} - {v.modelo}</td>
                            <td className="p-4 text-slate-600">{v.ano}</td>
                            <td className="p-4 font-bold text-emerald-600">R$ {v.valor_diaria}</td>
                            <td className="p-4 text-slate-600">
                              <div className="flex items-center gap-2">
                                <div className="w-16 bg-slate-200 rounded-full h-2 overflow-hidden">
                                  <div 
                                    className="bg-emerald-500 h-full rounded-full" 
                                    style={{ width: `${Math.round((v.combustivel_nivel || 1) * 100)}%` }}
                                  ></div>
                                </div>
                                <span className="text-xs">{Math.round((v.combustivel_nivel || 1) * 100)}%</span>
                              </div>
                            </td>
                            <td className="p-4">
                              <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${v.status === 'disponível' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
                                {v.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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