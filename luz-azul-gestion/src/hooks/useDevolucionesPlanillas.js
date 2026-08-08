import { useCallback, useEffect, useState } from 'react'
import { apiFetch, API_URLS, GetDepositosUsuario } from '../config/api'
import { useModal } from '../contexts/ModalContext'


const enrichPlanillasWithDepositos = (planillas, depositos) => {
  if (!Array.isArray(planillas)) return []

  return planillas.map((planilla) => {
    const deposito = Array.isArray(depositos)
      ? depositos.find((item) => item.DepositoId === planilla.DepositoId)
      : null

    return {
      ...planilla,
      DevolucionId: planilla.DevolucionId,
      DepositoNombre: deposito?.Descripcion ?? ''
    }
  })
}

export const useDevolucionesPlanillas = () => {
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
        apiFetch(API_URLS.GetPlanillasDevolucion),
        GetDepositosUsuario()
      ])

      setPlanillas(enrichPlanillasWithDepositos(planillasData, depositos))
    } catch (err) {
      console.error('Error al cargar planillas de devolucion:', err)
      setError('No se pudieron cargar las planillas. Intente nuevamente mas tarde.')
    } finally {
      setIsLoading(false)
      setLoadingMessage('')
    }
  }, [])

  const deletePlanilla = useCallback(
    (planillaId) => {
      if (!planillaId) {
        setError('No se pudo identificar la planilla a eliminar.')
        return
      }

      openModal(
        'Eliminar Planilla',
        'Esta seguro que desea eliminar esta planilla de devolucion? Esta accion no se puede deshacer.',
        async () => {
          try {
            const response = await apiFetch(API_URLS.DeletePlanillaDevolucion, {
              method: 'POST',
              body: JSON.stringify({
                DocumentoId: planillaId,
              })
            })

            if (response?.bok === true || response?.ok === true || response === null) {
              setPlanillas((prev) => prev.filter((p) => p.DevolucionId !== planillaId))
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

  useEffect(() => {
    loadPlanillas()
  }, [loadPlanillas])

  return {
    planillas,
    isLoading,
    loadingMessage,
    error,
    loadPlanillas,
    deletePlanilla
  }
}