import { createContext, useContext, useState } from 'react';
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
  // El depósito seleccionado se lee de las cookies al crear el estado (sin useEffect).
  const [DepositoId, setDepositoId] = useState(() => Cookies.get('DepositoId') ?? null);
  const [Deposito, setDeposito] = useState(() => {
    const DepositoData = Cookies.get('DepositoData');
    return DepositoData ? JSON.parse(DepositoData) : null;
  });
  const loading = false;
  const navigate = useNavigate();
  const location = useLocation();

  const handleDepositoSelected = (deposito) => {
    /* Guardamos el depósito seleccionado en cookies para que esté disponible en toda la aplicación, incluso después de recargar la página */
    Cookies.set('DepositoId', deposito.DepositoId , { expires: 7 });
    Cookies.set('DepositoData', JSON.stringify(deposito), { expires: 7 });

    setDeposito(deposito);
    setDepositoId(deposito.DepositoId);
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