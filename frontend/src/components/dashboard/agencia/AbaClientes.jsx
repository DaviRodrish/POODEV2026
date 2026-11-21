import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../../services/api';

const CARD = 'bg-white rounded-3xl shadow-[0_12px_32px_-22px_rgba(15,23,42,0.35)]';

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
      const res = await fetch(`${API_BASE_URL}/api/clientes`);
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
      const res = await fetch(`${API_BASE_URL}/api/clientes/${clienteId}/status`, {
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
      <div className={`${CARD} p-6 flex flex-col md:flex-row md:items-center justify-between gap-4`}>
        <div>
          <h2 className="text-lg font-bold text-slate-900">Gestão & histórico de clientes</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Visualize os clientes cadastrados, histórico de locações e controle de bloqueio preventivo
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="bg-[#e6f0fa] text-[#0066cc] px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap">
            Total: {clientesFiltrados.length}
          </span>
          <button
            onClick={carregarClientes}
            className="px-4 py-1.5 text-xs font-semibold text-slate-600 bg-[#eef3f9] hover:bg-[#dcebf9] rounded-full transition"
            title="Atualizar lista"
          >
            Atualizar
          </button>
        </div>
      </div>

      <div className="relative">
        <svg
          viewBox="0 0 24 24"
          className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.5-3.5" />
        </svg>
        <input
          type="text"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar cliente por nome, e-mail ou CPF..."
          className="w-full pl-11 pr-5 py-3 bg-white rounded-full text-sm shadow-[0_12px_32px_-22px_rgba(15,23,42,0.35)] border border-transparent placeholder:text-slate-400 focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/20 focus:outline-none transition"
        />
      </div>

      <div className={`${CARD} overflow-hidden`}>
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
                <tr className="bg-[#f4f7fb] text-xs text-slate-500 font-semibold">
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
                    <tr key={cli.id} className="hover:bg-[#f8fafd] transition">
                      <td className="p-4 font-bold text-slate-900">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#e6f0fa] text-[#0066cc] flex items-center justify-center font-bold text-xs">
                            {cli.nome ? cli.nome.charAt(0).toUpperCase() : 'C'}
                          </div>
                          <span>{cli.nome}</span>
                        </div>
                      </td>
                      <td className="p-4 text-slate-500">{cli.email || '-'}</td>
                      <td className="p-4 font-mono text-slate-600">{formatarCpf(cli.cpf)}</td>
                      <td className="p-4 font-mono text-slate-600">{cli.cnh || 'Não informada'}</td>
                      <td className="p-4">
                        <span className="px-3 py-1 rounded-full font-semibold bg-[#eef3f9] text-slate-700">
                          {totalLocacoes} locação(ões)
                        </span>
                      </td>
                      <td className="p-4">
                        {bloqueado ? (
                          <div className="space-y-0.5">
                            <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-700 inline-block">
                              Bloqueado
                            </span>
                            {cli.motivo && (
                              <p className="text-[10px] text-rose-600 truncate max-w-[160px]" title={cli.motivo}>
                                {cli.motivo}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-700 inline-block">
                            Ativo
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        {bloqueado ? (
                          <button
                            onClick={() => handleAlterarStatus(cli.id, 'ATIVO', '')}
                            disabled={enviando}
                            className="px-4 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold transition disabled:opacity-50"
                          >
                            Desbloquear
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setClienteParaBloquear(cli);
                              setMotivoBloqueio('');
                            }}
                            disabled={enviando}
                            className="px-4 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-full text-xs font-semibold transition disabled:opacity-50"
                          >
                            Bloquear
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
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-base font-bold text-slate-900">Bloquear locações do cliente</h3>
                <p className="text-xs text-slate-500 mt-0.5">{clienteParaBloquear.nome}</p>
              </div>
              <button
                type="button"
                onClick={() => setClienteParaBloquear(null)}
                aria-label="Fechar"
                className="text-slate-400 hover:text-slate-700 text-lg font-bold h-8 w-8 rounded-full hover:bg-slate-100 transition"
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
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-600">Motivo do bloqueio</label>
                <input
                  type="text"
                  required
                  value={motivoBloqueio}
                  onChange={(e) => setMotivoBloqueio(e.target.value)}
                  placeholder="Ex: Pendência financeira, infração contratual..."
                  className="w-full bg-[#f4f7fb] border border-transparent rounded-xl px-4 py-2.5 text-sm placeholder:text-slate-400 focus:bg-white focus:border-rose-400 focus:ring-2 focus:ring-rose-200 focus:outline-none transition"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setClienteParaBloquear(null)}
                  disabled={enviando}
                  className="flex-1 bg-[#eef3f9] hover:bg-[#dcebf9] text-slate-700 font-semibold py-2.5 rounded-full text-sm transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={enviando}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-semibold py-2.5 rounded-full text-sm transition disabled:opacity-50"
                >
                  {enviando ? 'Bloqueando...' : 'Confirmar bloqueio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}