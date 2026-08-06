import { useEffect } from 'react'
import Cookies from 'js-cookie'

export const usePlanillaDraftPersistence = ({
  DepositoId,
  items,
  setItems,
  setLastSavedTime,
  openModal,
  reloadConfirmMessage
}) => {
  useEffect(() => {
    if (!DepositoId) return

    const cookieKey = `planillaItems_${DepositoId}`
    const savedItems = Cookies.get(cookieKey)
    if (!savedItems) return

    try {
      setItems(JSON.parse(savedItems))
      const savedTime = Cookies.get(`planillaItemsTime_${DepositoId}`)
      if (savedTime) {
        setLastSavedTime(new Date(savedTime))
      }
    } catch (error) {
      console.error('Error restaurando items desde cookie:', error)
    }
  }, [DepositoId, setItems, setLastSavedTime])

  useEffect(() => {
    if (items.length === 0 || !DepositoId) return

    const now = new Date()
    Cookies.set(`planillaItems_${DepositoId}`, JSON.stringify(items), { expires: 1 })
    Cookies.set(`planillaItemsTime_${DepositoId}`, now.toISOString(), { expires: 1 })
    setLastSavedTime(now)
  }, [DepositoId, items, setLastSavedTime])

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
