import { Button } from 'react-bootstrap'
import { FaDownload } from 'react-icons/fa'
import { useNavigate, useParams } from 'react-router-dom'
import Sidebar from '../../components/Sidebar/Sidebar'
import Loader from '../../components/Loader/Loader'
import ShowError from '../../components/ShowError/ShowError'
import './stock.css'
import { useViewDevolucion } from '../../hooks/useViewDevolucion'
import { CabeceraDevolucion, TablaDetalleDevolucion } from './DetalleDevolucion'

const ViewDevolucion = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const { planilla, items, isLoading, messageLoader, errorMessage, showError, closeError, descargarPlanilla } = useViewDevolucion(id)

  return (
    <>
      <Sidebar title={'Planilla de devolucion'} />
      <div className='container'>
        <ShowError message={errorMessage} show={showError} onClose={closeError} />
        {planilla && (
          <>
            <div className='Container-stock-form mb-3'>
              <div className='Container-mermas-header d-flex align-items-center justify-content-between'>
                <h5 className='mb-0'>Planilla de devolucion N° {planilla.DevolucionId}</h5>
                <Button variant='outline-success' size='sm' onClick={descargarPlanilla}>
                  <FaDownload className='me-1' /> Excel
                </Button>
              </div>
              <div className='Container-stock-content'>
                <CabeceraDevolucion planilla={planilla} />
              </div>
            </div>
            <div className='Container-stock-form mb-3'>
              <div className='Container-mermas-header'>
                <h5 className='mb-0'>Productos</h5>
              </div>
              <div className='Container-stock-content'>
                <TablaDetalleDevolucion items={items} />
              </div>
            </div>
          </>
        )}
        <div className='mb-3 d-flex justify-content-end'>
          <Button onClick={() => navigate('/stock/listar-devoluciones')} variant='primary'>Volver a la lista</Button>
        </div>
      </div>
      <Loader visible={isLoading} message={messageLoader} />
    </>
  )
}

export default ViewDevolucion
