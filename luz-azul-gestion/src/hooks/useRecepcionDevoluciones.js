import { useCallback, useEffect, useMemo, useState } from 'react'
import { apiFetch, API_URLS, downloadFile } from '../config/api'
import { getErrorMessage } from '../utils/planillaItems'
import { toInputDate } from '../utils/devoluciones'

// Vistas del panel: las pendientes se muestran todas; las recibidas y "todas", por rango de fechas de envío
export const VISTAS_RECEPCION = {
  pendientes: { titulo: 'Pendientes de recibir', Recibidas: false, usaFechas: false },
  recibidas: { titulo: 'Recibidas', Recibidas: true, usaFechas: true },
  todas: { titulo: 'Todas', Recibidas: null, usaFechas: true }
}

const hace30Dias = () => {
  const fecha = new Date()
  fecha.setDate(fecha.getDate() - 30)
  return fecha
}

export const useRecepcionDevoluciones = () => {
  const [planillas, setPlanillas] = useState([])
  const [vista, setVista] = useState('pendientes')
  const [fechas, setFechas] = useState(() => ({ desde: toInputDate(hace30Dias()), hasta: toInputDate(new Date()) }))
  // Las fechas se aplican con "Buscar"; la vista, al cambiar de pestaña
  const [fechasAplicadas, setFechasAplicadas] = useState(fechas)
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('')
  const [error, setError] = useState(null)

  const loadPlanillas = useCallback(async (vistaActual, rango) => {
    setLoadingMessage('Cargando planillas...')
    setIsLoading(true)
    setError(null)

    try {
      const config = VISTAS_RECEPCION[vistaActual]
      const filtros = { Recibidas: config.Recibidas }
      if (config.usaFechas) {
        filtros.FechaDesde = rango.desde || null
        filtros.FechaHasta = rango.hasta || null
      }

      const data = await apiFetch(API_URLS.GetPlanillasDevolucionRecepcion, {
        method: 'POST',
        body: JSON.stringify(filtros)
      })
      setPlanillas(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Error al cargar las planillas de recepcion:', err)
      setError(`No se pudieron cargar las planillas: ${getErrorMessage(err)}`)
    } finally {
      setIsLoading(false)
      setLoadingMessage('')
    }
  }, [])

  useEffect(() => {
    loadPlanillas(vista, fechasAplicadas)
  }, [loadPlanillas, vista, fechasAplicadas])

  const buscar = useCallback(() => {
    if (fechas.desde && fechas.hasta && fechas.desde > fechas.hasta) {
      setError('La fecha desde no puede ser posterior a la fecha hasta.')
      return
    }
    setFechasAplicadas({ ...fechas })
  }, [fechas])

  const descargarPlanilla = useCallback(async (planillaId) => {
    try {
      setLoadingMessage('Generando archivo excel...')
      setIsLoading(true)

      const config = { id: planillaId, NombreArchivo: `planilla_devolucion_${planillaId}.xlsx` }
      await downloadFile(API_URLS.DownloadPlanillaDevolucionRecepcion, config.NombreArchivo, {
        method: 'POST',
        body: JSON.stringify(config)
      })
    } finally {
      setIsLoading(false)
      setLoadingMessage('')
    }
  }, [])

  const filteredPlanillas = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return planillas

    return planillas.filter((planilla) =>
      [planilla.DevolucionId, planilla.Establecimiento, planilla.Usuario, planilla.Observaciones]
        .some((valor) => String(valor ?? '').toLowerCase().includes(term))
    )
  }, [planillas, searchTerm])

  return {
    planillas: filteredPlanillas,
    total: planillas.length,
    vista,
    setVista,
    fechas,
    setFechas,
    buscar,
    searchTerm,
    setSearchTerm,
    isLoading,
    loadingMessage,
    error,
    descargarPlanilla
  }
}
