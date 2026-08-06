import { useCallback, useEffect, useState } from 'react'
import { apiFetch, API_URLS, GetDepositosUsuario } from '../config/api'
import { useModal } from '../contexts/ModalContext'

const getDescriptionById = (items, idField, idValue) => {
  if (!Array.isArray(items)) return ''
  const item = items.find((entry) => entry[idField] === idValue)
  return item?.Descripcion ?? ''
}

const enrichPlanillas = (planillas, depositos, conceptos) => {
  if (!Array.isArray(planillas)) return []

  return planillas.map((planilla) => ({
    ...planilla,
    DepositoNombre: getDescriptionById(depositos, 'DepositoId', planilla.DepositoId),
    Concepto: getDescriptionById(conceptos, 'ConfigId', planilla.ConfigId)
  }))
}

export const useMermasPlanillas = () => {
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
      const [planillasData, depositos, conceptos] = await Promise.all([
        apiFetch(API_URLS.GetPlanillasMermas),
        GetDepositosUsuario(),
        apiFetch(API_URLS.GetConceptosMermas, { method: 'GET' })
      ])

      setPlanillas(enrichPlanillas(planillasData, depositos, conceptos))
    } catch (err) {
      console.error('Error al cargar planillas de mermas:', err)
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
            const data = { InventarioId: planillaId }
            const response = await apiFetch(API_URLS.DeletePlanillaInventario, {
              method: 'POST',
              body: JSON.stringify(data)
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
