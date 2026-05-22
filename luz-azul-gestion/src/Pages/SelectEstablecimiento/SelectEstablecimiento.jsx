import React, { useState, useEffect } from 'react';
import { API_URLS, apiFetch } from '../../config/api';
import Cookies from 'js-cookie';
import './SelectEstablecimiento.css';
import Loader from '../../components/Loader/Loader';
import { useEstablecimiento } from '../../contexts/EstablecimientoContext';

const SelectEstablecimiento = () => {
  const {establecimientoId, establecimientos, loading, error, handleEstablecimientoSelected, fetchEstablecimientos } = useEstablecimiento();

  useEffect(() => {
    fetchEstablecimientos();
  }, []);

  const handleSelect = (e) => {
    const id = e.target.value;
    const establecimiento = establecimientos.find(est => est.EstablecimientoId == id);
    if (establecimiento) {
      handleEstablecimientoSelected(establecimiento);
    }
  };

  if (loading) return <Loader />;
  if (error) return <div>{error}</div>;

  return (
    <div className="establecimiento-container">
      <div className="establecimiento-card">
        <img src="/images/logo-small.png" alt="Logo" className="login-logo" />
        <h2>Selecciona un Establecimiento</h2>
        <select value={establecimientoId} onChange={handleSelect}>
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