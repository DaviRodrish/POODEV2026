import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createWorker } from 'tesseract.js';

export function Cadastro() {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    cpf: '',
    cnpj: '',
    tipoPerfil: 'cliente',
    cnh: '',
    endereco: '',
    senha: ''
  });
  
  const [fotoCnh, setFotoCnh] = useState(null);
  const [cnhValidadaPorOCR, setCnhValidadaPorOCR] = useState(false);
  const [statusOcr, setStatusOcr] = useState({ texto: '', tipo: '' });
  const [erro, setErro] = useState('');
  const [loadingOcr, setLoadingOcr] = useState(false);
  
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Função para processar a imagem da CNH com o Tesseract.js (apenas para motorista)
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFotoCnh(file);

    if (!formData.nome || !formData.cnh) {
      setStatusOcr({
        texto: "Preencha o Nome e o número da CNH antes de enviar a imagem.",
        tipo: "error"
      });
      e.target.value = "";
      return;
    }

    setLoadingOcr(true);
    setStatusOcr({ texto: "Lendo imagem da CNH com OCR... Aguarde.", tipo: "info" });

    try {
      const worker = await createWorker('por');
      const ret = await worker.recognize(file);
      await worker.terminate();

      const textoDetectado = ret.data.text.toUpperCase();
      const primeiroNome = formData.nome.trim().split(' ')[0].toUpperCase();
      const numeroCnh = formData.cnh.trim();

      const nomeMatch = textoDetectado.includes(primeiroNome);
      const cnhMatch = textoDetectado.includes(numeroCnh);

      if (nomeMatch || cnhMatch) {
        setCnhValidadaPorOCR(true);
        setStatusOcr({
          texto: "✓ OCR verificado com sucesso! Os dados conferem.",
          tipo: "success"
        });
      } else {
        setCnhValidadaPorOCR(false);
        setStatusOcr({
          texto: "⚠️ Atenção: Não conseguimos validar o Nome/CNH no documento. Verifique a imagem.",
          tipo: "error"
        });
      }
    } catch (error) {
      console.error(error);
      setCnhValidadaPorOCR(false);
      setStatusOcr({
        texto: "Erro ao processar imagem da CNH.",
        tipo: "error"
      });
    } finally {
      setLoadingOcr(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    const dataToSend = new FormData();

    // Lógica específica para Agência
    if (formData.tipoPerfil === 'agencia') {
      dataToSend.append('nome', formData.nome);
      dataToSend.append('email', formData.email);
      dataToSend.append('cnpj', formData.cnpj);
      dataToSend.append('senha', formData.senha);
      dataToSend.append('endereco', formData.endereco);

      try {
        const response = await fetch(`${apiUrl}/api/cadastro-agencia`, {
          method: 'POST',
          body: dataToSend 
        });

        const resJson = await response.json();
        if (response.ok) {
          alert("Agência cadastrada com sucesso!");
          navigate('/login');
        } else {
          setErro(resJson.detail || "Erro ao realizar o cadastro da agência.");
        }
      } catch (err) {
        console.error(err);
        setErro("Falha na conexão com o servidor.");
      }
      return;
    }

    // Lógica para Cliente / Motorista
    if (formData.tipoPerfil === 'motorista' && !cnhValidadaPorOCR) {
      const confirmar = window.confirm("O OCR não pôde confirmar 100% dos dados. Deseja enviar para validação manual?");
      if (!confirmar) return;
    }

    dataToSend.append('nome', formData.nome);
    dataToSend.append('email', formData.email);
    dataToSend.append('cpf', formData.cpf);
    dataToSend.append('tipoPerfil', formData.tipoPerfil);
    dataToSend.append('senha', formData.senha);

    if (formData.tipoPerfil === 'motorista') {
      dataToSend.append('cnh', formData.cnh);
      if (fotoCnh) {
        dataToSend.append('fotoCnh', fotoCnh);
      }
    }

    try {
      const response = await fetch(`${apiUrl}/api/cadastro`, {
        method: 'POST',
        body: dataToSend 
      });

      const resJson = await response.json();
      if (response.ok) {
        alert("Cadastro realizado com sucesso!");
        navigate('/login');
      } else {
        setErro(resJson.detail || resJson.message || "Erro ao realizar o cadastro.");
      }
    } catch (err) {
      console.error(err);
      setErro("Falha na conexão com o servidor.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4 py-8 font-sans">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Criar Nova Conta</h2>
          <p className="text-sm text-gray-500 mt-1">Preencha os campos abaixo para se cadastrar</p>
        </div>

        {erro && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {erro}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {formData.tipoPerfil === 'agencia' ? 'Nome da Agência' : 'Nome Completo'}
            </label>
            <input 
              type="text" 
              name="nome"
              value={formData.nome} 
              onChange={handleChange} 
              placeholder={formData.tipoPerfil === 'agencia' ? 'Nome da empresa' : 'Digite seu nome completo'}
              required 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
            <input 
              type="email" 
              name="email"
              value={formData.email} 
              onChange={handleChange} 
              placeholder="seu@email.com"
              required 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
            />
          </div>

          {/* Campo CPF (apenas para cliente/motorista) */}
          {formData.tipoPerfil !== 'agencia' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CPF</label>
              <input 
                type="text" 
                name="cpf"
                value={formData.cpf} 
                onChange={handleChange} 
                maxLength="11"
                placeholder="Apenas números"
                required 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
              />
            </div>
          )}

          {/* Campo CNPJ (apenas para agência) */}
          {formData.tipoPerfil === 'agencia' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CNPJ</label>
              <input 
                type="text" 
                name="cnpj"
                value={formData.cnpj} 
                onChange={handleChange} 
                maxLength="14"
                placeholder="Apenas números"
                required 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Perfil</label>
            <select 
              name="tipoPerfil"
              value={formData.tipoPerfil} 
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition bg-white"
            >
              <option value="cliente">Cliente / Usuário Padrão</option>
              <option value="motorista">Motorista</option>
              <option value="agencia">Agência de Aluguel</option>
            </select>
          </div>

          {/* Seção Dinâmica para Motorista */}
          {formData.tipoPerfil === 'motorista' && (
            <div className="p-4 bg-gray-50 border border-dashed border-gray-300 rounded-lg space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Número da CNH</label>
                <input 
                  type="text" 
                  name="cnh"
                  value={formData.cnh} 
                  onChange={handleChange} 
                  placeholder="Número do documento CNH"
                  required 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Upload da Imagem da CNH</label>
                <input 
                  type="file" 
                  accept="image/png, image/jpeg"
                  onChange={handleFileChange}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>

              {statusOcr.texto && (
                <p className={`text-xs font-semibold mt-1 ${
                  statusOcr.tipo === 'success' ? 'text-green-600' :
                  statusOcr.tipo === 'error' ? 'text-red-600' : 'text-blue-600'
                }`}>
                  {statusOcr.texto}
                </p>
              )}
            </div>
          )}

          {/* Seção Dinâmica para Agência */}
          {formData.tipoPerfil === 'agencia' && (
            <div className="p-4 bg-gray-50 border border-dashed border-gray-300 rounded-lg space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Endereço da Agência</label>
                <input 
                  type="text" 
                  name="endereco"
                  value={formData.endereco} 
                  onChange={handleChange} 
                  placeholder="Rua, Número, Bairro, Cidade"
                  required 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition bg-white"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
            <input 
              type="password" 
              name="senha"
              value={formData.senha} 
              onChange={handleChange} 
              placeholder="••••••••"
              required 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
            />
          </div>

          <button 
            type="submit" 
            disabled={loadingOcr}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-lg shadow transition duration-200 mt-2"
          >
            {loadingOcr ? 'Processando OCR...' : 'Cadastrar'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link to="/login" className="text-sm text-blue-600 hover:underline font-medium">
            ← Já tem uma conta? Faça login
          </Link>
        </div>
      </div>
    </div>
  );
}