import React from 'react';

export function AbaEmergencias({ emergencias, carregando, atualizarStatusEmergencia }) {
  const totalAlertasAbertos = Array.isArray(emergencias) ? emergencias.filter(e => e.status === 'ABERTO').length : 0;

  return (
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
  );
}