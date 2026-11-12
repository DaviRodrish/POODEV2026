import React from 'react';
import { useClienteDashboard } from '../hooks/useClienteDashboard';
import { SidebarCliente } from '../components/dashboard/cliente/SidebarCliente';
import { AbaCatalogo } from '../components/dashboard/cliente/AbaCatalogo';
import { AbaReservas } from '../components/dashboard/cliente/AbaReservas';
import { AbaSos } from '../components/dashboard/cliente/AbaSos';

export function ClienteDashboard() {
  const dash = useClienteDashboard();

  return (
    <div className="min-h-screen bg-slate-100 flex font-sans">
      <SidebarCliente {...dash} />

      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {dash.isBloqueado && (
          <div className="bg-rose-600 text-white px-6 py-3 shadow-md flex justify-between items-center">
            <p className="text-sm font-semibold">Conta com Restrição Ativa: {dash.usuarioLogado.motivo}</p>
          </div>
        )}

        <div className="p-8 max-w-7xl mx-auto w-full space-y-6">
          {dash.mensagemFeedback && (
            <div className={`p-4 rounded-xl text-sm font-medium ${dash.mensagemFeedback.tipo === 'sucesso' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}>
              {dash.mensagemFeedback.texto}
            </div>
          )}

          {dash.abaAtiva === 'catalogo' && <AbaCatalogo {...dash} />}
          {dash.abaAtiva === 'minhas-reservas' && <AbaReservas {...dash} />}
          {dash.abaAtiva === 'sos' && <AbaSos {...dash} />}
        </div>
      </main>
    </div>
  );
}