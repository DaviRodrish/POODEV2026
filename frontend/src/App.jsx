import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { useContext } from 'react';

import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { CatalogoVeiculos } from './pages/CatalogoVeiculos';
import { MinhasLocacoes } from './pages/MinhasLocacoes';

function PrivateRoute({ children }) {
  const { authenticated, loading } = useContext(AuthContext);

  if (loading) return <p>A carregar...</p>;
  return authenticated ? children : <Navigate to="/login" />;
}

export function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/veiculos" element={<CatalogoVeiculos />} />
          <Route path="/login" element={<Login />} />
          <Route 
            path="/locacoes" 
            element={
              <PrivateRoute>
                <MinhasLocacoes />
              </PrivateRoute>
            } 
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;