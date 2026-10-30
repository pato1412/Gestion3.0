import { useCallback, useEffect, useMemo, useState } from 'react'
import { apiFetch, API_URLS, downloadFile } from '../config/api'
import { useModal } from '../contexts/ModalContext'
import { getErrorMessage } from '../utils/planillaItems'
import { agregarDescripciones, fetchDescripcionesProductos } from '../utils/devoluciones'

// El depósito recibe una planilla de devolución y aprueba o rechaza cada renglón con una respuesta
export const useFrmRecepcionDevolucion = (id) => {
  const [planilla, setPlanilla] = useState(null)
  const [items, setItems] = useState([])
  // Respuesta que se está escribiendo en cada renglón (se guarda al aprobar o rechazar)
  const [respuestas, setRespuestas] = useState({})
  const [guardandoId, setGuardandoId] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [messageLoader, setMessageLoader] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [showError, setShowError] = useState(false)
  const { openModal } = useModal()

  const showErrorAlert = useCallback((error) => {
    setErrorMessage(getErrorMessage(error))
    setShowError(true)
  }, [])

  const cargarPlanilla = useCallback(async () => {
    setIsLoading(true)
    setMessageLoader('Cargando planilla de devolucion...')

    try {
      const data = await apiFetch(API_URLS.GetPlanillaDevolucionRecepcion, {
        method: 'POST',
        body: JSON.stringify({ DocumentoId: Number(id) })
      })

      if (!data?.Planilla) {
        showErrorAlert('La planilla de devolucion no existe.')
        return
      }

      setMessageLoader('Cargando los productos de simple tempo...')
      const descripciones = await fetchDescripcionesProductos(data.Detalle.map((item) => item.ProductoId))
      setPlanilla(data.Planilla)
      setItems(agregarDescripciones(data.Detalle, descripciones))
      setRespuestas(Object.fromEntries(data.Detalle.map((item) => [item.DevolucionDetalleId, item.Respuesta ?? ''])))
    } catch (error) {
      showErrorAlert(`Error cargando la planilla: ${getErrorMessage(error)}`)
    } finally {
      setIsLoading(false)
      setMessageLoader('')
    }
  }, [id, showErrorAlert])

  useEffect(() => {
    cargarPlanilla()
  }, [cargarPlanilla])

  const recibida = Boolean(planilla?.FechaRecepcion)

  // Los contadores se calculan con los renglones en pantalla, así se actualizan al aprobar sin recargar
  const planillaActual = useMemo(() => {
    if (!planilla) return null
    return {
      ...planilla,
      Renglones: items.length,
      Aprobados: items.filter((item) => item.Aprobado === true).length,
      Rechazados: items.filter((item) => item.Aprobado === false).length,
      PendientesAprobacion: items.filter((item) => item.Aprobado === null || item.Aprobado === undefined).length
    }
  }, [planilla, items])

  const recibirPlanilla = useCallback(() => {
    if (!planilla) return

    openModal(
      'Recibir planilla',
      `Confirma que el deposito recibio la planilla N° ${planilla.DevolucionId} de ${planilla.Establecimiento}? Desde ese momento el local ya no podra modificarla.`,
      async () => {
        setIsLoading(true)
        setMessageLoader('Registrando la recepcion...')
        try {
          const response = await apiFetch(API_URLS.RecibirPlanillaDevolucion, {
            method: 'POST',
            body: JSON.stringify({ DocumentoId: planilla.DevolucionId })
          })
          if (!response?.bok) {
            showErrorAlert(response?.message || 'No se pudo marcar la planilla como recibida.')
          }
        } catch (error) {
          showErrorAlert(`Error registrando la recepcion: ${getErrorMessage(error)}`)
        } finally {
          setIsLoading(false)
          setMessageLoader('')
        }
        // Se recarga siempre: si otro usuario la recibió antes, se ve su fecha de recepción
        await cargarPlanilla()
      }
    )
  }, [cargarPlanilla, openModal, planilla, showErrorAlert])

  const guardarDecision = async (item, aprobado) => {
    const respuesta = (respuestas[item.DevolucionDetalleId] ?? '').trim()
    const response = await apiFetch(API_URLS.AprobarPlanillaDevolucionDetalle, {
      method: 'POST',
      body: JSON.stringify({ DevolucionDetalleId: item.DevolucionDetalleId, Aprobado: aprobado, Respuesta: respuesta || null })
    })
    if (!response?.bok) {
      throw new Error(response?.message || 'No se pudo guardar la decision.')
    }
    setItems((prev) =>
      prev.map((current) =>
        current.DevolucionDetalleId === item.DevolucionDetalleId ? { ...current, Aprobado: aprobado, Respuesta: respuesta || null } : current
      )
    )
  }

  const decidir = async (item, aprobado) => {
    setGuardandoId(item.DevolucionDetalleId)
    try {
      await guardarDecision(item, aprobado)
    } catch (error) {
      showErrorAlert(`${item.ProductoId}: ${getErrorMessage(error)}`)
    } finally {
      setGuardandoId(null)
    }
  }

  const aprobarPendientes = () => {
    const pendientes = items.filter((item) => item.Aprobado === null || item.Aprobado === undefined)
    if (pendientes.length === 0) return

    openModal('Aprobar pendientes', `Se aprobaran los ${pendientes.length} productos pendientes con la respuesta que tengan escrita. Desea continuar?`, async () => {
      setIsLoading(true)
      const errores = []
      for (let i = 0; i < pendientes.length; i++) {
        setMessageLoader(`Aprobando ${i + 1} de ${pendientes.length}...`)
        try {
          await guardarDecision(pendientes[i], true)
        } catch (error) {
          errores.push(`${pendientes[i].ProductoId}: ${getErrorMessage(error)}`)
        }
      }
      setIsLoading(false)
      setMessageLoader('')
      if (errores.length > 0) {
        showErrorAlert(`No se pudieron aprobar ${errores.length} productos. ${errores[0]}`)
      }
    })
  }

  const setRespuesta = (detalleId, texto) => {
    setRespuestas((prev) => ({ ...prev, [detalleId]: texto }))
  }

  // La respuesta escrita todavía no se guardó (hay que volver a aprobar o rechazar)
  const respuestaSinGuardar = (item) => item.Aprobado !== null && item.Aprobado !== undefined
    && (respuestas[item.DevolucionDetalleId] ?? '').trim() !== (item.Respuesta ?? '')

  const descargarPlanilla = useCallback(async () => {
    setIsLoading(true)
    setMessageLoader('Generando archivo excel...')
    try {
      const config = { id: Number(id), NombreArchivo: `planilla_devolucion_${id}.xlsx` }
      await downloadFile(API_URLS.DownloadPlanillaDevolucionRecepcion, config.NombreArchivo, {
        method: 'POST',
        body: JSON.stringify(config)
      })
    } finally {
      setIsLoading(false)
      setMessageLoader('')
    }
  }, [id])

  return {
    planilla: planillaActual,
    items,
    recibida,
    respuestas,
    setRespuesta,
    respuestaSinGuardar,
    guardandoId,
    recibirPlanilla,
    decidir,
    aprobarPendientes,
    descargarPlanilla,
    isLoading,
    messageLoader,
    errorMessage,
    showError,
    closeError: () => setShowError(false)
  }
}
