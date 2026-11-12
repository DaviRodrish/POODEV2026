import React from 'react';

export function SidebarCliente({ abaAtiva, setAbaAtiva, minhasReservas, usuarioLogado, handleSair }) {
  const totalReservasAtivas = Array.isArray(minhasReservas) 
    ? minhasReservas.filter(r => r.status === 'PENDENTE' || r.status === 'APROVADA').length 
    : 0;

  return (
    <aside className="w-72 bg-slate-900 text-slate-300 flex flex-col justify-between p-6 border-r border-slate-800 shadow-xl hidden md:flex">
      <div className="space-y-8">
        <div className="flex items-center gap-3 px-2">
          <div className="h-10 w-12 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow">
            {usuarioLogado?.nome ? usuarioLogado.nome.charAt(0).toUpperCase() : 'C'}
          </div>
          <div className="overflow-hidden">
            <h2 className="text-white font-bold text-sm truncate">{usuarioLogado?.nome}</h2>
            <p className="text-xs text-slate-400 truncate">{usuarioLogado?.email || 'Cliente'}</p>
          </div>
        </div>

        <nav className="space-y-2">
          <button
            onClick={() => setAbaAtiva('catalogo')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition ${
              abaAtiva === 'catalogo' ? 'bg-emerald-600 text-white shadow-lg' : 'hover:bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3"><span>🚗</span> Catálogo de Veículos</div>
          </button>

          <button
            onClick={() => setAbaAtiva('minhas-reservas')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition ${
              abaAtiva === 'minhas-reservas' ? 'bg-emerald-600 text-white shadow-lg' : 'hover:bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3"><span>📋</span> Minhas Reservas</div>
            {totalReservasAtivas > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] text-white font-bold">
                {totalReservasAtivas}
              </span>
            )}
          </button>

          <button
            onClick={() => setAbaAtiva('sos')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition ${
              abaAtiva === 'sos' ? 'bg-rose-600 text-white shadow-lg' : 'hover:bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3"><span>🚨</span> Emergência</div>
          </button>
        </nav>
      </div>

      <div>
        <button 
          onClick={handleSair}
          className="w-full bg-slate-800 hover:bg-rose-600/20 hover:border-rose-500 hover:text-rose-400 border border-slate-700 text-slate-300 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
        >
          🚪 Terminar Sessão
        </button>
      </div>
    </aside>
  );
}