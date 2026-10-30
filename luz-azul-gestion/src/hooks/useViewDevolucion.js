import { useCallback, useEffect, useState } from 'react'
import { apiFetch, API_URLS, downloadFile } from '../config/api'
import { getErrorMessage } from '../utils/planillaItems'
import { agregarDescripciones, fetchDescripcionesProductos } from '../utils/devoluciones'

// Detalle de una planilla de devolución del establecimiento (solo lectura)
export const useViewDevolucion = (id) => {
  const [planilla, setPlanilla] = useState(null)
  const [items, setItems] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [messageLoader, setMessageLoader] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [showError, setShowError] = useState(false)

  const showErrorAlert = useCallback((error) => {
    setErrorMessage(getErrorMessage(error))
    setShowError(true)
  }, [])

  useEffect(() => {
    const fetchPlanilla = async () => {
      setIsLoading(true)
      setMessageLoader('Cargando planilla de devolucion...')

      try {
        const data = await apiFetch(API_URLS.GetPlanillaDevolucion, {
          method: 'POST',
          body: JSON.stringify({ DocumentoId: Number(id) })
        })

        if (!data?.Planilla) {
          showErrorAlert('La planilla no existe o no es de este establecimiento.')
          return
        }

        setMessageLoader('Cargando los productos de simple tempo...')
        const descripciones = await fetchDescripcionesProductos(data.Detalle.map((item) => item.ProductoId))
        setPlanilla(data.Planilla)
        setItems(agregarDescripciones(data.Detalle, descripciones))
      } catch (error) {
        showErrorAlert(`Error cargando la planilla: ${getErrorMessage(error)}`)
      } finally {
        setIsLoading(false)
        setMessageLoader('')
      }
    }

    fetchPlanilla()
  }, [id, showErrorAlert])

  const descargarPlanilla = useCallback(async () => {
    setIsLoading(true)
    setMessageLoader('Generando archivo excel...')
    try {
      const config = { id: Number(id), NombreArchivo: `planilla_devolucion_${id}.xlsx` }
      await downloadFile(API_URLS.DownloadPlanillaDevolucion, config.NombreArchivo, {
        method: 'POST',
        body: JSON.stringify(config)
      })
    } finally {
      setIsLoading(false)
      setMessageLoader('')
    }
  }, [id])

  return {
    planilla,
    items,
    isLoading,
    messageLoader,
    errorMessage,
    showError,
    closeError: () => setShowError(false),
    descargarPlanilla
  }
}
