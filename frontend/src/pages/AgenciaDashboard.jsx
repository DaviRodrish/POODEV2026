import React from 'react';
import { useAgenciaDashboard } from '../hooks/useAgenciaDashboard';
import { SidebarAgencia } from '../components/dashboard/agencia/SidebarAgencia';
import { AbaEmergencias } from '../components/dashboard/agencia/AbaEmergencias';
import { AbaReservas } from '../components/dashboard/agencia/AbaReservas';
import { AbaFrota } from '../components/dashboard/agencia/AbaFrota';

export function AgenciaDashboard(props) {
  const dash = useAgenciaDashboard(props.agenciaLogada, props.onLogout);

  return (
    <div className="min-h-screen bg-slate-100 flex font-sans">
      <SidebarAgencia {...dash} />

      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="bg-white border-b border-slate-200 px-8 py-5 flex justify-between items-center shadow-sm">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 capitalize">
              {dash.abaAtiva === 'emergencias' && 'Central de Emergências & SOS'}
              {dash.abaAtiva === 'reservas' && 'Solicitações de Reserva de Clientes'}
              {dash.abaAtiva === 'frota' && 'Gestão de Frota e Tabela FIPE'}
            </h1>
            <p className="text-xs text-slate-500">Painel de Controlo Administrativo</p>
          </div>
          {dash.onLogout && (
            <button onClick={dash.onLogout} className="md:hidden bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs font-bold">Sair</button>
          )}
        </header>

        <div className="p-8 max-w-7xl mx-auto w-full space-y-6">
          {dash.mensagemFeedback && (
            <div className={`p-4 rounded-xl text-sm font-medium ${dash.mensagemFeedback.tipo === 'sucesso' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
              {dash.mensagemFeedback.texto}
            </div>
          )}

          {dash.abaAtiva === 'emergencias' && <AbaEmergencias {...dash} />}
          {dash.abaAtiva === 'reservas' && <AbaReservas {...dash} />}
          {dash.abaAtiva === 'frota' && <AbaFrota {...dash} />}
        </div>
      </main>
    </div>
  );
}