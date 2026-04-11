import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Loader from './Loader/Loader';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <Loader message='Cargando...' />; // O un spinner
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
};

export default ProtectedRoute;