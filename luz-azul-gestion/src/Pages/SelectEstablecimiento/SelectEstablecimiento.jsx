import { useEffect } from 'react';
import { Form } from 'react-bootstrap';
import Loader from '../../components/Loader/Loader';
import { useEstablecimiento } from '../../contexts/EstablecimientoContext';
// Mismo diseño que el ingreso
import '../Login/Login.css';

const SelectEstablecimiento = () => {
  const { establecimientos, loading, error, handleEstablecimientoSelected, fetchEstablecimientos } = useEstablecimiento();

  useEffect(() => {
    fetchEstablecimientos();
  }, [fetchEstablecimientos]);

  const handleSelect = (e) => {
    const id = e.target.value;
    const establecimiento = establecimientos.find((est) => String(est.EstablecimientoId) === id);
    if (establecimiento) {
      handleEstablecimientoSelected(establecimiento);
    }
  };

  if (loading) return <Loader message='Cargando establecimientos...' />;

  return (
    <div className='login-container'>
      <div className='login-marca'>
        <div className='login-logo'>
          <img src='/images/logo-small.png' alt='Luz Azul' />
        </div>
        <h1 className='login-app'>Gestión</h1>
      </div>
      <div className='login-card'>
        <h2>Seleccioná un establecimiento</h2>
        {error ? (
          <div className='alert alert-danger mb-0'>{error}</div>
        ) : (
          <Form.Select defaultValue='' onChange={handleSelect} aria-label='Establecimiento'>
            <option value='' disabled>Seleccioná...</option>
            {establecimientos.map((est) => (
              <option key={est.EstablecimientoId} value={est.EstablecimientoId}>{est.Descripcion}</option>
            ))}
          </Form.Select>
        )}
      </div>
    </div>
  );
};

export default SelectEstablecimiento;
