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

export const useFrmSheetStock = () => {
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

  const inputRefStock = useRef(null)
  const inputRefCantidad = useRef(null)
  const inputRefCodigo = useRef(null)
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

        const formattedProductos = mapProductosToPlanillaOptions(productos)

        setMessageLoader('Cargando stock de simple tempo...')
        const pageSize = Number(import.meta.env.VITE_ST_RESULTADOS_POR_PAGINA_STOCK)
        const paginas = Math.ceil(formattedProductos.length / pageSize)

        for (let paginaActual = 1; paginaActual <= paginas; paginaActual += 1) {
          const sliceProductos = formattedProductos.slice((paginaActual - 1) * pageSize, paginaActual * pageSize)

          try {
            const stockData = await apiFetch(API_URLS.GetStockByProductosDepositoId, {
              method: 'POST',
              body: JSON.stringify({
                ProductosIds: sliceProductos.map((p) => p.ProductoId),
                DepositoId,
                ResultadosPorPagina: pageSize,
                Pagina: paginaActual
              })
            })

            if (Array.isArray(stockData)) {
              stockData.forEach((stockItem) => {
                const idx = formattedProductos.findIndex((p) => p.ProductoId === stockItem.ProductoId)
                if (idx !== -1) {
                  formattedProductos[idx].StockActual = stockItem.Stock || 0
                }
              })
            }
          } catch (error) {
            showErrorAlert(
              `Error cargando stock de producto en la pagina ${paginaActual}: ${getErrorMessage(error)}`
            )
          }

          setProgress((paginaActual / paginas) * 100)
        }

        setOptions(formattedProductos)
      } catch (error) {
        showErrorAlert(`Error cargando productos: ${getErrorMessage(error)}`)
      } finally {
        setIsLoading(false)
        setProgress(100)
      }
    }

    if (DepositoId) {
      fetchProductos()
    }
  }, [DepositoId, showErrorAlert])

  const handleProductSelection = useCallback((selected) => {
    setSingleSelections(selected)
    if (inputRefStock.current) {
      inputRefStock.current.value = selected[0]?.StockActual || '0'
    }
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
    if (inputRefStock.current) inputRefStock.current.value = ''
    if (inputRefCantidad.current) inputRefCantidad.current.value = ''
    inputRefCodigo.current?.focus()
  }, [showErrorAlert, singleSelections])

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

  const savePlanilla = useCallback(
    async (observaciones) => {
      setIsLoading(true)
      setMessageLoader('Cargando planilla de stock...')

      try {
        const EstablecimientoId = Cookies.get('EstablecimientoId')
        const data = {
          Usuario: user.NombreCompleto,
          FechaInicio: dateStartRef.current,
          FechaFin: new Date(),
          DepositoId,
          EstablecimientoId,
          Observaciones: observaciones
        }

        const response = await apiFetch(API_URLS.NewPlanillaInventario, {
          method: 'POST',
          body: JSON.stringify(data)
        })

        if (!response?.bok) {
          showErrorAlert('No se pudo guardar la planilla de stock. Intente nuevamente.')
          return
        }

        const detallesData = items.map((item) => ({
          InventarioId: response.id,
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
          showErrorAlert('No se pudieron guardar los detalles de la planilla de stock. Intente nuevamente.')
          return
        }

        Cookies.remove(`planillaItems_${DepositoId}`)
        Cookies.remove(`planillaItemsTime_${DepositoId}`)

        openModal('Planilla guardada', 'La planilla de stock se ha guardado correctamente.', () => {
          navigate('/stock/listar-planillas')
        })
      } catch (error) {
        showErrorAlert(`Error cargando la planilla: ${getErrorMessage(error)}`)
      } finally {
        setIsLoading(false)
      }
    },
    [DepositoId, items, navigate, openModal, showErrorAlert, user.NombreCompleto]
  )

  const handleGuardarPlanilla = useCallback(() => {
    openModal(
      'Guardar planilla de stock',
      'Desea guardar la planilla de stock? Ingrese una observacion si lo desea.',
      (valor) => {
        savePlanilla(valor)
      },
      true,
      'Observacion (opcional)',
      ''
    )
  }, [openModal, savePlanilla])

  const analizarCaja = useCallback(
    (codigoCaja) => {
      if (!codigoCaja || codigoCaja.trim() === '') {
        showErrorAlert('Debe ingresar un codigo de caja valido.')
        return
      }

      if (codigoCaja.length !== 12) {
        showErrorAlert('El codigo de caja debe tener 12 caracteres.')
        return
      }

      const codigoProducto = codigoCaja.substring(1, 4)
      let cantidad = codigoCaja.substring(4, 8)

      if (Number.isNaN(Number(cantidad)) || Number(cantidad) <= 0) {
        showErrorAlert('La cantidad en el codigo de caja no es valida.')
        return
      }

      cantidad = Number(cantidad) / 100
      const productoSeleccionado = options.find((option) => option.ProductoId === codigoProducto)

      if (!productoSeleccionado) {
        showErrorAlert(`No se encontro un producto con el codigo ${codigoProducto}.`)
        return
      }

      setItems((prevItems) => upsertItemCantidad(prevItems, productoSeleccionado, Number(cantidad)))
    },
    [options, showErrorAlert]
  )

  const handleSeleccionarCaja = useCallback(() => {
    openModal(
      'Seleccionar caja de luz azul',
      'Por favor escanee la caja de luz azul.',
      (valor) => {
        analizarCaja(valor)
      },
      true,
      '0000-0000-0000',
      ''
    )
  }, [analizarCaja, openModal])

  const filteredItems = useMemo(() => {
    return filterPlanillaItems(items, searchTerm)
  }, [items, searchTerm])

  return {
    dateStart: dateStartRef.current,
    singleSelections,
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
    inputRefStock,
    inputRefCantidad,
    inputRefCodigo,
    handleProductSelection,
    ingresarProducto,
    eliminarItem,
    handleGuardarPlanilla,
    filteredItems,
    handleSeleccionarCaja
  }
}
