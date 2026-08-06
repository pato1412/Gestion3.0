import { useCallback, useEffect, useState } from 'react'
import { apiFetch, API_URLS, GetDepositosUsuario, downloadFile } from '../config/api'
import { useModal } from '../contexts/ModalContext'

const enrichPlanillasWithDepositos = (planillas, depositos) => {
  if (!Array.isArray(planillas)) return []

  return planillas.map((planilla) => {
    const deposito = Array.isArray(depositos)
      ? depositos.find((item) => item.DepositoId === planilla.DepositoId)
      : null

    return {
      ...planilla,
      DepositoNombre: deposito?.Descripcion ?? ''
    }
  })
}

export const useStockPlanillas = () => {
  const [planillas, setPlanillas] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('')
  const [error, setError] = useState(null)
  const { openModal } = useModal()

  const loadPlanillas = useCallback(async () => {
    setLoadingMessage('Cargando planillas...')
    setIsLoading(true)
    setError(null)

    try {
      const [planillasData, depositos] = await Promise.all([
        apiFetch(API_URLS.GetPlanillasInventario),
        GetDepositosUsuario()
      ])

      setPlanillas(enrichPlanillasWithDepositos(planillasData, depositos))
    } catch (err) {
      console.error('Error al cargar planillas de inventario:', err)
      setError('No se pudieron cargar las planillas. Intente nuevamente mas tarde.')
    } finally {
      setIsLoading(false)
      setLoadingMessage('')
    }
  }, [])

  const deletePlanilla = useCallback(
    (planillaId) => {
      openModal(
        'Eliminar Planilla',
        'Esta seguro que desea eliminar esta planilla de inventario? Esta accion no se puede deshacer.',
        async () => {
          try {
            const response = await apiFetch(API_URLS.DeletePlanillaInventario, {
              method: 'POST',
              body: JSON.stringify({ InventarioId: planillaId })
            })

            if (response?.bok === true) {
              setPlanillas((prev) => prev.filter((p) => p.InventarioId !== planillaId))
              return
            }

            setError('No se pudo eliminar la planilla. Intente nuevamente mas tarde.')
          } catch (err) {
            console.error('Error al eliminar la planilla:', err)
            setError('No se pudo eliminar la planilla. Intente nuevamente mas tarde.')
          }
        }
      )
    },
    [openModal]
  )

  const descargarPlanilla = useCallback(async (planillaId) => {
    try {
      setLoadingMessage('Generando archivo excel...')
      setIsLoading(true)

      const config = { id: planillaId, NombreArchivo: `planilla_stock_${planillaId}.xlsx` }
      await downloadFile(API_URLS.DownloadPlanillaInventario, config.NombreArchivo, {
        method: 'POST',
        body: JSON.stringify(config)
      })
    } catch (err) {
      setError(`Error descargando el archivo: ${err.message}`)
    } finally {
      setIsLoading(false)
      setLoadingMessage('')
    }
  }, [])

  useEffect(() => {
    loadPlanillas()
  }, [loadPlanillas])

  return {
    planillas,
    isLoading,
    loadingMessage,
    error,
    deletePlanilla,
    descargarPlanilla
  }
}
