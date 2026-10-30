import { useEffect } from 'react'
import Cookies from 'js-cookie'

// El borrador va en localStorage (unos 5 MB por sitio): las cookies tienen un tope de 4 KB,
// unos 25 productos, y pasado ese tamaño el navegador las descarta sin avisar.
// storageKey separa los borradores de cada tipo de planilla; la clave queda `${storageKey}_${DepositoId}`.
const VIGENCIA_MS = 24 * 60 * 60 * 1000 // Como la cookie anterior: se descarta al día del último guardado

const draftKey = (storageKey, DepositoId) => `${storageKey}_${DepositoId}`

// Borradores que quedaron en cookies antes del cambio: se pasan una vez a localStorage
const leerBorradorCookie = (storageKey, DepositoId) => {
  const items = Cookies.get(draftKey(storageKey, DepositoId))
  if (!items) return null

  const guardado = Cookies.get(`${storageKey}Time_${DepositoId}`)
  Cookies.remove(draftKey(storageKey, DepositoId))
  Cookies.remove(`${storageKey}Time_${DepositoId}`)
  return { guardado: guardado ?? new Date().toISOString(), items: JSON.parse(items) }
}

const leerBorrador = (storageKey, DepositoId) => {
  const guardado = localStorage.getItem(draftKey(storageKey, DepositoId))
  return guardado ? JSON.parse(guardado) : leerBorradorCookie(storageKey, DepositoId)
}

// Se llama al enviar la planilla con éxito
export const clearPlanillaDraft = (storageKey, DepositoId) => {
  try {
    localStorage.removeItem(draftKey(storageKey, DepositoId))
  } catch (error) {
    console.error('Error borrando el borrador de la planilla:', error)
  }
}

export const usePlanillaDraftPersistence = ({
  DepositoId,
  items,
  setItems,
  setLastSavedTime,
  openModal,
  reloadConfirmMessage,
  storageKey
}) => {
  useEffect(() => {
    if (!DepositoId) return

    try {
      const borrador = leerBorrador(storageKey, DepositoId)
      if (!borrador || !Array.isArray(borrador.items)) return

      const guardado = new Date(borrador.guardado)
      if (Date.now() - guardado.getTime() > VIGENCIA_MS) {
        clearPlanillaDraft(storageKey, DepositoId)
        return
      }

      setItems(borrador.items)
      setLastSavedTime(guardado)
    } catch (error) {
      console.error('Error restaurando el borrador de la planilla:', error)
    }
  }, [DepositoId, setItems, setLastSavedTime, storageKey])

  useEffect(() => {
    if (items.length === 0 || !DepositoId) return

    const now = new Date()
    try {
      localStorage.setItem(draftKey(storageKey, DepositoId), JSON.stringify({ guardado: now.toISOString(), items }))
      setLastSavedTime(now)
    } catch (error) {
      // Sin espacio o almacenamiento bloqueado: queda a la vista la hora del último guardado bueno
      console.error('Error guardando el borrador de la planilla:', error)
    }
  }, [DepositoId, items, setLastSavedTime, storageKey])

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (items.length === 0) return
      event.preventDefault()
      event.returnValue = ''
    }

    const handleReloadShortcut = (event) => {
      const isReloadKey =
        event.key === 'F5' ||
        ((event.key === 'r' || event.key === 'R') && (event.ctrlKey || event.metaKey))

      if (!isReloadKey || items.length === 0) return

      event.preventDefault()
      openModal('Confirmar recarga', reloadConfirmMessage, () => {
        window.removeEventListener('beforeunload', handleBeforeUnload)
        window.location.reload()
      })
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('keydown', handleReloadShortcut)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('keydown', handleReloadShortcut)
    }
  }, [items, openModal, reloadConfirmMessage])
}
