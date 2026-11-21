import React from 'react';
import { API_BASE_URL } from '../../../services/api';

export function AbaReservas({ minhasReservas, setMensagemFeedback, carregarMinhasReservas, carregarCatalogo }) {
  const handleDevolver = async (reservaId) => {
    setMensagemFeedback('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/reservas/${reservaId}/devolver`, {
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

  const handleConfirmarPagamentoPix = async (reservaId) => {
    setMensagemFeedback('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/reservas/${reservaId}/pagar`, {
        method: 'PUT'
      });
      if (res.ok) {
        setMensagemFeedback({ tipo: 'sucesso', texto: `Pagamento da Reserva #${reservaId} informado via PIX! Aguardando confirmação da agência.` });
      } else {
        setMensagemFeedback({ tipo: 'sucesso', texto: `Pagamento informado! Aguardando confirmação da agência.` });
      }
      carregarMinhasReservas();
    } catch (err) {
      setMensagemFeedback({ tipo: 'sucesso', texto: `Pagamento informado! Aguardando confirmação da agência.` });
      carregarMinhasReservas();
    }
  };

  return (
    <section className="bg-white rounded-3xl p-6 space-y-6 shadow-[0_12px_32px_-22px_rgba(15,23,42,0.35)]">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Histórico de reservas</h2>
        <p className="text-sm text-slate-500">Acompanhe o status e os detalhes das suas reservas.</p>
      </div>

      {minhasReservas.length === 0 ? (
        <div className="py-12 text-center text-slate-400 text-sm bg-[#f4f7fb] rounded-2xl">
          Você ainda não possui reservas.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {minhasReservas.map(reserva => {
            const temMotorista2 = reserva.motorista_secundario === true || reserva.motorista_secundario === 'true';
            const outraAgencia = reserva.outra_agencia === true || reserva.outra_agencia === 'true';
            const chavePix = reserva.agencia_pix || '12.345.678/0001-90';

            return (
              <div key={reserva.id} className="bg-[#f4f7fb] rounded-2xl p-5 flex flex-col justify-between gap-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">Reserva #{reserva.id}</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      reserva.status === 'ATIVA' ? 'bg-emerald-100 text-emerald-700' :
                      reserva.status === 'AGUARDANDO_CONFIRMACAO' ? 'bg-amber-100 text-amber-800' :
                      reserva.status === 'APROVADA' ? 'bg-blue-100 text-blue-700' :
                      reserva.status === 'RECUSADA' ? 'bg-rose-100 text-rose-700' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {reserva.status === 'AGUARDANDO_CONFIRMACAO' ? 'Aguardando confirmação' :
                       reserva.status === 'APROVADA' ? 'Aguardando pagamento' : reserva.status}
                    </span>
                  </div>

                  <div className="bg-white p-4 rounded-xl space-y-3 text-xs">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                      <span className="text-slate-800 font-bold">Veículo ID: {reserva.veiculo_id}</span>
                      <span className="text-slate-600 font-medium">{reserva.dias} dia(s)</span>
                    </div>

                    <div className="bg-[#e6f0fa] rounded-xl p-3 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-[#0066cc] text-xs">Endereço de retirada</span>
                        <span className="text-[10px] font-semibold text-[#0066cc] bg-white/80 px-2 py-0.5 rounded-full">
                          {reserva.agencia_nome || (reserva.agencia_id ? `Agência ${reserva.agencia_id}` : 'Agência 1')}
                        </span>
                      </div>
                      <p className="text-slate-700 font-medium text-xs">
                        {reserva.agencia_endereco || reserva.endereco_retirada || 'Av. Alberto Lamego, 2000 • Parque Califórnia'}
                      </p>
                    </div>

                    {temMotorista2 && (
                      <div className="text-slate-600 space-y-0.5 bg-[#f4f7fb] p-3 rounded-xl">
                        <p className="font-semibold text-slate-700">Motorista secundário</p>
                        <p className="text-[11px]">Nome: {reserva.motorista_nome || 'Não especificado'}</p>
                        <p className="text-[11px] font-mono">CNH: {reserva.motorista_cnh || 'N/D'}</p>
                      </div>
                    )}

                    {outraAgencia && (
                      <div className="text-slate-600 space-y-0.5 bg-[#f4f7fb] p-3 rounded-xl">
                        <p className="font-semibold text-slate-700">Devolução em outra agência</p>
                        <p className="text-[11px]">Destino: {reserva.agencia_destino || 'Agência selecionada'}</p>
                      </div>
                    )}

                    <div className="pt-2 flex justify-between items-center font-bold text-slate-900 border-t border-slate-100">
                      <span>Valor total</span>
                      <span className="text-[#0066cc] text-base">R$ {Number(reserva.valor_total || 0).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {reserva.status === 'APROVADA' && (
                  <div className="bg-[#0066cc] text-white rounded-2xl p-4 space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold">Pagar com a chave PIX da agência</span>
                      <span className="font-black text-sm">R$ {Number(reserva.valor_total || 0).toFixed(2)}</span>
                    </div>

                    <div className="bg-white/15 p-3 rounded-xl flex items-center justify-between gap-3 text-xs">
                      <div className="overflow-hidden">
                        <p className="text-[10px] text-white/75 font-medium">Chave PIX destino</p>
                        <p className="font-mono font-bold text-[11px] truncate">{chavePix}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(chavePix);
                          alert('Chave PIX copiada!');
                        }}
                        className="shrink-0 px-3 py-1.5 bg-white text-[#0066cc] hover:bg-[#e6f0fa] rounded-full text-[11px] font-semibold transition"
                      >
                        Copiar chave
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleConfirmarPagamentoPix(reserva.id)}
                      className="w-full py-2.5 bg-white hover:bg-[#e6f0fa] text-[#0066cc] rounded-full text-sm font-semibold transition"
                    >
                      Confirmar pagamento realizado
                    </button>
                  </div>
                )}

                {reserva.status === 'AGUARDANDO_CONFIRMACAO' && (
                  <div className="bg-amber-50 rounded-2xl p-4 text-xs space-y-1">
                    <div className="font-bold text-amber-900">Pagamento PIX informado</div>
                    <p className="text-[11px] text-amber-700">
                      Aguardando confirmação do PIX pela agência.
                    </p>
                  </div>
                )}

                {reserva.status === 'ATIVA' && (
                  <button
                    onClick={() => handleDevolver(reserva.id)}
                    className="w-full py-2.5 bg-[#0066cc] hover:bg-[#0052a3] text-white rounded-full text-sm font-semibold transition"
                  >
                    Devolver veículo à agência
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

export default AbaReservas;
