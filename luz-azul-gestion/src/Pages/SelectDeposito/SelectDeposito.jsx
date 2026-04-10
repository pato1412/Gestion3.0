import React, { useState, useEffect } from 'react';
import { API_URLS, apiFetch } from '../../config/api';
import Cookies from 'js-cookie';
import Loader from '../../components/Loader/Loader';
import './SelectDeposito.css';

const SelectDeposito = ({ onDepositoSelected }) => {
  const [depositos, setDepositos] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDepositos = async () => {
      try {
        const userData = Cookies.get('userData');
        debugger;
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
    const deposito = depositos.find((dep) => String(dep.DepositoId) === String(id) || String(dep.Id) === String(id));
    if (deposito) {
      Cookies.set('DepositoId', deposito.DepositoId ?? deposito.Id, { expires: 7 });
      Cookies.set('DepositoGUID', deposito.DepositoGUID ?? deposito.GUID ?? '', { expires: 7 });
      Cookies.set('DepositoNombre', deposito.Descripcion ?? deposito.Nombre ?? '', { expires: 7 });
      if (onDepositoSelected) onDepositoSelected(deposito);
    }
  };

  if (loading) return <Loader />;
  if (error) return <div>{error}</div>;

  return (
    <div className="establecimiento-container">
      <div className="establecimiento-card">
        <img src="/images/logo-small.png" alt="Logo" className="login-logo" />
        <h2>Selecciona un Depósito</h2>
        <select value={selectedId} onChange={handleSelect}>
          <option value="">Selecciona...</option>
          {depositos.map((dep) => {
            const value = dep.DepositoId ?? dep.Id;
            const label = dep.Descripcion ?? dep.Nombre ?? dep.DepositoNombre ?? `Depósito ${value}`;
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
