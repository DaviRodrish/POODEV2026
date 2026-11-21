import React from 'react';

const ICONES = {
  catalogo: 'M4 16v-3l2-5h12l2 5v3 M4 16h16v3H4z M7 19v1 M17 19v1 M7 13h.01 M17 13h.01',
  'minhas-reservas': 'M9 4h6v3H9z M7 5H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-1 M8 12h8 M8 16h5',
  sos: 'M12 3 2.5 20h19L12 3z M12 10v4 M12 17h.01',
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

// Exportado para o menu horizontal no mobile (ClienteDashboard)
export const ABAS = [
  { id: 'catalogo', rotulo: 'Catálogo de veículos' },
  { id: 'minhas-reservas', rotulo: 'Minhas reservas' },
  { id: 'sos', rotulo: 'Emergência', perigo: true },
];

export function SidebarCliente({ abaAtiva, setAbaAtiva, minhasReservas, usuarioLogado, handleSair }) {
  const totalReservasAtivas = Array.isArray(minhasReservas)
    ? minhasReservas.filter(r => r.status === 'PENDENTE' || r.status === 'APROVADA').length
    : 0;

  return (
    <aside className="w-72 shrink-0 bg-white hidden md:flex flex-col justify-between p-5 sticky top-0 h-screen shadow-[8px_0_32px_-24px_rgba(15,23,42,0.35)]">
      <div className="space-y-7">
        <div className="flex items-center gap-2.5 px-3 pt-1">
          <span className="h-3 w-3 rounded-full bg-[#0066cc]" />
          <span className="text-xl font-bold tracking-tight text-slate-900">POODEV</span>
        </div>

        <div className="flex items-center gap-3 rounded-2xl bg-[#eef4fb] p-3">
          <div className="h-10 w-10 shrink-0 rounded-full bg-[#0066cc] flex items-center justify-center text-white font-bold">
            {usuarioLogado?.nome ? usuarioLogado.nome.charAt(0).toUpperCase() : 'C'}
          </div>
          <div className="overflow-hidden">
            <h2 className="text-slate-900 font-semibold text-sm truncate">{usuarioLogado?.nome}</h2>
            <p className="text-xs text-slate-500 truncate">{usuarioLogado?.email || 'Cliente'}</p>
          </div>
        </div>

        <nav className="space-y-1">
          {ABAS.map((aba) => {
            const ativa = abaAtiva === aba.id;
            const estiloAtivo = aba.perigo ? 'bg-rose-50 text-rose-600' : 'bg-[#e6f0fa] text-[#0066cc]';
            return (
              <button
                key={aba.id}
                onClick={() => setAbaAtiva(aba.id)}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-full text-sm font-semibold transition ${
                  ativa
                    ? estiloAtivo
                    : `text-slate-600 hover:text-slate-900 ${aba.perigo ? 'hover:bg-rose-50' : 'hover:bg-[#f1f5fa]'}`
                }`}
              >
                <span className="flex items-center gap-3">
                  <Icone nome={aba.id} />
                  {aba.rotulo}
                </span>
                {aba.id === 'minhas-reservas' && totalReservasAtivas > 0 && (
                  <span className="flex h-5 min-w-5 px-1.5 items-center justify-center rounded-full bg-amber-500 text-[10px] text-white font-bold">
                    {totalReservasAtivas}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div>
        <button
          onClick={handleSair}
          className="w-full flex items-center justify-center gap-2 rounded-full bg-[#f1f5fa] hover:bg-rose-50 text-slate-600 hover:text-rose-600 py-2.5 text-sm font-semibold transition"
        >
          <Icone nome="sair" />
          Sair
        </button>
      </div>
    </aside>
  );
}