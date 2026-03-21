import React, { useState } from 'react';
import './Login.css';
import { API_URLS, apiFetch } from '../../config/api';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError(null);

    if (!validateForm()) return;

    try {
      const result = await apiFetch(API_URLS.login, {
        method: 'POST',
        body: JSON.stringify({ "Email": email, "Password": password }),
      });

      console.log('Login success', result);
      alert('Inicio de sesión exitoso');
    } catch (err) {
      console.error(err);
      setServerError('No se pudo iniciar sesión. Verifica tus datos e intenta de nuevo.');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <img src="/images/logo-small.png" alt="Logo" className="login-logo" />
        <h2>Iniciar Sesión</h2>
        <form onSubmit={handleSubmit} className="login-form">
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
          
          <button type="submit" className="login-button">
            Iniciar Sesión
          </button>
          {serverError && <p className="error-message">{serverError}</p>}
        </form>
      </div>
    </div>
  );
};

export default Login;