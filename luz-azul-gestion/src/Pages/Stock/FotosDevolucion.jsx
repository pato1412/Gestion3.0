import { Alert, Button, Modal, Spinner } from 'react-bootstrap'
import { FaCamera, FaChevronLeft, FaChevronRight, FaDownload, FaTrash } from 'react-icons/fa'
import { MAXIMO_FOTOS_DEVOLUCION, useFotosDevolucion } from '../../hooks/useFotosDevolucion'
import { formatDateTime } from '../../utils/dateTime'
import { formatBytes } from '../../utils/fotos'

/**
 * Fotos de respaldo de una planilla de devolución. Las ve el local y el depósito; con puedeEditar
 * (el local, mientras el depósito no la recibió) se pueden agregar y borrar.
 * aviso: texto opcional debajo de las fotos (por ejemplo, por qué ya no se pueden agregar).
 */
const FotosDevolucion = ({ devolucionId, puedeEditar, headerClass = '', aviso }) => {
  const f = useFotosDevolucion(devolucionId, puedeEditar)
  const actual = f.seleccionada === null ? null : f.fotos[f.seleccionada]
  const total = f.fotos.length

  const onArchivos = (e) => {
    f.agregar(e.target.files)
    // Permite volver a elegir el mismo archivo
    e.target.value = ''
  }

  return (
    <div className='Container-form mb-3'>
      <div className={`Container-header ${headerClass} d-flex align-items-center justify-content-between gap-2`}>
        <h5 className='mb-0'>Fotos{total > 0 ? ` (${total})` : ''}</h5>
        {puedeEditar && (
          <label
            className={`btn btn-outline-primary btn-sm mb-0 ${f.puedeAgregar ? '' : 'disabled'}`}
            title={total >= MAXIMO_FOTOS_DEVOLUCION ? `Máximo ${MAXIMO_FOTOS_DEVOLUCION} fotos por planilla` : undefined}
          >
            <FaCamera className='me-1' /> Agregar fotos
            <input type='file' accept='image/*' multiple hidden onChange={onArchivos} disabled={!f.puedeAgregar} aria-label='Agregar fotos' />
          </label>
        )}
      </div>
      <div className='Container-content'>
        {f.error && <Alert variant='danger' dismissible onClose={f.cerrarError}>{f.error}</Alert>}

        {f.cargando ? (
          <p className='text-muted mb-0'>Cargando fotos...</p>
        ) : total === 0 && !f.subiendo ? (
          <p className='text-muted mb-0'>
            La planilla no tiene fotos.
            {puedeEditar && ' Podés sacar o elegir fotos de la mercadería como respaldo de la devolución.'}
          </p>
        ) : (
          <div className='fotos-devolucion'>
            {f.fotos.map((foto, i) => (
              <div key={foto.Nombre} className='foto-devolucion'>
                <button type='button' className='foto-devolucion-ver' onClick={() => f.abrir(i)} disabled={!foto.url} aria-label={`Ver foto ${i + 1}`}>
                  {foto.url
                    ? <img src={foto.url} alt={`Foto ${i + 1} de la devolución`} />
                    : foto.falla
                      ? <span className='small text-danger'>No se pudo cargar</span>
                      : <Spinner animation='border' size='sm' />}
                </button>
                {puedeEditar && (
                  <button type='button' className='foto-devolucion-borrar' onClick={() => f.eliminar(foto)} title='Eliminar foto' aria-label={`Eliminar foto ${i + 1}`}>
                    <FaTrash />
                  </button>
                )}
              </div>
            ))}
            {f.subiendo && (
              <div className='foto-devolucion foto-devolucion-subiendo'>
                <Spinner animation='border' size='sm' />
                <span className='small'>Subiendo {f.subiendo.actual} de {f.subiendo.total}</span>
              </div>
            )}
          </div>
        )}

        {aviso && <p className='small text-muted mt-2 mb-0'>{aviso}</p>}
      </div>

      <Modal show={actual !== null} onHide={f.cerrar} size='lg' centered>
        {actual && (
          <>
            <Modal.Header closeButton>
              <Modal.Title as='h6'>
                Foto {f.seleccionada + 1} de {total}
                <span className='text-muted fw-normal ms-2'>{formatDateTime(actual.Fecha)} · {formatBytes(actual.Bytes)}</span>
              </Modal.Title>
            </Modal.Header>
            <Modal.Body className='text-center foto-devolucion-grande'>
              {actual.url ? <img src={actual.url} alt={`Foto ${f.seleccionada + 1} de la devolución`} /> : <Spinner animation='border' />}
            </Modal.Body>
            <Modal.Footer className='justify-content-between'>
              <div className='d-flex gap-1'>
                <Button variant='outline-secondary' size='sm' onClick={() => f.abrir(f.seleccionada - 1)} disabled={f.seleccionada === 0} aria-label='Foto anterior'>
                  <FaChevronLeft />
                </Button>
                <Button variant='outline-secondary' size='sm' onClick={() => f.abrir(f.seleccionada + 1)} disabled={f.seleccionada === total - 1} aria-label='Foto siguiente'>
                  <FaChevronRight />
                </Button>
              </div>
              <div className='d-flex gap-2'>
                {puedeEditar && (
                  <Button
                    variant='outline-danger'
                    size='sm'
                    onClick={() => {
                      // Se cierra la foto antes de abrir la confirmación (no quedan dos modales abiertos)
                      f.cerrar()
                      f.eliminar(actual)
                    }}
                  >
                    <FaTrash className='me-1' /> Eliminar
                  </Button>
                )}
                <Button variant='primary' size='sm' onClick={() => f.descargar(actual)} disabled={!actual.blob}>
                  <FaDownload className='me-1' /> Descargar
                </Button>
              </div>
            </Modal.Footer>
          </>
        )}
      </Modal>
    </div>
  )
}

export default FotosDevolucion
