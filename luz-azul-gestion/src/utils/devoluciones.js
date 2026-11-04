import { apiFetch, API_URLS } from '../config/api'

// Estado de la planilla según la recepción del depósito, la aprobación de sus renglones y la nota de crédito
export const estadoPlanillaDevolucion = (planilla) => {
  if (planilla?.NotaCredito) {
    return { texto: 'Generada', variant: 'primary' }
  }
  if (!planilla?.FechaRecepcion) {
    return { texto: 'Pendiente de recepción', variant: 'warning' }
  }
  if (planilla.PendientesAprobacion > 0) {
    return { texto: 'Recibida - en revisión', variant: 'info' }
  }
  return { texto: 'Revisada', variant: 'success' }
}

// La nota de crédito se carga con la planilla recibida y todos sus productos aprobados o rechazados
export const motivoSinNotaCredito = (planilla) => {
  if (!planilla?.FechaRecepcion) return 'Primero hay que recibir la planilla'
  if (planilla.PendientesAprobacion > 0) return 'Aprobá o rechazá todos los productos antes de cargar la nota de crédito'
  return null
}

// Largo máximo del número de nota de crédito (DevolucionesPlanillas.NotaCredito VARCHAR(50))
export const LARGO_NOTA_CREDITO = 50

export const estadoRenglonDevolucion = (renglon) => {
  if (renglon?.Aprobado === true) return { texto: 'Aprobado', variant: 'success' }
  if (renglon?.Aprobado === false) return { texto: 'Rechazado', variant: 'danger' }
  return { texto: 'Pendiente', variant: 'secondary' }
}

// Qué se hace con la mercadería del renglón (lo decide el depósito en la recepción)
export const envioMercaderiaDevolucion = (renglon) => {
  if (renglon?.EnvioMercaderia === true) return { texto: 'Enviar', variant: 'primary' }
  if (renglon?.EnvioMercaderia === false) return { texto: 'Descartar', variant: 'dark' }
  return { texto: 'Sin definir', variant: 'light' }
}

// aaaa-mm-dd en hora local (valor de CampoFecha)
export const toInputDate = (date) => {
  const pad = (num) => String(num).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export const formatNumber = (value) => {
  if (value === null || value === undefined || value === '') return ''
  return Number(value).toLocaleString('es-AR', { maximumFractionDigits: 3 })
}

/**
 * Descripciones de Simple Tempo para los códigos del detalle (en tandas, como el resto de las planillas).
 * Si Simple Tempo no responde devuelve un mapa vacío: el detalle se muestra igual, solo con el código.
 */
export const fetchDescripcionesProductos = async (productoIds) => {
  const ids = [...new Set((productoIds ?? []).filter(Boolean))]
  const descripciones = new Map()
  if (ids.length === 0) return descripciones

  const pageSize = Number(import.meta.env.VITE_ST_RESULTADOS_POR_PAGINA_STOCK) || 100
  const tandas = []
  for (let i = 0; i < ids.length; i += pageSize) {
    tandas.push(ids.slice(i, i + pageSize))
  }

  try {
    const resultados = await Promise.all(
      tandas.map((tanda) =>
        apiFetch(API_URLS.GetProductosByIds, {
          method: 'POST',
          body: JSON.stringify(tanda)
        })
      )
    )
    resultados.flat().forEach((producto) => {
      if (producto?.ProductoId) descripciones.set(producto.ProductoId, producto.Descripcion)
    })
  } catch (error) {
    console.error('No se pudieron obtener las descripciones de los productos:', error)
  }

  return descripciones
}

export const agregarDescripciones = (detalle, descripciones) => {
  if (!Array.isArray(detalle)) return []
  return detalle.map((renglon) => ({
    ...renglon,
    Descripcion: descripciones.get(renglon.ProductoId) ?? ''
  }))
}
