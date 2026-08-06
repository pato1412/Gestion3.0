import Sidebar from '../../components/Sidebar/Sidebar'
import Loader from '../../components/Loader/Loader'
import { Accordion, Button, Nav, NavItem } from 'react-bootstrap'
import { FaTrash, FaEye } from 'react-icons/fa'
import { useModal } from '../../contexts/ModalContext'
import './notifications.css'
import { Link } from 'react-router-dom'
import { formatDateTime } from '../../utils/dateTime'
import { useNotificationsList } from '../../hooks/useNotificationsList'

const ListNotifications = () => {
  const { notificaciones, isLoading, loadingMessage, error, deleteNotificacion } = useNotificationsList()
  const { openModal } = useModal();

  const handleViewNotificacion = (notificacionId) => {
    const notificacion = notificaciones.find(n => n.NotificacionId === notificacionId)

    if (!notificacion) {
      openModal('Error', 'No se encontro la notificacion seleccionada.', () => {})
      return
    }

    const establecimientosRelacionados = Array.isArray(notificacion.Establecimientos)
      ? notificacion.Establecimientos
      : []

    openModal(
      `Detalle de notificación: ${notificacion.Titulo ?? ''}`,
      (
        <Accordion defaultActiveKey='0' alwaysOpen>
          <Accordion.Item eventKey='0'>
            <Accordion.Header>
              Establecimientos relacionados ({establecimientosRelacionados.length})
            </Accordion.Header>
            <Accordion.Body>
              {establecimientosRelacionados.length === 0 ? (
                <div className='text-muted'>No hay establecimientos asociados a esta notificación.</div>
              ) : (
                <div className='table-responsive'>
                  <table className='table table-sm table-striped mb-0'>
                    <thead>
                      <tr>
                        <th>Establecimiento</th>
                        <th>Fecha de visualización</th>
                      </tr>
                    </thead>
                    <tbody>
                      {establecimientosRelacionados.map((establecimiento, index) => (
                        <tr key={`${establecimiento.EstablecimientoId ?? 'establecimiento'}-${index}`}>
                          <td>{establecimiento.Descripcion ?? `ID: ${establecimiento.EstablecimientoId ?? '-'}`}</td>
                          <td>{establecimiento.FechaVisualizacion ? formatDateTime(establecimiento.FechaVisualizacion) : 'Sin visualizar'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Accordion.Body>
          </Accordion.Item>
        </Accordion>
      ),
      () => {}
    )
  }

  return (
    <>
      <Sidebar title={'Listado de notificaciones'} />
      <div className='container'>
        <div className='Container-notifications-form mb-3'>
          <div className='Container-notifications-header d-flex align-items-center justify-content-between'>
            <h5>Notificaciones</h5>
            <Link to='/notificaciones/nueva-notificacion' className='btn btn-primary'>
              Nueva Notificacion
            </Link>            
          </div>
          <div className='Container-notifications-content'>
            {error && <div className='alert alert-danger'>{error}</div>}
            <div className='table-responsive'>
              <table className='table table-striped'>
                <thead>
                  <tr>
                    <th className='xs-hide'>Imagen</th>
                    <th><span className='xs-hide'>Título</span><span className='xs-show'>Notificación</span></th>
                    <th className='xs-hide'>Categoría</th>
                    <th className='xs-hide'>Fechas</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {notificaciones.length === 0 ? (
                    <tr>
                      <td colSpan='6' className='text-center'>
                        No hay notificaciones disponibles.
                      </td>
                    </tr>
                  ) : (
                    notificaciones.map((notificacion) => (
                      <tr key={notificacion.NotificacionId}>
                        <td className='xs-hide'>
                          {notificacion.ImageURL ? (
                            <img 
                              src={notificacion.ImageURL} 
                              alt='Notificación' 
                              className='notification-thumbnail'
                              style={{ maxWidth: '60px', maxHeight: '60px', borderRadius: '4px' }}
                            />
                          ) : (
                            <span className='text-muted'>Sin imagen</span>
                          )}
                        </td>
                        <td>
                          <div className='xs-show'>
                            <div className='item-notification'>
                              <span className='fw-bold'>Título:</span> {notificacion.Titulo ?? ''}
                            </div>
                            <div className='item-notification'>
                              <span className='fw-bold'>Categoría:</span> {notificacion.Categoria ?? ''}
                            </div>
                            <div className='item-notification'>
                              <span className='fw-bold'>Desde:</span> {formatDateTime(notificacion.FechaDesde)}
                            </div>
                            <div className='item-notification'>
                              <span className='fw-bold'>Hasta:</span> {formatDateTime(notificacion.FechaHasta)}
                            </div>
                            <div className='item-notification'>
                              <span className='fw-bold'>Detalle:</span> {notificacion.Detalle ?? ''}
                            </div>
                            {notificacion.ImageURL && (
                              <div className='item-notification'>
                                <img 
                                  src={notificacion.ImageURL} 
                                  alt='Notificación' 
                                  style={{ maxWidth: '100px', maxHeight: '100px', borderRadius: '4px', marginTop: '5px' }}
                                />
                              </div>
                            )}
                          </div>
                          <div className='xs-hide'>
                            <strong>{notificacion.Titulo ?? ''}</strong>
                            <br />
                            <small className='text-muted'>{notificacion.Detalle ?? ''}</small>
                          </div>
                        </td>
                        <td className='xs-hide'>{notificacion.Categoria ?? ''}</td>
                        <td className='xs-hide'>
                          <small>
                            Desde: {formatDateTime(notificacion.FechaDesde)}
                            <br />
                            Hasta: {formatDateTime(notificacion.FechaHasta)}
                          </small>
                        </td>
                        <td>
                          <Nav className="justify-content-center" style={{ gap: '10px', minWidth: '80px' }}>
                            <NavItem>
                              <Button 
                                variant="outline-success" 
                                size="sm" 
                                onClick={() => handleViewNotificacion(notificacion.NotificacionId)}
                              >
                                <FaEye />
                              </Button>
                            </NavItem>
                            <NavItem>
                              <Button 
                                variant="outline-danger" 
                                size="sm" 
                                onClick={() => deleteNotificacion(notificacion.NotificacionId)}
                              >
                                <FaTrash />
                              </Button>
                            </NavItem>
                          </Nav>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      <Loader visible={isLoading} message={loadingMessage} ShowProgress={false} />
    </>
  )
}

export default ListNotifications