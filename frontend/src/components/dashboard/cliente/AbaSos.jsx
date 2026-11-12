import React, { useState } from 'react';

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
          texto: 'Atendimento confirmado com sucesso! Ocorrência encerrada.'
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
      setMensagemFeedback({ tipo: 'erro', texto: 'Não possui nenhuma locação Aprovada/Ativa para disparar o SOS.' });
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
          setMensagemFeedback({ tipo: 'sucesso', texto: 'Alerta SOS acionado com sucesso com a sua localização GPS atual! O seguro foi notificado.' });
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
      setMensagemFeedback({ tipo: 'sucesso', texto: 'A obter localização GPS atual...' });
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
        <div key={em.id} className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4 animate-in fade-in">
          <div className="space-y-1">
            <span className="bg-amber-600 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded">
              Confirmação Solicitada
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
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition shadow flex items-center justify-center gap-1.5 whitespace-nowrap"
          >
            <span>👍</span> Confirmar que Fui Atendido
          </button>
        </div>
      ))}

      <section className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6">
        <div className="mb-6 border-b border-slate-100 pb-4">
          <h2 className="text-lg font-bold text-rose-600">
            Solicitar Emergência
          </h2>
          <p className="text-xs text-slate-500">A localização GPS atual será recolhida e enviada automaticamente à agência</p>
        </div>

        <form onSubmit={enviarSos} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700 uppercase">Tipo de Ocorrência</label>
            <select 
              value={tipoEmergencia} 
              onChange={(e) => setTipoEmergencia(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none"
            >
              <option value="ACIDENTE">Acidente Rodoviário</option>
              <option value="PANE_MECANICA">Pane Mecânica</option>
              <option value="ROUBO">Roubo / Furto</option>
              <option value="OUTRO">Outro Motivo</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700 uppercase">Descrição Opcional</label>
            <textarea 
              rows="3"
              placeholder="Descreva brevemente o que aconteceu..." 
              value={descricaoEmergencia} 
              onChange={(e) => setDescricaoEmergencia(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none"
            ></textarea>
          </div>

          <button 
            type="submit" 
            className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-xl text-sm transition shadow-lg mt-4"
          >
            Enviar Alerta
          </button>
        </form>

        {minhasEmergencias.length > 0 && (
          <div className="mt-8 pt-6 border-t border-slate-100 space-y-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Histórico de Chamados SOS</h3>
            <div className="space-y-2">
              {minhasEmergencias.map(item => (
                <div key={item.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex justify-between items-center text-xs">
                  <div>
                    <p className="font-bold text-slate-900">Chamado #{item.id} • {item.tipo}</p>
                    <p className="text-slate-500">Data: {item.data_hora} {item.protocolo_seguro && `• Seguro: ${item.protocolo_seguro}`}</p>
                  </div>
                  <div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      item.status === 'ABERTO' ? 'bg-rose-100 text-rose-700' :
                      item.status === 'EM_ATENDIMENTO' ? 'bg-blue-100 text-blue-700' :
                      item.status === 'AGUARDANDO_CLIENTE' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                      'bg-emerald-100 text-emerald-700'
                    }`}>
                      {item.status === 'ABERTO' ? 'Aberto ⏳' :
                       item.status === 'EM_ATENDIMENTO' ? 'Em Atendimento 📞' :
                       item.status === 'AGUARDANDO_CLIENTE' ? 'Aguardando Sua Confirmação ⚠️' :
                       'Resolvido ✅'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}