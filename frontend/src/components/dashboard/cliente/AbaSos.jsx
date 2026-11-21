import React, { useState } from 'react';

const CAMPO =
  'w-full bg-[#f4f7fb] border border-transparent rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-rose-400 focus:ring-2 focus:ring-rose-200 focus:outline-none transition';

export function AbaSos({ minhasReservas, minhasEmergencias, setMensagemFeedback, carregarMinhasEmergencias }) {
  const [tipoEmergencia, setTipoEmergencia] = useState('ACIDENTE');
  const [descricaoEmergencia, setDescricaoEmergencia] = useState('');

  const handleConfirmarAtendimento = async (emergenciaId) => {
    setMensagemFeedback('');
    try {
      const formData = new FormData();
      formData.append('novo_status', 'RESOLVIDO');
      formData.append('status', 'RESOLVIDO');

      const res = await fetch(`http://localhost:8000/api/emergencias/${emergenciaId}/status`, {
        method: 'PUT',
        body: formData
      });

      if (res.ok) {
        setMensagemFeedback({
          tipo: 'sucesso',
          texto: 'Atendimento confirmado. Ocorrência encerrada.'
        });
        carregarMinhasEmergencias();
      } else {
        const erroJson = await res.json();
        const msgErro = typeof erroJson.detail === 'string'
          ? erroJson.detail
          : Array.isArray(erroJson.detail)
            ? erroJson.detail.map(e => e.msg || JSON.stringify(e)).join(', ')
            : (erroJson.detail ? JSON.stringify(erroJson.detail) : 'Erro ao confirmar atendimento.');
        setMensagemFeedback({
          tipo: 'erro',
          texto: msgErro
        });
      }
    } catch (err) {
      setMensagemFeedback({
        tipo: 'erro',
        texto: 'Erro de conexão com o servidor ao confirmar atendimento.'
      });
    }
  };

  const enviarSos = async (e) => {
    e.preventDefault();
    setMensagemFeedback('');

    const locacaoAtiva = minhasReservas.find(r => r.status === 'APROVADA' || r.status === 'RETIRADO');

    if (!locacaoAtiva) {
      setMensagemFeedback({ tipo: 'erro', texto: 'Nenhuma locação ativa para acionar o SOS.' });
      return;
    }

    const executarEnvio = (lat, lng) => {
      const formData = new FormData();
      formData.append('locacao_id', locacaoAtiva.id);
      formData.append('tipo', tipoEmergencia);
      formData.append('descricao', descricaoEmergencia);
      formData.append('latitude', lat);
      formData.append('longitude', lng);

      fetch('http://localhost:8000/api/emergencias', {
        method: 'POST',
        body: formData
      })
      .then(async (res) => {
        if (res.ok) {
          setMensagemFeedback({ tipo: 'sucesso', texto: 'SOS acionado! Localização enviada ao seguro.' });
          setDescricaoEmergencia('');
          carregarMinhasEmergencias();
        } else {
          const erroJson = await res.json();
          setMensagemFeedback({ tipo: 'erro', texto: erroJson.detail || 'Erro ao enviar SOS.' });
        }
      })
      .catch(() => setMensagemFeedback({ tipo: 'erro', texto: 'Erro de conexão com o servidor.' }));
    };

    if (navigator.geolocation) {
      setMensagemFeedback({ tipo: 'sucesso', texto: 'Obtendo localização GPS...' });
      navigator.geolocation.getCurrentPosition(
        (position) => {
          executarEnvio(position.coords.latitude.toString(), position.coords.longitude.toString());
        },
        () => {
          executarEnvio('-21.7633', '-41.3236');
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      executarEnvio('-21.7633', '-41.3236');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {minhasEmergencias.filter(e => e.status === 'AGUARDANDO_CLIENTE').map(em => (
        <div key={em.id} className="bg-amber-50 rounded-3xl p-5 shadow-[0_12px_32px_-22px_rgba(180,83,9,0.45)] flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="space-y-1.5">
            <span className="inline-block bg-amber-600 text-white text-xs font-semibold px-3 py-0.5 rounded-full">
              Confirmação solicitada
            </span>
            <h3 className="text-sm font-bold text-amber-900">
              A equipe de socorro informou que o atendimento foi concluído!
            </h3>
            <p className="text-xs text-amber-700">
              Chamado #{em.id} ({em.tipo}) • Confirme que você foi socorrido para encerrar o protocolo.
            </p>
          </div>
          <button
            onClick={() => handleConfirmarAtendimento(em.id)}
            className="w-full sm:w-auto bg-[#0066cc] hover:bg-[#0052a3] text-white text-sm font-semibold px-6 py-2.5 rounded-full transition whitespace-nowrap"
          >
            Confirmar que fui atendido
          </button>
        </div>
      ))}

      <section className="bg-white rounded-3xl p-6 shadow-[0_12px_32px_-22px_rgba(15,23,42,0.35)]">
        <div className="mb-6 flex items-start gap-3">
          <span className="mt-1 h-3 w-3 shrink-0 rounded-full bg-rose-500" />
          <div>
            <h2 className="text-lg font-bold text-rose-600">Solicitar emergência</h2>
            <p className="text-sm text-slate-500">Sua localização GPS será enviada automaticamente à agência.</p>
          </div>
        </div>

        <form onSubmit={enviarSos} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-600">Tipo de ocorrência</label>
            <select
              value={tipoEmergencia}
              onChange={(e) => setTipoEmergencia(e.target.value)}
              className={CAMPO}
            >
              <option value="ACIDENTE">Acidente rodoviário</option>
              <option value="PANE_MECANICA">Pane mecânica</option>
              <option value="ROUBO">Roubo / furto</option>
              <option value="OUTRO">Outro motivo</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-600">Descrição (opcional)</label>
            <textarea
              rows="3"
              placeholder="Descreva brevemente o que aconteceu..."
              value={descricaoEmergencia}
              onChange={(e) => setDescricaoEmergencia(e.target.value)}
              className={CAMPO}
            ></textarea>
          </div>

          <button
            type="submit"
            className="w-full bg-rose-600 hover:bg-rose-700 text-white font-semibold py-3 rounded-full text-sm transition shadow-[0_10px_24px_-12px_rgba(225,29,72,0.7)] mt-2"
          >
            Enviar alerta
          </button>
        </form>

        {minhasEmergencias.length > 0 && (
          <div className="mt-8 pt-6 border-t border-slate-100 space-y-3">
            <h3 className="text-sm font-bold text-slate-800">Histórico de chamados SOS</h3>
            <div className="space-y-2">
              {minhasEmergencias.map(item => (
                <div key={item.id} className="bg-[#f4f7fb] rounded-2xl p-4 flex justify-between items-center gap-3 text-xs">
                  <div>
                    <p className="font-bold text-slate-900">Chamado #{item.id} • {item.tipo}</p>
                    <p className="text-slate-500 mt-0.5">Data: {item.data_hora} {item.protocolo_seguro && `• Seguro: ${item.protocolo_seguro}`}</p>
                  </div>
                  <span className={`shrink-0 px-3 py-1 rounded-full text-[11px] font-semibold ${
                    item.status === 'ABERTO' ? 'bg-rose-100 text-rose-700' :
                    item.status === 'EM_ATENDIMENTO' ? 'bg-blue-100 text-blue-700' :
                    item.status === 'AGUARDANDO_CLIENTE' ? 'bg-amber-100 text-amber-800' :
                    'bg-emerald-100 text-emerald-700'
                  }`}>
                    {item.status === 'ABERTO' ? 'Aberto' :
                     item.status === 'EM_ATENDIMENTO' ? 'Em atendimento' :
                     item.status === 'AGUARDANDO_CLIENTE' ? 'Aguardando sua confirmação' :
                     'Resolvido'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}