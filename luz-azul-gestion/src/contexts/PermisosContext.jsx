import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { apiFetch, API_URLS } from '../config/api';
import { useAuth } from './AuthContext';

const PermisosContext = createContext();

export const usePermisos = () => {
  const context = useContext(PermisosContext);
  if (!context) {
    throw new Error('usePermisos debe ser utilizado dentro de un PermisosProvider');
  }
  return context;
};

// Permisos del usuario de la sesión (ENSEMBLE..PermisosGestion, vía Ensemble GetPermisosUsuarios).
// Se vuelven a leer al iniciar sesión o al recargar la app, así un cambio de permisos se ve sin cerrar sesión.
// Si no se pueden leer, el usuario queda sin permisos.
export const PermisosProvider = ({ children }) => {
  const { user } = useAuth();
  const email = user?.email ?? null;
  // Permisos leídos y de qué email son: si el usuario cambia, los anteriores dejan de valer
  const [leidos, setLeidos] = useState({ email: null, permisos: null });

  useEffect(() => {
    if (!email) return;

    let cancelado = false;
    apiFetch(API_URLS.GetPermisosUsuarios, { method: 'POST', body: JSON.stringify(email) })
      .then((data) => {
        if (!cancelado) setLeidos({ email, permisos: (Array.isArray(data) && data[0]) || {} });
      })
      .catch((error) => {
        console.error('No se pudieron leer los permisos del usuario:', error);
        if (!cancelado) setLeidos({ email, permisos: {} });
      });

    return () => {
      cancelado = true;
    };
  }, [email]);

  const permisos = email && leidos.email === email ? leidos.permisos : null;
  const cargando = Boolean(email) && permisos === null;

  // EsAdministrador tiene todos los permisos
  const tienePermiso = useCallback(
    (permiso) => Boolean(permisos?.EsAdministrador || permisos?.[permiso]),
    [permisos]
  );

  return (
    <PermisosContext.Provider value={{ permisos, cargando, tienePermiso }}>
      {children}
    </PermisosContext.Provider>
  );
};
