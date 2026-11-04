import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Loader from './Loader/Loader';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();
  const { pathname } = useLocation();

  if (loading) {
    return <Loader message='Cargando...' />; // O un spinner
  }

  if (!isAuthenticated) return <Navigate to="/login" />;

  // Entró con una clave temporal: no puede seguir hasta cambiarla
  if (user?.DebeCambiarClave && pathname !== '/cambiar-clave') return <Navigate to="/cambiar-clave" />;

  return children;
};

export default ProtectedRoute;