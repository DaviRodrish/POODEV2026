import React from 'react';

const ICONES = {
  'visao-geral':'M4 4h7v7H4z M13 4h7v4h-7z M13 11h7v9h-7z M4 14h7v6H4z',
  emergencias: 'M12 3 2.5 20h19L12 3z M12 10v4 M12 17h.01',
  reservas: 'M9 4h6v3H9z M7 5H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-1 M8 12h8 M8 16h5',
  frota: 'M4 16v-3l2-5h12l2 5v3 M4 16h16v3H4z M7 19v1 M17 19v1 M7 13h.01 M17 13h.01',
  manutencao: 'M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-.6-.6-2.4z',
  clientes: 'M16 20v-1a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v1 M10 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z M20 20v-1a3 3 0 0 0-2-2.8 M16 4.2a3.5 3.5 0 0 1 0 6.6',
  financeiro: 'M4 7h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h11 M16 13.5h.01',
  sair: 'M9 20H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h4 M16 16l4-4-4-4 M20 12H9',
};

function Icone({ nome }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[18px] w-[18px] shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={ICONES[nome]} />
    </svg>
  );
}

// Exportado para o menu horizontal no mobile (AgenciaDashboard)
export const ABAS = [
  { id: 'visao-geral', rotulo: 'Visão Geral'},
  { id: 'emergencias', rotulo: 'Alertas SOS' },
  { id: 'reservas', rotulo: 'Solicitações' },
  { id: 'frota', rotulo: 'Frota & FIPE' },
  { id: 'manutencao', rotulo: 'Manutenção' },
  { id: 'clientes', rotulo: 'Clientes' },
  { id: 'financeiro', rotulo: 'Financeiro' },
];

export function SidebarAgencia({ agenciaLogada, abaAtiva, setAbaAtiva, emergencias, reservasPendentes, frota, onLogout }) {
  const totalAlertasAbertos = Array.isArray(emergencias) ? emergencias.filter(e => e.status === 'ABERTO').length : 0;
  const totalReservasPendentes = Array.isArray(reservasPendentes) ? reservasPendentes.length : 0;
  const totalManutencaoPendente = Array.isArray(frota)
    ? frota.filter(v => v.status === 'manutenção' || v.precisa_revisao).length
    : 0;

  const contadores = {
    emergencias: { total: totalAlertasAbertos, cor: 'bg-rose-500', pulsar: true },
    reservas: { total: totalReservasPendentes, cor: 'bg-amber-500' },
    manutencao: { total: totalManutencaoPendente, cor: 'bg-orange-500' },
  };

  return (
    <aside className="w-72 shrink-0 bg-white hidden md:flex flex-col justify-between p-5 sticky top-0 h-screen shadow-[8px_0_32px_-24px_rgba(15,23,42,0.35)]">
      <div className="space-y-7">
        <div className="flex items-center gap-2.5 px-3 pt-1">
          <span className="h-3 w-3 rounded-full bg-[#0066cc]" />
          <span className="text-xl font-bold tracking-tight text-slate-900">POODEV</span>
        </div>

        <div className="flex items-center gap-3 rounded-2xl bg-[#eef4fb] p-3">
          <div className="h-10 w-10 shrink-0 rounded-full bg-[#0066cc] flex items-center justify-center text-white font-bold">
            {agenciaLogada?.nome ? agenciaLogada.nome.charAt(0).toUpperCase() : 'A'}
          </div>
          <div className="overflow-hidden">
            <h2 className="text-slate-900 font-semibold text-sm truncate">{agenciaLogada?.nome}</h2>
            <p className="text-xs text-slate-500 truncate">{agenciaLogada?.email}</p>
          </div>
        </div>

        <nav className="space-y-1">
          {ABAS.map((aba) => {
            const ativa = abaAtiva === aba.id;
            const contador = contadores[aba.id];
            return (
              <button
                key={aba.id}
                onClick={() => setAbaAtiva(aba.id)}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-full text-sm font-semibold transition ${
                  ativa ? 'bg-[#e6f0fa] text-[#0066cc]' : 'text-slate-600 hover:bg-[#f1f5fa] hover:text-slate-900'
                }`}
              >
                <span className="flex items-center gap-3">
                  <Icone nome={aba.id} />
                  {aba.rotulo}
                </span>
                {contador && contador.total > 0 && (
                  <span
                    className={`flex h-5 min-w-5 px-1.5 items-center justify-center rounded-full text-[10px] text-white font-bold ${contador.cor} ${
                      contador.pulsar ? 'animate-pulse' : ''
                    }`}
                  >
                    {contador.total}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div>
        {onLogout && (
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 rounded-full bg-[#f1f5fa] hover:bg-rose-50 text-slate-600 hover:text-rose-600 py-2.5 text-sm font-semibold transition"
          >
            <Icone nome="sair" />
            Sair
          </button>
        )}
      </div>
    </aside>
  );
}