import React, { useState, useEffect } from 'react';
import { API_URLS, apiFetch } from '../../config/api';
import Cookies from 'js-cookie';
import './SelectEstablecimiento.css';
import Loader from '../../components/Loader/Loader';

const SelectEstablecimiento = ({ onEstablecimientoSelected }) => {
  const [establecimientos, setEstablecimientos] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEstablecimientos = async () => {
      try {
        const data = await apiFetch(API_URLS.getEstablecimientos, {
        method: 'POST'
        });
        setEstablecimientos(data); // Asumiendo que data es un array de objetos con Id, GUID, Nombre, etc.
      } catch (err) {
        setError('Error al cargar establecimientos');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchEstablecimientos();
  }, []);

  const handleSelect = (e) => {
    const id = e.target.value;
    setSelectedId(id);
    const establecimiento = establecimientos.find(est => est.EstablecimientoId == id);
    if (establecimiento) {
      Cookies.set('EstablecimientoId', establecimiento.EstablecimientoIdId, { expires: 7 }); // Expira en 7 días
      Cookies.set('EstablecimientoGUID', establecimiento.EstablecimientoGUID, { expires: 7 });
      Cookies.set('EstablecimientoNombre', establecimiento.Descripcion, { expires: 7 });
      onEstablecimientoSelected(establecimiento);
    }
  };

  if (loading) return <Loader />;
  if (error) return <div>{error}</div>;

  return (
    <div className="establecimiento-container">
      <div className="establecimiento-card">
        <img src="/images/logo-small.png" alt="Logo" className="login-logo" />
        <h2>Selecciona un Establecimiento</h2>
        <select value={selectedId} onChange={handleSelect}>
          <option value="">Selecciona...</option>
          {establecimientos.map(est => (
            <option key={est.EstablecimientoId} value={est.EstablecimientoId}>{est.Descripcion}</option> // Asumiendo propiedades
          ))}
        </select>
      </div>
    </div>
  );
};

export default SelectEstablecimiento;