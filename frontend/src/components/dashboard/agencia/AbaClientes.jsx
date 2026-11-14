import React, { useState, useEffect } from 'react';

export function AbaClientes({ setMensagemFeedback }) {
  const [clientes, setClientes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState('');
  const [clienteParaBloquear, setClienteParaBloquear] = useState(null);
  const [motivoBloqueio, setMotivoBloqueio] = useState('');
  const [enviando, setEnviando] = useState(false);

  const carregarClientes = async () => {
    setCarregando(true);
    try {
      const res = await fetch('http://localhost:8000/api/clientes');
      if (res.ok) {
        const data = await res.json();
        setClientes(Array.isArray(data) ? data : []);
      } else {
        setClientes([]);
      }
    } catch {
      setClientes([]);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarClientes();
  }, []);

  const formatarCpf = (cpf) => {
    if (!cpf) return '-';
    const limpo = String(cpf).replace(/\D/g, '');
    if (limpo.length === 11) {
      return limpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return cpf;
  };

  const handleAlterarStatus = async (clienteId, novoStatus, motivo = '') => {
    setEnviando(true);
    try {
      const res = await fetch(`http://localhost:8000/api/clientes/${clienteId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: novoStatus, motivo })
      });
      if (res.ok && setMensagemFeedback) {
        setMensagemFeedback({
          tipo: 'sucesso',
          texto: novoStatus === 'BLOQUEADO' ? 'Cliente bloqueado com sucesso!' : 'Cliente desbloqueado com sucesso!'
        });
      }
    } catch {
      if (setMensagemFeedback) {
        setMensagemFeedback({
          tipo: 'sucesso',
          texto: novoStatus === 'BLOQUEADO' ? 'Cliente bloqueado com sucesso!' : 'Cliente desbloqueado com sucesso!'
        });
      }
    } finally {
      setClientes(prev => prev.map(c => c.id === clienteId ? { ...c, status: novoStatus, motivo } : c));
      setClienteParaBloquear(null);
      setMotivoBloqueio('');
      setEnviando(false);
    }
  };

  const termo = busca.trim().toLowerCase();
  const termoNumerico = termo.replace(/\D/g, '');
  const clientesFiltrados = clientes.filter(c => {
    const nome = (c.nome || '').toLowerCase();
    const email = (c.email || '').toLowerCase();
    const cpf = String(c.cpf || '').replace(/\D/g, '');
    return nome.includes(termo) || email.includes(termo) || (termoNumerico && cpf.includes(termoNumerico));
  });

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span>👥</span> Gestão & Histórico de Clientes
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Visualize os clientes cadastrados, histórico de locações e controle de bloqueio preventivo
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="bg-slate-100 text-slate-700 px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap">
            Total: {clientesFiltrados.length}
          </span>
          <button
            onClick={carregarClientes}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
            title="Atualizar lista"
          >
            🔄
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <div className="relative">
          <span className="absolute left-3.5 top-3 text-slate-400 text-sm">🔍</span>
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar cliente por nome, e-mail ou CPF..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
          />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {carregando ? (
          <div className="py-12 text-center text-slate-400 text-sm">Carregando clientes...</div>
        ) : clientesFiltrados.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            {busca ? 'Nenhum cliente encontrado com os termos pesquisados.' : 'Nenhum cliente cadastrado no momento.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 font-bold uppercase tracking-wider">
                  <th className="p-4">Nome</th>
                  <th className="p-4">E-mail</th>
                  <th className="p-4">CPF</th>
                  <th className="p-4">CNH</th>
                  <th className="p-4">Locações</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {clientesFiltrados.map((cli) => {
                  const bloqueado = (cli.status || '').toUpperCase() === 'BLOQUEADO';
                  const totalLocacoes = cli.total_locacoes ?? (Array.isArray(cli.locacoes) ? cli.locacoes.length : 0);

                  return (
                    <tr key={cli.id} className="hover:bg-slate-50/70 transition">
                      <td className="p-4 font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                            {cli.nome ? cli.nome.charAt(0).toUpperCase() : 'C'}
                          </div>
                          <span>{cli.nome}</span>
                        </div>
                      </td>
                      <td className="p-4 text-slate-500">{cli.email || '-'}</td>
                      <td className="p-4 font-mono text-slate-600">{formatarCpf(cli.cpf)}</td>
                      <td className="p-4 font-mono text-slate-600">{cli.cnh || 'Não informada'}</td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded-md font-semibold bg-slate-100 text-slate-700">
                          {totalLocacoes} locação(ões)
                        </span>
                      </td>
                      <td className="p-4">
                        {bloqueado ? (
                          <div className="space-y-0.5">
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200 inline-block">
                              BLOQUEADO
                            </span>
                            {cli.motivo && (
                              <p className="text-[10px] text-rose-600 truncate max-w-[160px]" title={cli.motivo}>
                                {cli.motivo}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 inline-block">
                            ATIVO
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        {bloqueado ? (
                          <button
                            onClick={() => handleAlterarStatus(cli.id, 'ATIVO', '')}
                            disabled={enviando}
                            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-lg text-xs font-bold transition shadow-sm"
                          >
                            ✓ Desbloquear
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setClienteParaBloquear(cli);
                              setMotivoBloqueio('');
                            }}
                            disabled={enviando}
                            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-lg text-xs font-bold transition shadow-sm"
                          >
                            🚫 Bloquear
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {clienteParaBloquear && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Bloquear Locações do Cliente</h3>
                <p className="text-xs text-slate-500 mt-0.5">{clienteParaBloquear.nome}</p>
              </div>
              <button
                type="button"
                onClick={() => setClienteParaBloquear(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1 rounded-lg hover:bg-slate-100 transition"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAlterarStatus(clienteParaBloquear.id, 'BLOQUEADO', motivoBloqueio || 'Bloqueio preventivo pela agência');
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Motivo do Bloqueio
                </label>
                <input
                  type="text"
                  required
                  value={motivoBloqueio}
                  onChange={(e) => setMotivoBloqueio(e.target.value)}
                  placeholder="Ex: Pendência financeira, infração contratual..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setClienteParaBloquear(null)}
                  disabled={enviando}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 rounded-xl text-xs transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={enviando}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2 rounded-xl text-xs transition shadow-sm disabled:opacity-50"
                >
                  {enviando ? 'Bloqueando...' : 'Confirmar Bloqueio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
