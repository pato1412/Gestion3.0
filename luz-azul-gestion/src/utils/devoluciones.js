import { apiFetch, API_URLS } from '../config/api'

// Estado de la planilla según la recepción del depósito y la aprobación de sus renglones
export const estadoPlanillaDevolucion = (planilla) => {
  if (!planilla?.FechaRecepcion) {
    return { texto: 'Pendiente de recepción', variant: 'warning' }
  }
  if (planilla.PendientesAprobacion > 0) {
    return { texto: 'Recibida - en revisión', variant: 'info' }
  }
  return { texto: 'Revisada', variant: 'success' }
}

export const estadoRenglonDevolucion = (renglon) => {
  if (renglon?.Aprobado === true) return { texto: 'Aprobado', variant: 'success' }
  if (renglon?.Aprobado === false) return { texto: 'Rechazado', variant: 'danger' }
  return { texto: 'Pendiente', variant: 'secondary' }
}

// Fecha sin hora (dd/mm/aaaa) para el vencimiento y los filtros
export const formatDate = (value) => {
  if (!value) return ''

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  const pad = (num) => String(num).padStart(2, '0')
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`
}

// aaaa-mm-dd en hora local (para inputs type="date")
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
