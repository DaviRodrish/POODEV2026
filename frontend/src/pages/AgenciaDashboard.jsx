import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export function AgenciaDashboard() {
  const [frota, setFrota] = useState([]);
  
  // Estados para os seletores do formulário de cadastro FIPE
  const [marcas, setMarcas] = useState([]);
  const [modelos, setModelos] = useState([]);
  const [anos, setAnos] = useState([]);

  const [marcaSelecionada, setMarcaSelecionada] = useState('');
  const [modeloSelecionado, setModeloSelecionado] = useState('');
  const [anoSelecionado, setAnoSelecionado] = useState('');
  const [placa, setPlaca] = useState('');
  const [valorDiaria, setValorDiaria] = useState(150.0);

  // Estado para filtrar a tabela de veículos por marca
  const [marcaFiltroTabela, setMarcaFiltroTabela] = useState('');

  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const agenciaLogada = user || JSON.parse(localStorage.getItem('user')) || { nome: 'Agência', id: 1 };

  useEffect(() => {
    carregarFrota();
    carregarMarcas();
  }, []);

  const carregarFrota = () => {
    fetch('http://localhost:8000/api/catalogo/veiculos')
      .then(res => res.json())
      .then(data => setFrota(data))
      .catch(err => console.error("Erro ao carregar frota", err));
  };

  const carregarMarcas = () => {
    fetch('http://localhost:8000/api/fipe/marcas')
      .then(res => res.json())
      .then(data => setMarcas(data || []))
      .catch(err => console.error("Erro ao carregar marcas FIPE", err));
  };

  const handleMarcaChange = (e) => {
    const codMarca = e.target.value;
    setMarcaSelecionada(codMarca);
    setModelos([]);
    setAnos([]);
    setModeloSelecionado('');
    setAnoSelecionado('');

    if (codMarca) {
      fetch(`http://localhost:8000/api/fipe/marcas/${codMarca}/modelos`)
        .then(res => res.json())
        .then(data => setModelos(data || []))
        .catch(err => console.error("Erro ao carregar modelos FIPE", err));
    }
  };

  const handleModeloChange = (e) => {
    const codModelo = e.target.value;
    setModeloSelecionado(codModelo);
    setAnos([]);
    setAnoSelecionado('');

    if (codModelo && marcaSelecionada) {
      fetch(`http://localhost:8000/api/fipe/marcas/${marcaSelecionada}/modelos/${codModelo}/anos`)
        .then(res => res.json())
        .then(data => setAnos(data || []))
        .catch(err => console.error("Erro ao carregar anos FIPE", err));
    }
  };

  const handleCadastrarVeiculo = async (e) => {
    e.preventDefault();
    if (!marcaSelecionada || !modeloSelecionado || !anoSelecionado) {
      alert("Por favor, selecione a Marca, Modelo e Ano da tabela FIPE.");
      return;
    }

    const formData = new FormData();
    formData.append('placa', placa);
    formData.append('marca_codigo', marcaSelecionada);
    formData.append('modelo_codigo', modeloSelecionado);
    formData.append('ano_codigo', anoSelecionado);
    formData.append('valor_diaria', valorDiaria);

    try {
      const response = await fetch(`http://localhost:8000/api/agencias/${agenciaLogada.id}/veiculos`, {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      if (response.ok) {
        alert("Veículo cadastrado e vinculado com sucesso à base oficial da FIPE!");
        carregarFrota();
        setPlaca('');
        setMarcaSelecionada('');
        setModeloSelecionado('');
        setAnoSelecionado('');
        setModelos([]);
        setAnos([]);
      } else {
        alert(data.detail || "Erro ao cadastrar veículo.");
      }
    } catch (err) {
      console.error(err);
      alert("Erro de conexão com o servidor.");
    }
  };

  const handleAtualizarCombustivel = async (veiculoId) => {
    const input = prompt("Informe o novo nível de combustível (0.0 a 1.0, ex: 1.0 para Cheio, 0.5 para Meio):", "1.0");
    if (input === null) return;
    const nivel = parseFloat(input);
    if (isNaN(nivel) || nivel < 0 || nivel > 1) {
      alert("Valor inválido! Digite um número entre 0.0 e 1.0.");
      return;
    }

    const formData = new FormData();
    formData.append('nivel', nivel);

    try {
      const res = await fetch(`http://localhost:8000/api/veiculos/${veiculoId}/combustivel`, {
        method: 'PUT',
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || "Combustível atualizado!");
        carregarFrota();
      } else {
        alert(data.detail || "Erro ao atualizar combustível.");
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao conectar com o servidor.");
    }
  };

  const handleRegistrarRevisao = async (veiculoId) => {
    if (!confirm("Confirmar que a revisão preventiva deste veículo foi realizada?")) return;

    try {
      const res = await fetch(`http://localhost:8000/api/veiculos/${veiculoId}/revisao`, {
        method: 'PUT'
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || "Revisão registrada com sucesso!");
        carregarFrota();
      } else {
        alert(data.detail || "Erro ao registrar revisão.");
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao conectar com o servidor.");
    }
  };

  const handleSair = () => {
    logout();
    navigate('/login');
  };

  // Filtra a frota com base na marca selecionada no filtro da tabela
  const frotaFiltrada = marcaFiltroTabela 
    ? frota.filter(v => v.marca && v.marca.toLowerCase() === marcaFiltroTabela.toLowerCase())
    : frota;

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Navbar Superior */}
      <nav className="bg-white shadow px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <span className="bg-emerald-600 text-white font-bold p-2 rounded-lg text-sm">Agência</span>
          <h1 className="text-xl font-bold text-gray-800">Painel de Gestão da Frota</h1>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-gray-900">{agenciaLogada.nome}</p>
            <p className="text-xs text-emerald-600 font-medium">Agência de Aluguel</p>
          </div>
          <div className="h-8 w-px bg-gray-200"></div>
          <button 
            onClick={handleSair}
            className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            Sair
          </button>
        </div>
      </nav>

      <div className="p-6 max-w-7xl mx-auto space-y-8">
        {/* Formulário Intuitivo com Dropdowns Dinâmicos */}
        <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold mb-2 text-gray-800">Adicionar Veículo à Frota</h2>
          <p className="text-sm text-gray-500 mb-6">Selecione os dados da FIPE para preencher automaticamente as especificações do veículo.</p>
          
          <form onSubmit={handleCadastrarVeiculo} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Seletor 1: Marca */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">1. Marca (FIPE)</label>
                <select
                  value={marcaSelecionada}
                  onChange={handleMarcaChange}
                  required
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="">Selecione a marca...</option>
                  {marcas.map(m => (
                    <option key={m.codigo} value={m.codigo}>{m.nome}</option>
                  ))}
                </select>
              </div>

              {/* Seletor 2: Modelo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">2. Modelo (FIPE)</label>
                <select
                  value={modeloSelecionado}
                  onChange={handleModeloChange}
                  disabled={!marcaSelecionada}
                  required
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white disabled:bg-gray-100"
                >
                  <option value="">{marcaSelecionada ? "Selecione o modelo..." : "Escolha a marca primeiro"}</option>
                  {modelos.map(m => (
                    <option key={m.codigo} value={m.codigo}>{m.nome}</option>
                  ))}
                </select>
              </div>

              {/* Seletor 3: Ano/Versão */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">3. Ano / Versão (FIPE)</label>
                <select
                  value={anoSelecionado}
                  onChange={e => setAnoSelecionado(e.target.value)}
                  disabled={!modeloSelecionado}
                  required
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white disabled:bg-gray-100"
                >
                  <option value="">{modeloSelecionado ? "Selecione o ano..." : "Escolha o modelo primeiro"}</option>
                  {anos.map(a => (
                    <option key={a.codigo} value={a.codigo}>{a.nome}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Placa do Veículo</label>
                <input 
                  type="text" 
                  value={placa}
                  onChange={e => setPlaca(e.target.value)}
                  placeholder="ex: KXX-9021"
                  required
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valor da Diária (R$)</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={valorDiaria}
                  onChange={e => setValorDiaria(e.target.value)}
                  required
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-end">
                <button 
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-4 rounded-lg shadow-sm transition"
                >
                  Cadastrar Veículo na Frota
                </button>
              </div>
            </div>
          </form>
        </section>

        {/* Tabela da Frota com Filtro por Marca */}
        <section>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
            <h2 className="text-xl font-semibold text-gray-800">Frota Cadastrada</h2>
            
            {/* Controlo de Filtro por Marca */}
            <div className="w-full md:w-72">
              <select
                value={marcaFiltroTabela}
                onChange={e => setMarcaFiltroTabela(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg bg-white text-sm focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Filtrar por marca (Todas)</option>
                {marcas.map(m => (
                  <option key={m.codigo} value={m.nome}>{m.nome}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Placa</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Marca / Modelo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ano</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Diária</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Combustível</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status / Revisão</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {frotaFiltrada.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                      Nenhum veículo encontrado para a marca selecionada.
                    </td>
                  </tr>
                ) : (
                  frotaFiltrada.map(v => {
                    const combustivelPct = Math.round((v.combustivel_nivel ?? 1.0) * 100);
                    const kmAtual = v.quilometragem || 0;
                    const kmLimite = v.km_rev || 10000;
                    const precisaRevisao = v.precisa_revisao || (kmAtual >= kmLimite);

                    return (
                      <tr key={v.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 font-mono">{v.placa}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{v.marca} {v.modelo}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{v.ano}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">R$ {v.valor_diaria}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-bold rounded-full ${
                            combustivelPct <= 25 ? 'bg-red-100 text-red-800' :
                            combustivelPct <= 50 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            ⛽ {combustivelPct}%
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {precisaRevisao ? (
                            <span className="px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 animate-pulse">
                              🔴 Revisão Obrigatória ({kmAtual}/{kmLimite} km)
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-emerald-100 text-emerald-800">
                              🟢 Em dia ({kmAtual}/{kmLimite} km)
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                          <button
                            onClick={() => handleAtualizarCombustivel(v.id)}
                            className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium py-1 px-2.5 rounded border border-blue-200 transition"
                            title="Atualizar nível de combustível na vistoria"
                          >
                            Vistoria Tanque
                          </button>
                          {precisaRevisao && (
                            <button
                              onClick={() => handleRegistrarRevisao(v.id)}
                              className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-1 px-2.5 rounded shadow-sm transition"
                              title="Registrar revisão realizada"
                            >
                              Fazer Revisão
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}