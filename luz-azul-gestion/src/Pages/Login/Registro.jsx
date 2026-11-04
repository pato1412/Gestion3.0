import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import './Login.css';
import { API_URLS, apiFetch } from '../../config/api';
import { useEstablecimiento } from '../../contexts/EstablecimientoContext';

const LARGO_MINIMO_CLAVE = 8;

// Registro de un usuario de un establecimiento Ayres. Queda pendiente hasta que lo aprueben en el configurador.
const RegistroPage = () => {
  const { establecimiento } = useEstablecimiento();
  const [datos, setDatos] = useState({ nombre: '', email: '', clave: '', repetir: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [registrado, setRegistrado] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (establecimiento?.PlataformaTempo !== 'AY') return <Navigate to="/login" />;

  const cambiar = (campo) => (e) => setDatos((prev) => ({ ...prev, [campo]: e.target.value }));

  const validar = () => {
    const nuevos = {};
    if (!datos.nombre.trim()) nuevos.nombre = 'El nombre es requerido';
    if (!/\S+@\S+\.\S+/.test(datos.email.trim())) nuevos.email = 'El email no es válido';
    if (datos.clave.length < LARGO_MINIMO_CLAVE) nuevos.clave = `La contraseña tiene que tener al menos ${LARGO_MINIMO_CLAVE} caracteres`;
    if (datos.repetir !== datos.clave) nuevos.repetir = 'Las contraseñas no coinciden';
    setErrors(nuevos);
    return Object.keys(nuevos).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError(null);
    if (!validar()) return;

    setIsSubmitting(true);
    try {
      const respuesta = await apiFetch(API_URLS.registrarUsuario, {
        method: 'POST',
        body: JSON.stringify({ Email: datos.email.trim(), NombreCompleto: datos.nombre.trim(), Password: datos.clave }),
      });
      if (respuesta?.bok) {
        setRegistrado(respuesta.message);
      } else {
        setServerError(respuesta?.message || 'No se pudo completar el registro.');
      }
    } catch {
      setServerError('No se pudo completar el registro. Intentá de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const campo = (id, etiqueta, tipo, autocompletar) => (
    <div className="form-group">
      <label htmlFor={id}>{etiqueta}</label>
      <input
        type={tipo}
        id={id}
        value={datos[id]}
        onChange={cambiar(id)}
        autoComplete={autocompletar}
        className={errors[id] ? 'error' : ''}
      />
      {errors[id] && <span className="error-message">{errors[id]}</span>}
    </div>
  );

  return (
    <div className="login-container">
      <div className="login-marca">
        <div className="login-logo">
          <img src="/images/logo-small.png" alt="Luz Azul" />
        </div>
        <h1 className="login-app">Gestión</h1>
      </div>
      <div className="login-card">
        <h2>Registrarme</h2>
        {registrado ? (
          <div className="login-form">
            <p className="login-aviso">{registrado}</p>
            <Link to="/login" className="login-enlace">Volver a iniciar sesión</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="login-form" noValidate>
            <p className="login-aviso">Establecimiento: {establecimiento.Descripcion}</p>
            {campo('nombre', 'Nombre y apellido', 'text', 'name')}
            {campo('email', 'Email', 'email', 'email')}
            {campo('clave', 'Contraseña', 'password', 'new-password')}
            {campo('repetir', 'Repetir contraseña', 'password', 'new-password')}
            <button type="submit" className="login-button" disabled={isSubmitting}>
              {isSubmitting ? 'Enviando...' : 'Registrarme'}
            </button>
            {serverError && <p className="error-message">{serverError}</p>}
            <Link to="/login" className="login-enlace">Ya tengo usuario</Link>
          </form>
        )}
      </div>
    </div>
  );
};

export default RegistroPage;
