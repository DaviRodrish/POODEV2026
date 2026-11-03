import { Link } from 'react-router-dom';

export function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between font-sans">
      {/* Cabeçalho */}
      <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <span className="bg-blue-600 text-white font-bold p-2 rounded-lg text-sm">Home</span>
          <span className="text-xl font-bold text-gray-800">Sistema de Aluguel</span>
        </div>
        <div className="space-x-4">
          <Link 
            to="/login" 
            className="text-gray-600 hover:text-blue-600 font-medium text-sm transition"
          >
            Entrar
          </Link>
          <Link 
            to="/cadastro" 
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow transition"
          >
            Criar Conta
          </Link>
        </div>
      </header>

      {/* Conteúdo Principal / Hero Section */}
      <main className="max-w-5xl mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6">
          Encontre o veículo ideal para a sua jornada
        </h1>
        <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
          Consulte a frota disponível diretamente das agências parceiras, faça reservas de forma rápida e segura.
        </p>
        
        <div className="flex justify-center gap-4">
          <Link 
            to="/veiculos" 
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-xl shadow-lg transition duration-200"
          >
            Ver Veículos Disponíveis
          </Link>
          <Link 
            to="/cadastro" 
            className="bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 font-semibold px-8 py-3 rounded-xl shadow-sm transition duration-200"
          >
            Cadastrar Agência ou Frota
          </Link>
        </div>
      </main>

      {/* Rodapé Limpo */}
      <footer className="bg-white border-t border-gray-200 py-6 text-center text-sm text-gray-500">
        <p>&copy; {new Date().getFullYear()} Sistema de Aluguel de Veículos. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}

export default Home;