import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export function useClienteDashboard() {
  const [abaAtiva, setAbaAtiva] = useState('catalogo');
  const [veiculos, setVeiculos] = useState([]);
  const [minhasReservas, setMinhasReservas] = useState([]);
  const [minhasEmergencias, setMinhasEmergencias] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [mensagemFeedback, setMensagemFeedback] = useState('');
  const [diasReserva, setDiasReserva] = useState({});

  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const usuarioLogado = user || JSON.parse(localStorage.getItem('user')) || { id: 1, nome: 'Cliente', status: 'ATIVO' };
  const isBloqueado = (usuarioLogado.status || '').toUpperCase() === 'BLOQUEADO';

  const carregarCatalogo = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/catalogo/veiculos');
      if (res.ok) setVeiculos(await res.json());
    } catch (err) {
      console.error("Erro ao carregar veículos:", err);
    }
  };

  const carregarMinhasReservas = async () => {
    if (!usuarioLogado?.id) return;
    try {
      const res = await fetch(`http://localhost:8000/api/clientes/${usuarioLogado.id}/reservas`);
      if (res.ok) setMinhasReservas(await res.json());
    } catch (err) {
      console.error("Erro ao carregar reservas:", err);
    }
  };

  const carregarMinhasEmergencias = async () => {
    if (!usuarioLogado?.id) return;
    try {
      const res = await fetch(`http://localhost:8000/api/clientes/${usuarioLogado.id}/emergencias`);
      if (res.ok) setMinhasEmergencias(await res.json());
    } catch (err) {
      console.error("Erro ao carregar emergências:", err);
    }
  };

  useEffect(() => {
    if (!usuarioLogado?.id) return;
    setCarregando(true);
    Promise.all([carregarCatalogo(), carregarMinhasReservas(), carregarMinhasEmergencias()])
      .finally(() => setCarregando(false));

    const intervalo = setInterval(() => {
      carregarMinhasReservas();
      carregarMinhasEmergencias();
    }, 10000);

    return () => clearInterval(intervalo);
  }, [usuarioLogado?.id]);

  const handleSair = () => {
    logout();
    navigate('/login');
  };

  return {
    abaAtiva, setAbaAtiva,
    veiculos, minhasReservas, minhasEmergencias,
    carregando, mensagemFeedback, setMensagemFeedback,
    diasReserva, setDiasReserva,
    usuarioLogado, isBloqueado,
    carregarCatalogo, carregarMinhasReservas, carregarMinhasEmergencias,
    handleSair
  };
}