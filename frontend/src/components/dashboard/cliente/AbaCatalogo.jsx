import React, { useState } from 'react';
import { API_BASE_URL } from '../../../services/api';

export function AbaCatalogo({
  veiculos,
  carregando,
  minhasReservas,
  diasReserva,
  setDiasReserva,
  isBloqueado,
  usuarioLogado,
  setMensagemFeedback,
  carregarMinhasReservas
}) {
  // Estados para controlar o Modal de Reserva Detalhada
  const [veiculoModal, setVeiculoModal] = useState(null);
  const [diasModal, setDiasModal] = useState(1);
  const [incluirMotoristaSecundario, setIncluirMotoristaSecundario] = useState(false);
  const [nomeMotorista2, setNomeMotorista2] = useState('');
  const [cnhMotorista2, setCnhMotorista2] = useState('');
  
  const [outraAgencia, setOutraAgencia] = useState(false);
  const [agenciaDestino, setAgenciaDestino] = useState('Rio de Janeiro - Capital');
  const [enviandoReserva, setEnviandoReserva] = useState(false);

  // Abrir modal validando bloqueios e revisões antes
  const abrirModalReserva = (v) => {
    setMensagemFeedback('');

    if (isBloqueado) {
      setMensagemFeedback({ tipo: 'erro', texto: `Conta bloqueada: ${usuarioLogado.motivo || 'procure a agência'}.` });
      return;
    }

    if (v.precisa_revisao || v.status === 'manutenção') {
      setMensagemFeedback({ tipo: 'erro', texto: 'Veículo em revisão preventiva (indisponível).' });
      return;
    }

    setVeiculoModal(v);
    setDiasModal(diasReserva[v.id] || 1);
    setIncluirMotoristaSecundario(false);
    setNomeMotorista2('');
    setCnhMotorista2('');
    setOutraAgencia(false);
  };

  const fecharModalReserva = () => {
    setVeiculoModal(null);
  };

  // Cálculo de valores arbitrados
  const valorDiaria = veiculoModal?.valor_diaria || 0;
  const subtotalDiarias = valorDiaria * diasModal;
  const taxaMotorista2 = incluirMotoristaSecundario ? 20 * diasModal : 0; // R$ 20/dia
  const taxaOutraAgencia = outraAgencia ? 120.00 : 0; // Taxa fixa de logistica R$ 120
  const valorTotalGeral = subtotalDiarias + taxaMotorista2 + taxaOutraAgencia;

  const handleConfirmarReserva = async (e) => {
    e.preventDefault();
    if (!veiculoModal) return;

    setEnviandoReserva(true);
    setMensagemFeedback('');

    const form = new FormData();
    form.append("cliente_id", usuarioLogado.id);
    form.append("veiculo_id", veiculoModal.id);
    form.append("dias", diasModal);
    form.append("motorista_secundario", incluirMotoristaSecundario ? "true" : "false");
    if (incluirMotoristaSecundario) {
      form.append("motorista_nome", nomeMotorista2);
      form.append("motorista_cnh", cnhMotorista2);
    }
    form.append("outra_agencia", outraAgencia ? "true" : "false");
    if (outraAgencia) {
      form.append("agencia_destino", agenciaDestino);
    }
    form.append("valor_total", valorTotalGeral);

    try {
      const res = await fetch(`${API_BASE_URL}/api/reservas`, { method: "POST", body: form });
      if (res.ok) {
        setMensagemFeedback({ tipo: 'sucesso', texto: 'Reserva solicitada com sucesso!' });
        carregarMinhasReservas();
        fecharModalReserva();
      } else {
        const erroJson = await res.json();
        setMensagemFeedback({ tipo: 'erro', texto: erroJson.detail || 'Erro ao efetuar reserva.' });
      }
    } catch (err) {
      setMensagemFeedback({ tipo: 'erro', texto: 'Erro de conexão com o servidor.' });
    } finally {
      setEnviandoReserva(false);
    }
  };

  const veiculosDisponiveis = veiculos.filter(v => v.status === 'disponível');

  return (
    <section className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Escolha o seu Veículo</h2>
          <p className="text-xs text-slate-500">Selecione o período e personalize sua locação</p>
        </div>
        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-xl text-xs font-bold">
          Disponíveis: {veiculosDisponiveis.length}
        </span>
      </div>

      {carregando ? (
        <div className="py-12 text-center text-slate-400 text-sm">Carregando catálogo...</div>
      ) : veiculosDisponiveis.length === 0 ? (
        <div className="py-12 text-center text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-2xl bg-white">
          Nenhum veículo disponível no momento.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {veiculosDisponiveis.map(v => {
            const combustivelPct = Math.round((v.combustivel_nivel ?? 1.0) * 100);
            const emRevisao = v.precisa_revisao || v.status === 'manutenção';
            const alugado = v.status === 'alugado';
            
            const minhaReservaDoVeiculo = minhasReservas.find(r => r.veiculo_id === v.id && (r.status === 'PENDENTE' || r.status === 'APROVADA'));
            const statusReserva = minhaReservaDoVeiculo ? minhaReservaDoVeiculo.status : null;
            const bloqueadoParaAluguel = isBloqueado || emRevisao || (alugado && !minhaReservaDoVeiculo) || statusReserva;

            return (
              <div key={v.id} className="bg-white border border-slate-200 rounded-2xl p-6 md:p-7 min-h-[460px] flex flex-col justify-between shadow-sm hover:shadow-md transition">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 shadow-sm">
                      <span>🏢</span>
                      <span>{v.agencia_nome || (v.agencia_id ? `Agência ${v.agencia_id}` : 'Agência 1')}</span>
                    </span>
                    {emRevisao && (
                      <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-100 text-amber-800">
                        Revisão
                      </span>
                    )}
                  </div>

                  <div className="w-full h-36 bg-slate-100 rounded-xl overflow-hidden relative flex items-center justify-center">
                    <img 
                      src={`${API_BASE_URL}/api/veiculos/${v.id}/foto`}
                      alt={`${v.marca} ${v.modelo}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        if (e.target.nextElementSibling) {
                          e.target.nextElementSibling.style.display = 'flex';
                        }
                      }}
                    />
                    <div style={{ display: 'none' }} className="w-full h-full items-center justify-center bg-slate-100 text-slate-400">
                      <svg className="w-12 h-12 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                      </svg>
                    </div>
                  </div>

                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-base text-slate-900">{v.marca} {v.modelo}</h3>
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

                  <div className="flex items-center justify-between text-xs bg-emerald-50/70 text-emerald-800 px-3 py-2 rounded-xl border border-emerald-200">
                    <span className="font-medium">
                      ⚙️ Motor {v.cilindrada > 0 ? Number(v.cilindrada).toFixed(1) : 'EV'} • {v.combustivel_tipo || 'Gasolina'}
                    </span>
                    <span className="font-bold">
                      🌱 {v.emissao_100km ?? 18} kg CO₂ / 100km
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
                  <div>
                    <span className="text-xs text-slate-500">Diária</span>
                    <p className="text-base font-bold text-blue-600">R$ {v.valor_diaria}</p>
                  </div>

                  <button 
                    onClick={() => abrirModalReserva(v)}
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

      {/* MODAL DE FORMULÁRIO DE RESERVA PERSONALIZADA */}
      {veiculoModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
            
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Solicitar Locação</h3>
                <p className="text-xs text-slate-500">{veiculoModal.marca} {veiculoModal.modelo} • Diária: R$ {veiculoModal.valor_diaria}</p>
              </div>
              <button 
                type="button" 
                onClick={fecharModalReserva} 
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1 rounded-lg hover:bg-slate-100 transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmarReserva} className="space-y-4 text-xs">
              
              {/* BLOCO DESTACADO: LOCAL DE RETIRADA */}
              <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-3.5 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-900 uppercase text-[11px] tracking-wide flex items-center gap-1.5">
                    <span className="text-rose-500 text-sm">📍</span> Local de Retirada do Veículo
                  </span>
                  <span className="text-[11px] font-semibold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-md">
                    🏢 {veiculoModal.agencia_nome || (veiculoModal.agencia_id ? `Agência ${veiculoModal.agencia_id}` : 'Agência 1')}
                  </span>
                </div>
                <p className="text-slate-700 font-medium text-xs pl-5">
                  📍 Local de Retirada: {veiculoModal.agencia_endereco || 'Av. Alberto Lamego, 2000 • Parque Califórnia'}
                </p>
              </div>
              
              {/* 1. Quantidade de Dias */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                <label className="block font-bold text-slate-700 uppercase">Quantidade de Dias</label>
                <input 
                  type="number" 
                  min="1" 
                  value={diasModal}
                  onChange={(e) => setDiasModal(parseInt(e.target.value) || 1)}
                  required
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <p className="text-[11px] text-slate-500">Subtotal diárias ({diasModal}x): R$ {subtotalDiarias.toFixed(2)}</p>
              </div>

              {/* 2. Motorista Secundário */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700 uppercase flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={incluirMotoristaSecundario}
                      onChange={(e) => setIncluirMotoristaSecundario(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                    />
                    Adicionar Motorista Secundário
                  </label>
                  <span className="text-[11px] text-emerald-700 font-semibold">+ R$ 20,00 / dia</span>
                </div>

                {incluirMotoristaSecundario && (
                  <div className="space-y-2 pt-2 border-t border-slate-200">
                    <div>
                      <span className="block text-slate-600 font-medium mb-1">Nome Completo do Condutor</span>
                      <input 
                        type="text"
                        placeholder="Nome do motorista secundário"
                        value={nomeMotorista2}
                        onChange={(e) => setNomeMotorista2(e.target.value)}
                        required={incluirMotoristaSecundario}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs"
                      />
                    </div>
                    <div>
                      <span className="block text-slate-600 font-medium mb-1">Número da CNH</span>
                      <input 
                        type="text"
                        placeholder="CNH do motorista secundário"
                        value={cnhMotorista2}
                        onChange={(e) => setCnhMotorista2(e.target.value)}
                        required={incluirMotoristaSecundario}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-mono"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Devolver em Outra Agência */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700 uppercase flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={outraAgencia}
                      onChange={(e) => setOutraAgencia(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                    />
                    Devolver em Outra Agência
                  </label>
                  <span className="text-[11px] text-emerald-700 font-semibold">+ R$ 120,00 (Taxa fixa)</span>
                </div>

                {outraAgencia && (
                  <div className="pt-2 border-t border-slate-200">
                    <span className="block text-slate-600 font-medium mb-1">Agência de Destino / Devolução</span>
                    <select 
                      value={agenciaDestino}
                      onChange={(e) => setAgenciaDestino(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs"
                    >
                      <option value="Rio de Janeiro - Capital">Rio de Janeiro - Capital</option>
                      <option value="Campos dos Goytacazes - Centro">Campos dos Goytacazes - Centro</option>
                      <option value="Macaé - Rodoviária">Macaé - Rodoviária</option>
                      <option value="Vitória - ES">Vitória - ES</option>
                    </select>
                  </div>
                )}
              </div>

              {/* RESUMO DO ORÇAMENTO TOTAL */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-1.5 text-slate-800">
                <div className="flex justify-between text-xs">
                  <span>Diárias ({diasModal}x):</span>
                  <span>R$ {subtotalDiarias.toFixed(2)}</span>
                </div>
                {incluirMotoristaSecundario && (
                  <div className="flex justify-between text-xs text-emerald-700">
                    <span>Motorista Secundário:</span>
                    <span>+ R$ {taxaMotorista2.toFixed(2)}</span>
                  </div>
                )}
                {outraAgencia && (
                  <div className="flex justify-between text-xs text-emerald-700">
                    <span>Taxa Outra Agência:</span>
                    <span>+ R$ {taxaOutraAgencia.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t border-blue-200 pt-2 flex justify-between font-extrabold text-sm text-blue-900">
                  <span>Valor Total Estimado:</span>
                  <span>R$ {valorTotalGeral.toFixed(2)}</span>
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={fecharModalReserva}
                  disabled={enviandoReserva}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={enviandoReserva}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl transition shadow-sm disabled:opacity-50"
                >
                  {enviandoReserva ? 'Enviando...' : 'Confirmar Reserva 📋'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </section>
  );
}