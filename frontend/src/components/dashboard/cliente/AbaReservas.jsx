import React from 'react';

export function AbaReservas({ minhasReservas, setMensagemFeedback, carregarMinhasReservas, carregarCatalogo }) {

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

  return (
    <section className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Histórico de Reservas</h2>
        <p className="text-xs text-slate-500">Acompanhe em tempo real o estado de aprovação das suas solicitações e detalhes da locação</p>
      </div>

      {minhasReservas.length === 0 ? (
        <div className="py-12 text-center text-slate-400 text-sm border-2 border-dashed border-slate-100 rounded-xl">
          Ainda não efetuou nenhuma reserva.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {minhasReservas.map(reserva => {
            const temMotorista2 = reserva.motorista_secundario === true || reserva.motorista_secundario === 'true';
            const outraAgencia = reserva.outra_agencia === true || reserva.outra_agencia === 'true';

            return (
              <div key={reserva.id} className="border border-slate-200 rounded-xl p-5 flex flex-col justify-between gap-4 shadow-sm bg-slate-50/50">
                <div className="space-y-3">
                  
                  {/* Cabeçalho do Card */}
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-900">Reserva #{reserva.id}</span>
                    <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase ${
                      reserva.status === 'APROVADA' || reserva.status === 'ATIVA' ? 'bg-emerald-100 text-emerald-800' :
                      reserva.status === 'RECUSADA' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {reserva.status}
                    </span>
                  </div>

                  {/* Informações Principais do Veículo e Período */}
                  <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1.5 text-xs">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                      <span className="text-slate-800 font-bold">🚗 Veículo ID: {reserva.veiculo_id}</span>
                      <span className="text-slate-600 font-medium">⏱️ {reserva.dias} dia(s)</span>
                    </div>

                    {/* Detalhes de Motorista Secundário */}
                    {temMotorista2 && (
                      <div className="text-slate-600 space-y-0.5 bg-slate-50 p-2 rounded border border-slate-100">
                        <p className="font-semibold text-slate-700">👤 Motorista Secundário:</p>
                        <p className="text-[11px]">Nome: {reserva.motorista_nome || 'Não especificado'}</p>
                        <p className="text-[11px] font-mono">CNH: {reserva.motorista_cnh || 'N/D'}</p>
                      </div>
                    )}

                    {/* Detalhes de Devolução em Outra Agência */}
                    {outraAgencia && (
                      <div className="text-slate-600 space-y-0.5 bg-slate-50 p-2 rounded border border-slate-100">
                        <p className="font-semibold text-slate-700">🏢 Devolução em Outra Agência:</p>
                        <p className="text-[11px]">Destino: {reserva.agencia_destino || 'Agência selecionada'}</p>
                      </div>
                    )}

                    {/* Valor Total */}
                    <div className="pt-2 flex justify-between items-center font-bold text-slate-900 border-t border-slate-100">
                      <span>Valor Total:</span>
                      <span className="text-blue-600 text-sm">R$ {Number(reserva.valor_total || 0).toFixed(2)}</span>
                    </div>
                  </div>

                </div>

                {/* Botão de Devolução (Caso esteja Aprovada ou Ativa) */}
                {(reserva.status === 'APROVADA' || reserva.status === 'ATIVA') && (
                  <button 
                    onClick={() => handleDevolver(reserva.id)}
                    className="w-full mt-2 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <span>🏁</span> Devolver Veículo à Agência
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}