import { useEffect, useState } from 'react'
import Sidebar from '../../components/Sidebar/Sidebar'
import Loader from '../../components/Loader/Loader'
import { apiFetch, API_URLS } from '../../config/api'
import { Accordion, Button, Nav, NavItem } from 'react-bootstrap'
import { FaTrash, FaEye } from 'react-icons/fa'
import { useModal } from '../../contexts/ModalContext'
import './notifications.css'
import { Link } from 'react-router-dom'

const formatDateTime = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  const pad = (num) => String(num).padStart(2, '0')
  const day = pad(date.getDate())
  const month = pad(date.getMonth() + 1)
  const year = date.getFullYear()
  const hours = pad(date.getHours())
  const minutes = pad(date.getMinutes())

  return `${day}/${month} ${hours}:${minutes}`
}

const ListNotifications = () => {
  const [notificaciones, setNotificaciones] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [MessageLoading, setMessageLoading] = useState('')
  const [error, setError] = useState(null)
  const { openModal } = useModal();
  const [establecimientos, setEstablecimientos] = useState([]);

  useEffect(() => {
    const fetchNotificaciones = async (establecimientosData) => {
      setMessageLoading('Cargando notificaciones...')
      setIsLoading(true)
      setError(null)
      try {
        const data = await apiFetch(API_URLS.GetNotificaciones)

        data.forEach(notificacion => {
          notificacion.Establecimientos.map(establecimiento => {
            const establecimientoEncontrado = establecimientosData.find(d => d.EstablecimientoId === establecimiento.EstablecimientoId);
            if (establecimientoEncontrado) {
              establecimiento.Descripcion = establecimientoEncontrado.Descripcion;
            }
          });
        });

        setNotificaciones(Array.isArray(data) ? data : [])
        console.log('Notificaciones cargadas:', data)

      } catch (err) {
        console.error('Error al cargar notificaciones:', err)
        setError('No se pudieron cargar las notificaciones. Intente nuevamente más tarde.')
      } finally {
        setIsLoading(false)
        setMessageLoading('')
      }
    }

        const fetchEstablecimientos = async () => {
            setIsLoading(true);
            setMessageLoading("Cargando todos los establecimientos...");
            try {
                const data = {};
                const establecimientos = await apiFetch( API_URLS.getEstablecimientos, { method: 'POST', body: JSON.stringify(data) });

                setEstablecimientos(establecimientos);

                fetchNotificaciones(establecimientos); // Llamamos a fetchNotificaciones pasando los establecimientos obtenidos
            } catch (error) {
                showErrorAlert(`Error cargando establecimientos: ${getErrorMessage(error)}`);
            } finally {
                setIsLoading(false);
                setMessageLoading('');
             }
        };

        fetchEstablecimientos();
  }, [])

  const handleDeleteNotificacion = async (notificacionId) => {
    openModal(
      'Eliminar Notificación',
      '¿Está seguro que desea eliminar esta notificación? Esta acción no se puede deshacer.',
      async (value) => {
        try {
          const data = { DocumentoId: notificacionId };
          const response = await apiFetch(API_URLS.EliminarNotificacion, { method: 'POST', body: JSON.stringify(data) });
          if (response && response.bok === true) {
            setNotificaciones(prev => prev.filter(n => n.NotificacionId !== notificacionId));
          } else {
            console.error('Error al eliminar la notificación:', notificacionId);
            setError('No se pudo eliminar la notificación. Intente nuevamente más tarde.');
          }
        } catch (err) {
          console.error('Error al eliminar notificación:', err);
          setError('Error al eliminar la notificación. Intente nuevamente más tarde.');
        }
      }
    );
  }

  const handleViewNotificacion = (notificacionId) => {
    const notificacion = notificaciones.find(n => n.NotificacionId === notificacionId)

    if (!notificacion) {
      setError('No se encontró la notificación seleccionada.')
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
                                onClick={() => handleDeleteNotificacion(notificacion.NotificacionId)}
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
      <Loader visible={isLoading} message={MessageLoading} ShowProgress={false} />
    </>
  )
}

export default ListNotifications