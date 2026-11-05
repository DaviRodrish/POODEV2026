import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export function AgenciaDashboard() {
  const [frota, setFrota] = useState([]);
  
  // Estados para os seletores do formulário de cadastro
  const [marcas, setMarcas] = useState([]);
  const [modelos, setModelos] = useState([]);
  const [anos, setAnos] = useState([]);

  const [marcaSelecionada, setMarcaSelecionada] = useState('');
  const [modeloSelecionado, setModeloSelecionado] = useState('');
  const [anoSelecionado, setAnoSelecionado] = useState('');
  const [placa, setPlaca] = useState('');
  const [valorDiaria, setValorDiaria] = useState(150.0);

  // Estado para filtrar a tabela de veículos
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

  const handleSair = () => {
    logout();
    navigate('/login');
  };

  // Filtra a frota com base na marca selecionada no filtro da tabela
  const frotaFiltrada = marcaFiltroTabela 
    ? frota.filter(v => v.marca.toLowerCase() === marcaFiltroTabela.toLowerCase())
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor Diária</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {frotaFiltrada.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                      Nenhum veículo encontrado para a marca selecionada.
                    </td>
                  </tr>
                ) : (
                  frotaFiltrada.map(v => (
                    <tr key={v.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 font-mono">{v.placa}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{v.marca} {v.modelo}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{v.ano}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">R$ {v.valor_diaria}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className="px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-emerald-100 text-emerald-800">
                          {v.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}