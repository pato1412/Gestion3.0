import { useEffect } from 'react'

const ShowError = ({ message, show, onClose, duration = 5000 }) => {
  useEffect(() => {
    if (!show) return

    const timer = setTimeout(() => {
      if (typeof onClose === 'function') {
        onClose()
      }
    }, duration)

    return () => clearTimeout(timer)
  }, [show, duration, onClose])

  if (!show || !message) return null

  return (
    <div className="alert alert-danger alert-dismissible fade show" role="alert">
      {message}
      <button
        type="button"
        className="btn-close"
        aria-label="Close"
        onClick={() => {
          if (typeof onClose === 'function') {
            onClose()
          }
        }}
      ></button>
    </div>
  )
}

export default ShowError