import { Link } from 'react-router-dom';

export function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between font-sans">
      {/* Header */}
      <header className="bg-white shadow-sm py-4 px-6 md:px-12 flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-600 flex items-center gap-2">
          🚗 RentCar UENF
        </h1>
        <nav className="flex items-center gap-4">
          <Link to="/veiculos" className="text-gray-600 hover:text-blue-600 font-medium transition">
            Ver Veículos
          </Link>
          <Link to="/login" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium shadow transition">
            Entrar
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-12 max-w-4xl mx-auto">
        <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider mb-4">
          Sistema Académico POO 2026
        </span>
        <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight mb-6">
          Encontre o carro perfeito para a sua viagem
        </h2>
        <p className="text-lg text-gray-600 mb-8 max-w-2xl">
          Explore a nossa frota completa integrada com dados da tabela FIPE e faça locações de forma rápida e segura.
        </p>
        
        <div className="flex flex-wrap justify-center gap-4">
          <Link to="/veiculos" className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-semibold shadow-md transition text-lg">
            Explorar Catálogo
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6 text-center text-sm text-gray-500">
        Desenvolvido no âmbito da disciplina de Programação Orientada a Objetos - UENF.
      </footer>
    </div>
  );
}