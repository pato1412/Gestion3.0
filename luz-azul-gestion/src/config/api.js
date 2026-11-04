import Cookies from 'js-cookie';

export const API_URLS = {
  login: import.meta.env.VITE_API_DOMAIN + import.meta.env.VITE_API_LOGIN_URL,
  registrarUsuario: import.meta.env.VITE_API_DOMAIN + import.meta.env.VITE_API_REGISTRAR_USUARIO_URL,
  cambiarClaveUsuario: import.meta.env.VITE_API_DOMAIN + import.meta.env.VITE_API_CAMBIAR_CLAVE_USUARIO_URL,
  getEstablecimientos: import.meta.env.VITE_API_DOMAIN +import.meta.env.VITE_API_GET_ESTABLECIMIENTOS_URL,
  getDepositosUsuario: import.meta.env.VITE_API_DOMAIN + import.meta.env.VITE_API_GET_DEPOSITOS_USUARIO_URL,
  InfoEmpresa: import.meta.env.VITE_API_DOMAIN + import.meta.env.VITE_API_INFO_EMPRESA_URL,
  GetAllProductos: import.meta.env.VITE_API_DOMAIN + import.meta.env.VITE_API_GET_ALL_PRODUCTOS_URL,
  GetProductosByIds: import.meta.env.VITE_API_DOMAIN + import.meta.env.VITE_API_GET_PRODUCTOS_BY_IDS_URL,
  GetStockByProductosDepositoId: import.meta.env.VITE_API_DOMAIN + import.meta.env.VITE_API_GET_STOCK_PRODUCTO_URL, 
  GetPlanillasInventario: import.meta.env.VITE_API_DOMAIN + import.meta.env.VITE_API_GET_PLANILLAS_INVENTARIO_URL,
  NewPlanillaInventario: import.meta.env.VITE_API_DOMAIN + import.meta.env.VITE_API_NEW_PLANILLA_INVENTARIO_URL,
  NewPlanillaMermas: import.meta.env.VITE_API_DOMAIN + import.meta.env.VITE_API_NEW_PLANILLA_MERMAS_URL,
  NewPlanillaInventarioDetalle: import.meta.env.VITE_API_DOMAIN + import.meta.env.VITE_API_NEW_PLANILLA_INVENTARIO_DETALLE_URL,
  GetPlanillaInventarioDetalle: import.meta.env.VITE_API_DOMAIN + import.meta.env.VITE_API_GET_PLANILLA_INVENTARIO_DETALLE_URL,
  DeletePlanillaInventario: import.meta.env.VITE_API_DOMAIN + import.meta.env.VITE_API_DELETE_PLANILLA_INVENTARIO_URL,
  DownloadPlanillaInventario: import.meta.env.VITE_API_DOMAIN + import.meta.env.VITE_API_DOWLOAD_PLANILLA_INVENTARIO_URL,
  GetPlanillasMermas: import.meta.env.VITE_API_DOMAIN + import.meta.env.VITE_API_GET_PLANILLAS_MERMAS_URL,
  GetConceptosMermas: import.meta.env.VITE_API_DOMAIN + import.meta.env.VITE_API_GET_CONCEPTOS_MERMAS_URL,
  GetNotificaciones: import.meta.env.VITE_API_DOMAIN + import.meta.env.VITE_API_GET_NOTIFICACIONES_URL,
  InsertNotificaciones: import.meta.env.VITE_API_DOMAIN + import.meta.env.VITE_API_INSERT_NOTIFICACION_URL,  
  EliminarNotificacion: import.meta.env.VITE_API_DOMAIN + import.meta.env.VITE_API_ELIMINAR_NOTIFICACION_URL,
  UploadNotificationImage: import.meta.env.VITE_API_DOMAIN + import.meta.env.VITE_API_UPLOAD_NOTIFICATION_IMAGE_URL,
  GetPlanillasDevolucion: import.meta.env.VITE_API_DOMAIN + import.meta.env.VITE_API_GET_PLANILLAS_DEVOLUCION_URL,
  NewPlanillaDevolucion: import.meta.env.VITE_API_DOMAIN + import.meta.env.VITE_API_NEW_PLANILLA_DEVOLUCION_URL,
  DeletePlanillaDevolucion: import.meta.env.VITE_API_DOMAIN + import.meta.env.VITE_API_DELETE_PLANILLA_DEVOLUCION_URL,
  NewPlanillaDevolucionDetalle: import.meta.env.VITE_API_DOMAIN + import.meta.env.VITE_API_NEW_PLANILLA_DEVOLUCION_DETALLE_URL,
  GetPlanillaDevolucionDetalle: import.meta.env.VITE_API_DOMAIN + import.meta.env.VITE_API_GET_PLANILLA_DEVOLUCION_DETALLE_URL,
  DeletePlanillaDevolucionDetalle: import.meta.env.VITE_API_DOMAIN + import.meta.env.VITE_API_DELETE_PLANILLA_DEVOLUCION_DETALLE_URL,
  GetPlanillaDevolucion: import.meta.env.VITE_API_DOMAIN + import.meta.env.VITE_API_GET_PLANILLA_DEVOLUCION_URL,
  DownloadPlanillaDevolucion: import.meta.env.VITE_API_DOMAIN + import.meta.env.VITE_API_DOWNLOAD_PLANILLA_DEVOLUCION_URL,
  GetPlanillasDevolucionRecepcion: import.meta.env.VITE_API_DOMAIN + import.meta.env.VITE_API_GET_PLANILLAS_DEVOLUCION_RECEPCION_URL,
  GetPlanillaDevolucionRecepcion: import.meta.env.VITE_API_DOMAIN + import.meta.env.VITE_API_GET_PLANILLA_DEVOLUCION_RECEPCION_URL,
  RecibirPlanillaDevolucion: import.meta.env.VITE_API_DOMAIN + import.meta.env.VITE_API_RECIBIR_PLANILLA_DEVOLUCION_URL,
  NotaCreditoPlanillaDevolucion: import.meta.env.VITE_API_DOMAIN + import.meta.env.VITE_API_NOTA_CREDITO_PLANILLA_DEVOLUCION_URL,
  AprobarPlanillaDevolucionDetalle: import.meta.env.VITE_API_DOMAIN + import.meta.env.VITE_API_APROBAR_PLANILLA_DEVOLUCION_DETALLE_URL,
  EnvioMercaderiaPlanillaDevolucionDetalle: import.meta.env.VITE_API_DOMAIN + import.meta.env.VITE_API_ENVIO_MERCADERIA_PLANILLA_DEVOLUCION_DETALLE_URL,
  DownloadPlanillaDevolucionRecepcion: import.meta.env.VITE_API_DOMAIN + import.meta.env.VITE_API_DOWNLOAD_PLANILLA_DEVOLUCION_RECEPCION_URL,
  GetFotosDevolucion: import.meta.env.VITE_API_DOMAIN + import.meta.env.VITE_API_GET_FOTOS_DEVOLUCION_URL,
  DescargarFotoDevolucion: import.meta.env.VITE_API_DOMAIN + import.meta.env.VITE_API_DESCARGAR_FOTO_DEVOLUCION_URL,
  NewFotoDevolucion: import.meta.env.VITE_API_DOMAIN + import.meta.env.VITE_API_NEW_FOTO_DEVOLUCION_URL,
  DeleteFotoDevolucion: import.meta.env.VITE_API_DOMAIN + import.meta.env.VITE_API_DELETE_FOTO_DEVOLUCION_URL,
  ChatWidget: import.meta.env.VITE_API_CHAT_WIDGET_URL,
  GetPermisosUsuarios: import.meta.env.VITE_API_DOMAIN + import.meta.env.VITE_API_GET_PERMISOS_USUARIOS_URL,
};

// Email del usuario de la sesión: Ensemble lo usa para validar sus permisos (header UsuarioEmail)
const headerUsuario = () => {
  const userData = Cookies.get('userData');
  const email = userData ? JSON.parse(userData).email : null;
  return email ? { UsuarioEmail: email } : {};
};

export async function apiFetch(url, options = {}) {
  const EstablecimientoData = Cookies.get('EstablecimientoData'); // fallback
  const guid = (EstablecimientoData) ? JSON.parse(EstablecimientoData).EstablecimientoGUID : null; // fallback
  const response = await fetch(url, {
    mode: 'cors', // petición en modo CORS (necesario para dominios externos desde el navegador)
    // options va antes que headers: si options trae headers propios se suman a los por defecto en vez de reemplazarlos
    ...options,
    headers: {
      // Con FormData (subir archivos) el navegador arma el Content-Type multipart con su boundary
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      'EstablecimientoGUID': guid,
      // El navegador ya envía el header 'Origin' real y no permite sobreescribirlo ni honra
      // 'Access-Control-Allow-Origin' en el request (es un header de respuesta del servidor).
      // Enviamos el origen actual en un header propio para que el backend lo valide y lo
      // devuelva reflejado en su respuesta CORS en lugar de usar '*'.
      'X-Site-Origin': window.location.origin,
      ...headerUsuario(),
      ...options.headers,
    },
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

// Como apiFetch, pero devuelve el contenido como Blob (por ejemplo una foto para mostrarla con URL.createObjectURL)
export async function apiFetchBlob(url, options = {}) {
  const EstablecimientoData = Cookies.get('EstablecimientoData');
  const guid = (EstablecimientoData) ? JSON.parse(EstablecimientoData).EstablecimientoGUID : null;
  const response = await fetch(url, {
    mode: 'cors',
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'EstablecimientoGUID': guid,
      'X-Site-Origin': window.location.origin,
      ...headerUsuario(),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    const error = new Error(text || `API request failed (${response.status})`);
    error.status = response.status;
    throw error;
  }

  return response.blob();
}

// Descarga en el navegador un Blob que ya está en memoria
export const guardarBlob = (blob, fileName) => {
  const blobUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  link.parentNode.removeChild(link);
  window.URL.revokeObjectURL(blobUrl);
};


export const downloadFile =async (url,fileName,  options = {}) => {
  try {
    const EstablecimientoData = Cookies.get('EstablecimientoData'); // fallback
    const guid = (EstablecimientoData) ? JSON.parse(EstablecimientoData).EstablecimientoGUID : null; // fallback
    const response = await fetch(url, {
      mode: 'cors', // petición en modo CORS (necesario para dominios externos desde el navegador)
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'EstablecimientoGUID': guid,
        'X-Site-Origin': window.location.origin,
        ...headerUsuario(),
        ...options.headers,
      },
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

export const GetDepositosUsuario = async () => {
      const userData = Cookies.get('userData');
      if (!userData) {
        return;
      }
      const CookieData = JSON.parse(userData);
      const url = API_URLS.getDepositosUsuario.replace('{usuarioId}', CookieData.id); 
      const data = await apiFetch(url, {
        method: 'GET',
      });
      return Array.isArray(data) ? data : [];
};

