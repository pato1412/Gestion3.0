import { Badge } from 'react-bootstrap'
import { estadoPlanillaDevolucion } from '../../utils/devoluciones'

// Estado de una planilla de devolución (recepción y aprobación), para los listados de los dos perfiles
const EstadoDevolucion = ({ planilla }) => {
  const estado = estadoPlanillaDevolucion(planilla)

  return (
    <>
      <Badge bg={estado.variant} text={estado.variant === 'warning' ? 'dark' : undefined}>{estado.texto}</Badge>
      {planilla.FechaRecepcion && (
        <div className='small text-muted mt-1'>
          {planilla.Aprobados} aprobados, {planilla.Rechazados} rechazados de {planilla.Renglones}
        </div>
      )}
    </>
  )
}

export default EstadoDevolucion
