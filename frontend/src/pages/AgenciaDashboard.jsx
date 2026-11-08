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

  // Estados para Modal Unificado de Vistoria (Odômetro + Combustível)
  const [modalVistoriaAberto, setModalVistoriaAberto] = useState(false);
  const [veiculoVistoria, setVeiculoVistoria] = useState(null);
  const [novoKmInput, setNovoKmInput] = useState('');
  const [novoCombustivelInput, setNovoCombustivelInput] = useState(1.0);
  const [erroVistoriaModal, setErroVistoriaModal] = useState('');
  const [salvandoVistoria, setSalvandoVistoria] = useState(false);

  useEffect(() => {
    if (!agenciaLogada?.id) return;
    carregarDadosIniciais();

    const intervaloEmergencias = setInterval(() => {
      carregarEmergencias();
      carregarReservasPendentes();
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

  const abrirModalVistoria = (veiculo) => {
    setVeiculoVistoria(veiculo);
    setNovoKmInput(veiculo.quilometragem || 0);
    setNovoCombustivelInput(veiculo.combustivel_nivel ?? 1.0);
    setErroVistoriaModal('');
    setModalVistoriaAberto(true);
  };

  const fecharModalVistoria = () => {
    setModalVistoriaAberto(false);
    setVeiculoVistoria(null);
    setNovoKmInput('');
    setErroVistoriaModal('');
  };

  const handleSalvarVistoria = async (e) => {
    e.preventDefault();
    setErroVistoriaModal('');
    const kmAtual = veiculoVistoria?.quilometragem || 0;
    const kmInformado = parseFloat(novoKmInput);
    const combustivelInformado = parseFloat(novoCombustivelInput);

    if (isNaN(kmInformado) || kmInformado < kmAtual) {
      setErroVistoriaModal(`Quilometragem inválida: ${kmInformado} km não pode ser menor que o odômetro atual (${kmAtual} km).`);
      return;
    }

    if (isNaN(combustivelInformado) || combustivelInformado < 0 || combustivelInformado > 1) {
      setErroVistoriaModal('Nível de combustível inválido (deve ser entre 0% e 100%).');
      return;
    }

    setSalvandoVistoria(true);
    try {
      const formData = new FormData();
      formData.append('quilometragem', kmInformado);
      formData.append('combustivel_nivel', combustivelInformado);

      const res = await fetch(`http://localhost:8000/api/veiculos/${veiculoVistoria.id}/vistoria`, {
        method: 'PUT',
        body: formData
      });

      if (res.ok) {
        fecharModalVistoria();
        carregarFrota();
        setMensagemFeedback({ 
          tipo: 'sucesso', 
          texto: `Vistoria do veículo (${veiculoVistoria.placa}) concluída: ${kmInformado} km e ${Math.round(combustivelInformado * 100)}% de combustível.` 
        });
      } else {
        const dadosErro = await res.json();
        setErroVistoriaModal(dadosErro.detail || 'Erro ao atualizar dados do veículo.');
      }
    } catch (err) {
      setErroVistoriaModal('Erro de conexão com o servidor ao atualizar dados.');
    } finally {
      setSalvandoVistoria(false);
    }
  };

  const atualizarStatusEmergencia = async (emergenciaId, novoStatus) => {
    try {
      const formData = new FormData();
      formData.append('novo_status', novoStatus);
      formData.append('status', novoStatus);

      const res = await fetch(`http://localhost:8000/api/emergencias/${emergenciaId}/status`, {
        method: 'PUT',
        body: formData
      });

      if (res.ok) {
        carregarEmergencias();
        setMensagemFeedback({
          tipo: 'sucesso',
          texto: `Status da emergência #${emergenciaId} atualizado para ${novoStatus}!`
        });
      } else {
        const errJson = await res.json();
        const msgErro = typeof errJson.detail === 'string'
          ? errJson.detail
          : Array.isArray(errJson.detail)
            ? errJson.detail.map(e => e.msg || JSON.stringify(e)).join(', ')
            : (errJson.detail ? JSON.stringify(errJson.detail) : 'Erro ao atualizar status da emergência.');
        setMensagemFeedback({
          tipo: 'erro',
          texto: msgErro
        });
      }
    } catch (err) {
      setMensagemFeedback({
        tipo: 'erro',
        texto: 'Erro de conexão com o servidor ao atualizar emergência.'
      });
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
      
      {/* SIDEBAR DA AGÊNCIA */}
      <aside className="w-72 bg-slate-900 text-slate-300 flex flex-col justify-between p-6 border-r border-slate-800 shadow-xl hidden md:flex">
        <div className="space-y-8">
          <div className="flex items-center gap-3 px-2">
            <div className="h-10 w-12 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow">
              {agenciaLogada?.nome ? agenciaLogada.nome.charAt(0).toUpperCase() : 'A'}
            </div>
            <div className="overflow-hidden">
              <h2 className="text-white font-bold text-sm truncate">{agenciaLogada?.nome}</h2>
              <p className="text-xs text-slate-400 truncate">{agenciaLogada?.email}</p>
            </div>
          </div>

          <nav className="space-y-2">
            <button
              onClick={() => setAbaAtiva('emergencias')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition ${
                abaAtiva === 'emergencias' ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3"><span>🚨</span> Alertas SOS</div>
              {totalAlertasAbertos > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] text-white font-bold animate-pulse">
                  {totalAlertasAbertos}
                </span>
              )}
            </button>

            <button
              onClick={() => setAbaAtiva('reservas')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition ${
                abaAtiva === 'reservas' ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3"><span>📋</span> Solicitações</div>
              {totalReservasPendentes > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] text-white font-bold">
                  {totalReservasPendentes}
                </span>
              )}
            </button>

            <button
              onClick={() => setAbaAtiva('frota')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition ${
                abaAtiva === 'frota' ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3"><span>🚗</span> Frota & FIPE</div>
            </button>
          </nav>
        </div>

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
        <header className="bg-white border-b border-slate-200 px-8 py-5 flex justify-between items-center shadow-sm">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 capitalize">
              {abaAtiva === 'emergencias' && 'Central de Emergências & SOS'}
              {abaAtiva === 'reservas' && 'Solicitações de Reserva de Clientes'}
              {abaAtiva === 'frota' && 'Gestão de Frota e Tabela FIPE'}
            </h1>
            <p className="text-xs text-slate-500">Painel de Controlo Administrativo</p>
          </div>
          {onLogout && (
            <button onClick={onLogout} className="md:hidden bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs font-bold">Sair</button>
          )}
        </header>

        <div className="p-8 max-w-7xl mx-auto w-full space-y-6">

          {mensagemFeedback && (
            <div className={`p-4 rounded-xl text-sm font-medium ${mensagemFeedback.tipo === 'sucesso' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
              {mensagemFeedback.texto}
            </div>
          )}

          {/* ABA 1: EMERGÊNCIAS */}
          {abaAtiva === 'emergencias' && (
            <section className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Monitorização de Ocorrências</h2>
                  <p className="text-xs text-slate-500">Alertas SOS enviados pelos clientes em circulação</p>
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
                          <span className="bg-rose-600 text-white text-[10px] tracking-wider px-2.5 py-1 rounded-md font-bold uppercase">{alerta.tipo}</span>
                          <span className="text-[11px] font-semibold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">{alerta.status}</span>
                        </div>
                        <p className="text-xs text-slate-500">Recebido em: {alerta.data_hora}</p>
                        
                        <div className="bg-white/80 p-3 rounded-lg border border-rose-100 space-y-1 text-xs">
                          <p className="text-slate-700"><strong>Locação ID:</strong> {alerta.locacao_id}</p>
                          <p className="text-slate-700"><strong>Seguro:</strong> {alerta.protocolo_seguro || "N/A"}</p>
                          {alerta.descricao && <p className="text-slate-600 italic">"{alerta.descricao}"</p>}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-rose-200/60 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-slate-500 truncate max-w-[140px]">📍 {alerta.latitude}, {alerta.longitude}</span>
                          <a 
                            href={`https://www.google.com/maps?q=${alerta.latitude},${alerta.longitude}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs px-2.5 py-1 rounded-md font-medium transition inline-flex items-center gap-1"
                          >
                            🗺️ Mapa
                          </a>
                        </div>

                        <div>
                          {alerta.status === 'ABERTO' && (
                            <button
                              onClick={() => atualizarStatusEmergencia(alerta.id, 'EM_ATENDIMENTO')}
                              className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded-lg font-bold transition shadow-sm inline-flex items-center gap-1"
                            >
                              <span>📞</span> Iniciar Atendimento
                            </button>
                          )}

                          {alerta.status === 'EM_ATENDIMENTO' && (
                            <button
                              onClick={() => atualizarStatusEmergencia(alerta.id, 'AGUARDANDO_CLIENTE')}
                              className="bg-amber-500 hover:bg-amber-600 text-white text-xs px-3 py-1.5 rounded-lg font-bold transition shadow-sm inline-flex items-center gap-1"
                            >
                              <span>🏁</span> Finalizar Socorro
                            </button>
                          )}

                          {alerta.status === 'AGUARDANDO_CLIENTE' && (
                            <span className="bg-amber-100 text-amber-800 border border-amber-300 text-xs px-2.5 py-1 rounded-lg font-semibold inline-flex items-center gap-1">
                              <span>⏳</span> Aguardando Cliente
                            </span>
                          )}

                          {alerta.status === 'RESOLVIDO' && (
                            <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs px-2.5 py-1 rounded-lg font-bold inline-flex items-center gap-1">
                              <span>✅</span> Encerrada
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* ABA 2: RESERVAS PENDENTES (COM CNH E CLASSE/APTIDÃO) */}
          {abaAtiva === 'reservas' && (
            <section className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6">
              <div className="mb-6">
                <h2 className="text-lg font-bold text-slate-900">Aprovação de Reservas</h2>
                <p className="text-xs text-slate-500">Analise os dados cadastrais, CNH e aptidão do cliente antes de autorizar</p>
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
                          <span className="bg-amber-600 text-white text-[10px] uppercase font-bold px-2.5 py-1 rounded-md">Pendente de Aprovação</span>
                          <span className="text-xs font-bold text-emerald-700">Total: R$ {item.valor_total}</span>
                        </div>

                        <div className="bg-white p-3 rounded-lg border border-amber-100 space-y-1 text-xs">
                          <p className="text-slate-900 font-bold">👤 Cliente: {item.cliente?.nome || 'Nome não inf.'}</p>
                          <p className="text-slate-600">E-mail: {item.cliente?.email || 'N/A'}</p>
                          <p className="text-slate-600">CNH: <span className="font-mono font-semibold">{item.cliente?.cnh || 'Não informada'}</span></p>
                          <p className="text-slate-600">Aptidão / Classe: <span className="font-bold text-emerald-600">{item.cliente?.cnh_valida !== false ? 'Apto para Alugar ✅' : 'Verificar Pendência ⚠️'}</span></p>
                          <hr className="my-1 border-slate-100" />
                          <p className="text-slate-900 font-medium">🚗 Veículo: {item.veiculo?.modelo || 'Modelo'} ({item.veiculo?.placa || 'Placa'})</p>
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
              <section className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6">
                <div className="mb-6">
                  <h2 className="text-lg font-bold text-slate-900">Adicionar Novo Veículo à Frota</h2>
                  <p className="text-xs text-slate-500">Registo integrado diretamente com a Tabela FIPE</p>
                </div>

                <form onSubmit={cadastrarVeiculo} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Placa do Veículo</label>
                    <input type="text" placeholder="Ex: ABC-1234" value={placa} onChange={(e) => setPlaca(e.target.value)} required className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm uppercase focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition" />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">1. Marca (FIPE)</label>
                    <select value={marcaCodigo} onChange={selecionarMarca} required className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition">
                      <option value="">Selecione a Marca...</option>
                      {marcas.map(m => (<option key={m.codigo} value={m.codigo}>{m.nome}</option>))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">2. Modelo (FIPE)</label>
                    <select value={modeloCodigo} onChange={selecionarModelo} required disabled={!marcaCodigo} className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400 transition">
                      <option value="">Selecione o Modelo...</option>
                      {modelos.map(mod => (<option key={mod.codigo} value={mod.codigo}>{mod.nome}</option>))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">3. Ano / Versão (FIPE)</label>
                    <select value={anoCodigo} onChange={(e) => setAnoCodigo(e.target.value)} required disabled={!modeloCodigo} className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400 transition">
                      <option value="">Selecione o Ano...</option>
                      {anos.map(a => (<option key={a.codigo} value={a.codigo}>{a.nome}</option>))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Valor da Diária (R$)</label>
                    <input type="number" step="0.01" placeholder="150.00" value={valorDiaria} onChange={(e) => setValorDiaria(e.target.value)} required className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition" />
                  </div>

                  <div className="flex items-end">
                    <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl text-sm transition shadow-sm hover:shadow">Cadastrar Veículo 🚗</button>
                  </div>
                </form>
              </section>

              <section className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Frota Registada</h2>
                    <p className="text-xs text-slate-500">Veículos ativos sob gestão desta agência</p>
                  </div>
                  <span className="bg-blue-50 text-blue-700 border border-blue-100 px-3 py-1 rounded-xl text-xs font-bold">Total: {frota.length}</span>
                </div>

                {frota.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-sm border-2 border-dashed border-slate-100 rounded-xl">Ainda não existem veículos registados nesta agência.</div>
                ) : (
                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 font-bold uppercase tracking-wider">
                          <th className="p-4">Placa</th>
                          <th className="p-4">Marca / Modelo</th>
                          <th className="p-4">Ano</th>
                          <th className="p-4">Diária</th>
                          <th className="p-4">Odômetro</th>
                          <th className="p-4">Combustível</th>
                          <th className="p-4">Status</th>
                          <th className="p-4 text-center">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm divide-y divide-slate-100">
                        {frota.map(v => (
                          <tr key={v.id} className="hover:bg-slate-50/80 transition">
                            <td className="p-4 font-bold text-slate-900">{v.placa}</td>
                            <td className="p-4 text-slate-700 font-medium">{v.marca} - {v.modelo}</td>
                            <td className="p-4 text-slate-600">{v.ano}</td>
                            <td className="p-4 font-bold text-emerald-600">R$ {v.valor_diaria}</td>
                            <td className="p-4 text-slate-700 font-mono text-xs">
                              {(v.quilometragem || 0).toLocaleString('pt-BR')} km
                            </td>
                            <td className="p-4 text-slate-600">
                              <div className="flex items-center gap-2">
                                <div className="w-16 bg-slate-200 rounded-full h-2 overflow-hidden">
                                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${Math.round((v.combustivel_nivel || 1) * 100)}%` }}></div>
                                </div>
                                <span className="text-xs">{Math.round((v.combustivel_nivel || 1) * 100)}%</span>
                              </div>
                            </td>
                            <td className="p-4">
                              <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${v.status === 'disponível' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
                                {v.status}
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              <button
                                onClick={() => abrirModalVistoria(v)}
                                className="bg-slate-800 hover:bg-blue-600 text-white text-xs px-3 py-1.5 rounded-lg font-medium transition shadow-sm inline-flex items-center gap-1.5"
                              >
                                <span>⚙️</span> Atualizar Dados
                              </button>
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

        {/* MINI-MODAL NATIVO UNIFICADO: VISTORIA E DADOS */}
        {modalVistoriaAberto && veiculoVistoria && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in duration-200">
              <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Vistoria e Atualização de Frota</h3>
                  <p className="text-xs text-slate-500">
                    {veiculoVistoria.marca} {veiculoVistoria.modelo} • <span className="font-mono font-semibold">{veiculoVistoria.placa}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={fecharModalVistoria}
                  className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1 rounded-lg hover:bg-slate-100 transition"
                >
                  ✕
                </button>
              </div>

              {/* RESUMO ATUAL */}
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Odômetro Atual:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {(veiculoVistoria.quilometragem || 0).toLocaleString('pt-BR')} km
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Combustível Atual:</span>
                  <span className="font-bold text-emerald-700">
                    {Math.round((veiculoVistoria.combustivel_nivel ?? 1.0) * 100)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Classificação Atual:</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    (veiculoVistoria.quilometragem || 0) <= 10000
                      ? 'bg-purple-100 text-purple-700 border border-purple-300'
                      : 'bg-blue-100 text-blue-700 border border-blue-300'
                  }`}>
                    {(veiculoVistoria.quilometragem || 0) <= 10000 ? 'Novo' : 'Usado'}
                  </span>
                </div>
              </div>

              {erroVistoriaModal && (
                <div className="p-3 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                  {erroVistoriaModal}
                </div>
              )}

              <form onSubmit={handleSalvarVistoria} className="space-y-4">
                {/* 1. CAMPO QUILOMETRAGEM */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Novo Odômetro (km)
                  </label>
                  <input
                    type="number"
                    min={veiculoVistoria.quilometragem || 0}
                    step="1"
                    required
                    value={novoKmInput}
                    onChange={(e) => setNovoKmInput(e.target.value)}
                    placeholder={`Mínimo: ${veiculoVistoria.quilometragem || 0}`}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    * Não pode ser menor que o odômetro atual ({veiculoVistoria.quilometragem || 0} km).
                  </p>
                </div>

                {/* 2. CAMPO NÍVEL DE COMBUSTÍVEL COM ATALHOS RÁPIDOS */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-bold text-slate-700 uppercase">
                      Nível de Combustível
                    </label>
                    <span className="font-bold text-xs text-emerald-700">
                      {Math.round(novoCombustivelInput * 100)}%
                    </span>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={novoCombustivelInput}
                    onChange={(e) => setNovoCombustivelInput(parseFloat(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  />

                  {/* 4 BOTÕES RÁPIDOS DE TANQUE */}
                  <div className="grid grid-cols-4 gap-1.5 mt-2">
                    {[
                      { label: '25% (1/4)', val: 0.25 },
                      { label: '50% (1/2)', val: 0.50 },
                      { label: '75% (3/4)', val: 0.75 },
                      { label: '100% (Cheio)', val: 1.00 },
                    ].map(btn => (
                      <button
                        key={btn.val}
                        type="button"
                        onClick={() => setNovoCombustivelInput(btn.val)}
                        className={`py-1 text-[10px] font-bold rounded-lg border transition ${
                          Math.abs(novoCombustivelInput - btn.val) < 0.01
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-3">
                  <button
                    type="button"
                    onClick={fecharModalVistoria}
                    disabled={salvandoVistoria}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2.5 rounded-xl transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={salvandoVistoria}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2.5 rounded-xl transition shadow-sm disabled:opacity-50"
                  >
                    {salvandoVistoria ? 'Salvando...' : 'Salvar Vistoria'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}