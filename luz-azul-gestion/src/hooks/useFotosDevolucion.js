import { useCallback, useEffect, useRef, useState } from 'react'
import { apiFetch, apiFetchBlob, API_URLS, guardarBlob } from '../config/api'
import { useModal } from '../contexts/ModalContext'
import { getErrorMessage } from '../utils/planillaItems'
import { reducirFoto } from '../utils/fotos'

// Máximo de fotos por planilla (Ensemble: FotosDevolucionesModel.MaximoFotosPorPlanilla)
export const MAXIMO_FOTOS_DEVOLUCION = 20

const post = (url, body) => apiFetch(url, { method: 'POST', body: JSON.stringify(body) })

/**
 * Fotos de respaldo de una planilla de devolución. Ensemble no las publica como archivos estáticos:
 * cada foto se pide con el GUID y el usuario, y se muestra desde un Blob en memoria.
 */
export const useFotosDevolucion = (devolucionId, puedeEditar) => {
  // Cada foto: { Nombre, Fecha, Bytes, blob, url } (blob y url quedan en null hasta que termina de bajar)
  const [fotos, setFotos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [subiendo, setSubiendo] = useState(null) // { actual, total }
  const [error, setError] = useState('')
  const [seleccionada, setSeleccionada] = useState(null) // índice de la foto abierta en grande
  const urls = useRef(new Set())
  const { openModal } = useModal()

  const crearUrl = (blob) => {
    const url = URL.createObjectURL(blob)
    urls.current.add(url)
    return url
  }

  const liberarUrl = (url) => {
    if (!url) return
    URL.revokeObjectURL(url)
    urls.current.delete(url)
  }

  // Al salir de la pantalla se liberan las fotos de la memoria
  useEffect(() => {
    const creadas = urls.current
    return () => {
      creadas.forEach((url) => URL.revokeObjectURL(url))
      creadas.clear()
    }
  }, [])

  const cargar = useCallback(async () => {
    setCargando(true)
    try {
      const lista = await post(API_URLS.GetFotosDevolucion, { DocumentoId: Number(devolucionId) })
      const iniciales = (Array.isArray(lista) ? lista : []).map((foto) => ({ ...foto, blob: null, url: null }))
      setFotos(iniciales)
      setCargando(false)

      // Cada foto se muestra apenas llega
      await Promise.all(iniciales.map(async (foto) => {
        try {
          const blob = await apiFetchBlob(API_URLS.DescargarFotoDevolucion, {
            method: 'POST',
            body: JSON.stringify({ DevolucionId: Number(devolucionId), Nombre: foto.Nombre })
          })
          const url = crearUrl(blob)
          setFotos((prev) => prev.map((f) => (f.Nombre === foto.Nombre ? { ...f, blob, url } : f)))
        } catch (err) {
          setFotos((prev) => prev.map((f) => (f.Nombre === foto.Nombre ? { ...f, falla: true } : f)))
          console.error('No se pudo bajar la foto', foto.Nombre, err)
        }
      }))
    } catch (err) {
      setError(`No se pudieron cargar las fotos. ${getErrorMessage(err)}`)
      setCargando(false)
    }
  }, [devolucionId])

  useEffect(() => {
    cargar()
  }, [cargar])

  const agregar = async (archivos) => {
    const lista = [...archivos]
    if (lista.length === 0) return
    const lugar = MAXIMO_FOTOS_DEVOLUCION - fotos.length
    if (lugar <= 0) {
      setError(`La planilla ya tiene ${MAXIMO_FOTOS_DEVOLUCION} fotos, que es el máximo.`)
      return
    }

    const aSubir = lista.slice(0, lugar)
    const errores = []
    if (lista.length > lugar) {
      errores.push(`Solo se agregaron ${lugar} de las ${lista.length} fotos: el máximo es ${MAXIMO_FOTOS_DEVOLUCION} por planilla.`)
    }
    setError('')

    for (let i = 0; i < aSubir.length; i++) {
      setSubiendo({ actual: i + 1, total: aSubir.length })
      const archivo = aSubir[i]
      try {
        const blob = await reducirFoto(archivo)
        const formData = new FormData()
        formData.append('DevolucionId', String(devolucionId))
        formData.append('Foto', blob, 'foto.jpg')
        const respuesta = await apiFetch(API_URLS.NewFotoDevolucion, { method: 'POST', body: formData })
        if (!respuesta?.bok) throw new Error(respuesta?.message || 'No se pudo subir la foto.')
        const nueva = { Nombre: respuesta.message, Fecha: new Date().toISOString(), Bytes: blob.size, blob, url: crearUrl(blob) }
        setFotos((prev) => [...prev, nueva])
      } catch (err) {
        errores.push(`${archivo.name}: ${getErrorMessage(err)}`)
      }
    }

    setSubiendo(null)
    if (errores.length > 0) setError(errores.join(' '))
  }

  const eliminar = (foto) => {
    openModal('Eliminar foto', 'Seguro que desea eliminar la foto de la planilla?', async () => {
      try {
        const respuesta = await post(API_URLS.DeleteFotoDevolucion, { DevolucionId: Number(devolucionId), Nombre: foto.Nombre })
        if (!respuesta?.bok) throw new Error(respuesta?.message || 'No se pudo eliminar la foto.')
        liberarUrl(foto.url)
        setFotos((prev) => prev.filter((f) => f.Nombre !== foto.Nombre))
        setSeleccionada(null)
      } catch (err) {
        setError(getErrorMessage(err))
      }
    })
  }

  const descargar = (foto) => {
    if (!foto.blob) return
    const numero = fotos.findIndex((f) => f.Nombre === foto.Nombre) + 1
    const extension = foto.Nombre.split('.').pop()
    guardarBlob(foto.blob, `devolucion_${devolucionId}_foto_${numero}.${extension}`)
  }

  return {
    fotos,
    cargando,
    subiendo,
    error,
    cerrarError: () => setError(''),
    puedeAgregar: puedeEditar && fotos.length < MAXIMO_FOTOS_DEVOLUCION && !subiendo,
    agregar,
    eliminar,
    descargar,
    seleccionada,
    abrir: setSeleccionada,
    cerrar: () => setSeleccionada(null)
  }
}
