import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { API_BASE_URL } from '../services/api';

export function useAgenciaDashboard(propAgencia, propLogout) {
  const { user, logout } = useContext(AuthContext);
  const agenciaLogada = propAgencia || user;
  const onLogout = propLogout || logout;
  
  const [abaAtiva, setAbaAtiva] = useState('visao-geral');
  const [frota, setFrota] = useState([]);
  const [emergencias, setEmergencias] = useState([]);
  const [reservasPendentes, setReservasPendentes] = useState([]);
  const [manutencoes, setManutencoes] = useState([]);
  const [carregando, setCarregando] = useState(true);

  const [marcas, setMarcas] = useState([]);
  const [modelos, setModelos] = useState([]);
  const [anos, setAnos] = useState([]);
  const [placa, setPlaca] = useState('');
  const [marcaCodigo, setMarcaCodigo] = useState('');
  const [modeloCodigo, setModeloCodigo] = useState('');
  const [anoCodigo, setAnoCodigo] = useState('');
  const [valorDiaria, setValorDiaria] = useState('');
  const [mensagemFeedback, setMensagemFeedback] = useState('');

  const [modalVistoriaAberto, setModalVistoriaAberto] = useState(false);
  const [veiculoVistoria, setVeiculoVistoria] = useState(null);
  const [novoKmInput, setNovoKmInput] = useState('');
  const [novoCombustivelInput, setNovoCombustivelInput] = useState(1.0);
  const [erroVistoriaModal, setErroVistoriaModal] = useState('');
  const [salvandoVistoria, setSalvandoVistoria] = useState(false);

  useEffect(() => {
    if (!agenciaLogada?.id) return;
    carregarDadosIniciais();

    // [SOS 4/4] Polling (10s) busca emergencias em routers/emergencias.py
    const intervaloEmergencias = setInterval(() => {
      carregarEmergencias();
      carregarReservasPendentes();
    }, 10000);

    return () => clearInterval(intervaloEmergencias);
  }, [agenciaLogada?.id]);

  const carregarDadosIniciais = async () => {
    setCarregando(true);
    await Promise.all([
      carregarFrota(),
      carregarEmergencias(),
      carregarReservasPendentes(),
      carregarManutencoes(),
      carregarMarcasFipe()
    ]);
    setCarregando(false);
  };

  const carregarFrota = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/catalogo/veiculos`);
      if (res.ok) {
        const dados = await res.json();
        setFrota(dados.filter(v => v.agencia_id === agenciaLogada.id));
      }
    } catch (err) {
      console.error("Erro ao carregar frota:", err);
    }
  };

  const carregarEmergencias = async () => {
    if (!agenciaLogada?.id) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/agencias/${agenciaLogada.id}/emergencias`);
      if (res.ok) setEmergencias(await res.json());
    } catch (err) {
      console.error("Erro ao carregar emergências:", err);
    }
  };

  const carregarReservasPendentes = async () => {
    if (!agenciaLogada?.id) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/agencias/${agenciaLogada.id}/reservas-pendentes`);
      if (res.ok) setReservasPendentes(await res.json());
    } catch (err) {
      console.error("Erro ao carregar reservas pendentes:", err);
    }
  };

  const carregarManutencoes = async () => {
    if (!agenciaLogada?.id) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/agencias/${agenciaLogada.id}/manutencoes`);
      if (res.ok) setManutencoes(await res.json());
    } catch (err) {
      console.error("Erro ao carregar manutenções:", err);
    }
  };

  const gerenciarManutencao = async (veiculoId, acao, descricao, origem = 'REVISAO_KM') => {
    setMensagemFeedback('');
    const formData = new FormData();
    formData.append('acao', acao);
    formData.append('descricao', descricao);
    formData.append('origem', origem);

    try {
      const res = await fetch(`${API_BASE_URL}/api/veiculos/${veiculoId}/manutencao`, {
        method: 'PUT',
        body: formData
      });
      const dados = await res.json();

      if (res.ok) {
        setMensagemFeedback({ tipo: 'sucesso', texto: dados.mensagem });
        carregarFrota();
        carregarManutencoes();
        return true;
      } else {
        setMensagemFeedback({ tipo: 'erro', texto: dados.detail || 'Erro ao registrar manutenção.' });
        return false;
      }
    } catch (err) {
      setMensagemFeedback({ tipo: 'erro', texto: 'Erro de conexão com o servidor.' });
      return false;
    }
  };

  const responderReserva = async (reservaId, aprovar) => {
    const formData = new FormData();
    formData.append('aprovar', aprovar);
    try {
      const res = await fetch(`${API_BASE_URL}/api/reservas/${reservaId}/responder`, {
        method: 'PUT',
        body: formData
      });
      if (res.ok) {
        carregarReservasPendentes();
        carregarFrota();
      }
    } catch (err) {
      console.error("Erro ao responder reserva:", err);
    }
  };

  const abrirModalVistoria = (veiculo) => {
    setVeiculoVistoria(veiculo);
    setNovoKmInput(veiculo.quilometragem || 0);
    setNovoCombustivelInput(veiculo.combustivel_nivel ?? 1.0);
    setErroVistoriaModal('');
    setModalVistoriaAberto(true);
  };

  const fecharModalVistoria = () => {
    setModalVistoriaAberto(false);
    setVeiculoVistoria(null);
    setNovoKmInput('');
    setErroVistoriaModal('');
  };

  const handleSalvarVistoria = async (e, fotoOdometro = null, fotoVeiculo = null, onSucessoExtra = null) => {
    e.preventDefault();
    setErroVistoriaModal('');
    const kmAtual = veiculoVistoria?.quilometragem || 0;
    const kmInformado = parseFloat(novoKmInput);
    const combustivelInformado = parseFloat(novoCombustivelInput);

    if (isNaN(kmInformado) || kmInformado < kmAtual) {
      setErroVistoriaModal(`Quilometragem inválida: menor que a atual (${kmAtual} km).`);
      return;
    }

    if (isNaN(combustivelInformado) || combustivelInformado < 0 || combustivelInformado > 1) {
      setErroVistoriaModal('Nível de combustível inválido (entre 0% e 100%).');
      return;
    }

    setSalvandoVistoria(true);
    try {
      const formData = new FormData();
      formData.append('quilometragem', kmInformado);
      formData.append('combustivel_nivel', combustivelInformado);
      if (fotoOdometro) formData.append('foto_odometro', fotoOdometro);
      if (fotoVeiculo) formData.append('foto_veiculo', fotoVeiculo);

      const res = await fetch(`${API_BASE_URL}/api/veiculos/${veiculoVistoria.id}/vistoria`, {
        method: 'PUT',
        body: formData
      });

      if (res.ok) {
        fecharModalVistoria();
        if (onSucessoExtra) onSucessoExtra();
        carregarFrota();
        carregarManutencoes();
        setMensagemFeedback({ 
          tipo: 'sucesso', 
          texto: `Vistoria de ${veiculoVistoria.placa} concluída.` 
        });
      } else {
        const dadosErro = await res.json();
        setErroVistoriaModal(dadosErro.detail || 'Erro ao atualizar dados do veículo.');
      }
    } catch (err) {
      setErroVistoriaModal('Erro de conexão com o servidor.');
    } finally {
      setSalvandoVistoria(false);
    }
  };

  const atualizarStatusEmergencia = async (emergenciaId, novoStatus) => {
    try {
      const formData = new FormData();
      formData.append('novo_status', novoStatus);
      formData.append('status', novoStatus);

      const res = await fetch(`${API_BASE_URL}/api/emergencias/${emergenciaId}/status`, {
        method: 'PUT',
        body: formData
      });

      if (res.ok) {
        carregarEmergencias();
        setMensagemFeedback({ tipo: 'sucesso', texto: `Status da emergência #${emergenciaId} atualizado para ${novoStatus}!` });
      } else {
        const errJson = await res.json();
        const msgErro = typeof errJson.detail === 'string' ? errJson.detail : JSON.stringify(errJson.detail);
        setMensagemFeedback({ tipo: 'erro', texto: msgErro });
      }
    } catch (err) {
      setMensagemFeedback({ tipo: 'erro', texto: 'Erro de conexão com o servidor.' });
    }
  };

  const carregarMarcasFipe = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/fipe/marcas`);
      if (res.ok) setMarcas(await res.json());
    } catch (err) {
      console.error("Erro marcas FIPE:", err);
    }
  };

  const selecionarMarca = async (e) => {
    const codigo = e.target.value;
    setMarcaCodigo(codigo);
    setModelos([]);
    setAnos([]);
    setModeloCodigo('');
    setAnoCodigo('');
    if (!codigo) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/fipe/marcas/${codigo}/modelos`);
      if (res.ok) {
        const dados = await res.json();
        setModelos(dados.modelos || dados);
      }
    } catch (err) {
      console.error("Erro modelos FIPE:", err);
    }
  };

  const selecionarModelo = async (e) => {
    const codigo = e.target.value;
    setModeloCodigo(codigo);
    setAnos([]);
    setAnoCodigo('');
    if (!codigo) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/fipe/marcas/${marcaCodigo}/modelos/${codigo}/anos`);
      if (res.ok) setAnos(await res.json());
    } catch (err) {
      console.error("Erro anos FIPE:", err);
    }
  };

  const cadastrarVeiculo = async (e, fotoVeiculo = null) => {
    e.preventDefault();
    setMensagemFeedback('');

    const formData = new FormData();
    formData.append('placa', placa);
    formData.append('marca_codigo', marcaCodigo);
    formData.append('modelo_codigo', modeloCodigo);
    formData.append('ano_codigo', anoCodigo);
    formData.append('valor_diaria', valorDiaria);
    if (fotoVeiculo) {
      formData.append('foto', fotoVeiculo);
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/agencias/${agenciaLogada.id}/veiculos`, {
        method: 'POST',
        body: formData
      });
      const dados = await res.json();

      if (res.ok) {
        setMensagemFeedback({ tipo: 'sucesso', texto: dados.message });
        setPlaca('');
        setValorDiaria('');
        carregarFrota();
      } else {
        setMensagemFeedback({ tipo: 'erro', texto: dados.detail || 'Erro ao cadastrar veículo.' });
      }
    } catch (err) {
      setMensagemFeedback({ tipo: 'erro', texto: 'Erro de conexão com o servidor.' });
    }
  };

  return {
    agenciaLogada, onLogout,
    abaAtiva, setAbaAtiva,
    frota, emergencias, reservasPendentes, manutencoes, carregando,
    marcas, modelos, anos,
    placa, setPlaca, marcaCodigo, modeloCodigo, anoCodigo, setAnoCodigo,
    valorDiaria, setValorDiaria, mensagemFeedback,setMensagemFeedback,
    modalVistoriaAberto, veiculoVistoria, novoKmInput, setNovoKmInput,
    novoCombustivelInput, setNovoCombustivelInput, erroVistoriaModal, salvandoVistoria,
    selecionarMarca, selecionarModelo, cadastrarVeiculo,
    responderReserva, abrirModalVistoria, fecharModalVistoria, handleSalvarVistoria,
    atualizarStatusEmergencia, gerenciarManutencao
  };
}