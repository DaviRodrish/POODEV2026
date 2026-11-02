import { Link } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export function CatalogoVeiculos() {
  const { authenticated } = useContext(AuthContext);

  // Exemplo simulado de veículos (depois podes puxar do teu backend Python /api/veiculos)
  const veiculosExemplo = [
    { id: 1, modelo: 'Fiat Pulse', ano: 2023, preco: 'R$ 120/dia' },
    { id: 2, modelo: 'Jeep Renegade', ano: 2022, preco: 'R$ 180/dia' },
    { id: 3, modelo: 'Toyota Corolla', ano: 2024, preco: 'R$ 220/dia' },
  ];

  const handleReservar = (veiculo) => {
    if (!authenticated) {
      alert('Precisas de fazer login para realizar uma reserva!');
      window.location.href = '/login';
      return;
    }
    alert(`Redirecionando para reservar o veículo: ${veiculo.modelo}`);
    // Lógica para avançar para a reserva
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>Catálogo de Veículos Disponíveis</h2>
        <Link to="/" style={{ textDecoration: 'none', color: '#007bff' }}>← Voltar para a Home</Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        {veiculosExemplo.map((carro) => (
          <div key={carro.id} style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '1.5rem', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <h3>{carro.modelo}</h3>
            <p>Ano: {carro.ano}</p>
            <p style={{ fontWeight: 'bold', color: '#28a745', fontSize: '1.2rem' }}>{carro.preco}</p>
            
            <button 
              onClick={() => handleReservar(carro)}
              style={{ marginTop: '1rem', width: '100%', padding: '0.5rem', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              Reservar Agora
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}