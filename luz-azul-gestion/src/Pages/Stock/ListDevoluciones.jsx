import { Link } from 'react-router-dom'
import Sidebar from '../../components/Sidebar/Sidebar'
import Loader from '../../components/Loader/Loader'
import './stock.css'
import { Button, Nav, NavItem } from 'react-bootstrap'
import { FaTrash, FaEye, FaDownload } from 'react-icons/fa'
import { useDevolucionesPlanillas } from '../../hooks/useDevolucionesPlanillas'
import { formatDateTime } from '../../utils/dateTime'
import EstadoDevolucion from './EstadoDevolucion'

const ListDevoluciones = () => {
  const { planillas, isLoading, loadingMessage, error, deletePlanilla, descargarPlanilla } = useDevolucionesPlanillas()

  return (
    <>
      <Sidebar title={'Planillas de devolucion'} />
      <div className='container'>
        <div className='Container-form mb-3'>
          <div className='Container-header header-orange d-flex align-items-center justify-content-between'>
            <h5>Planillas de devolucion</h5>
            <Link to='/stock/nueva-devolucion' className='btn btn-primary'>
              Nueva Planilla
            </Link>
          </div>
          <div className='Container-content'>
            {error && <div className='alert alert-danger'>{error}</div>}
            <div className='table-responsive'>
              <table className='table table-striped align-middle'>
                <thead>
                  <tr>
                    <th>Planilla</th>
                    <th className='xs-hide'>Usuario</th>
                    <th className='xs-hide'>Deposito</th>
                    <th className='xs-hide'>Estado</th>
                    <th style={{ maxWidth: '200px' }} className='xs-hide'>Observaciones</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {planillas.length === 0 ? (
                    <tr>
                      <td colSpan='6' className='text-center'>
                        No hay planillas disponibles.
                      </td>
                    </tr>
                  ) : (
                    planillas.map((planilla) => (
                      <tr key={planilla.DevolucionId}>
                        <td>
                          <strong>N° {planilla.DevolucionId}</strong>
                          <div>{formatDateTime(planilla.Fecha)}</div>
                          <div className='xs-show mt-1'>
                            <div className='item-inventario'><span>Usuario:</span> {planilla.Usuario ?? ''}</div>
                            <div className='item-inventario'><span>Deposito:</span> {planilla.DepositoNombre ?? ''}</div>
                            <div className='item-inventario mb-1'><span>Observaciones:</span> {planilla.Observaciones ?? ''}</div>
                            <EstadoDevolucion planilla={planilla} />
                          </div>
                        </td>
                        <td className='xs-hide'>{planilla.Usuario ?? ''}</td>
                        <td className='xs-hide'>{planilla.DepositoNombre ?? ''}</td>
                        <td className='xs-hide'><EstadoDevolucion planilla={planilla} /></td>
                        <td style={{ maxWidth: '200px' }} className='xs-hide'>{planilla.Observaciones ?? ''}</td>
                        <td>
                          <Nav className='justify-content-center' style={{ gap: '10px', minWidth: '80px' }}>
                            <NavItem>
                              <Button
                                title='Ver detalle'
                                variant='outline-success'
                                size='sm'
                                as={Link}
                                to={`/stock/planilla-devolucion/${planilla.DevolucionId}`}
                              >
                                <FaEye />
                              </Button>
                            </NavItem>
                            <NavItem>
                              <Button title='Descargar' variant='outline-success' size='sm' onClick={() => descargarPlanilla(planilla.DevolucionId)}>
                                <FaDownload />
                              </Button>
                            </NavItem>
                            {/* Una vez recibida por el deposito ya no se puede eliminar */}
                            {!planilla.FechaRecepcion && (
                              <NavItem>
                                <Button
                                  title='Eliminar'
                                  variant='outline-danger'
                                  size='sm'
                                  onClick={() => deletePlanilla(planilla.DevolucionId)}
                                >
                                  <FaTrash />
                                </Button>
                              </NavItem>
                            )}
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

export default ListDevoluciones
