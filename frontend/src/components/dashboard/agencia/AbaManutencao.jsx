import React, { useState } from 'react';

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
      <section className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Veículos em Manutenção / Revisão Pendente</h2>
            <p className="text-xs text-slate-500">
              Carros que atingiram o limite de 10.000 km ou sofreram ocorrência de emergência SOS
            </p>
          </div>
          <span className="bg-orange-50 text-orange-700 border border-orange-200 px-3 py-1 rounded-xl text-xs font-bold">
            Pendentes: {veiculosPendentes.length}
          </span>
        </div>

        {veiculosPendentes.length === 0 ? (
          <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 p-5 rounded-xl text-sm font-medium">
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
                <div
                  key={v.id}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col justify-between gap-4 shadow-sm"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <span className="font-mono font-extrabold text-sm text-slate-900 bg-white px-2.5 py-1 rounded border border-slate-200">
                          {v.placa}
                        </span>
                        <h3 className="text-sm font-bold text-slate-800 mt-1.5">
                          {v.marca} {v.modelo} ({v.ano})
                        </h3>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <span
                          className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-md ${
                            porRevisaoKm
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-rose-100 text-rose-800 border border-rose-200'
                          }`}
                        >
                          {porRevisaoKm ? 'Revisão 10.000 km' : 'Pós-Emergência SOS'}
                        </span>
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                            osAtiva
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {osAtiva ? 'Em Andamento' : 'Aguardando Oficina'}
                        </span>
                      </div>
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-slate-400 block">Odômetro Atual</span>
                        <span className="font-mono font-bold text-slate-800">
                          {(v.quilometragem || 0).toLocaleString('pt-BR')} km
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Meta de Revisão</span>
                        <span className="font-mono font-bold text-orange-600">
                          {(v.km_rev || 10000).toLocaleString('pt-BR')} km →{' '}
                          {((v.quilometragem || 0) + 10000).toLocaleString('pt-BR')} km
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Descrição do Serviço / Reparo Realizado
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Troca de óleo, filtros, alinhamento e revisão de freios..."
                        value={valorInput}
                        onChange={(e) => handleChangeDescricao(v.id, e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => handleAcao(v, 'iniciar')}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2.5 px-3 rounded-xl transition shadow-sm"
                    >
                      Colocar em Andamento
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAcao(v, 'finalizar')}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 px-3 rounded-xl transition shadow-sm"
                    >
                      Finalizar e Liberar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Histórico de Serviços e Manutenções</h2>
            <p className="text-xs text-slate-500">Histórico de revisões e reparos da frota</p>
          </div>
          <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-xl text-xs font-bold">
            Registros: {manutencoes.length}
          </span>
        </div>

        {manutencoes.length === 0 ? (
          <div className="py-10 text-center text-slate-400 text-sm border-2 border-dashed border-slate-100 rounded-xl">
            Nenhuma manutenção registrada no histórico.
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 font-bold uppercase tracking-wider">
                  <th className="p-4">Data / Hora</th>
                  <th className="p-4">Placa</th>
                  <th className="p-4">Veículo</th>
                  <th className="p-4">Origem</th>
                  <th className="p-4">KM</th>
                  <th className="p-4">Serviço Realizado</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-slate-100">
                {manutencoes.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-4 text-xs text-slate-500">{m.data_hora}</td>
                    <td className="p-4 font-bold font-mono text-slate-900">{m.placa}</td>
                    <td className="p-4 text-slate-700 font-medium">{m.modelo}</td>
                    <td className="p-4 text-xs">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                        {m.origem === 'REVISAO_10K' ? 'Revisão 10.000 km' : 'Pós-Emergência SOS'}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-xs text-slate-700">
                      {(m.km_revisao || 0).toLocaleString('pt-BR')} km
                    </td>
                    <td className="p-4 text-slate-700">{m.descricao}</td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase ${
                          m.status === 'CONCLUIDA'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}
                      >
                        {m.status === 'CONCLUIDA' ? 'Concluída' : 'Em Andamento'}
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
