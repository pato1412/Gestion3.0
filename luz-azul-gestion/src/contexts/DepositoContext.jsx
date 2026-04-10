import { createContext, useContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import SelectDeposito from '../Pages/SelectDeposito/SelectDeposito';

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

  const value = {
    DepositoId,    
    Deposito,
    loading,
  };

  const handleDepositoSelected = (deposito) => {
    setDeposito(deposito);
  }

  return (    
    <DepositoContext.Provider value={value}>
        {Deposito === null && !loading ? <SelectDeposito onDepositoSelected={handleDepositoSelected}   /> : children}
    </DepositoContext.Provider>
  );
};