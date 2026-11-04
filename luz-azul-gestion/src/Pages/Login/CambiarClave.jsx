import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Login.css';
import { API_URLS, apiFetch } from '../../config/api';
import { useAuth } from '../../contexts/AuthContext';

const LARGO_MINIMO_CLAVE = 8;

// Cambio de contraseña de los usuarios de Ayres. Es obligatorio después de un reseteo (clave temporal).
const CambiarClavePage = () => {
  const { user, actualizarUsuario, logout } = useAuth();
  const navigate = useNavigate();
  const [datos, setDatos] = useState({ actual: '', nueva: '', repetir: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const obligatorio = Boolean(user?.DebeCambiarClave);

  const cambiar = (campo) => (e) => setDatos((prev) => ({ ...prev, [campo]: e.target.value }));

  const validar = () => {
    const nuevos = {};
    if (!datos.actual) nuevos.actual = 'Ingresá tu contraseña actual';
    if (datos.nueva.length < LARGO_MINIMO_CLAVE) nuevos.nueva = `La contraseña tiene que tener al menos ${LARGO_MINIMO_CLAVE} caracteres`;
    if (datos.repetir !== datos.nueva) nuevos.repetir = 'Las contraseñas no coinciden';
    setErrors(nuevos);
    return Object.keys(nuevos).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError(null);
    if (!validar()) return;

    setIsSubmitting(true);
    try {
      const respuesta = await apiFetch(API_URLS.cambiarClaveUsuario, {
        method: 'POST',
        body: JSON.stringify({ Email: user.email, PasswordActual: datos.actual, PasswordNueva: datos.nueva }),
      });
      if (respuesta?.bok) {
        actualizarUsuario({ DebeCambiarClave: false });
        navigate('/');
      } else {
        setServerError(respuesta?.message || 'No se pudo cambiar la contraseña.');
      }
    } catch {
      setServerError('No se pudo cambiar la contraseña. Intentá de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const campo = (id, etiqueta, autocompletar) => (
    <div className="form-group">
      <label htmlFor={id}>{etiqueta}</label>
      <input
        type="password"
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
        <h2>Cambiar contraseña</h2>
        <form onSubmit={handleSubmit} className="login-form" noValidate>
          {obligatorio && <p className="login-aviso">Ingresaste con una contraseña temporal: elegí una nueva para continuar.</p>}
          {campo('actual', obligatorio ? 'Contraseña temporal' : 'Contraseña actual', 'current-password')}
          {campo('nueva', 'Contraseña nueva', 'new-password')}
          {campo('repetir', 'Repetir contraseña nueva', 'new-password')}
          <button type="submit" className="login-button" disabled={isSubmitting}>
            {isSubmitting ? 'Guardando...' : 'Guardar'}
          </button>
          {serverError && <p className="error-message">{serverError}</p>}
          {obligatorio
            ? <button type="button" className="login-enlace" onClick={logout}>Cerrar sesión</button>
            : <Link to="/" className="login-enlace">Volver</Link>}
        </form>
      </div>
    </div>
  );
};

export default CambiarClavePage;
