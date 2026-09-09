import { useEffect } from 'react';
import { initChatWidget } from '../../utils/chat-widget';
import { API_URLS } from '../../config/api';
import { useAuth } from '../../contexts/AuthContext';
import { useEstablecimiento } from '../../contexts/EstablecimientoContext';

const ChatWidget = ({ endpoint = API_URLS.ChatWidget , title = 'Capacitación Luz Azul' }) => {

  const { establecimiento, loading } = useEstablecimiento();
  const { user } = useAuth()
  const usuarioNombre = user?.NombreCompleto || user?.email || 'Usuario no disponible'
  const establecimientoDescripcion = establecimiento?.Descripcion || "Sin establecimiento";

  useEffect(() => {
    const destroy = initChatWidget({ endpoint, title, usuarioNombre, establecimientoDescripcion });
    return destroy;
  }, [endpoint, title, usuarioNombre, establecimientoDescripcion]);

  return null;
};

export default ChatWidget;
