import Cookies from 'js-cookie';

export const API_URLS = {
  login: import.meta.env.VITE_API_LOGIN_URL,
  getEstablecimientos: import.meta.env.VITE_API_GET_ESTABLECIMIENTOS_URL,
};

export async function apiFetch(url, options = {}) {
  const guid = Cookies.get('EstablecimientoGUID') || '50f94dcd6a49db9f55e4bfb662aff6a9'; // fallback
  const response = await fetch(url, {
    mode: 'cors', // petición en modo CORS (necesario para dominios externos desde el navegador)
    headers: {
      'Content-Type': 'application/json',
      'EstablecimientoGUID': guid,
      'Access-Control-Allow-Origin': '*', // Permitir solicitudes desde cualquier origen
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const text = await response.text();
    const error = new Error(`API request failed (${response.status}): ${text}`);
    error.status = response.status;
    error.body = text;
    throw error;
  }

  return response.json();
}
