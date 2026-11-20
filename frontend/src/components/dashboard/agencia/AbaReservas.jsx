import React from 'react';

export function AbaReservas({ reservasPendentes, responderReserva }) {
  return (
    <section className="bg-white rounded-3xl p-6 shadow-[0_12px_32px_-22px_rgba(15,23,42,0.35)]">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-slate-900">Aprovação de Reservas</h2>
        <p className="text-sm text-slate-500">Revise os dados e a CNH do cliente antes de aprovar</p>
      </div>

      {reservasPendentes.length === 0 ? (
        <div className="py-12 text-center text-slate-400 text-sm bg-[#f4f7fb] rounded-2xl">
          Nenhuma solicitação de reserva pendente no momento.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reservasPendentes.map((item) => {
            const apto = item.cliente?.cnh_valida !== false;
            return (
              <div key={item.id} className="bg-[#f4f7fb] rounded-2xl p-5 flex flex-col justify-between gap-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center gap-2">
                    <span className="bg-amber-100 text-amber-800 text-xs font-semibold px-3 py-1 rounded-full">
                      Pendente de aprovação
                    </span>
                    <span className="text-sm font-bold text-[#0066cc]">R$ {item.valor_total}</span>
                  </div>

                  <div className="bg-white p-4 rounded-xl space-y-1.5 text-xs">
                    <p className="text-slate-900 font-bold text-sm">{item.cliente?.nome || 'Nome não inf.'}</p>
                    <p className="text-slate-600">E-mail: {item.cliente?.email || 'N/A'}</p>
                    <p className="text-slate-600">
                      CNH: <span className="font-mono font-semibold">{item.cliente?.cnh || 'Não informada'}</span>
                    </p>
                    <p className="text-slate-600">
                      Aptidão:{' '}
                      <span className={`font-bold ${apto ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {apto ? 'Apto para alugar' : 'Verificar pendência'}
                      </span>
                    </p>
                    <hr className="my-2 border-slate-100" />
                    <p className="text-slate-900 font-medium">
                      Veículo: {item.veiculo?.modelo || 'Modelo'} ({item.veiculo?.placa || 'Placa'})
                    </p>
                    <p className="text-slate-700 font-semibold">Período solicitado: {item.dias} dia(s)</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => responderReserva(item.id, true)}
                    className="flex-1 bg-[#0066cc] hover:bg-[#0052a3] text-white text-sm py-2.5 rounded-full font-semibold transition"
                  >
                    Aprovar
                  </button>
                  <button
                    onClick={() => responderReserva(item.id, false)}
                    className="flex-1 bg-white hover:bg-rose-50 text-rose-600 text-sm py-2.5 rounded-full font-semibold transition"
                  >
                    Recusar
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