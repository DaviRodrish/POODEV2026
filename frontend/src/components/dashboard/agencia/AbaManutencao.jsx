import React, { useState } from 'react';

const CARD = 'bg-white rounded-3xl p-6 shadow-[0_12px_32px_-22px_rgba(15,23,42,0.35)]';

export function AbaManutencao({ frota = [], manutencoes = [], gerenciarManutencao }) {
  const [descricoes, setDescricoes] = useState({});

  const veiculosPendentes = frota.filter(
    (v) => v.status === 'manutenção' || v.precisa_revisao
  );

  const handleChangeDescricao = (veiculoId, texto) => {
    setDescricoes((prev) => ({ ...prev, [veiculoId]: texto }));
  };

  const handleAcao = async (veiculo, acao) => {
    const emAndamento = manutencoes.find(
      (m) => m.veiculo_id === veiculo.id && m.status === 'EM_ANDAMENTO'
    );
    const texto = (descricoes[veiculo.id] ?? emAndamento?.descricao ?? '').trim();
    const origem = veiculo.precisa_revisao ? 'REVISAO_10K' : 'EMERGENCIA_SOS';

    const ok = await gerenciarManutencao(veiculo.id, acao, texto, origem);
    if (ok && acao === 'finalizar') {
      setDescricoes((prev) => ({ ...prev, [veiculo.id]: '' }));
    }
  };

  return (
    <div className="space-y-6">
      <section className={CARD}>
        <div className="flex justify-between items-center gap-3 mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Veículos em manutenção / revisão pendente</h2>
            <p className="text-sm text-slate-500">
              Carros que atingiram o limite de 10.000 km ou sofreram ocorrência de emergência SOS
            </p>
          </div>
          <span className="bg-orange-50 text-orange-700 px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap">
            Pendentes: {veiculosPendentes.length}
          </span>
        </div>

        {veiculosPendentes.length === 0 ? (
          <div className="bg-emerald-50 text-emerald-800 px-5 py-4 rounded-2xl text-sm font-medium flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Nenhum veículo retido na oficina! Toda a frota está em dia.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {veiculosPendentes.map((v) => {
              const osAtiva = manutencoes.find(
                (m) => m.veiculo_id === v.id && m.status === 'EM_ANDAMENTO'
              );
              const valorInput = descricoes[v.id] ?? osAtiva?.descricao ?? '';
              const porRevisaoKm = v.precisa_revisao;

              return (
                <div key={v.id} className="bg-[#f4f7fb] rounded-2xl p-5 flex flex-col justify-between gap-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <span className="font-mono font-extrabold text-sm text-slate-900 bg-white px-3 py-1 rounded-full">
                          {v.placa}
                        </span>
                        <h3 className="text-sm font-bold text-slate-800 mt-2">
                          {v.marca} {v.modelo} ({v.ano})
                        </h3>
                      </div>

                      <div className="flex flex-col items-end gap-1.5">
                        <span
                          className={`text-xs font-semibold px-3 py-1 rounded-full ${
                            porRevisaoKm ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {porRevisaoKm ? 'Revisão 10.000 km' : 'Pós-emergência SOS'}
                        </span>
                        <span
                          className={`text-xs font-semibold px-3 py-1 rounded-full ${
                            osAtiva ? 'bg-blue-100 text-blue-800' : 'bg-white text-slate-600'
                          }`}
                        >
                          {osAtiva ? 'Em andamento' : 'Aguardando oficina'}
                        </span>
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-xl text-xs grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-slate-400 block">Odômetro atual</span>
                        <span className="font-mono font-bold text-slate-800">
                          {(v.quilometragem || 0).toLocaleString('pt-BR')} km
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Meta de revisão</span>
                        <span className="font-mono font-bold text-orange-600">
                          {(v.km_rev || 10000).toLocaleString('pt-BR')} km →{' '}
                          {((v.quilometragem || 0) + 10000).toLocaleString('pt-BR')} km
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-600">
                        Descrição do serviço / reparo realizado
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Troca de óleo, filtros, alinhamento e revisão de freios..."
                        value={valorInput}
                        onChange={(e) => handleChangeDescricao(v.id, e.target.value)}
                        className="w-full bg-white border border-transparent rounded-xl px-4 py-2.5 text-sm placeholder:text-slate-400 focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/20 focus:outline-none transition"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleAcao(v, 'iniciar')}
                      className="flex-1 bg-white hover:bg-[#e6f0fa] text-[#0066cc] text-sm font-semibold py-2.5 px-3 rounded-full transition"
                    >
                      Colocar em andamento
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAcao(v, 'finalizar')}
                      className="flex-1 bg-[#0066cc] hover:bg-[#0052a3] text-white text-sm font-semibold py-2.5 px-3 rounded-full transition"
                    >
                      Finalizar e liberar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className={CARD}>
        <div className="flex justify-between items-center gap-3 mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Histórico de serviços e manutenções</h2>
            <p className="text-sm text-slate-500">Histórico de revisões e reparos da frota</p>
          </div>
          <span className="bg-[#e6f0fa] text-[#0066cc] px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap">
            Registros: {manutencoes.length}
          </span>
        </div>

        {manutencoes.length === 0 ? (
          <div className="py-10 text-center text-slate-400 text-sm bg-[#f4f7fb] rounded-2xl">
            Nenhuma manutenção registrada no histórico.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl ring-1 ring-slate-100">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f4f7fb] text-xs text-slate-500 font-semibold">
                  <th className="p-4">Data / hora</th>
                  <th className="p-4">Placa</th>
                  <th className="p-4">Veículo</th>
                  <th className="p-4">Origem</th>
                  <th className="p-4">KM</th>
                  <th className="p-4">Serviço realizado</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-slate-100">
                {manutencoes.map((m) => (
                  <tr key={m.id} className="hover:bg-[#f8fafd] transition">
                    <td className="p-4 text-xs text-slate-500">{m.data_hora}</td>
                    <td className="p-4 font-bold font-mono text-slate-900">{m.placa}</td>
                    <td className="p-4 text-slate-700 font-medium">{m.modelo}</td>
                    <td className="p-4 text-xs">
                      <span className="px-3 py-1 rounded-full bg-[#eef3f9] text-slate-700 font-semibold">
                        {m.origem === 'REVISAO_10K' ? 'Revisão 10.000 km' : 'Pós-emergência SOS'}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-xs text-slate-700">
                      {(m.km_revisao || 0).toLocaleString('pt-BR')} km
                    </td>
                    <td className="p-4 text-slate-700">{m.descricao}</td>
                    <td className="p-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          m.status === 'CONCLUIDA' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'
                        }`}
                      >
                        {m.status === 'CONCLUIDA' ? 'Concluída' : 'Em andamento'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}