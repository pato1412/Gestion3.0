import { useEffect } from 'react';
import { initChatWidget } from '../../utils/chat-widget';
import { API_URLS } from '../../config/api';

const ChatWidget = ({ endpoint = API_URLS.ChatWidget , title = 'Capacitación Luz Azul' }) => {
  useEffect(() => {
    const destroy = initChatWidget({ endpoint, title });
    return destroy;
  }, [endpoint, title]);

  return null;
};

export default ChatWidget;
