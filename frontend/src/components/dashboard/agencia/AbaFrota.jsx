import React, { useState } from 'react';
import { createWorker } from 'tesseract.js';

const CARD = 'bg-white rounded-3xl p-6 shadow-[0_12px_32px_-22px_rgba(15,23,42,0.35)]';
const LABEL = 'block text-xs font-semibold text-slate-600';
const CAMPO =
  'w-full bg-[#f4f7fb] border border-transparent rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/20 focus:outline-none disabled:opacity-50 transition';

export function AbaFrota({
  frota, alertasFipe = {}, marcas, modelos, anos,
  placa, setPlaca, marcaCodigo, modeloCodigo, anoCodigo, setAnoCodigo,
  valorDiaria, setValorDiaria,
  selecionarMarca, selecionarModelo, cadastrarVeiculo, abrirModalVistoria,
  modalVistoriaAberto, veiculoVistoria, fecharModalVistoria,
  novoKmInput, setNovoKmInput, novoCombustivelInput, setNovoCombustivelInput,
  erroVistoriaModal, salvandoVistoria, handleSalvarVistoria
}) {
  const [fotoOdometro, setFotoOdometro] = useState(null);
  const [fotoVeiculoCadastro, setFotoVeiculoCadastro] = useState(null);
  const [fotoVeiculoVistoria, setFotoVeiculoVistoria] = useState(null);
  const [loadingOcr, setLoadingOcr] = useState(false);
  const [statusOcr, setStatusOcr] = useState({ texto: '', tipo: '' });
  const [somenteAlertaFipe, setSomenteAlertaFipe] = useState(false);

  const totalAlertasFipe = frota.filter(v => alertasFipe[String(v.id)]?.alerta_fipe).length;
  const frotaExibida = somenteAlertaFipe
    ? frota.filter(v => alertasFipe[String(v.id)]?.alerta_fipe)
    : frota;

  const fecharModalComLimpeza = () => {
    setFotoOdometro(null);
    setFotoVeiculoVistoria(null);
    setStatusOcr({ texto: '', tipo: '' });
    setLoadingOcr(false);
    fecharModalVistoria();
  };

  // [MANUT 1/3] RF15 - OCR do odometro no navegador (Tesseract.js) -> routers/veiculos.py
  const handleFotoPainelChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFotoOdometro(file);
    setLoadingOcr(true);
    setStatusOcr({ texto: 'Lendo odômetro via OCR...', tipo: 'info' });

    try {
      const worker = await createWorker('por');
      const ret = await worker.recognize(file);
      await worker.terminate();

      const textoDetectado = ret.data.text.replace(/\s+/g, '');
      const numeros = textoDetectado.match(/\d{4,6}/g);

      if (numeros && numeros.length > 0) {
        const kmSugerido = parseInt(numeros[0], 10);
        const kmAtual = veiculoVistoria?.quilometragem || 0;

        if (kmSugerido >= kmAtual) {
          setNovoKmInput(kmSugerido);
          setStatusOcr({
            texto: `✓ Odômetro detectado: ${kmSugerido.toLocaleString('pt-BR')} km.`,
            tipo: 'success'
          });
        } else {
          setStatusOcr({
            texto: `⚠️ Odômetro menor que o atual (${kmAtual} km). Ajuste se necessário.`,
            tipo: 'warning'
          });
        }
      } else {
        setStatusOcr({
          texto: 'Dígitos não identificados. Digite manualmente.',
          tipo: 'warning'
        });
      }
    } catch (err) {
      console.error('Erro no Tesseract OCR:', err);
      setStatusOcr({ texto: 'Falha no leitor de imagem. Digite o valor manualmente.', tipo: 'error' });
    } finally {
      setLoadingOcr(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className={CARD}>
        <div className="mb-6">
          <h2 className="text-lg font-bold text-slate-900">Adicionar novo veículo à frota</h2>
          <p className="text-sm text-slate-500">Cadastro integrado à Tabela FIPE</p>
        </div>

        <form onSubmit={(e) => cadastrarVeiculo(e, fotoVeiculoCadastro)} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <div className="space-y-1.5">
            <label className={LABEL}>Placa</label>
            <input type="text" placeholder="Ex: ABC-1234" value={placa} onChange={(e) => setPlaca(e.target.value)} required className={`${CAMPO} uppercase`} />
          </div>

          <div className="space-y-1.5">
            <label className={LABEL}>Marca</label>
            <select value={marcaCodigo} onChange={selecionarMarca} required className={CAMPO}>
              <option value="">Selecione...</option>
              {marcas.map(m => (<option key={m.codigo} value={m.codigo}>{m.nome}</option>))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className={LABEL}>Modelo</label>
            <select value={modeloCodigo} onChange={selecionarModelo} required disabled={!marcaCodigo} className={CAMPO}>
              <option value="">Selecione...</option>
              {modelos.map(mod => (<option key={mod.codigo} value={mod.codigo}>{mod.nome}</option>))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className={LABEL}>Ano</label>
            <select value={anoCodigo} onChange={(e) => setAnoCodigo(e.target.value)} required disabled={!modeloCodigo} className={CAMPO}>
              <option value="">Selecione...</option>
              {anos.map(a => (<option key={a.codigo} value={a.codigo}>{a.nome}</option>))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className={LABEL}>Diária (R$)</label>
            <input type="number" step="0.01" placeholder="150.00" value={valorDiaria} onChange={(e) => setValorDiaria(e.target.value)} required className={CAMPO} />
          </div>

          <div className="space-y-1.5">
            <label className={LABEL}>Foto do veículo</label>
            <input
              type="file"
              accept="image/png, image/jpeg, image/webp"
              onChange={(e) => setFotoVeiculoCadastro(e.target.files[0] || null)}
              className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#e6f0fa] file:text-[#0066cc] hover:file:bg-[#d2e5f7] cursor-pointer"
            />
          </div>

          <div className="flex items-end sm:col-span-2 lg:col-span-3">
            <button type="submit" className="w-full bg-[#0066cc] hover:bg-[#0052a3] text-white font-semibold py-2.5 rounded-full text-sm transition shadow-[0_10px_24px_-12px_rgba(0,102,204,0.7)]">
              Cadastrar veículo
            </button>
          </div>
        </form>
      </section>

      <section className={CARD}>
        <div className="flex justify-between items-center gap-3 mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Frota cadastrada</h2>
            <p className="text-sm text-slate-500">Veículos ativos sob gestão desta agência</p>
          </div>
          <span className="bg-[#e6f0fa] text-[#0066cc] px-3.5 py-1.5 rounded-full text-xs font-bold">Total: {frota.length}</span>
        </div>

        {totalAlertasFipe > 0 && (
          <button
            type="button"
            onClick={() => setSomenteAlertaFipe(prev => !prev)}
            className="w-full mb-5 flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800 text-xs font-semibold transition text-left"
          >
            <span>⚠️ {totalAlertasFipe} veículo(s) acima de 15% de desvalorização FIPE</span>
            <span className="underline">{somenteAlertaFipe ? 'Mostrar todos' : 'Filtrar'}</span>
          </button>
        )}

        {frotaExibida.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm bg-[#f4f7fb] rounded-2xl">Nenhum veículo cadastrado nesta agência.</div>
        ) : (
          <div className="overflow-x-auto rounded-2xl ring-1 ring-slate-100">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f4f7fb] text-xs text-slate-500 font-semibold">
                  <th className="p-4">Placa</th>
                  <th className="p-4">Marca / Modelo</th>
                  <th className="p-4">Ano</th>
                  <th className="p-4">Diária</th>
                  <th className="p-4">Tabela FIPE</th>
                  <th className="p-4">Odômetro</th>
                  <th className="p-4">Combustível</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-slate-100">
                {frotaExibida.map(v => {
                  const fipe = alertasFipe[String(v.id)];
                  return (
                    <tr key={v.id} className="hover:bg-[#f8fafd] transition">
                      <td className="p-4 font-bold font-mono text-slate-900">{v.placa}</td>
                      <td className="p-4 text-slate-700 font-medium">{v.marca} - {v.modelo}</td>
                      <td className="p-4 text-slate-600">{v.ano}</td>
                      <td className="p-4 font-bold text-[#0066cc]">R$ {v.valor_diaria}</td>
                      <td className="p-4">
                        <div className="text-xs font-semibold text-slate-700">
                          {fipe?.valor_fipe_atual || (String(v.fipeP || '').includes('R$') ? v.fipeP : '—')}
                        </div>
                        {fipe && (
                          <span
                            className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                              fipe.alerta_fipe
                                ? 'bg-rose-100 text-rose-700'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {fipe.alerta_fipe
                              ? `⚠️ -${fipe.desvalorizacao_pct}%`
                              : fipe.desvalorizacao_pct > 0
                                ? `-${fipe.desvalorizacao_pct}%`
                                : '0%'}
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-slate-700 font-mono text-xs">{(v.quilometragem || 0).toLocaleString('pt-BR')} km</td>
                      <td className="p-4 text-slate-600">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${Math.round((v.combustivel_nivel || 1) * 100)}%` }}></div>
                          </div>
                          <span className="text-xs">{Math.round((v.combustivel_nivel || 1) * 100)}%</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${v.status === 'disponível' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'}`}>
                          {v.status}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <button onClick={() => abrirModalVistoria(v)} className="bg-[#e6f0fa] hover:bg-[#d2e5f7] text-[#0066cc] text-xs px-4 py-2 rounded-full font-semibold transition">
                          Atualizar dados
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {modalVistoriaAberto && veiculoVistoria && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-base font-bold text-slate-900">Atualizar dados</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {veiculoVistoria.marca} {veiculoVistoria.modelo} • <span className="font-mono font-semibold">{veiculoVistoria.placa}</span>
                </p>
              </div>
              <button type="button" onClick={fecharModalComLimpeza} aria-label="Fechar" className="text-slate-400 hover:text-slate-700 text-lg font-bold h-8 w-8 rounded-full hover:bg-slate-100 transition">✕</button>
            </div>

            <div className="bg-[#f4f7fb] rounded-2xl p-4 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Odômetro atual</span>
                <span className="font-mono font-bold text-slate-800">{(veiculoVistoria.quilometragem || 0).toLocaleString('pt-BR')} km</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Combustível atual</span>
                <span className="font-bold text-emerald-700">{Math.round((veiculoVistoria.combustivel_nivel ?? 1.0) * 100)}%</span>
              </div>
            </div>

            {erroVistoriaModal && (
              <div className="px-4 py-3 rounded-xl text-xs font-semibold bg-rose-50 text-rose-700">{erroVistoriaModal}</div>
            )}

            <form
              onSubmit={(e) => handleSalvarVistoria(e, fotoOdometro, fotoVeiculoVistoria, fecharModalComLimpeza)}
              className="space-y-4"
            >
              <div className="p-4 bg-[#f4f7fb] border border-dashed border-[#b9d3ee] rounded-2xl space-y-2">
                <label className="flex items-center justify-between text-xs font-semibold text-slate-700">
                  <span>Foto do painel (odômetro)</span>
                  <span className="text-[10px] text-slate-400 font-normal">OCR</span>
                </label>
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handleFotoPainelChange}
                  disabled={loadingOcr || salvandoVistoria}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[#e6f0fa] file:text-[#0066cc] hover:file:bg-[#d2e5f7] cursor-pointer"
                />
                {statusOcr.texto && (
                  <p className={`text-[11px] font-semibold ${
                    statusOcr.tipo === 'success' ? 'text-emerald-700' :
                    statusOcr.tipo === 'warning' ? 'text-amber-700' :
                    statusOcr.tipo === 'error' ? 'text-rose-700' : 'text-[#0066cc]'
                  }`}>
                    {statusOcr.texto}
                  </p>
                )}
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                <label className="flex items-center justify-between text-xs font-semibold text-slate-700">
                  <span>Foto do veículo</span>
                  <span className="text-[10px] text-slate-400 font-normal">Opcional</span>
                </label>
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={(e) => setFotoVeiculoVistoria(e.target.files[0] || null)}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[#e6f0fa] file:text-[#0066cc] hover:file:bg-[#d2e5f7] cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <label className={LABEL}>Novo odômetro (km)</label>
                <input
                  type="number"
                  min={veiculoVistoria.quilometragem || 0}
                  step="1"
                  required
                  value={novoKmInput}
                  onChange={(e) => setNovoKmInput(e.target.value)}
                  className={`${CAMPO} font-mono`}
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className={LABEL}>Nível de combustível</label>
                  <span className="font-bold text-xs text-emerald-700">{Math.round(novoCombustivelInput * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={novoCombustivelInput}
                  onChange={(e) => setNovoCombustivelInput(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#0066cc]"
                />
                <div className="grid grid-cols-4 gap-1.5 mt-3">
                  {[
                    { label: '25%', val: 0.25 },
                    { label: '50%', val: 0.50 },
                    { label: '75%', val: 0.75 },
                    { label: '100%', val: 1.00 },
                  ].map(btn => (
                    <button
                      key={btn.val}
                      type="button"
                      onClick={() => setNovoCombustivelInput(btn.val)}
                      className={`py-1.5 text-[10px] font-semibold rounded-full transition ${
                        Math.abs(novoCombustivelInput - btn.val) < 0.01
                          ? 'bg-[#0066cc] text-white'
                          : 'bg-[#eef3f9] text-slate-600 hover:bg-[#dcebf9]'
                      }`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={fecharModalComLimpeza} disabled={salvandoVistoria} className="flex-1 bg-[#eef3f9] hover:bg-[#dcebf9] text-slate-700 text-sm font-semibold py-2.5 rounded-full transition">Cancelar</button>
                <button type="submit" disabled={salvandoVistoria || loadingOcr} className="flex-1 bg-[#0066cc] hover:bg-[#0052a3] text-white text-sm font-semibold py-2.5 rounded-full transition disabled:opacity-50">
                  {salvandoVistoria ? 'Salvando...' : loadingOcr ? 'Lendo...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
