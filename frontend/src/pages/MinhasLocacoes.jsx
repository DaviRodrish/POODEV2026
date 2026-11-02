import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';

export function MinhasLocacoes() {
  const { user, logout } = useContext(AuthContext);

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid #eaeaea', paddingBottom: '1rem' }}>
        <h2>Painel do Cliente - Minhas Locações</h2>
        <div>
          <span style={{ marginRight: '1rem' }}>Olá, {user?.nome || 'Utilizador'}</span>
          <button onClick={logout} style={{ padding: '0.4rem 0.8rem', backgroundColor: '#dc3545', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Sair
          </button>
        </div>
      </header>

      <main>
        <p>Aqui vais ver o histórico e o estado das locações associadas à tua conta.</p>
        <div style={{ marginTop: '2rem' }}>
          <Link to="/veiculos" style={{ color: '#007bff', textDecoration: 'none' }}>Ver mais veículos</Link>
        </div>
      </main>
    </div>
  );
}