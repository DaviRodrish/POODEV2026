import React from 'react';

export function AbaReservas({ reservasPendentes, responderReserva }) {
  return (
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
  );
}