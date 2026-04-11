import {useDeposito} from '../contexts/DepositoContext';
import Loader from './Loader/Loader';
import SelectDeposito from '../Pages/SelectDeposito/SelectDeposito';

const ProtectedDeposito = ({ children }) => {
  const { DepositoId, loading} = useDeposito();

  if (loading) {
    return <Loader message='Cargando...' />; // O un spinner
  }

  return DepositoId ? children : <SelectDeposito  />;
}

export default ProtectedDeposito