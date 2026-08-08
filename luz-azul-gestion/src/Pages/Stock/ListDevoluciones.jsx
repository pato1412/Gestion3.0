import { Link } from 'react-router-dom'
import Sidebar from '../../components/Sidebar/Sidebar'
import Loader from '../../components/Loader/Loader'
import './stock.css'
import { Button, Nav, NavItem } from 'react-bootstrap'
import { FaTrash, FaEye } from 'react-icons/fa'
import { useDevolucionesPlanillas } from '../../hooks/useDevolucionesPlanillas'
import { formatDateTime } from '../../utils/dateTime'

const ListDevoluciones = () => {
  const { planillas, isLoading, loadingMessage, error, deletePlanilla } = useDevolucionesPlanillas()

  return (
    <>
      <Sidebar title={'Planillas de devolucion'} />
      <div className='container'>
        <div className='Container-mermas-form mb-3'>
          <div className='Container-mermas-header d-flex align-items-center justify-content-between'>
            <h5>Planillas de devolucion</h5>
            <Link to='/stock/nueva-planilla-devolucion' className='btn btn-primary'>
              Nueva Planilla
            </Link>
          </div>
          <div className='Container-stock-content'>
            {error && <div className='alert alert-danger'>{error}</div>}
            <div className='table-responsive'>
              <table className='table table-striped'>
                <thead>
                  <tr>
                    <th className='xs-hide'>Usuario</th>
                    <th><span className='xs-hide'>Fecha</span><span className='xs-show'>Planilla</span></th>
                    <th className='xs-hide'>Deposito</th>
                    <th style={{ maxWidth: '200px' }} className='xs-hide'>Observaciones</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {planillas.length === 0 ? (
                    <tr>
                      <td colSpan='5' className='text-center'>
                        No hay planillas disponibles.
                      </td>
                    </tr>
                  ) : (
                    planillas.map((planilla) => (
                      <tr key={planilla.DevolucionId}>
                        <td className='xs-hide'>{planilla.Usuario ?? ''}</td>
                        <td>
                          <div className='xs-show'>
                            <div className='item-inventario'><span>Usuario:</span> {planilla.Usuario ?? ''}</div>
                            <div className='item-inventario'><span>Deposito:</span> {planilla.DepositoNombre ?? ''}</div>
                            <div className='item-inventario'><span>Fecha:</span> {formatDateTime(planilla.Fecha)}</div>
                            <div className='item-inventario'><span>Observaciones:</span> {planilla.Observaciones ?? ''}</div>
                          </div>
                          <div className='xs-hide'>
                            Fecha: {formatDateTime(planilla.Fecha)}
                          </div>
                        </td>
                        <td className='xs-hide'>{planilla.DepositoNombre ?? ''}</td>
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
                              <Button
                                title='Eliminar'
                                variant='outline-danger'
                                size='sm'
                                onClick={() => deletePlanilla(planilla.DevolucionId)}
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

export default ListDevoluciones