import React from 'react';

export function AbaFrota({
  frota, marcas, modelos, anos,
  placa, setPlaca, marcaCodigo, modeloCodigo, anoCodigo, setAnoCodigo,
  valorDiaria, setValorDiaria,
  selecionarMarca, selecionarModelo, cadastrarVeiculo, abrirModalVistoria,
  modalVistoriaAberto, veiculoVistoria, fecharModalVistoria,
  novoKmInput, setNovoKmInput, novoCombustivelInput, setNovoCombustivelInput,
  erroVistoriaModal, salvandoVistoria, handleSalvarVistoria
}) {
  return (
    <div className="space-y-6">
      <section className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-slate-900">Adicionar Novo Veículo à Frota</h2>
          <p className="text-xs text-slate-500">Registo integrado diretamente com a Tabela FIPE</p>
        </div>

        <form onSubmit={cadastrarVeiculo} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Placa do Veículo</label>
            <input type="text" placeholder="Ex: ABC-1234" value={placa} onChange={(e) => setPlaca(e.target.value)} required className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm uppercase focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition" />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">1. Marca (FIPE)</label>
            <select value={marcaCodigo} onChange={selecionarMarca} required className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition">
              <option value="">Selecione a Marca...</option>
              {marcas.map(m => (<option key={m.codigo} value={m.codigo}>{m.nome}</option>))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">2. Modelo (FIPE)</label>
            <select value={modeloCodigo} onChange={selecionarModelo} required disabled={!marcaCodigo} className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400 transition">
              <option value="">Selecione o Modelo...</option>
              {modelos.map(mod => (<option key={mod.codigo} value={mod.codigo}>{mod.nome}</option>))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">3. Ano / Versão (FIPE)</label>
            <select value={anoCodigo} onChange={(e) => setAnoCodigo(e.target.value)} required disabled={!modeloCodigo} className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400 transition">
              <option value="">Selecione o Ano...</option>
              {anos.map(a => (<option key={a.codigo} value={a.codigo}>{a.nome}</option>))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Valor da Diária (R$)</label>
            <input type="number" step="0.01" placeholder="150.00" value={valorDiaria} onChange={(e) => setValorDiaria(e.target.value)} required className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition" />
          </div>

          <div className="flex items-end">
            <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl text-sm transition shadow-sm hover:shadow">Cadastrar Veículo 🚗</button>
          </div>
        </form>
      </section>

      <section className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Frota Registada</h2>
            <p className="text-xs text-slate-500">Veículos ativos sob gestão desta agência</p>
          </div>
          <span className="bg-blue-50 text-blue-700 border border-blue-100 px-3 py-1 rounded-xl text-xs font-bold">Total: {frota.length}</span>
        </div>

        {frota.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm border-2 border-dashed border-slate-100 rounded-xl">Ainda não existem veículos registados nesta agência.</div>
        ) : (
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 font-bold uppercase tracking-wider">
                  <th className="p-4">Placa</th>
                  <th className="p-4">Marca / Modelo</th>
                  <th className="p-4">Ano</th>
                  <th className="p-4">Diária</th>
                  <th className="p-4">Odômetro</th>
                  <th className="p-4">Combustível</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-slate-100">
                {frota.map(v => (
                  <tr key={v.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-4 font-bold text-slate-900">{v.placa}</td>
                    <td className="p-4 text-slate-700 font-medium">{v.marca} - {v.modelo}</td>
                    <td className="p-4 text-slate-600">{v.ano}</td>
                    <td className="p-4 font-bold text-emerald-600">R$ {v.valor_diaria}</td>
                    <td className="p-4 text-slate-700 font-mono text-xs">{(v.quilometragem || 0).toLocaleString('pt-BR')} km</td>
                    <td className="p-4 text-slate-600">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-200 rounded-full h-2 overflow-hidden">
                          <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${Math.round((v.combustivel_nivel || 1) * 100)}%` }}></div>
                        </div>
                        <span className="text-xs">{Math.round((v.combustivel_nivel || 1) * 100)}%</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${v.status === 'disponível' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
                        {v.status}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <button onClick={() => abrirModalVistoria(v)} className="bg-slate-800 hover:bg-blue-600 text-white text-xs px-3 py-1.5 rounded-lg font-medium transition shadow-sm inline-flex items-center gap-1.5">
                        <span>⚙️</span> Atualizar Dados
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* MINI-MODAL NATIVO UNIFICADO: VISTORIA E DADOS */}
      {modalVistoriaAberto && veiculoVistoria && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in duration-200">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Vistoria e Atualização de Frota</h3>
                <p className="text-xs text-slate-500">
                  {veiculoVistoria.marca} {veiculoVistoria.modelo} • <span className="font-mono font-semibold">{veiculoVistoria.placa}</span>
                </p>
              </div>
              <button type="button" onClick={fecharModalVistoria} className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1 rounded-lg hover:bg-slate-100 transition">✕</button>
            </div>

            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Odômetro Atual:</span>
                <span className="font-mono font-bold text-slate-800">{(veiculoVistoria.quilometragem || 0).toLocaleString('pt-BR')} km</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Combustível Atual:</span>
                <span className="font-bold text-emerald-700">{Math.round((veiculoVistoria.combustivel_nivel ?? 1.0) * 100)}%</span>
              </div>
            </div>

            {erroVistoriaModal && (
              <div className="p-3 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">{erroVistoriaModal}</div>
            )}

            <form onSubmit={handleSalvarVistoria} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Novo Odômetro (km)</label>
                <input
                  type="number"
                  min={veiculoVistoria.quilometragem || 0}
                  step="1"
                  required
                  value={novoKmInput}
                  onChange={(e) => setNovoKmInput(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase">Nível de Combustível</label>
                  <span className="font-bold text-xs text-emerald-700">{Math.round(novoCombustivelInput * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={novoCombustivelInput}
                  onChange={(e) => setNovoCombustivelInput(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
                <div className="grid grid-cols-4 gap-1.5 mt-2">
                  {[
                    { label: '25% (1/4)', val: 0.25 },
                    { label: '50% (1/2)', val: 0.50 },
                    { label: '75% (3/4)', val: 0.75 },
                    { label: '100% (Cheio)', val: 1.00 },
                  ].map(btn => (
                    <button
                      key={btn.val}
                      type="button"
                      onClick={() => setNovoCombustivelInput(btn.val)}
                      className={`py-1 text-[10px] font-bold rounded-lg border transition ${
                        Math.abs(novoCombustivelInput - btn.val) < 0.01
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button type="button" onClick={fecharModalVistoria} disabled={salvandoVistoria} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2.5 rounded-xl transition">Cancelar</button>
                <button type="submit" disabled={salvandoVistoria} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2.5 rounded-xl transition shadow-sm disabled:opacity-50">
                  {salvandoVistoria ? 'Salvando...' : 'Salvar Vistoria'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}