import { createContext, useContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { useNavigate, useLocation } from 'react-router-dom';

const DepositoContext = createContext();

export const useDeposito = () => {
  const context = useContext(DepositoContext);
  if (!context) {
    throw new Error('useDeposito debe ser utilizado dentro de un DepositoProvider');
  }
  return context;
};

export const DepositoProvider = ({ children }) => {
  const [DepositoId, setDepositoId] = useState(null);
  const [Deposito, setDeposito] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Verificar si hay un token o sesión guardada
    const cookieDepositoId = Cookies.get('DepositoId');
    const DepositoData = Cookies.get('DepositoData');
    if (cookieDepositoId) {
      setDepositoId(cookieDepositoId);
    }
    if (DepositoData) {
      setDeposito(JSON.parse(DepositoData));
    }
    setLoading(false);
  }, []);

  const handleDepositoSelected = (deposito) => {
    setDeposito(deposito);
    // Recarga la página para que los cambios se reflejen en todos los componentes
    if (location.pathname !== '/select-deposito') {
      navigate(0); // Recarga la página
    } else {
      navigate(-1); // Redirige a la página anterior si estamos en la selección de depósito para evitar recargar esa página innecesariamente
    } 
  }

  const value = {
    DepositoId,    
    Deposito,
    loading,
    handleDepositoSelected,
  };

  return (    
    <DepositoContext.Provider value={value}>
      {children}
    </DepositoContext.Provider>
  );
};