import React, { useState } from 'react';

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
      setMensagemFeedback({ tipo: 'erro', texto: `Locação Bloqueada: Sua conta possui pendências ativas (${usuarioLogado.motivo || 'regularize com a agência'}).` });
      return;
    }

    if (v.precisa_revisao || v.status === 'manutenção') {
      setMensagemFeedback({ tipo: 'erro', texto: `Este veículo atingiu o limite de quilometragem para revisão preventiva e está temporariamente indisponível.` });
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
      const res = await fetch("http://localhost:8000/api/reservas", { method: "POST", body: form });
      if (res.ok) {
        setMensagemFeedback({ tipo: 'sucesso', texto: 'Pedido de reserva enviado com sucesso para a agência!' });
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

  return (
    <section className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Escolha o seu Veículo</h2>
          <p className="text-xs text-slate-500">Selecione os dias pretendidos e personalize a sua locação</p>
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
                <h3 className="text-base font-bold text-slate-900">Configurar Solicitação de Locação</h3>
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
                  {enviandoReserva ? 'A enviar...' : 'Confirmar Reserva 📋'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </section>
  );
}