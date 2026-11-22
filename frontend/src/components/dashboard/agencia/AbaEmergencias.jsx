import React from 'react';

const COR_STATUS = {
  ABERTO: 'bg-rose-100 text-rose-700',
  EM_ATENDIMENTO: 'bg-blue-100 text-blue-700',
  AGUARDANDO_CLIENTE: 'bg-amber-100 text-amber-800',
  RESOLVIDO: 'bg-emerald-100 text-emerald-700',
};

export function AbaEmergencias({
  emergencias,
  carregando,
  atualizarStatusEmergencia,
  somAlertaAtivo = true,
  somBloqueado = false,
  alternarSomAlerta,
  dispararAlertaSonoro,
}) {
  const listaEmergencias = Array.isArray(emergencias) ? emergencias : [];
  const totalAlertasAbertos = listaEmergencias.filter((e) => e.status === 'ABERTO').length;

  return (
    <section className="bg-white rounded-3xl p-6 shadow-[0_12px_32px_-22px_rgba(15,23,42,0.35)]">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Monitoramento de Ocorrências</h2>
          <p className="text-sm text-slate-500">Alertas SOS enviados pelos clientes em circulação</p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {totalAlertasAbertos > 0 && (
            <span className="inline-flex items-center gap-2 bg-rose-100 text-rose-700 px-3.5 py-1.5 rounded-full text-xs font-bold">
              <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
              {totalAlertasAbertos} ativo(s)
            </span>
          )}

          {alternarSomAlerta && (
            <button
              type="button"
              onClick={alternarSomAlerta}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition ${
                somAlertaAtivo
                  ? 'bg-[#e6f0fa] text-[#0066cc] hover:bg-[#d7e8fa]'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {somAlertaAtivo ? 'Som ligado' : 'Som mudo'}
            </button>
          )}

          {somAlertaAtivo && dispararAlertaSonoro && (
            <button
              type="button"
              onClick={() => dispararAlertaSonoro('teste')}
              className="px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
            >
              Testar som
            </button>
          )}
        </div>
      </div>

      {somAlertaAtivo && somBloqueado && totalAlertasAbertos > 0 && dispararAlertaSonoro && (
        <div className="mb-5 bg-amber-50 border border-amber-200 text-amber-900 px-4 py-3 rounded-2xl text-xs flex items-center justify-between gap-3">
          <span>
            O navegador bloqueou o som automático. Clique em <strong>Liberar som</strong> para ativar o aviso sonoro.
          </span>
          <button
            type="button"
            onClick={() => dispararAlertaSonoro('teste')}
            className="shrink-0 bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-full font-semibold transition"
          >
            Liberar som
          </button>
        </div>
      )}

      {carregando ? (
        <div className="py-12 text-center text-slate-400 text-sm">Carregando alertas...</div>
      ) : listaEmergencias.length === 0 ? (
        <div className="bg-emerald-50 text-emerald-800 px-5 py-4 rounded-2xl text-sm font-medium flex items-center gap-3">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          Nenhum alerta de emergência registrado no momento. Frota segura!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {listaEmergencias.map((alerta) => (
            <div key={alerta.id} className="bg-[#fdf3f4] rounded-2xl p-5 flex flex-col justify-between gap-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center gap-2">
                  <span className="bg-rose-600 text-white text-xs px-3 py-1 rounded-full font-semibold">{alerta.tipo}</span>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${COR_STATUS[alerta.status] || 'bg-slate-100 text-slate-700'}`}>
                    {String(alerta.status || '').replace(/_/g, ' ')}
                  </span>
                </div>
                <p className="text-xs text-slate-500">Recebido em {alerta.data_hora}</p>

                <div className="bg-white/80 p-3.5 rounded-xl space-y-1 text-xs">
                  <p className="text-slate-700"><strong>Locação ID:</strong> {alerta.locacao_id}</p>
                  <p className="text-slate-700"><strong>Seguro:</strong> {alerta.protocolo_seguro || 'N/A'}</p>
                  {alerta.descricao && <p className="text-slate-600 italic">"{alerta.descricao}"</p>}
                </div>
              </div>

              <div className="pt-3 border-t border-rose-200/60 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 truncate max-w-[130px]">{alerta.latitude}, {alerta.longitude}</span>
                  <a
                    href={`https://www.google.com/maps?q=${alerta.latitude},${alerta.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white hover:bg-slate-50 text-[#0066cc] text-xs px-3 py-1.5 rounded-full font-semibold transition"
                  >
                    Ver no mapa
                  </a>
                </div>

                <div>
                  {alerta.status === 'ABERTO' && (
                    <button
                      type="button"
                      onClick={() => atualizarStatusEmergencia(alerta.id, 'EM_ATENDIMENTO')}
                      className="bg-[#0066cc] hover:bg-[#0052a3] text-white text-xs px-4 py-2 rounded-full font-semibold transition"
                    >
                      Iniciar atendimento
                    </button>
                  )}

                  {alerta.status === 'EM_ATENDIMENTO' && (
                    <button
                      type="button"
                      onClick={() => atualizarStatusEmergencia(alerta.id, 'AGUARDANDO_CLIENTE')}
                      className="bg-amber-500 hover:bg-amber-600 text-white text-xs px-4 py-2 rounded-full font-semibold transition"
                    >
                      Finalizar socorro
                    </button>
                  )}

                  {alerta.status === 'AGUARDANDO_CLIENTE' && (
                    <span className="bg-amber-100 text-amber-800 text-xs px-3 py-1.5 rounded-full font-semibold">
                      Aguardando cliente
                    </span>
                  )}

                  {alerta.status === 'RESOLVIDO' && (
                    <span className="bg-emerald-100 text-emerald-700 text-xs px-3 py-1.5 rounded-full font-semibold">
                      Encerrada
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