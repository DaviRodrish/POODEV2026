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
        setMensagemFeedback({ tipo: 'sucesso', texto: `Pagamento da Reserva #${reservaId} informado via PIX! Aguardando confirmação da agência ⏳.` });
      } else {
        setMensagemFeedback({ tipo: 'sucesso', texto: `Pagamento informado! Aguardando confirmação da agência ⏳.` });
      }
      carregarMinhasReservas();
    } catch (err) {
      setMensagemFeedback({ tipo: 'sucesso', texto: `Pagamento informado! Aguardando confirmação da agência ⏳.` });
      carregarMinhasReservas();
    }
  };

  return (
    <section className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Histórico de Reservas</h2>
        <p className="text-xs text-slate-500">Acompanhe o status e os detalhes das suas reservas.</p>
      </div>

      {minhasReservas.length === 0 ? (
        <div className="py-12 text-center text-slate-400 text-sm border-2 border-dashed border-slate-100 rounded-xl">
          Você ainda não possui reservas.
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
                      reserva.status === 'ATIVA' ? 'bg-emerald-100 text-emerald-800' :
                      reserva.status === 'AGUARDANDO_CONFIRMACAO' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                      reserva.status === 'APROVADA' ? 'bg-blue-100 text-blue-800' :
                      reserva.status === 'RECUSADA' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-800'
                    }`}>
                      {reserva.status === 'AGUARDANDO_CONFIRMACAO' ? 'Aguardando Confirmação da Agência ⏳' :
                       reserva.status === 'APROVADA' ? 'Aguardando Pagamento' : reserva.status}
                    </span>
                  </div>

                  {/* Informações Principais do Veículo e Período */}
                  <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-2 text-xs">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                      <span className="text-slate-800 font-bold">🚗 Veículo ID: {reserva.veiculo_id}</span>
                      <span className="text-slate-600 font-medium">⏱️ {reserva.dias} dia(s)</span>
                    </div>

                    {/* BLOCO DESTACADO: ENDEREÇO DE RETIRADA */}
                    <div className="bg-blue-50/80 border border-blue-200/80 rounded-lg p-2.5 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-blue-900 uppercase text-[10px] tracking-wide flex items-center gap-1">
                          <span className="text-rose-500 text-xs">📍</span> Endereço de Retirada
                        </span>
                        <span className="text-[10px] font-semibold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">
                          🏢 {reserva.agencia_nome || (reserva.agencia_id ? `Agência ${reserva.agencia_id}` : 'Agência 1')}
                        </span>
                      </div>
                      <p className="text-slate-700 font-medium text-xs pl-4">
                        📍 Endereço de Retirada: {reserva.agencia_endereco || reserva.endereco_retirada || 'Av. Alberto Lamego, 2000 • Parque Califórnia'}
                      </p>
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

                {/* ETAPA DE PAGAMENTO PIX (RF09) SE APROVADA */}
                {reserva.status === 'APROVADA' && (
                  <div className="mt-2 bg-blue-50/70 border border-blue-200 rounded-xl p-3 space-y-2.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-blue-900 flex items-center gap-1">
                        <span>⚡</span> Pagar com Chave PIX da Agência
                      </span>
                      <span className="font-black text-blue-700">
                        R$ {Number(reserva.valor_total || 0).toFixed(2)}
                      </span>
                    </div>

                    <div className="bg-white p-2 rounded-lg border border-blue-100 flex items-center justify-between text-xs">
                      <div className="overflow-hidden">
                        <p className="text-[10px] text-slate-400 font-semibold uppercase">Chave PIX Destino:</p>
                        <p className="font-mono font-bold text-slate-800 text-[11px] truncate">
                          {reserva.agencia_pix || '12.345.678/0001-90'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(reserva.agencia_pix || '12.345.678/0001-90');
                          alert('Chave PIX copiada!');
                        }}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-bold transition"
                      >
                        Copiar Chave
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleConfirmarPagamentoPix(reserva.id)}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <span>✅</span> Confirmar Pagamento Realizado
                    </button>
                  </div>
                )}

                {/* STATUS AGUARDANDO CONFIRMAÇÃO DA AGÊNCIA */}
                {reserva.status === 'AGUARDANDO_CONFIRMACAO' && (
                  <div className="mt-2 bg-amber-50/80 border border-amber-200 rounded-xl p-3 text-xs space-y-1">
                    <div className="font-bold text-amber-900 flex items-center gap-1.5">
                      <span>⏳</span> Pagamento PIX Informado
                    </div>
                    <p className="text-[11px] text-amber-700">
                      Aguardando confirmação do PIX pela agência.
                    </p>
                  </div>
                )}

                {/* Botão de Devolução (Somente após o Pagamento e Veículo Ativo) */}
                {reserva.status === 'ATIVA' && (
                  <button 
                    onClick={() => handleDevolver(reserva.id)}
                    className="w-full mt-2 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
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