import { useEffect, useState } from 'react'
import { apiFetch, API_URLS } from '../config/api'

const getErrorMessage = (error) => {
  if (!error) return 'Error inesperado'
  if (typeof error === 'string') return error
  if (error.message) return error.message

  try {
    return JSON.stringify(error)
  } catch {
    return 'Error inesperado'
  }
}

const parseDetalleCantidades = (detalle) => {
  if (!Array.isArray(detalle)) return []

  return detalle.map((item) => {
    let cantidades = []

    if (item.Cantidades && item.Cantidades.length > 0) {
      try {
        cantidades = JSON.parse(item.Cantidades)
      } catch {
        cantidades = []
      }
    }

    return {
      ...item,
      Cantidades: cantidades
    }
  })
}

const hydrateDetalleDescriptions = (detalle, productos) => {
  return detalle.map((item) => {
    const producto = productos.find((p) => p.ProductoId === item.ProductoId)
    return {
      ...item,
      Descripcion: producto?.Descripcion ?? item.Descripcion
    }
  })
}

export const useViewMermas = (id) => {
  const [items, setItems] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [showError, setShowError] = useState(false)
  const [messageLoader, setMessageLoader] = useState('Cargando, por favor espere...')

  const showErrorAlert = (error) => {
    setErrorMessage(getErrorMessage(error))
    setShowError(true)
  }

  useEffect(() => {
    const fetchProductos = async (detalle) => {
      if (!Array.isArray(detalle) || detalle.length === 0) return []

      const data = detalle.map((item) => item.ProductoId)
      const pageSize = Number(import.meta.env.VITE_ST_RESULTADOS_POR_PAGINA_STOCK)

      if (data.length <= pageSize) {
        return apiFetch(API_URLS.GetProductosByIds, {
          method: 'POST',
          body: JSON.stringify(data)
        })
      }

      const chunks = []
      for (let i = 0; i < data.length; i += pageSize) {
        chunks.push(data.slice(i, i + pageSize))
      }

      const productos = await Promise.all(
        chunks.map((chunk) =>
          apiFetch(API_URLS.GetProductosByIds, {
            method: 'POST',
            body: JSON.stringify(chunk)
          })
        )
      )

      return productos.flat()
    }

    const fetchDetalle = async () => {
      setIsLoading(true)
      setMessageLoader('Cargando detalle de mermas...')

      try {
        if (!id) {
          showErrorAlert('ID de planilla de mermas no proporcionado.')
          return
        }

        const detalle = await apiFetch(API_URLS.GetPlanillaInventarioDetalle, {
          method: 'POST',
          body: JSON.stringify(id)
        })

        const parsedDetalle = parseDetalleCantidades(detalle)
        setMessageLoader('Cargando los productos de simple tempo...')

        const productos = await fetchProductos(parsedDetalle)
        const itemsHydrated = hydrateDetalleDescriptions(parsedDetalle, Array.isArray(productos) ? productos : [])

        setItems(itemsHydrated)
      } catch (error) {
        showErrorAlert(`Error cargando detalle: ${getErrorMessage(error)}`)
      } finally {
        setIsLoading(false)
        setMessageLoader('')
      }
    }

    fetchDetalle()
  }, [id])

  return {
    items,
    isLoading,
    errorMessage,
    showError,
    closeError: () => setShowError(false),
    messageLoader
  }
}
