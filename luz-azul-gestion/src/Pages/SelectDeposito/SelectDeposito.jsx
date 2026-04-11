import { useState, useEffect } from 'react';
import { API_URLS, apiFetch } from '../../config/api';
import Cookies from 'js-cookie';
import Loader from '../../components/Loader/Loader';
import './SelectDeposito.css';
import { useDeposito } from '../../contexts/DepositoContext';

const SelectDeposito = () => {
  const [depositos, setDepositos] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /* Obtenemos la función para actualizar el depósito seleccionado desde el contexto */
  const {handleDepositoSelected} = useDeposito();

  useEffect(() => {
    const fetchDepositos = async () => {
      try {
        const userData = Cookies.get('userData');
        if (!userData) {
          setError('No se encontró información del usuario. Por favor, inicia sesión nuevamente.');
          setLoading(false);
          return;
        }
        const { id: usuarioId } = JSON.parse(userData);
        const url = API_URLS.getDepositosUsuario.replace('{usuarioId}', usuarioId); 
        const data = await apiFetch(url, {
          method: 'GET',
        });

        setDepositos(Array.isArray(data) ? data : []);
      } catch (err) {
        setError('Error al cargar depósitos');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDepositos();
  }, []);

  const handleSelect = (e) => {
    const id = e.target.value;
    setSelectedId(id);
    const deposito = depositos.find((dep) => String(dep.DepositoId) === String(id));
    if (deposito) {
      Cookies.set('DepositoId', deposito.DepositoId , { expires: 7 });
      Cookies.set('DepositoData', JSON.stringify(deposito), { expires: 7 });
      /* Si el componente padre pasó una función para manejar la selección, la llamamos con el depósito seleccionado */
      if (handleDepositoSelected) handleDepositoSelected(deposito);
    }
  };

  if (loading) return <Loader message='Cargando depositos...' />;
  if (error) return <div>{error}</div>;

  return (
    <div className="deposito-container">
      <div className="deposito-card">
        <img src="/images/logo-small.png" alt="Logo" className="login-logo" />
        <h2>Selecciona un Depósito</h2>
        <select value={selectedId} onChange={handleSelect}>
          <option value="">Selecciona...</option>
          {depositos.map((dep) => {
            const value = dep.DepositoId;
            const label = dep.Descripcion ?? `Depósito ${value}`;
            return (
              <option key={value} value={value}>
                {label}
              </option>
            );
          })}
        </select>
      </div>
    </div>
  );
};

export default SelectDeposito;
