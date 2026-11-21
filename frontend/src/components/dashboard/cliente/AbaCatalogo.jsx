import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../../services/api';

const CAMPO =
  'w-full bg-white border border-transparent rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/20 focus:outline-none transition';

function CarroIlustracao() {
  return (
    <svg viewBox="0 0 240 110" className="h-24 w-auto" aria-hidden="true">
      <ellipse cx="120" cy="94" rx="78" ry="6" fill="#0f172a" opacity="0.12" />
      <path
        d="M34 80C34 70 40 64 50 62L68 34C73 27 80 24 90 24H146C156 24 164 28 170 36L186 60C196 63 202 70 202 79V86H34Z"
        fill="#0066cc"
      />
      <path d="M78 40H112V60H64Z" fill="#e6f0fa" />
      <path d="M122 40H146C150 40 153 42 155 45L168 60H122Z" fill="#e6f0fa" />
      <rect x="190" y="70" width="12" height="7" rx="3" fill="#fde9c8" />
      <circle cx="72" cy="86" r="14" fill="#1e293b" />
      <circle cx="72" cy="86" r="5.5" fill="#cbd5e1" />
      <circle cx="164" cy="86" r="14" fill="#1e293b" />
      <circle cx="164" cy="86" r="5.5" fill="#cbd5e1" />
    </svg>
  );
}

const API_URL = API_BASE_URL;

function obterImagemVeiculo(v) {
  const bruto =
    v.imagem_url || v.imagem || v.foto_url || v.foto || v.url_imagem || v.image_url || v.image || v.img || null;
  if (!bruto || typeof bruto !== 'string') return null;
  const s = bruto.trim();
  if (!s) return null;
  if (/^(https?:|data:|blob:)/i.test(s)) return s;
  if (s.length > 100 && /^[A-Za-z0-9+/=\s]+$/.test(s)) return `data:image/jpeg;base64,${s.replace(/\s/g, '')}`;
  return `${API_URL}/${s.replace(/^\/+/, '')}`;
}

function ImagemVeiculo({ veiculo }) {
  const src = obterImagemVeiculo(veiculo);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    setErro(false);
  }, [src]);

  if (!src || erro) return <CarroIlustracao />;

  return (
    <img
      src={src}
      alt={`${veiculo.marca} ${veiculo.modelo}`}
      loading="lazy"
      onError={() => setErro(true)}
      className="absolute inset-0 h-full w-full object-cover"
    />
  );
}

export function AbaCatalogo({
  veiculos,
  carregando,
  minhasReservas,
  diasReserva,
  setDiasReserva,
  isBloqueado,
  usuarioLogado,
  setMensagemFeedback,
  carregarMinhasReservas
}) {
  const [veiculoModal, setVeiculoModal] = useState(null);
  const [diasModal, setDiasModal] = useState(1);
  const [incluirMotoristaSecundario, setIncluirMotoristaSecundario] = useState(false);
  const [nomeMotorista2, setNomeMotorista2] = useState('');
  const [cnhMotorista2, setCnhMotorista2] = useState('');

  const [outraAgencia, setOutraAgencia] = useState(false);
  const [agenciaDestino, setAgenciaDestino] = useState('Rio de Janeiro - Capital');
  const [enviandoReserva, setEnviandoReserva] = useState(false);

  const abrirModalReserva = (v) => {
    setMensagemFeedback('');

    if (isBloqueado) {
      setMensagemFeedback({ tipo: 'erro', texto: `Conta bloqueada: ${usuarioLogado.motivo || 'procure a agência'}.` });
      return;
    }

    if (v.precisa_revisao || v.status === 'manutenção') {
      setMensagemFeedback({ tipo: 'erro', texto: 'Veículo em revisão preventiva (indisponível).' });
      return;
    }

    setVeiculoModal(v);
    setDiasModal(diasReserva[v.id] || 1);
    setIncluirMotoristaSecundario(false);
    setNomeMotorista2('');
    setCnhMotorista2('');
    setOutraAgencia(false);
  };

  const fecharModalReserva = () => {
    setVeiculoModal(null);
  };

  const valorDiaria = veiculoModal?.valor_diaria || 0;
  const subtotalDiarias = valorDiaria * diasModal;
  const taxaMotorista2 = incluirMotoristaSecundario ? 20 * diasModal : 0;
  const taxaOutraAgencia = outraAgencia ? 120.00 : 0;
  const valorTotalGeral = subtotalDiarias + taxaMotorista2 + taxaOutraAgencia;

  const handleConfirmarReserva = async (e) => {
    e.preventDefault();
    if (!veiculoModal) return;

    setEnviandoReserva(true);
    setMensagemFeedback('');

    const form = new FormData();
    form.append("cliente_id", usuarioLogado.id);
    form.append("veiculo_id", veiculoModal.id);
    form.append("dias", diasModal);
    form.append("motorista_secundario", incluirMotoristaSecundario ? "true" : "false");
    if (incluirMotoristaSecundario) {
      form.append("motorista_nome", nomeMotorista2);
      form.append("motorista_cnh", cnhMotorista2);
    }
    form.append("outra_agencia", outraAgencia ? "true" : "false");
    if (outraAgencia) {
      form.append("agencia_destino", agenciaDestino);
    }
    form.append("valor_total", valorTotalGeral);

    try {
      const res = await fetch(`${API_BASE_URL}/api/reservas`, { method: "POST", body: form });
      if (res.ok) {
        setMensagemFeedback({ tipo: 'sucesso', texto: 'Reserva solicitada com sucesso!' });
        carregarMinhasReservas();
        fecharModalReserva();
      } else {
        const erroJson = await res.json();
        setMensagemFeedback({ tipo: 'erro', texto: erroJson.detail || 'Erro ao efetuar reserva.' });
      }
    } catch (err) {
      setMensagemFeedback({ tipo: 'erro', texto: 'Erro de conexão com o servidor.' });
    } finally {
      setEnviandoReserva(false);
    }
  };

  const veiculosDisponiveis = veiculos.filter(v => v.status === 'disponível');

  return (
    <section className="space-y-6">
      <div className="flex justify-between items-center gap-3">
        <p className="text-sm text-slate-600">Selecione o período e personalize sua locação</p>
        <span className="bg-white text-[#0066cc] px-4 py-1.5 rounded-full text-xs font-bold shadow-[0_8px_20px_-14px_rgba(15,23,42,0.4)] whitespace-nowrap">
          Disponíveis: {veiculosDisponiveis.length}
        </span>
      </div>

      {carregando ? (
        <div className="py-12 text-center text-slate-400 text-sm">Carregando catálogo...</div>
      ) : veiculosDisponiveis.length === 0 ? (
        <div className="py-12 text-center text-slate-400 text-sm rounded-3xl bg-white">
          Nenhum veículo disponível no momento.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {veiculosDisponiveis.map(v => {
            const combustivelPct = Math.round((v.combustivel_nivel ?? 1.0) * 100);
            const emRevisao = v.precisa_revisao || v.status === 'manutenção';
            const alugado = v.status === 'alugado';
            const novo = (v.quilometragem || 0) <= 10000;

            const minhaReservaDoVeiculo = minhasReservas.find(r => r.veiculo_id === v.id && (r.status === 'PENDENTE' || r.status === 'APROVADA'));
            const statusReserva = minhaReservaDoVeiculo ? minhaReservaDoVeiculo.status : null;
            const bloqueadoParaAluguel = isBloqueado || emRevisao || (alugado && !minhaReservaDoVeiculo) || statusReserva;

            return (
              <div key={v.id} className="bg-white rounded-3xl overflow-hidden flex flex-col shadow-[0_12px_32px_-22px_rgba(15,23,42,0.35)] hover:shadow-[0_18px_40px_-20px_rgba(15,23,42,0.4)] transition">
                <div className="relative bg-gradient-to-b from-[#dcebf9] to-[#eef4fb] h-44 pb-3 flex items-end justify-center overflow-hidden">
                  <span className="absolute top-4 left-4 z-10 bg-white/90 text-[#0066cc] px-3 py-1 rounded-full text-xs font-semibold">
                    {v.agencia_nome || (v.agencia_id ? `Agência ${v.agencia_id}` : 'Agência 1')}
                  </span>
                  {emRevisao && (
                    <span className="absolute top-4 right-4 z-10 px-3 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800">
                      Revisão
                    </span>
                  )}
                  <ImagemVeiculo veiculo={v} />
                </div>

                <div className="p-6 flex flex-col justify-between flex-1 gap-5">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="font-bold text-lg text-slate-900 leading-tight">{v.marca} {v.modelo}</h3>
                      <span className={`shrink-0 px-3 py-1 rounded-full text-xs font-semibold ${novo ? 'bg-violet-100 text-violet-700' : 'bg-blue-100 text-blue-700'}`}>
                        {novo ? 'Novo' : 'Usado'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500">
                      Placa <span className="font-mono text-slate-700">{v.placa}</span> • Ano {v.ano}
                    </p>

                    <div className="flex items-center gap-3 text-xs text-slate-600 bg-[#f4f7fb] px-3.5 py-2.5 rounded-2xl">
                      <span className="font-semibold text-emerald-700">Tanque {combustivelPct}%</span>
                      <span className="text-slate-300">•</span>
                      <span>{v.quilometragem || 0} km</span>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-1 text-xs bg-emerald-50 text-emerald-800 px-3.5 py-2.5 rounded-2xl">
                      <span className="font-medium">
                        Motor {v.cilindrada > 0 ? Number(v.cilindrada).toFixed(1) : 'EV'} • {v.combustivel_tipo || 'Gasolina'}
                      </span>
                      <span className="font-bold">{v.emissao_100km ?? 18} kg CO₂ / 100km</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-xs text-slate-500">Diária</span>
                      <p className="text-xl font-bold text-[#0066cc] leading-tight">R$ {v.valor_diaria}</p>
                    </div>

                    <button
                      onClick={() => abrirModalReserva(v)}
                      disabled={!!bloqueadoParaAluguel}
                      className={`px-5 py-2.5 rounded-full text-sm font-semibold transition ${
                        statusReserva === 'PENDENTE' ? 'bg-amber-100 text-amber-800 cursor-not-allowed' :
                        statusReserva === 'APROVADA' ? 'bg-emerald-100 text-emerald-800 cursor-not-allowed' :
                        bloqueadoParaAluguel ? 'bg-slate-100 text-slate-400 cursor-not-allowed' :
                        'bg-[#0066cc] hover:bg-[#0052a3] text-white shadow-[0_10px_24px_-12px_rgba(0,102,204,0.7)]'
                      }`}
                    >
                      {statusReserva === 'PENDENTE' ? 'Solicitado' :
                       statusReserva === 'APROVADA' ? 'Reservado' :
                       isBloqueado ? 'Bloqueado' :
                       emRevisao ? 'Em revisão' :
                       alugado ? 'Alugado' : 'Reservar'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {veiculoModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-base font-bold text-slate-900">Solicitar locação</h3>
                <p className="text-xs text-slate-500 mt-0.5">{veiculoModal.marca} {veiculoModal.modelo} • Diária: R$ {veiculoModal.valor_diaria}</p>
              </div>
              <button
                type="button"
                onClick={fecharModalReserva}
                aria-label="Fechar"
                className="text-slate-400 hover:text-slate-700 text-lg font-bold h-8 w-8 rounded-full hover:bg-slate-100 transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmarReserva} className="space-y-4 text-xs">
              <div className="bg-[#e6f0fa] rounded-2xl p-4 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-[#0066cc] text-xs">Local de retirada do veículo</span>
                  <span className="text-[11px] font-semibold text-[#0066cc] bg-white/80 px-2.5 py-0.5 rounded-full">
                    {veiculoModal.agencia_nome || (veiculoModal.agencia_id ? `Agência ${veiculoModal.agencia_id}` : 'Agência 1')}
                  </span>
                </div>
                <p className="text-slate-700 font-medium text-xs">
                  {veiculoModal.agencia_endereco || 'Av. Alberto Lamego, 2000 • Parque Califórnia'}
                </p>
              </div>

              <div className="bg-[#f4f7fb] p-4 rounded-2xl space-y-1.5">
                <label className="block font-semibold text-slate-700">Quantidade de dias</label>
                <input
                  type="number"
                  min="1"
                  value={diasModal}
                  onChange={(e) => setDiasModal(parseInt(e.target.value) || 1)}
                  required
                  className={CAMPO}
                />
                <p className="text-[11px] text-slate-500">Subtotal diárias ({diasModal}x): R$ {subtotalDiarias.toFixed(2)}</p>
              </div>

              <div className="bg-[#f4f7fb] p-4 rounded-2xl space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <label className="font-semibold text-slate-700 flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={incluirMotoristaSecundario}
                      onChange={(e) => setIncluirMotoristaSecundario(e.target.checked)}
                      className="rounded h-4 w-4 accent-[#0066cc]"
                    />
                    Adicionar motorista secundário
                  </label>
                  <span className="text-[11px] text-emerald-700 font-semibold whitespace-nowrap">+ R$ 20,00 / dia</span>
                </div>

                {incluirMotoristaSecundario && (
                  <div className="space-y-3 pt-3 border-t border-slate-200/70">
                    <div className="space-y-1">
                      <span className="block text-slate-600 font-medium">Nome completo do condutor</span>
                      <input
                        type="text"
                        placeholder="Nome do motorista secundário"
                        value={nomeMotorista2}
                        onChange={(e) => setNomeMotorista2(e.target.value)}
                        required={incluirMotoristaSecundario}
                        className={CAMPO}
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="block text-slate-600 font-medium">Número da CNH</span>
                      <input
                        type="text"
                        placeholder="CNH do motorista secundário"
                        value={cnhMotorista2}
                        onChange={(e) => setCnhMotorista2(e.target.value)}
                        required={incluirMotoristaSecundario}
                        className={`${CAMPO} font-mono`}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-[#f4f7fb] p-4 rounded-2xl space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <label className="font-semibold text-slate-700 flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={outraAgencia}
                      onChange={(e) => setOutraAgencia(e.target.checked)}
                      className="rounded h-4 w-4 accent-[#0066cc]"
                    />
                    Devolver em outra agência
                  </label>
                  <span className="text-[11px] text-emerald-700 font-semibold whitespace-nowrap">+ R$ 120,00 (taxa fixa)</span>
                </div>

                {outraAgencia && (
                  <div className="pt-3 border-t border-slate-200/70 space-y-1">
                    <span className="block text-slate-600 font-medium">Agência de destino / devolução</span>
                    <select
                      value={agenciaDestino}
                      onChange={(e) => setAgenciaDestino(e.target.value)}
                      className={CAMPO}
                    >
                      <option value="Rio de Janeiro - Capital">Rio de Janeiro - Capital</option>
                      <option value="Campos dos Goytacazes - Centro">Campos dos Goytacazes - Centro</option>
                      <option value="Macaé - Rodoviária">Macaé - Rodoviária</option>
                      <option value="Vitória - ES">Vitória - ES</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="bg-[#0066cc] text-white rounded-2xl p-5 space-y-1.5">
                <div className="flex justify-between text-xs text-white/85">
                  <span>Diárias ({diasModal}x)</span>
                  <span>R$ {subtotalDiarias.toFixed(2)}</span>
                </div>
                {incluirMotoristaSecundario && (
                  <div className="flex justify-between text-xs text-white/85">
                    <span>Motorista secundário</span>
                    <span>+ R$ {taxaMotorista2.toFixed(2)}</span>
                  </div>
                )}
                {outraAgencia && (
                  <div className="flex justify-between text-xs text-white/85">
                    <span>Taxa outra agência</span>
                    <span>+ R$ {taxaOutraAgencia.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t border-white/25 pt-2.5 mt-1 flex justify-between items-baseline font-bold">
                  <span className="text-sm">Valor total estimado</span>
                  <span className="text-xl">R$ {valorTotalGeral.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={fecharModalReserva}
                  disabled={enviandoReserva}
                  className="flex-1 bg-[#eef3f9] hover:bg-[#dcebf9] text-slate-700 font-semibold py-2.5 rounded-full text-sm transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={enviandoReserva}
                  className="flex-1 bg-[#0066cc] hover:bg-[#0052a3] text-white font-semibold py-2.5 rounded-full text-sm transition disabled:opacity-50"
                >
                  {enviandoReserva ? 'Enviando...' : 'Confirmar reserva'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

export default AbaCatalogo;
