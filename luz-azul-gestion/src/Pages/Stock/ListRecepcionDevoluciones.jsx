import { Link } from 'react-router-dom'
import { Alert, Button, Col, Form, Nav, NavItem, Row } from 'react-bootstrap'
import { FaClipboardCheck, FaDownload, FaFileInvoiceDollar } from 'react-icons/fa'
import Sidebar from '../../components/Sidebar/Sidebar'
import Loader from '../../components/Loader/Loader'
import './stock.css'
import { useRecepcionDevoluciones, VISTAS_RECEPCION } from '../../hooks/useRecepcionDevoluciones'
import { formatDateTime } from '../../utils/dateTime'
import { CampoFecha } from '../../components/CampoFecha/CampoFecha'
import EstadoDevolucion from './EstadoDevolucion'
import NotaCreditoModal from './NotaCreditoModal'
import { motivoSinNotaCredito } from '../../utils/devoluciones'

const ListRecepcionDevoluciones = () => {
  const {
    planillas,
    total,
    vista,
    setVista,
    fechas,
    setFechas,
    buscar,
    searchTerm,
    setSearchTerm,
    isLoading,
    loadingMessage,
    error,
    mensaje,
    cerrarMensaje,
    descargarPlanilla,
    planillaNotaCredito,
    abrirNotaCredito,
    cerrarNotaCredito,
    guardarNotaCredito
  } = useRecepcionDevoluciones()

  return (
    <>
      <Sidebar title={'Recepcion de devoluciones'} />
      <div className='container'>
        <div className='Container-form mb-3'>
          <div className='Container-header header-green'>
            <h5 className='mb-0'>Recepcion de devoluciones</h5>
          </div>
          <div className='Container-content'>
            <Nav variant='tabs' activeKey={vista} onSelect={(key) => key && setVista(key)} className='mb-3'>
              {Object.entries(VISTAS_RECEPCION).map(([key, config]) => (
                <Nav.Item key={key}>
                  <Nav.Link eventKey={key}>{config.titulo}</Nav.Link>
                </Nav.Item>
              ))}
            </Nav>

            <Row className='mb-3 g-2 align-items-end'>
              {VISTAS_RECEPCION[vista].usaFechas && (
                <>
                  <Col xs={6} md={3}>
                    <Form.Label htmlFor='txtDesde' className='small mb-1'>Enviadas desde</Form.Label>
                    <CampoFecha id='txtDesde' value={fechas.desde} onChange={(desde) => setFechas((prev) => ({ ...prev, desde }))} />
                  </Col>
                  <Col xs={6} md={3}>
                    <Form.Label htmlFor='txtHasta' className='small mb-1'>Hasta</Form.Label>
                    <CampoFecha id='txtHasta' value={fechas.hasta} onChange={(hasta) => setFechas((prev) => ({ ...prev, hasta }))} />
                  </Col>
                  <Col xs={12} md='auto'>
                    <Button variant='primary' onClick={buscar}>Buscar</Button>
                  </Col>
                </>
              )}
              <Col xs={12} md>
                <Form.Control
                  id='txtBuscar'
                  type='text'
                  placeholder='Filtrar por numero, establecimiento, usuario, observacion o nota de credito'
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </Col>
            </Row>

            {error && <div className='alert alert-danger'>{error}</div>}
            {mensaje && (
              <Alert variant='success' dismissible onClose={cerrarMensaje}>{mensaje}</Alert>
            )}
            <div className='table-responsive'>
              <table className='table table-striped align-middle'>
                <thead>
                  <tr>
                    <th>Planilla</th>
                    <th className='xs-hide'>Establecimiento</th>
                    <th className='xs-hide'>Usuario</th>
                    <th className='xs-hide text-end'>Productos</th>
                    <th className='xs-hide'>Estado</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {planillas.length === 0 ? (
                    <tr>
                      <td colSpan='6' className='text-center'>
                        {total === 0 ? 'No hay planillas para mostrar.' : 'Ninguna planilla coincide con el filtro.'}
                      </td>
                    </tr>
                  ) : (
                    planillas.map((planilla) => (
                      <tr key={planilla.DevolucionId}>
                        <td>
                          <strong>N° {planilla.DevolucionId}</strong>
                          <div>{formatDateTime(planilla.Fecha)}</div>
                          <div className='xs-show mt-1'>
                            <div className='item-inventario'><span>Establecimiento:</span> {planilla.Establecimiento}</div>
                            <div className='item-inventario'><span>Usuario:</span> {planilla.Usuario}</div>
                            <div className='item-inventario mb-1'><span>Productos:</span> {planilla.Renglones}</div>
                            <EstadoDevolucion planilla={planilla} />
                          </div>
                        </td>
                        <td className='xs-hide'>{planilla.Establecimiento}</td>
                        <td className='xs-hide'>{planilla.Usuario}</td>
                        <td className='xs-hide text-end'>{planilla.Renglones}</td>
                        <td className='xs-hide'><EstadoDevolucion planilla={planilla} /></td>
                        <td>
                          <Nav className='justify-content-center' style={{ gap: '10px', minWidth: '120px' }}>
                            <NavItem>
                              <Button
                                title={planilla.FechaRecepcion ? 'Revisar' : 'Recibir'}
                                variant='outline-primary'
                                size='sm'
                                as={Link}
                                to={`/stock/recepcion-devoluciones/${planilla.DevolucionId}`}
                              >
                                <FaClipboardCheck />
                              </Button>
                            </NavItem>
                            <NavItem>
                              {/* El span lleva el title: un botón deshabilitado no muestra el tooltip */}
                              <span title={motivoSinNotaCredito(planilla) ?? (planilla.NotaCredito ? 'Modificar nota de credito' : 'Cargar nota de credito')}>
                                <Button
                                  variant={planilla.NotaCredito ? 'primary' : 'outline-primary'}
                                  size='sm'
                                  aria-label={`Nota de credito de la planilla ${planilla.DevolucionId}`}
                                  disabled={motivoSinNotaCredito(planilla) !== null}
                                  onClick={() => abrirNotaCredito(planilla)}
                                >
                                  <FaFileInvoiceDollar />
                                </Button>
                              </span>
                            </NavItem>
                            <NavItem>
                              <Button title='Descargar' variant='outline-success' size='sm' onClick={() => descargarPlanilla(planilla.DevolucionId)}>
                                <FaDownload />
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
      {planillaNotaCredito && (
        <NotaCreditoModal
          key={planillaNotaCredito.DevolucionId}
          planilla={planillaNotaCredito}
          onGuardar={guardarNotaCredito}
          onCerrar={cerrarNotaCredito}
        />
      )}
      <Loader visible={isLoading} message={loadingMessage} ShowProgress={false} />
    </>
  )
}

export default ListRecepcionDevoluciones
