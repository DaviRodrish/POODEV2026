import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export function AgenciaDashboard() {
  const [frota, setFrota] = useState([]);
  const [novoVeiculo, setNovoVeiculo] = useState({
    placa: '',
    marca_codigo: '1', // Código FIPE de exemplo
    modelo_codigo: '1',
    ano_codigo: '2024-1',
    valor_diaria: 150.0
  });

  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  // Obtém os dados da agência logada a partir do contexto ou do localStorage
  const agenciaLogada = user || JSON.parse(localStorage.getItem('user')) || { nome: 'Agência', id: 1 };

  useEffect(() => {
    carregarFrota();
  }, []);

  const carregarFrota = () => {
    fetch('http://localhost:8000/api/catalogo/veiculos')
      .then(res => res.json())
      .then(data => setFrota(data))
      .catch(err => console.error("Erro ao carregar frota", err));
  };

  const handleCadastrarVeiculo = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('placa', novoVeiculo.placa);
    formData.append('marca_codigo', novoVeiculo.marca_codigo);
    formData.append('modelo_codigo', novoVeiculo.modelo_codigo);
    formData.append('ano_codigo', novoVeiculo.ano_codigo);
    formData.append('valor_diaria', novoVeiculo.valor_diaria);

    try {
      const response = await fetch(`http://localhost:8000/api/agencias/${agenciaLogada.id}/veiculos`, {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      if (response.ok) {
        alert("Veículo integrado com FIPE e adicionado à frota com sucesso!");
        carregarFrota();
        setNovoVeiculo({ placa: '', marca_codigo: '1', modelo_codigo: '1', ano_codigo: '2024-1', valor_diaria: 150.0 });
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

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Barra superior de navegação com o nome da agência logada */}
      <nav className="bg-white shadow px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <span className="bg-emerald-600 text-white font-bold p-2 rounded-lg text-sm">Agência</span>
          <h1 className="text-xl font-bold text-gray-800">Painel de Gestão da Agência</h1>
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
        {/* Formulário para Cadastrar Veículo na Frota integrado com FIPE */}
        <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Adicionar Novo Veículo à Frota (Integração FIPE)</h2>
          <form onSubmit={handleCadastrarVeiculo} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Placa</label>
              <input 
                type="text" 
                value={novoVeiculo.placa}
                onChange={e => setNovoVeiculo({...novoVeiculo, placa: e.target.value})}
                placeholder="ABC-1234"
                required
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valor da Diária (R$)</label>
              <input 
                type="number" 
                step="0.01"
                value={novoVeiculo.valor_diaria}
                onChange={e => setNovoVeiculo({...novoVeiculo, valor_diaria: e.target.value})}
                required
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="flex items-end">
              <button 
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-4 rounded-lg shadow-sm transition"
              >
                Cadastrar com FIPE
              </button>
            </div>
          </form>
        </section>

        {/* Gestão da Frota Atual */}
        <section>
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Frota Registrada</h2>
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
                {frota.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                      Nenhum veículo cadastrado na frota.
                    </td>
                  </tr>
                ) : (
                  frota.map(v => (
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