import { createContext, useCallback, useContext, useState } from 'react';
import Cookies from 'js-cookie';
import { API_URLS, apiFetch } from '../config/api';

const EstablecimientoContext = createContext();

export const useEstablecimiento = () => {
  const context = useContext(EstablecimientoContext);
  if (!context) {
    throw new Error('useEstablecimiento debe ser utilizado dentro de un EstablecimientoProvider');
  }
  return context;
};

export const EstablecimientoProvider = ({ children }) => {
  // El establecimiento seleccionado se lee de las cookies al crear el estado (sin useEffect).
  const [establecimientoId, setEstablecimientoId] = useState(() => Cookies.get('EstablecimientoId') ?? null);
  const [establecimiento, setEstablecimiento] = useState(() => {
    const EstablecimientoData = Cookies.get('EstablecimientoData');
    return EstablecimientoData ? JSON.parse(EstablecimientoData) : null;
  });
  const [establecimientos, setEstablecimientos] = useState([]);
  // loading indica la carga de la lista de establecimientos (fetchEstablecimientos)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

    // useCallback: SelectEstablecimiento la usa como dependencia de su useEffect
    const fetchEstablecimientos = useCallback(async () => {
        //console.log('fetchEstablecimientos - Iniciando carga de establecimientos...'); // Debug
      try {
        const data = await apiFetch(API_URLS.getEstablecimientos, {
        method: 'POST'
        });
        setEstablecimientos(data); // Asumiendo que data es un array de objetos con Id, GUID, Nombre, etc.
      } catch {
        setError('Error al cargar establecimientos');
       // console.error('Error al cargar establecimientos:', err);
      } finally {
        setLoading(false);
      }
    }, []);

  const handleEstablecimientoSelected = (establecimiento) => {
    /* Guardamos el establecimiento seleccionado en cookies para que esté disponible en toda la aplicación, incluso después de recargar la página */
    Cookies.set('EstablecimientoId', establecimiento.EstablecimientoId , { expires: 7 });
    Cookies.set('EstablecimientoData', JSON.stringify(establecimiento), { expires: 7 });
    
    setEstablecimiento(establecimiento);
    setEstablecimientoId(establecimiento.EstablecimientoId);
  }

  const clearCookies = () => {
    Cookies.remove('EstablecimientoId');
    Cookies.remove('EstablecimientoData');
    setEstablecimiento(null);
    setEstablecimientoId(null);
  }

  const value = {
    establecimientoId,
    establecimiento,
    establecimientos,
    loading,
    error,
    handleEstablecimientoSelected,
    fetchEstablecimientos,
    clearCookies
  };

  return (    
    <EstablecimientoContext.Provider value={value}>
      {children}
    </EstablecimientoContext.Provider>
  );
};