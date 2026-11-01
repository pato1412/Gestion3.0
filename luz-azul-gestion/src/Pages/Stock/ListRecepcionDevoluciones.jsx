import { Link } from 'react-router-dom'
import { Button, Col, Form, Nav, NavItem, Row } from 'react-bootstrap'
import { FaClipboardCheck, FaDownload } from 'react-icons/fa'
import Sidebar from '../../components/Sidebar/Sidebar'
import Loader from '../../components/Loader/Loader'
import './stock.css'
import { useRecepcionDevoluciones, VISTAS_RECEPCION } from '../../hooks/useRecepcionDevoluciones'
import { formatDateTime } from '../../utils/dateTime'
import EstadoDevolucion from './EstadoDevolucion'

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
    descargarPlanilla
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
                    <Form.Control id='txtDesde' type='date' value={fechas.desde} onChange={(e) => setFechas((prev) => ({ ...prev, desde: e.target.value }))} />
                  </Col>
                  <Col xs={6} md={3}>
                    <Form.Label htmlFor='txtHasta' className='small mb-1'>Hasta</Form.Label>
                    <Form.Control id='txtHasta' type='date' value={fechas.hasta} onChange={(e) => setFechas((prev) => ({ ...prev, hasta: e.target.value }))} />
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
                  placeholder='Filtrar por numero, establecimiento, usuario u observacion'
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </Col>
            </Row>

            {error && <div className='alert alert-danger'>{error}</div>}
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
                          <Nav className='justify-content-center' style={{ gap: '10px', minWidth: '80px' }}>
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
      <Loader visible={isLoading} message={loadingMessage} ShowProgress={false} />
    </>
  )
}

export default ListRecepcionDevoluciones
