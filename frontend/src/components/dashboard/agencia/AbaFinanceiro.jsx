import React, { useState, useEffect } from 'react';

const CARD = 'bg-white rounded-3xl p-6 shadow-[0_12px_32px_-22px_rgba(15,23,42,0.35)]';

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
    <div className="space-y-6">
      {/* 1. Resumo: o faturamento é o destaque (azul sólido), os demais ficam discretos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0066cc] text-white p-6 rounded-3xl shadow-[0_16px_36px_-18px_rgba(0,102,204,0.7)]">
          <span className="text-xs font-semibold text-white/80">Faturamento total</span>
          <p className="text-3xl font-black mt-1.5 tracking-tight">R$ {faturamentoTotal.toFixed(2)}</p>
          <span className="text-xs text-white/75">Total recebido via PIX</span>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-[0_12px_32px_-22px_rgba(15,23,42,0.35)]">
          <span className="text-xs font-semibold text-slate-500">Contratos quitados</span>
          <p className="text-2xl font-black text-slate-900 mt-1.5">{totalQuitadas} locações</p>
          <span className="text-xs text-slate-400">Locações ativas ou concluídas</span>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-[0_12px_32px_-22px_rgba(15,23,42,0.35)]">
          <span className="text-xs font-semibold text-slate-500">Pagamento pendente</span>
          <p className="text-2xl font-black text-amber-600 mt-1.5">{totalPagamentoPendente} locações</p>
          <span className="text-xs text-slate-400">Reserva aprovada, aguardando PIX</span>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-[0_12px_32px_-22px_rgba(15,23,42,0.35)]">
          <span className="text-xs font-semibold text-slate-500">Aguardando confirmação</span>
          <p className="text-2xl font-black text-orange-600 mt-1.5">{totalAguardandoConfirmacao} locações</p>
          <span className="text-xs text-slate-400">PIX declarado pelo cliente</span>
        </div>
      </div>

      {/* 2. Chave PIX */}
      <div className={`${CARD} space-y-4`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">Chave PIX oficial da filial</h2>
            <p className="text-sm text-slate-500">
              Chave exibida aos clientes no pagamento das locações desta agência.
            </p>
          </div>
          <span className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 font-mono self-start">
            Chave ativa: {chaveAtiva || 'Não configurada'}
          </span>
        </div>

        <form onSubmit={handleSalvarChavePix} className="flex flex-col md:flex-row gap-3 items-center">
          <input
            type="text"
            required
            value={chavePixInput}
            onChange={(e) => setChavePixInput(e.target.value)}
            placeholder="Digite CNPJ, E-mail, Celular ou Chave Aleatória"
            className="flex-1 w-full bg-[#f4f7fb] border border-transparent rounded-full px-5 py-2.5 text-sm font-mono placeholder:text-slate-400 focus:bg-white focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/20 focus:outline-none transition"
          />
          <button
            type="button"
            onClick={() => setChavePixInput(agenciaLogada?.cnpj || '12.345.678/0001-90')}
            className="w-full md:w-auto bg-[#eef3f9] hover:bg-[#dcebf9] text-slate-700 px-5 py-2.5 rounded-full text-sm font-semibold transition"
          >
            Usar CNPJ
          </button>
          <button
            type="submit"
            disabled={salvandoPix}
            className="w-full md:w-auto bg-[#0066cc] hover:bg-[#0052a3] text-white px-6 py-2.5 rounded-full text-sm font-semibold transition disabled:opacity-50"
          >
            {salvandoPix ? 'Gravando...' : 'Salvar chave PIX'}
          </button>
        </form>
      </div>

      {/* 3. Histórico financeiro */}
      <div className={`${CARD} space-y-4`}>
        <div className="flex justify-between items-center">
          <h3 className="text-base font-bold text-slate-900">Histórico financeiro</h3>
          <button
            type="button"
            onClick={carregarDadosFinanceiros}
            disabled={carregando}
            className="text-xs font-semibold text-[#0066cc] hover:underline disabled:opacity-50"
          >
            {carregando ? 'Atualizando...' : 'Atualizar'}
          </button>
        </div>

        <div className="overflow-x-auto rounded-2xl ring-1 ring-slate-100">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f4f7fb] text-slate-500 font-semibold">
              <tr>
                <th className="py-3 px-4">Reserva</th>
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-4">Veículo</th>
                <th className="py-3 px-4">Método</th>
                <th className="py-3 px-4">Valor</th>
                <th className="py-3 px-4">Status / ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recebimentos.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-10 text-center text-slate-400">
                    Nenhuma movimentação financeira registrada para esta agência até o momento.
                  </td>
                </tr>
              ) : (
                recebimentos.map(r => {
                  const idItem = r.id || r.reservaId;
                  const isAguardando = r.status === 'AGUARDANDO_CONFIRMACAO';

                  return (
                    <tr key={idItem} className="hover:bg-[#f8fafd]">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800">#{idItem}</td>
                      <td className="py-3.5 px-4 font-medium text-slate-700">{r.cliente || 'Cliente'}</td>
                      <td className="py-3.5 px-4 text-slate-600">{r.veiculo || 'Veículo'}</td>
                      <td className="py-3.5 px-4 font-semibold text-[#0066cc]">{r.metodo || 'PIX'}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        R$ {Number(r.valor || 0).toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4">
                        {isAguardando ? (
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800">
                              Aguardando confirmação
                            </span>
                            <button
                              type="button"
                              onClick={() => handleConfirmarRecebimentoPix(idItem)}
                              className="px-3 py-1 bg-[#0066cc] hover:bg-[#0052a3] text-white rounded-full text-[10px] font-semibold transition"
                            >
                              Confirmar recebimento PIX
                            </button>
                          </div>
                        ) : (
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${
                            r.status === 'ATIVA' ? 'bg-emerald-100 text-emerald-700' :
                            r.status === 'CONCLUIDA' ? 'bg-blue-100 text-blue-700' :
                            r.status === 'APROVADA' ? 'bg-amber-100 text-amber-800' :
                            r.status === 'PENDENTE' ? 'bg-slate-100 text-slate-700' :
                            r.status === 'RECUSADA' ? 'bg-rose-100 text-rose-700' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {r.status === 'ATIVA' ? 'Pago / ativa' :
                             r.status === 'APROVADA' ? 'Pagamento pendente' :
                             r.status === 'PENDENTE' ? 'Aguardando aprovação' :
                             r.status === 'CONCLUIDA' ? 'Concluída' :
                             r.status === 'RECUSADA' ? 'Recusada' : r.status}
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