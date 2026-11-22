import React, { useState, useEffect, useMemo } from 'react';
import { API_BASE_URL } from '../../../services/api';

const CARD = 'bg-white rounded-3xl p-6 shadow-[0_12px_32px_-22px_rgba(15,23,42,0.35)]';

const moeda = (n) =>
  Number(n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// Ordem do funil de uma locação, do pedido até o encerramento
const ETAPAS = [
  { id: 'PENDENTE', rotulo: 'Aguardando aprovação', cor: 'bg-slate-400' },
  { id: 'APROVADA', rotulo: 'Aprovada, falta pagar', cor: 'bg-amber-500' },
  { id: 'AGUARDANDO_CONFIRMACAO', rotulo: 'PIX a confirmar', cor: 'bg-orange-500' },
  { id: 'ATIVA', rotulo: 'Em curso (paga)', cor: 'bg-emerald-500' },
  { id: 'CONCLUIDA', rotulo: 'Concluída', cor: 'bg-[#0066cc]' },
  { id: 'RECUSADA', rotulo: 'Recusada', cor: 'bg-rose-400' },
];

const COR_STATUS_MOV = {
  ATIVA: ['bg-emerald-100 text-emerald-700', 'Paga'],
  CONCLUIDA: ['bg-blue-100 text-blue-700', 'Concluída'],
  APROVADA: ['bg-amber-100 text-amber-800', 'Pagamento pendente'],
  AGUARDANDO_CONFIRMACAO: ['bg-orange-100 text-orange-700', 'PIX a confirmar'],
  PENDENTE: ['bg-slate-100 text-slate-700', 'Aguardando aprovação'],
  RECUSADA: ['bg-rose-100 text-rose-700', 'Recusada'],
};

function Kpi({ titulo, valor, detalhe, destaque = false, corValor = 'text-slate-900' }) {
  if (destaque) {
    return (
      <div className="bg-[#0066cc] text-white p-6 rounded-3xl shadow-[0_16px_36px_-18px_rgba(0,102,204,0.7)]">
        <span className="text-xs font-semibold text-white/80">{titulo}</span>
        <p className="text-3xl font-black mt-1.5 tracking-tight">{valor}</p>
        <span className="text-xs text-white/75">{detalhe}</span>
      </div>
    );
  }
  return (
    <div className="bg-white p-6 rounded-3xl shadow-[0_12px_32px_-22px_rgba(15,23,42,0.35)]">
      <span className="text-xs font-semibold text-slate-500">{titulo}</span>
      <p className={`text-2xl font-black mt-1.5 tracking-tight ${corValor}`}>{valor}</p>
      <span className="text-xs text-slate-400">{detalhe}</span>
    </div>
  );
}

export function AbaVisaoGeral({
  agenciaLogada,
  frota = [],
  emergencias = [],
  reservasPendentes = [],
  setAbaAtiva,
}) {
  const [recebimentos, setRecebimentos] = useState([]);
  const [faturamentoTotal, setFaturamentoTotal] = useState(0);
  const [clientes, setClientes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizadoEm, setAtualizadoEm] = useState(null);

  const carregar = async () => {
    const agenciaId = agenciaLogada?.id || 1;
    setCarregando(true);
    const [fin, cli] = await Promise.allSettled([
      fetch(`${API_BASE_URL}/api/agencias/${agenciaId}/financeiro`).then((r) => (r.ok ? r.json() : null)),
      fetch(`${API_BASE_URL}/api/clientes`).then((r) => (r.ok ? r.json() : null)),
    ]);

    const dadosFin = fin.status === 'fulfilled' ? fin.value : null;
    const dadosCli = cli.status === 'fulfilled' ? cli.value : null;

    setRecebimentos(Array.isArray(dadosFin?.locacoes) ? dadosFin.locacoes : []);
    setFaturamentoTotal(Number(dadosFin?.faturamento_total || 0));
    setClientes(Array.isArray(dadosCli) ? dadosCli : []);
    setAtualizadoEm(new Date());
    setCarregando(false);
  };

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agenciaLogada?.id]);

  const m = useMemo(() => {
    // Frota
    const emManutencao = frota.filter((v) => v.status === 'manutenção' || v.precisa_revisao);
    const idsManutencao = new Set(emManutencao.map((v) => v.id));
    const disponiveis = frota.filter((v) => v.status === 'disponível' && !idsManutencao.has(v.id));
    const emLocacao = frota.filter((v) => v.status !== 'disponível' && !idsManutencao.has(v.id));
    const combustivelBaixo = frota.filter((v) => (v.combustivel_nivel ?? 1) <= 0.25);
    const ocupacao = frota.length ? Math.round((emLocacao.length / frota.length) * 100) : 0;

    // Locações
    const porStatus = ETAPAS.reduce((acc, e) => {
      acc[e.id] = recebimentos.filter((r) => r.status === e.id);
      return acc;
    }, {});
    const somar = (lista) => lista.reduce((s, r) => s + Number(r.valor || 0), 0);
    const aReceber = somar(porStatus.APROVADA) + somar(porStatus.AGUARDANDO_CONFIRMACAO);
    const quitadas = porStatus.ATIVA.length + porStatus.CONCLUIDA.length;
    const ticketMedio = quitadas ? faturamentoTotal / quitadas : 0;

    // Receita por veículo (apenas locações pagas)
    const receitaPorVeiculo = {};
    [...porStatus.ATIVA, ...porStatus.CONCLUIDA].forEach((r) => {
      const chave = r.veiculo || 'Veículo';
      receitaPorVeiculo[chave] = (receitaPorVeiculo[chave] || 0) + Number(r.valor || 0);
    });
    const topVeiculos = Object.entries(receitaPorVeiculo)
      .map(([nome, total]) => ({ nome, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    // Clientes
    const bloqueados = clientes.filter((c) => (c.status || '').toUpperCase() === 'BLOQUEADO').length;

    return {
      emManutencao, disponiveis, emLocacao, combustivelBaixo, ocupacao,
      porStatus, aReceber, quitadas, ticketMedio, topVeiculos, bloqueados,
    };
  }, [frota, recebimentos, faturamentoTotal, clientes]);

  const alertasAbertos = Array.isArray(emergencias) ? emergencias.filter((e) => e.status === 'ABERTO').length : 0;

  const atencao = [
    { id: 'emergencias', total: alertasAbertos, texto: 'alerta(s) SOS aberto(s)', cor: 'bg-rose-50 text-rose-700', ponto: 'bg-rose-500', pulsar: true },
    { id: 'reservas', total: reservasPendentes.length, texto: 'reserva(s) esperando aprovação', cor: 'bg-amber-50 text-amber-800', ponto: 'bg-amber-500' },
    { id: 'financeiro', total: m.porStatus.AGUARDANDO_CONFIRMACAO.length, texto: 'PIX para confirmar', cor: 'bg-orange-50 text-orange-700', ponto: 'bg-orange-500' },
    { id: 'manutencao', total: m.emManutencao.length, texto: 'veículo(s) na oficina ou com revisão', cor: 'bg-orange-50 text-orange-700', ponto: 'bg-orange-500' },
    { id: 'frota', total: m.combustivelBaixo.length, texto: 'veículo(s) com tanque em 25% ou menos', cor: 'bg-slate-100 text-slate-700', ponto: 'bg-slate-400' },
  ].filter((a) => a.total > 0);

  const totalFrota = frota.length;
  const pct = (n) => (totalFrota ? (n / totalFrota) * 100 : 0);
  const maxEtapa = Math.max(1, ...ETAPAS.map((e) => m.porStatus[e.id].length));
  const maxVeiculo = Math.max(1, ...m.topVeiculos.map((v) => v.total));
  const ultimasMov = recebimentos.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* 1. O que precisa de ação agora */}
      <section className={CARD}>
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Precisa da sua atenção</h2>
            <p className="text-sm text-slate-500">
              {atualizadoEm
                ? `Atualizado às ${atualizadoEm.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
                : 'Carregando indicadores...'}
            </p>
          </div>
          <button
            type="button"
            onClick={carregar}
            disabled={carregando}
            className="px-4 py-1.5 text-xs font-semibold text-slate-600 bg-[#eef3f9] hover:bg-[#dcebf9] rounded-full transition disabled:opacity-50"
          >
            {carregando ? 'Atualizando...' : 'Atualizar'}
          </button>
        </div>

        {atencao.length === 0 ? (
          <div className="bg-emerald-50 text-emerald-800 px-5 py-4 rounded-2xl text-sm font-medium flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Nenhuma pendência. Alertas, reservas, pagamentos e oficina estão em dia.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {atencao.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => setAbaAtiva && setAbaAtiva(a.id)}
                className={`${a.cor} rounded-2xl px-4 py-3.5 flex items-center gap-3 text-left text-sm font-semibold hover:brightness-95 transition`}
              >
                <span className={`h-2 w-2 shrink-0 rounded-full ${a.ponto} ${a.pulsar ? 'animate-pulse' : ''}`} />
                <span>
                  <span className="text-xl font-black mr-1.5">{a.total}</span>
                  {a.texto}
                </span>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* 2. KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi
          destaque
          titulo="Faturamento total"
          valor={moeda(faturamentoTotal)}
          detalhe={m.quitadas ? `Ticket médio de ${moeda(m.ticketMedio)} por locação` : 'Total recebido via PIX'}
        />
        <Kpi
          titulo="A receber"
          valor={moeda(m.aReceber)}
          corValor="text-amber-600"
          detalhe={`${m.porStatus.APROVADA.length + m.porStatus.AGUARDANDO_CONFIRMACAO.length} locação(ões) sem PIX confirmado`}
        />
        <Kpi
          titulo="Ocupação da frota"
          valor={`${m.ocupacao}%`}
          detalhe={`${m.emLocacao.length} de ${totalFrota} veículos em locação`}
        />
        <Kpi
          titulo="Clientes"
          valor={clientes.length}
          detalhe={m.bloqueados > 0 ? `${m.bloqueados} bloqueado(s)` : 'Nenhum bloqueado'}
        />
      </div>

      {/* 3. Frota e funil */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className={CARD}>
          <div className="mb-5">
            <h3 className="text-base font-bold text-slate-900">Situação da frota</h3>
            <p className="text-sm text-slate-500">{totalFrota} veículo(s) cadastrado(s)</p>
          </div>

          {totalFrota === 0 ? (
            <div className="py-10 text-center text-slate-400 text-sm bg-[#f4f7fb] rounded-2xl">
              Nenhum veículo cadastrado. Cadastre o primeiro na aba Frota & FIPE.
            </div>
          ) : (
            <>
              <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-100">
                <div className="bg-emerald-500" style={{ width: `${pct(m.disponiveis.length)}%` }} />
                <div className="bg-[#0066cc]" style={{ width: `${pct(m.emLocacao.length)}%` }} />
                <div className="bg-orange-500" style={{ width: `${pct(m.emManutencao.length)}%` }} />
              </div>

              <div className="mt-5 grid grid-cols-3 gap-3 text-xs">
                {[
                  { rotulo: 'Disponíveis', n: m.disponiveis.length, cor: 'bg-emerald-500' },
                  { rotulo: 'Em locação', n: m.emLocacao.length, cor: 'bg-[#0066cc]' },
                  { rotulo: 'Manutenção', n: m.emManutencao.length, cor: 'bg-orange-500' },
                ].map((i) => (
                  <div key={i.rotulo} className="bg-[#f4f7fb] rounded-2xl p-3.5">
                    <span className="flex items-center gap-2 text-slate-500 font-semibold">
                      <span className={`h-2 w-2 rounded-full ${i.cor}`} />
                      {i.rotulo}
                    </span>
                    <p className="text-xl font-black text-slate-900 mt-1">{i.n}</p>
                  </div>
                ))}
              </div>

              {m.combustivelBaixo.length > 0 && (
                <div className="mt-5">
                  <p className="text-xs font-semibold text-slate-600 mb-2">Tanque baixo</p>
                  <div className="flex flex-wrap gap-2">
                    {m.combustivelBaixo.map((v) => (
                      <span key={v.id} className="bg-rose-50 text-rose-700 rounded-full px-3 py-1 text-xs font-semibold">
                        <span className="font-mono">{v.placa}</span> · {Math.round((v.combustivel_nivel ?? 1) * 100)}%
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </section>

        <section className={CARD}>
          <div className="mb-5">
            <h3 className="text-base font-bold text-slate-900">Locações por etapa</h3>
            <p className="text-sm text-slate-500">Do pedido do cliente até o encerramento</p>
          </div>

          {recebimentos.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-sm bg-[#f4f7fb] rounded-2xl">
              {carregando ? 'Carregando locações...' : 'Nenhuma locação registrada até o momento.'}
            </div>
          ) : (
            <ul className="space-y-3.5">
              {ETAPAS.map((e) => {
                const n = m.porStatus[e.id].length;
                return (
                  <li key={e.id} className="text-xs">
                    <div className="flex justify-between mb-1.5">
                      <span className="font-semibold text-slate-600">{e.rotulo}</span>
                      <span className="font-bold text-slate-900">{n}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div className={`h-full rounded-full ${e.cor}`} style={{ width: `${(n / maxEtapa) * 100}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      {/* 4. Receita por veículo e últimas movimentações */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className={CARD}>
          <div className="mb-5">
            <h3 className="text-base font-bold text-slate-900">Veículos que mais faturam</h3>
            <p className="text-sm text-slate-500">Somando locações pagas</p>
          </div>

          {m.topVeiculos.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-sm bg-[#f4f7fb] rounded-2xl">
              Ainda não há locações pagas para ranquear.
            </div>
          ) : (
            <ul className="space-y-3.5">
              {m.topVeiculos.map((v) => (
                <li key={v.nome} className="text-xs">
                  <div className="flex justify-between gap-3 mb-1.5">
                    <span className="font-semibold text-slate-700 truncate">{v.nome}</span>
                    <span className="font-bold text-slate-900 whitespace-nowrap">{moeda(v.total)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full bg-[#0066cc]" style={{ width: `${(v.total / maxVeiculo) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={CARD}>
          <div className="flex justify-between items-center mb-5">
            <div>
              <h3 className="text-base font-bold text-slate-900">Últimas movimentações</h3>
              <p className="text-sm text-slate-500">Locações mais recentes da agência</p>
            </div>
            <button
              type="button"
              onClick={() => setAbaAtiva && setAbaAtiva('financeiro')}
              className="text-xs font-semibold text-[#0066cc] hover:underline"
            >
              Ver financeiro
            </button>
          </div>

          {ultimasMov.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-sm bg-[#f4f7fb] rounded-2xl">
              Nenhuma movimentação registrada.
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {ultimasMov.map((r) => {
                const [cor, rotulo] = COR_STATUS_MOV[r.status] || ['bg-slate-100 text-slate-700', r.status];
                return (
                  <li key={r.id || r.reservaId} className="py-3 flex items-center justify-between gap-3 text-xs">
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 truncate">{r.cliente || 'Cliente'}</p>
                      <p className="text-slate-500 truncate">
                        #{r.id || r.reservaId} · {r.veiculo || 'Veículo'}
                      </p>
                    </div>
                    <div className="text-right shrink-0 space-y-1">
                      <p className="font-bold text-slate-900">{moeda(r.valor)}</p>
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${cor}`}>
                        {rotulo}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}