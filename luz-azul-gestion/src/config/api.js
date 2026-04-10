import Cookies from 'js-cookie';

export const API_URLS = {
  login: import.meta.env.VITE_API_LOGIN_URL,
  getEstablecimientos: import.meta.env.VITE_API_GET_ESTABLECIMIENTOS_URL,
  getDepositosUsuario: import.meta.env.VITE_API_GET_DEPOSITOS_USUARIO_URL,
  InfoEmpresa: import.meta.env.VITE_API_INFO_EMPRESA_URL,
};

export async function apiFetch(url, options = {}) {
  const guid = Cookies.get('EstablecimientoGUID'); // fallback
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
   if (response.status === 204) {
    // Operation was successful, but there is no content to return.
    // Return null or an empty object/value to continue the promise chain successfully.
    return null; 
  }

  if (!response.ok) {
    const text = await response.text();
    const error = new Error(`API request failed (${response.status}): ${text}`);
    error.status = response.status;
    error.body = text;
    throw error;
  }

  return response.json();
}


export const downloadFile = async (url,fileName,  options = {}) => {
  try {
    const guid = Cookies.get('EstablecimientoGUID'); // fallback
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

    if (!response.ok) throw new Error('Network response was not ok');

    // 1. Convert the response to a Blob
    const blob = await response.blob();

    // 2. Create a temporary URL for the Blob
    const blobUrl = window.URL.createObjectURL(blob);

    // 3. Create a hidden <a> element and trigger click
    const link = document.createElement('a');
    link.href = blobUrl;
    link.setAttribute('download', fileName || 'download-file');
    document.body.appendChild(link);
    link.click();

    // 4. Clean up: remove the link and revoke the URL
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error('Download failed:', error);
  }
};