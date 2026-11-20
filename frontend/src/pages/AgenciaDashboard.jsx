import React from 'react';
import { useAgenciaDashboard } from '../hooks/useAgenciaDashboard';
import { SidebarAgencia, ABAS } from '../components/dashboard/agencia/SidebarAgencia';
import { AbaEmergencias } from '../components/dashboard/agencia/AbaEmergencias';
import { AbaReservas } from '../components/dashboard/agencia/AbaReservas';
import { AbaFrota } from '../components/dashboard/agencia/AbaFrota';
import { AbaManutencao } from '../components/dashboard/agencia/AbaManutencao';
import { AbaFinanceiro } from '../components/dashboard/agencia/AbaFinanceiro';
import { AbaClientes } from '../components/dashboard/agencia/AbaClientes';

const TITULOS = {
  emergencias: 'Central de Emergências & SOS',
  reservas: 'Solicitações de Reserva de Clientes',
  frota: 'Gestão de Frota e Tabela FIPE',
  manutencao: 'Oficina & Histórico de Manutenção',
  clientes: 'Gestão & Histórico de Clientes',
  financeiro: 'Financeiro & Histórico',
};

export function AgenciaDashboard(props) {
  const dash = useAgenciaDashboard(props.agenciaLogada, props.onLogout);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#e3eefa] via-[#f0f5fb] to-[#f4f6f9] flex font-sans text-slate-900">
      <SidebarAgencia {...dash} />

      <main className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-20 bg-white/90 backdrop-blur shadow-[0_6px_20px_-14px_rgba(15,23,42,0.3)]">
          <div className="px-5 sm:px-8 py-4 flex justify-between items-center gap-4">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">{TITULOS[dash.abaAtiva]}</h1>
              <p className="text-xs text-slate-500 mt-0.5">Painel administrativo</p>
            </div>
            {dash.onLogout && (
              <button
                onClick={dash.onLogout}
                className="md:hidden bg-[#0066cc] text-white px-4 py-2 rounded-full text-xs font-semibold"
              >
                Sair
              </button>
            )}
          </div>

          {/* Menu horizontal no mobile (a sidebar fica escondida abaixo de md) */}
          <nav className="md:hidden flex gap-2 overflow-x-auto px-5 pb-3">
            {ABAS.map((aba) => (
              <button
                key={aba.id}
                onClick={() => dash.setAbaAtiva(aba.id)}
                className={`whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                  dash.abaAtiva === aba.id ? 'bg-[#0066cc] text-white' : 'bg-[#eef3f9] text-slate-600'
                }`}
              >
                {aba.rotulo}
              </button>
            ))}
          </nav>
        </header>

        <div className="p-5 sm:p-8 max-w-7xl mx-auto w-full space-y-6">
          {dash.mensagemFeedback && (
            <div
              className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl text-sm font-medium ${
                dash.mensagemFeedback.tipo === 'sucesso' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
              }`}
            >
              <span
                className={`h-2 w-2 shrink-0 rounded-full ${
                  dash.mensagemFeedback.tipo === 'sucesso' ? 'bg-emerald-500' : 'bg-rose-500'
                }`}
              />
              {dash.mensagemFeedback.texto}
            </div>
          )}

          {dash.abaAtiva === 'emergencias' && <AbaEmergencias {...dash} />}
          {dash.abaAtiva === 'reservas' && <AbaReservas {...dash} />}
          {dash.abaAtiva === 'frota' && <AbaFrota {...dash} />}
          {dash.abaAtiva === 'manutencao' && <AbaManutencao {...dash} />}
          {dash.abaAtiva === 'clientes' && <AbaClientes {...dash} />}
          {dash.abaAtiva === 'financeiro' && <AbaFinanceiro {...dash} />}
        </div>
      </main>
    </div>
  );
}