import { useCallback, useEffect, useState } from 'react'
import { apiFetch, API_URLS } from '../config/api'
import { useModal } from '../contexts/ModalContext'

const getEstablecimientoDescripcion = (establecimientos, establecimientoId) => {
  if (!Array.isArray(establecimientos)) return ''

  const establecimiento = establecimientos.find((item) => item.EstablecimientoId === establecimientoId)
  return establecimiento?.Descripcion ?? ''
}

const enrichNotificaciones = (notificaciones, establecimientos) => {
  if (!Array.isArray(notificaciones)) return []

  return notificaciones.map((notificacion) => ({
    ...notificacion,
    Establecimientos: Array.isArray(notificacion.Establecimientos)
      ? notificacion.Establecimientos.map((establecimiento) => ({
          ...establecimiento,
          Descripcion:
            establecimiento.Descripcion ||
            getEstablecimientoDescripcion(establecimientos, establecimiento.EstablecimientoId)
        }))
      : []
  }))
}

export const useNotificationsList = () => {
  const [notificaciones, setNotificaciones] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('')
  const [error, setError] = useState(null)
  const { openModal } = useModal()

  const loadNotificaciones = useCallback(async () => {
    setLoadingMessage('Cargando notificaciones...')
    setIsLoading(true)
    setError(null)

    try {
      const establecimientos = await apiFetch(API_URLS.getEstablecimientos, {
        method: 'POST',
        body: JSON.stringify({})
      })

      const data = await apiFetch(API_URLS.GetNotificaciones)
      setNotificaciones(enrichNotificaciones(data, establecimientos))
    } catch (err) {
      console.error('Error al cargar notificaciones:', err)
      setError('No se pudieron cargar las notificaciones. Intente nuevamente mas tarde.')
    } finally {
      setIsLoading(false)
      setLoadingMessage('')
    }
  }, [])

  const deleteNotificacion = useCallback(
    (notificacionId) => {
      openModal(
        'Eliminar Notificacion',
        'Esta seguro que desea eliminar esta notificacion? Esta accion no se puede deshacer.',
        async () => {
          try {
            const response = await apiFetch(API_URLS.EliminarNotificacion, {
              method: 'POST',
              body: JSON.stringify({ DocumentoId: notificacionId })
            })

            if (response?.bok === true) {
              setNotificaciones((prev) => prev.filter((n) => n.NotificacionId !== notificacionId))
              return
            }

            setError('No se pudo eliminar la notificacion. Intente nuevamente mas tarde.')
          } catch (err) {
            console.error('Error al eliminar notificacion:', err)
            setError('No se pudo eliminar la notificacion. Intente nuevamente mas tarde.')
          }
        }
      )
    },
    [openModal]
  )

  useEffect(() => {
    loadNotificaciones()
  }, [loadNotificaciones])

  return {
    notificaciones,
    isLoading,
    loadingMessage,
    error,
    deleteNotificacion
  }
}
