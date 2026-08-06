import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Cookies from 'js-cookie'
import { useNavigate } from 'react-router-dom'
import { apiFetch, API_URLS } from '../config/api'
import { useDeposito } from '../contexts/DepositoContext'
import { useModal } from '../contexts/ModalContext'
import { useAuth } from '../contexts/AuthContext'
import { usePlanillaDraftPersistence } from './usePlanillaDraftPersistence'
import {
  filterPlanillaItems,
  getErrorMessage,
  mapProductosToPlanillaOptions,
  removeItemOrLastCantidad,
  upsertItemCantidad
} from '../utils/planillaItems'

export const useFrmMermas = () => {
  const [singleSelections, setSingleSelections] = useState([])
  const [options, setOptions] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [items, setItems] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [showError, setShowError] = useState(false)
  const [progress, setProgress] = useState(0)
  const [messageLoader, setMessageLoader] = useState('Cargando, por favor espere...')
  const [lastSavedTime, setLastSavedTime] = useState(null)
  const [currentConcepto, setCurrentConcepto] = useState(0)
  const [conceptos, setConceptos] = useState([])

  const inputRefCantidad = useRef(null)
  const inputRefCodigo = useRef(null)
  const inputRefConcepto = useRef(null)
  const dateStartRef = useRef(new Date())

  const { DepositoId } = useDeposito()
  const { openModal } = useModal()
  const { user } = useAuth()
  const navigate = useNavigate()

  const showErrorAlert = useCallback((error) => {
    setErrorMessage(getErrorMessage(error))
    setShowError(true)
  }, [])

  usePlanillaDraftPersistence({
    DepositoId,
    items,
    setItems,
    setLastSavedTime,
    openModal,
    reloadConfirmMessage:
      'Hay datos cargados en la planilla. Si recarga la pagina, volvera a cargar todo y perdera los datos no guardados. Desea continuar?'
  })

  useEffect(() => {
    const fetchProductos = async () => {
      setIsLoading(true)
      setMessageLoader('Cargando todos los productos de simple tempo...')
      setProgress(0)

      try {
        const data = {
          Activo: true,
          TipoProducto: 0,
          DeVentas: true,
          DeCompras: false,
          ResultadosPorPagina: import.meta.env.VITE_ST_RESULTADOS_POR_PAGINA,
          Pagina: 1
        }

        const productos = await apiFetch(API_URLS.GetAllProductos, {
          method: 'POST',
          body: JSON.stringify(data)
        })

        setOptions(mapProductosToPlanillaOptions(productos))
      } catch (error) {
        showErrorAlert(`Error cargando productos: ${getErrorMessage(error)}`)
      } finally {
        setIsLoading(false)
        setProgress(100)
      }
    }

    const fetchConceptos = async () => {
      setIsLoading(true)
      setMessageLoader('Cargando todos los Conceptos...')
      setProgress(0)

      try {
        const conceptosData = await apiFetch(API_URLS.GetConceptosMermas, { method: 'GET' })
        setConceptos(conceptosData)
      } catch (error) {
        showErrorAlert(`Error cargando conceptos: ${getErrorMessage(error)}`)
      } finally {
        setIsLoading(false)
        setProgress(0)
        fetchProductos()
      }
    }

    fetchConceptos()
  }, [showErrorAlert])

  const handleSelectConceptos = useCallback((event) => {
    setCurrentConcepto(event.target.value)
  }, [])

  const ingresarProducto = useCallback(() => {
    if (singleSelections.length === 0) return

    const productoSeleccionado = singleSelections[0]
    const cantidad = Number(inputRefCantidad.current?.value)

    if (cantidad <= 0) {
      showErrorAlert('La cantidad ingresada debe ser mayor a cero.')
      return
    }

    setItems((prevItems) => upsertItemCantidad(prevItems, productoSeleccionado, cantidad))

    setSingleSelections([])

    if (inputRefCantidad.current) {
      inputRefCantidad.current.value = ''
    }

    inputRefCodigo.current?.focus()
  }, [items, showErrorAlert, singleSelections])

  const eliminarItem = useCallback(
    (item) => {
      const isLastQuantity = item.Cantidades.length === 1
      const message = isLastQuantity
        ? `Esta seguro que desea eliminar el producto ${item.Descripcion} de la planilla?`
        : `Esta seguro que desea eliminar la ultima cantidad del producto ${item.Descripcion}?`

      openModal('Eliminar', message, () => {
        setItems((prevItems) => removeItemOrLastCantidad(prevItems, item))
      })
    },
    [openModal]
  )

  const fetchPlanilla = useCallback(
    async (observaciones) => {
      setIsLoading(true)
      setMessageLoader('Cargando planilla de mermas...')

      try {
        const EstablecimientoId = Cookies.get('EstablecimientoId')
        const dateFin = new Date()

        const data = {
          Usuario: user.NombreCompleto,
          FechaInicio: dateStartRef.current,
          FechaFin: dateFin,
          DepositoId,
          EstablecimientoId,
          Observaciones: observaciones,
          ConfigId: currentConcepto
        }

        const response = await apiFetch(API_URLS.NewPlanillaMermas, {
          method: 'POST',
          body: JSON.stringify(data)
        })

        if (!response?.bok) {
          showErrorAlert('No se pudo guardar la planilla de mermas. Intente nuevamente.')
          return
        }

        const planillaId = response.id
        const detallesData = items.map((item) => ({
          InventarioId: planillaId,
          ProductoId: item.ProductoId,
          Cantidades: JSON.stringify(item.Cantidades),
          CantidadContada: item.CantidadContada,
          Stock: item.StockActual
        }))

        const detalleResponse = await apiFetch(API_URLS.NewPlanillaInventarioDetalle, {
          method: 'POST',
          body: JSON.stringify(detallesData)
        })

        if (!detalleResponse?.bok) {
          showErrorAlert('No se pudieron guardar los detalles de la planilla de mermas. Intente nuevamente.')
          return
        }

        Cookies.remove(`planillaItems_${DepositoId}`)
        Cookies.remove(`planillaItemsTime_${DepositoId}`)

        openModal('Planilla guardada', 'La planilla de mermas se ha guardado correctamente.', () => {
          navigate('/stock/listar-mermas')
        })
      } catch (error) {
        showErrorAlert(`Error cargando la planilla: ${getErrorMessage(error)}`)
      } finally {
        setIsLoading(false)
      }
    },
    [DepositoId, currentConcepto, items, navigate, openModal, showErrorAlert, user.NombreCompleto]
  )

  const handleGuardarPlanilla = useCallback(() => {
    if (!currentConcepto || Number(currentConcepto) === 0) {
      showErrorAlert('Debe seleccionar un concepto para guardar la planilla de mermas.')
      return
    }

    openModal(
      'Guardar planilla de mermas',
      'Desea guardar la planilla de mermas? Ingrese una observacion si lo desea.',
      (valor) => {
        fetchPlanilla(valor)
      },
      true,
      'Observacion (opcional)',
      ''
    )
  }, [currentConcepto, fetchPlanilla, openModal, showErrorAlert])

  const filteredItems = useMemo(() => {
    return filterPlanillaItems(items, searchTerm)
  }, [items, searchTerm])

  return {
    dateStart: dateStartRef.current,
    singleSelections,
    setSingleSelections,
    options,
    isLoading,
    searchTerm,
    setSearchTerm,
    errorMessage,
    showError,
    closeError: () => setShowError(false),
    progress,
    messageLoader,
    lastSavedTime,
    inputRefCantidad,
    inputRefCodigo,
    inputRefConcepto,
    currentConcepto,
    conceptos,
    handleSelectConceptos,
    ingresarProducto,
    eliminarItem,
    handleGuardarPlanilla,
    filteredItems
  }
}
