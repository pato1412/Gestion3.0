import { Alert, Button, Form } from 'react-bootstrap'
import { FaCheck, FaDownload, FaTimes } from 'react-icons/fa'
import { useNavigate, useParams } from 'react-router-dom'
import Sidebar from '../../components/Sidebar/Sidebar'
import Loader from '../../components/Loader/Loader'
import ShowError from '../../components/ShowError/ShowError'
import './stock.css'
import { useFrmRecepcionDevolucion } from '../../hooks/useFrmRecepcionDevolucion'
import { CabeceraDevolucion, TablaDetalleDevolucion } from './DetalleDevolucion'

const FrmRecepcionDevolucion = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const {
    planilla,
    items,
    recibida,
    respuestas,
    setRespuesta,
    respuestaSinGuardar,
    guardandoId,
    recibirPlanilla,
    decidir,
    elegirEnvio,
    aprobarPendientes,
    descargarPlanilla,
    isLoading,
    messageLoader,
    errorMessage,
    showError,
    closeError
  } = useFrmRecepcionDevolucion(id)

  const renderEnvio = (item) => {
    const deshabilitado = !recibida || guardandoId === item.DevolucionDetalleId
    return (
      <div className='d-flex gap-1'>
        <Button
          size='sm'
          style={{ width: 'auto' }}
          variant={item.EnvioMercaderia === true ? 'primary' : 'outline-primary'}
          disabled={deshabilitado}
          aria-pressed={item.EnvioMercaderia === true}
          onClick={() => elegirEnvio(item, true)}
        >
          Enviar
        </Button>
        <Button
          size='sm'
          style={{ width: 'auto' }}
          variant={item.EnvioMercaderia === false ? 'dark' : 'outline-dark'}
          disabled={deshabilitado}
          aria-pressed={item.EnvioMercaderia === false}
          onClick={() => elegirEnvio(item, false)}
        >
          Descartar
        </Button>
      </div>
    )
  }

  const renderRespuesta = (item) => {
    const guardando = guardandoId === item.DevolucionDetalleId
    return (
      <div className='d-flex gap-1 align-items-center'>
        <Form.Control
          size='sm'
          value={respuestas[item.DevolucionDetalleId] ?? ''}
          onChange={(e) => setRespuesta(item.DevolucionDetalleId, e.target.value)}
          placeholder={recibida ? 'Respuesta (opcional)' : ''}
          maxLength={255}
          disabled={!recibida}
          isInvalid={respuestaSinGuardar(item)}
          title={respuestaSinGuardar(item) ? 'Respuesta sin guardar: volve a aprobar o rechazar' : undefined}
        />
        <Button
          size='sm'
          title='Aprobar'
          style={{ width: 'auto' }}
          variant={item.Aprobado === true ? 'success' : 'outline-success'}
          disabled={!recibida || guardando}
          onClick={() => decidir(item, true)}
        >
          <FaCheck />
        </Button>
        <Button
          size='sm'
          title='Rechazar'
          style={{ width: 'auto' }}
          variant={item.Aprobado === false ? 'danger' : 'outline-danger'}
          disabled={!recibida || guardando}
          onClick={() => decidir(item, false)}
        >
          <FaTimes />
        </Button>
      </div>
    )
  }

  return (
    <>
      <Sidebar title={'Recepcion de devoluciones'} />
      <div className='container'>
        <ShowError message={errorMessage} show={showError} onClose={closeError} />
        {planilla && (
          <>
            <div className='Container-form mb-3'>
              <div className='Container-header header-green d-flex align-items-center justify-content-between'>
                <h5 className='mb-0'>Planilla de devolucion N° {planilla.DevolucionId}</h5>
                <Button variant='outline-success' size='sm' onClick={descargarPlanilla}>
                  <FaDownload className='me-1' /> Excel
                </Button>
              </div>
              <div className='Container-content'>
                <CabeceraDevolucion planilla={planilla} />
                {!recibida && (
                  <Alert variant='warning' className='mb-0 mt-2 d-flex flex-wrap align-items-center justify-content-between gap-2'>
                    <span>Cuando llegue la mercaderia, marca la planilla como recibida para aprobar o rechazar cada producto.</span>
                    <Button variant='primary' onClick={recibirPlanilla}>Marcar como recibida</Button>
                  </Alert>
                )}
              </div>
            </div>
            <div className='Container-form mb-3'>
              <div className='Container-header header-green d-flex align-items-center justify-content-between'>
                <h5 className='mb-0'>Productos</h5>
                {recibida && planilla.PendientesAprobacion > 0 && (
                  <Button variant='outline-success' size='sm' onClick={aprobarPendientes}>
                    Aprobar {planilla.PendientesAprobacion} pendientes
                  </Button>
                )}
              </div>
              <div className='Container-content'>
                <TablaDetalleDevolucion items={items} renderEnvio={renderEnvio} renderRespuesta={renderRespuesta} />
              </div>
            </div>
          </>
        )}
        <div className='mb-3 d-flex justify-content-end'>
          <Button onClick={() => navigate('/stock/recepcion-devoluciones')} variant='primary'>Volver a recepcion</Button>
        </div>
      </div>
      <Loader visible={isLoading} message={messageLoader} />
    </>
  )
}

export default FrmRecepcionDevolucion
