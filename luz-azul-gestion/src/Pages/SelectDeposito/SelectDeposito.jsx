import { useState, useEffect } from 'react';
import { API_URLS, apiFetch } from '../../config/api';
import Cookies from 'js-cookie';
import { Form } from 'react-bootstrap';
import Loader from '../../components/Loader/Loader';
// Mismo diseño que el ingreso
import '../Login/Login.css';
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
      /* Si el componente padre pasó una función para manejar la selección, la llamamos con el depósito seleccionado */
      if (handleDepositoSelected) handleDepositoSelected(deposito);
    }
  };

  if (loading) return <Loader message='Cargando depositos...' />;
  return (
    <div className='login-container'>
      <div className='login-marca'>
        <div className='login-logo'>
          <img src='/images/logo-small.png' alt='Luz Azul' />
        </div>
        <h1 className='login-app'>Gestión</h1>
      </div>
      <div className='login-card'>
        <h2>Seleccioná un depósito</h2>
        {error ? (
          <div className='alert alert-danger mb-0'>{error}</div>
        ) : (
          <Form.Select value={selectedId} onChange={handleSelect} aria-label='Depósito'>
            <option value='' disabled>Seleccioná...</option>
            {depositos.map((dep) => {
              const value = dep.DepositoId;
              const label = dep.Descripcion ?? `Depósito ${value}`;
              return (
                <option key={value} value={value}>
                  {label}
                </option>
              );
            })}
          </Form.Select>
        )}
      </div>
    </div>
  );
};

export default SelectDeposito;
