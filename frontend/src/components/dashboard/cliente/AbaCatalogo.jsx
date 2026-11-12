import React from 'react';

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

  return (
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
  );
}