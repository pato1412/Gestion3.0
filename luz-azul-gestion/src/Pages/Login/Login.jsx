import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaStore } from 'react-icons/fa';
import './Login.css';
import { API_URLS, apiFetch } from '../../config/api';
import { useAuth } from '../../contexts/AuthContext';
import { useModal } from '../../contexts/ModalContext';
import { useEstablecimiento } from '../../contexts/EstablecimientoContext';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [razonSocial, setRazonSocial] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const { openModal } = useModal();
  const navigate = useNavigate();
  const { establecimiento, clearCookies } = useEstablecimiento();

  const validateForm = () => {
    const newErrors = {};
    
    if (!email) {
      newErrors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'El email no es válido';
    }
    
    if (!password) {
      newErrors.password = 'La contraseña es requerida';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    const fetchEmpresa = async () => {
      try {
        const data = await apiFetch(API_URLS.InfoEmpresa);
        if (data && data.RazonSocial) {
          setRazonSocial(data.RazonSocial);
        }
      } catch (err) {
        console.error('Error al obtener datos de la empresa:', err);
      }
    };

    fetchEmpresa();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError(null);

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const result = await apiFetch(API_URLS.login, {
        method: 'POST',
        body: JSON.stringify({ "Email": email, "Password": password }),
      });
      if (result && result.UsuarioId) {
        // Asumir que result tiene más datos, como token si existe
        const userData = { id: result.UsuarioId, email, NombreCompleto: result.NombreCompleto };
        const token = result.UsuarioId; 
        login(userData, token);
        navigate('/'); // Redirigir a home después de login
      } else {
        setServerError("Usuario o contraseña incorrectos. Por favor, verifica tus datos e intenta de nuevo.");
      }
    } catch {
      setServerError('No se pudo iniciar sesión. Verifica tus datos e intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangeEmpresa = () => {
      openModal('Cambiar Empresa', '¿Desea cambiar de empresa? Se cerrará la sesión actual y se eliminará la selección de establecimiento.', () => {
        // Lógica para cerrar sesión y eliminar cookies
        clearCookies()
        window.location.reload();
      });
  };

  return (
    <div className="login-container">
      <div className="login-marca">
        <div className="login-logo">
          <img src="/images/logo-small.png" alt="Luz Azul" />
        </div>
        <h1 className="login-app">Gestión</h1>
      </div>
      <div className="login-card">
        <h2>Iniciar sesión</h2>
        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-empresa">
            <FaStore />
            <span>{razonSocial || establecimiento?.Descripcion}</span>
            <button type="button" onClick={handleChangeEmpresa}>Cambiar</button>
          </div>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={errors.email ? 'error' : ''}
              placeholder="tu@email.com"
            />
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={errors.password ? 'error' : ''}
              placeholder="Tu contraseña"
            />
            {errors.password && <span className="error-message">{errors.password}</span>}
          </div>

          <button type="submit" className="login-button" disabled={isSubmitting}>
            {isSubmitting ? 'Ingresando...' : 'Ingresar'}
          </button>
          {serverError && <p className="error-message">{serverError}</p>}
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
