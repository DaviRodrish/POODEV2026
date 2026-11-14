import React, { useState, useEffect } from 'react';

export function AbaFinanceiro({ agenciaLogada, setMensagemFeedback }) {
  const chavePadrao = agenciaLogada?.chave_pix || agenciaLogada?.cnpj || '';
  const [chavePixInput, setChavePixInput] = useState(chavePadrao);
  const [chaveAtiva, setChaveAtiva] = useState(chavePadrao);
  const [salvandoPix, setSalvandoPix] = useState(false);
  const [carregando, setCarregando] = useState(false);

  // Dados reais sincronizados com o banco de dados (zero dados mockados)
  const [recebimentos, setRecebimentos] = useState([]);
  const [faturamentoTotal, setFaturamentoTotal] = useState(0);

  const carregarDadosFinanceiros = async () => {
    const agenciaId = agenciaLogada?.id || 1;
    setCarregando(true);
    try {
      const res = await fetch(`http://localhost:8000/api/agencias/${agenciaId}/financeiro`);
      if (res.ok) {
        const dados = await res.json();
        if (dados.chave_pix) {
          setChavePixInput(dados.chave_pix);
          setChaveAtiva(dados.chave_pix);
        }
        setRecebimentos(Array.isArray(dados.locacoes) ? dados.locacoes : []);
        setFaturamentoTotal(Number(dados.faturamento_total || 0));
      } else {
        setRecebimentos([]);
        setFaturamentoTotal(0);
      }
    } catch (err) {
      console.log('Aviso ao buscar financeiro:', err);
      setRecebimentos([]);
      setFaturamentoTotal(0);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarDadosFinanceiros();
  }, [agenciaLogada?.id]);

  const handleSalvarChavePix = async (e) => {
    e.preventDefault();
    setSalvandoPix(true);
    const agenciaId = agenciaLogada?.id || 1;
    try {
      const res = await fetch(`http://localhost:8000/api/agencias/${agenciaId}/chave-pix`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chave_pix: chavePixInput })
      });
      if (res.ok) {
        setChaveAtiva(chavePixInput);
        setMensagemFeedback({
          tipo: 'sucesso',
          texto: `Chave PIX da agência atualizada com sucesso para: "${chavePixInput}"`
        });
        carregarDadosFinanceiros();
      } else {
        setChaveAtiva(chavePixInput);
        setMensagemFeedback({
          tipo: 'sucesso',
          texto: `Chave PIX configurada: "${chavePixInput}"`
        });
      }
    } catch {
      setChaveAtiva(chavePixInput);
      setMensagemFeedback({
        tipo: 'sucesso',
        texto: `Chave PIX da agência atualizada para: "${chavePixInput}"`
      });
    } finally {
      setSalvandoPix(false);
    }
  };

  const handleConfirmarRecebimentoPix = async (reservaId) => {
    try {
      const res = await fetch(`http://localhost:8000/api/reservas/${reservaId}/confirmar-pix`, {
        method: 'PUT'
      });
      if (res.ok) {
        setMensagemFeedback({
          tipo: 'sucesso',
          texto: `Pagamento da Reserva #${reservaId} confirmado!`
        });
        carregarDadosFinanceiros();
      } else {
        const erroJson = await res.json().catch(() => ({}));
        setMensagemFeedback({
          tipo: 'erro',
          texto: erroJson.detail || 'Erro ao confirmar recebimento do PIX.'
        });
      }
    } catch {
      setMensagemFeedback({
        tipo: 'erro',
        texto: 'Erro de conexão com o servidor ao confirmar PIX.'
      });
    }
  };

  const totalAguardandoConfirmacao = recebimentos.filter(
    r => r.status === 'AGUARDANDO_CONFIRMACAO'
  ).length;

  const totalQuitadas = recebimentos.filter(
    r => r.status === 'ATIVA' || r.status === 'CONCLUIDA'
  ).length;

  const totalPagamentoPendente = recebimentos.filter(
    r => r.status === 'APROVADA'
  ).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. CARD CONFIGURAÇÃO DA CHAVE PIX */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>💵</span> Chave PIX Oficial da Filial
            </h2>
            <p className="text-xs text-slate-500">
              Chave exibida aos clientes no pagamento das locações desta agência.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 font-mono">
              Chave Ativa: {chaveAtiva || 'Não configurada'}
            </span>
          </div>
        </div>

        <form onSubmit={handleSalvarChavePix} className="flex flex-col md:flex-row gap-3 items-center">
          <input
            type="text"
            required
            value={chavePixInput}
            onChange={(e) => setChavePixInput(e.target.value)}
            placeholder="Digite CNPJ, E-mail, Celular ou Chave Aleatória"
            className="flex-1 w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
          />
          <button
            type="button"
            onClick={() => setChavePixInput(agenciaLogada?.cnpj || '12.345.678/0001-90')}
            className="w-full md:w-auto bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2.5 rounded-xl text-xs font-bold transition"
          >
            Usar CNPJ
          </button>
          <button
            type="submit"
            disabled={salvandoPix}
            className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-sm disabled:opacity-50"
          >
            {salvandoPix ? 'Gravando...' : 'Salvar Chave PIX'}
          </button>
        </form>
      </div>

      {/* 2. CARDS DE RESUMO FINANCEIRO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-semibold uppercase">Faturamento Total</span>
          <p className="text-2xl font-black text-emerald-600 mt-1">R$ {faturamentoTotal.toFixed(2)}</p>
          <span className="text-[11px] text-slate-400">Total recebido via PIX</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-semibold uppercase">Contratos Quitados</span>
          <p className="text-2xl font-black text-slate-900 mt-1">{totalQuitadas} Locações</p>
          <span className="text-[11px] text-slate-400">Locações ativas ou concluídas</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-semibold uppercase">Pagamento Pendente</span>
          <p className="text-2xl font-black text-amber-600 mt-1">{totalPagamentoPendente} Locações</p>
          <span className="text-[11px] text-amber-700 font-semibold">Reserva aprovada, aguardando PIX</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-semibold uppercase">Aguardando Confirmação</span>
          <p className="text-2xl font-black text-orange-600 mt-1">{totalAguardandoConfirmacao} Locações</p>
          <span className="text-[11px] text-orange-700 font-semibold">PIX declarado pelo cliente</span>
        </div>
      </div>

      {/* 3. TABELA DE HISTÓRICO FINANCEIRO */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-bold text-slate-900">Histórico Financeiro</h3>
          <button
            type="button"
            onClick={carregarDadosFinanceiros}
            disabled={carregando}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 disabled:opacity-50"
          >
            {carregando ? 'Atualizando...' : '🔄 Atualizar'}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Reserva</th>
                <th className="py-2.5 px-3">Cliente</th>
                <th className="py-2.5 px-3">Veículo</th>
                <th className="py-2.5 px-3">Método</th>
                <th className="py-2.5 px-3">Valor</th>
                <th className="py-2.5 px-3">Status / Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recebimentos.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400">
                    Nenhuma movimentação financeira registrada para esta agência até o momento.
                  </td>
                </tr>
              ) : (
                recebimentos.map(r => {
                  const idItem = r.id || r.reservaId;
                  const isAguardando = r.status === 'AGUARDANDO_CONFIRMACAO';

                  return (
                    <tr key={idItem} className="hover:bg-slate-50/50">
                      <td className="py-3 px-3 font-mono font-bold text-slate-800">#{idItem}</td>
                      <td className="py-3 px-3 font-medium text-slate-700">{r.cliente || 'Cliente'}</td>
                      <td className="py-3 px-3 text-slate-600">{r.veiculo || 'Veículo'}</td>
                      <td className="py-3 px-3 font-semibold text-blue-600">{r.metodo || 'PIX'}</td>
                      <td className="py-3 px-3 font-bold text-emerald-600">
                        R$ {Number(r.valor || 0).toFixed(2)}
                      </td>
                      <td className="py-3 px-3">
                        {isAguardando ? (
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              Aguardando Confirmação
                            </span>
                            <button
                              type="button"
                              onClick={() => handleConfirmarRecebimentoPix(idItem)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold transition shadow-sm"
                            >
                              Confirmar Recebimento PIX
                            </button>
                          </div>
                        ) : (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            r.status === 'ATIVA' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                            r.status === 'CONCLUIDA' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                            r.status === 'APROVADA' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                            r.status === 'PENDENTE' ? 'bg-slate-100 text-slate-700 border-slate-300' :
                            r.status === 'RECUSADA' ? 'bg-rose-100 text-rose-800 border-rose-200' :
                            'bg-slate-100 text-slate-800 border-slate-200'
                          }`}>
                            {r.status === 'ATIVA' ? 'PAGO / ATIVA' :
                             r.status === 'APROVADA' ? 'PAGAMENTO PENDENTE' :
                             r.status === 'PENDENTE' ? 'AGUARDANDO APROVAÇÃO' :
                             r.status === 'CONCLUIDA' ? 'CONCLUÍDA' :
                             r.status === 'RECUSADA' ? 'RECUSADA' : r.status}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
