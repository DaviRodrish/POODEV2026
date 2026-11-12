import React from 'react';

export function SidebarAgencia({ agenciaLogada, abaAtiva, setAbaAtiva, emergencias, reservasPendentes, onLogout }) {
  const totalAlertasAbertos = Array.isArray(emergencias) ? emergencias.filter(e => e.status === 'ABERTO').length : 0;
  const totalReservasPendentes = Array.isArray(reservasPendentes) ? reservasPendentes.length : 0;

  return (
    <aside className="w-72 bg-slate-900 text-slate-300 flex flex-col justify-between p-6 border-r border-slate-800 shadow-xl hidden md:flex">
      <div className="space-y-8">
        <div className="flex items-center gap-3 px-2">
          <div className="h-10 w-12 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow">
            {agenciaLogada?.nome ? agenciaLogada.nome.charAt(0).toUpperCase() : 'A'}
          </div>
          <div className="overflow-hidden">
            <h2 className="text-white font-bold text-sm truncate">{agenciaLogada?.nome}</h2>
            <p className="text-xs text-slate-400 truncate">{agenciaLogada?.email}</p>
          </div>
        </div>

        <nav className="space-y-2">
          <button
            onClick={() => setAbaAtiva('emergencias')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition ${
              abaAtiva === 'emergencias' ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3"><span>🚨</span> Alertas SOS</div>
            {totalAlertasAbertos > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] text-white font-bold animate-pulse">
                {totalAlertasAbertos}
              </span>
            )}
          </button>

          <button
            onClick={() => setAbaAtiva('reservas')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition ${
              abaAtiva === 'reservas' ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3"><span>📋</span> Solicitações</div>
            {totalReservasPendentes > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] text-white font-bold">
                {totalReservasPendentes}
              </span>
            )}
          </button>

          <button
            onClick={() => setAbaAtiva('frota')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition ${
              abaAtiva === 'frota' ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3"><span>🚗</span> Frota & FIPE</div>
          </button>
        </nav>
      </div>

      <div>
        {onLogout && (
          <button 
            onClick={onLogout}
            className="w-full bg-slate-800 hover:bg-rose-600/20 hover:border-rose-500 hover:text-rose-400 border border-slate-700 text-slate-300 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
          >
            🚪 Terminar Sessão
          </button>
        )}
      </div>
    </aside>
  );
}