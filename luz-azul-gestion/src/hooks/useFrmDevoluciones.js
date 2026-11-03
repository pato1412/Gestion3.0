import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch, API_URLS } from '../config/api'
import { useDeposito } from '../contexts/DepositoContext'
import { useModal } from '../contexts/ModalContext'
import { useAuth } from '../contexts/AuthContext'
import { clearPlanillaDraft, usePlanillaDraftPersistence } from './usePlanillaDraftPersistence'
import { getErrorMessage } from '../utils/planillaItems'

// Borrador separado del de inventario (clave devolucionItems_<DepositoId>)
const STORAGE_KEY = 'devolucionItems'
// Largos de las columnas en ENSEMBLE..DevolucionesPlanillas / DevolucionesPlanillasDetalle
const LARGO_USUARIO = 50
const LARGO_OBSERVACIONES = 100
const LARGO_TEXTO_RENGLON = 255

let ultimoId = 0
const nuevoId = () => `${Date.now()}-${++ultimoId}`

const leerNumero = (ref) => {
  const valor = ref.current?.value?.trim() ?? ''
  return valor === '' ? null : Number(valor)
}

const leerTexto = (ref) => ref.current?.value?.trim() ?? ''

export const useFrmDevoluciones = () => {
  const [singleSelections, setSingleSelections] = useState([])
  const [options, setOptions] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [items, setItems] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [showError, setShowError] = useState(false)
  const [messageLoader, setMessageLoader] = useState('Cargando, por favor espere...')
  const [lastSavedTime, setLastSavedTime] = useState(null)
  const [vencimiento, setVencimiento] = useState('') // AAAA-MM-DD (CampoFecha)

  const inputRefCodigo = useRef(null)
  const inputRefUnidades = useRef(null)
  const inputRefKilos = useRef(null)
  const inputRefLote = useRef(null)
  const inputRefCausa = useRef(null)

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
    storageKey: STORAGE_KEY,
    reloadConfirmMessage:
      'Hay productos cargados en la planilla de devolucion. Si recarga la pagina, perdera los datos no enviados. Desea continuar?'
  })

  useEffect(() => {
    const fetchProductos = async () => {
      setIsLoading(true)
      setMessageLoader('Cargando todos los productos de simple tempo...')

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

        setOptions(
          Array.isArray(productos)
            ? productos.map((producto) => ({ ProductoId: producto.ProductoId, Descripcion: producto.Descripcion }))
            : []
        )
      } catch (error) {
        showErrorAlert(`Error cargando productos: ${getErrorMessage(error)}`)
      } finally {
        setIsLoading(false)
      }
    }

    if (DepositoId) {
      fetchProductos()
    }
  }, [DepositoId, showErrorAlert])

  const handleProductSelection = useCallback((selected) => {
    setSingleSelections(selected)
    if (selected.length > 0) {
      inputRefUnidades.current?.focus()
    }
  }, [])

  // Cada ingreso es un renglón propio: el mismo producto puede ir varias veces con otro lote, vencimiento o causa
  const ingresarProducto = useCallback(() => {
    if (singleSelections.length === 0) {
      showErrorAlert('Seleccione el producto a devolver.')
      return
    }

    const unidades = leerNumero(inputRefUnidades)
    const kilos = leerNumero(inputRefKilos)
    const lote = leerTexto(inputRefLote)
    const causa = leerTexto(inputRefCausa)

    if ((unidades !== null && Number.isNaN(unidades)) || (kilos !== null && Number.isNaN(kilos))) {
      showErrorAlert('Las unidades y los kilos tienen que ser numeros.')
      return
    }
    if (unidades !== null && !Number.isInteger(unidades)) {
      showErrorAlert('Las unidades tienen que ser un numero entero.')
      return
    }
    if ((unidades ?? 0) < 0 || (kilos ?? 0) < 0) {
      showErrorAlert('Las unidades y los kilos no pueden ser negativos.')
      return
    }
    if ((unidades ?? 0) === 0 && (kilos ?? 0) === 0) {
      showErrorAlert('Ingrese las unidades o los kilos que se devuelven.')
      return
    }
    if (lote.length > LARGO_TEXTO_RENGLON || causa.length > LARGO_TEXTO_RENGLON) {
      showErrorAlert(`El lote y la causa pueden tener hasta ${LARGO_TEXTO_RENGLON} caracteres.`)
      return
    }

    // Todo se lee antes de setItems: el updater corre en el próximo render, cuando los campos ya se limpiaron
    const nuevoItem = {
      Id: nuevoId(),
      ProductoId: singleSelections[0].ProductoId,
      Descripcion: singleSelections[0].Descripcion,
      Unidades: unidades,
      Kilos: kilos,
      Vencimiento: vencimiento,
      Lote: lote,
      Causa: causa
    }
    setItems((prevItems) => [...prevItems, nuevoItem])

    setSingleSelections([])
    setVencimiento('')
    for (const ref of [inputRefUnidades, inputRefKilos, inputRefLote, inputRefCausa]) {
      if (ref.current) ref.current.value = ''
    }
    inputRefCodigo.current?.focus()
  }, [showErrorAlert, singleSelections, vencimiento])

  const eliminarItem = useCallback(
    (item) => {
      openModal('Eliminar', `Esta seguro que desea quitar el producto ${item.Descripcion} de la planilla?`, () => {
        setItems((prevItems) => prevItems.filter((current) => current.Id !== item.Id))
      })
    },
    [openModal]
  )

  const savePlanilla = useCallback(
    async (observaciones) => {
      const textoObservaciones = (observaciones ?? '').trim()
      if (textoObservaciones.length > LARGO_OBSERVACIONES) {
        showErrorAlert(`La observacion puede tener hasta ${LARGO_OBSERVACIONES} caracteres.`)
        return
      }

      setIsLoading(true)
      setMessageLoader('Enviando planilla de devolucion...')

      let devolucionId = null
      try {
        // Sin Fecha: la pone el servidor (la del navegador viaja en UTC y quedaría corrida)
        const response = await apiFetch(API_URLS.NewPlanillaDevolucion, {
          method: 'POST',
          body: JSON.stringify({
            Usuario: (user?.NombreCompleto ?? '').slice(0, LARGO_USUARIO),
            DepositoId: Number(DepositoId),
            Observaciones: textoObservaciones
          })
        })

        if (!response?.bok) {
          showErrorAlert(response?.message || 'No se pudo guardar la planilla de devolucion. Intente nuevamente.')
          return
        }
        devolucionId = response.id

        const detalleResponse = await apiFetch(API_URLS.NewPlanillaDevolucionDetalle, {
          method: 'POST',
          body: JSON.stringify(
            items.map((item) => ({
              DevolucionId: devolucionId,
              ProductoId: item.ProductoId,
              Unidades: item.Unidades,
              Kilos: item.Kilos,
              Vencimiento: item.Vencimiento || null,
              Lote: item.Lote || null,
              Causa: item.Causa || null
            }))
          )
        })

        if (!detalleResponse?.bok) {
          throw new Error(detalleResponse?.message || 'No se pudieron guardar los productos de la planilla.')
        }

        clearPlanillaDraft(STORAGE_KEY, DepositoId)
        setItems([])

        // Se va al detalle de la planilla, donde se le pueden adjuntar fotos de respaldo
        openModal('Planilla enviada', 'La planilla de devolucion se envio correctamente al deposito. Ahora podes adjuntarle fotos de la mercaderia.', () => {
          navigate(`/stock/planilla-devolucion/${devolucionId}`)
        })
      } catch (error) {
        // El detalle se graba todo o nada: si falló, se borra el encabezado para no dejar una planilla vacía
        if (devolucionId) {
          try {
            await apiFetch(API_URLS.DeletePlanillaDevolucion, {
              method: 'POST',
              body: JSON.stringify({ DocumentoId: devolucionId })
            })
          } catch (deleteError) {
            console.error('No se pudo borrar la planilla incompleta:', deleteError)
          }
        }
        showErrorAlert(`Error enviando la planilla: ${getErrorMessage(error)}`)
      } finally {
        setIsLoading(false)
      }
    },
    [DepositoId, items, navigate, openModal, showErrorAlert, user]
  )

  const handleGuardarPlanilla = useCallback(() => {
    if (items.length === 0) {
      showErrorAlert('Agregue al menos un producto a la planilla.')
      return
    }

    openModal(
      'Enviar planilla de devolucion',
      `Se enviaran ${items.length} productos al deposito. Una vez recibida no se podra modificar. Ingrese una observacion si lo desea.`,
      (valor) => {
        savePlanilla(valor)
      },
      true,
      'Observacion (opcional)',
      ''
    )
  }, [items.length, openModal, savePlanilla, showErrorAlert])

  const filteredItems = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return items

    return items.filter((item) =>
      [item.ProductoId, item.Descripcion, item.Lote, item.Causa].some((valor) => String(valor ?? '').toLowerCase().includes(term))
    )
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
    messageLoader,
    lastSavedTime,
    inputRefCodigo,
    inputRefUnidades,
    inputRefKilos,
    vencimiento,
    setVencimiento,
    inputRefLote,
    inputRefCausa,
    handleProductSelection,
    ingresarProducto,
    eliminarItem,
    handleGuardarPlanilla,
    items,
    filteredItems
  }
}
