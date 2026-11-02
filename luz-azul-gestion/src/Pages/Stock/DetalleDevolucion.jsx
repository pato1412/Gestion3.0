import { Badge, Col, Row } from 'react-bootstrap'
import { formatDate, formatDateTime } from '../../utils/dateTime'
import { estadoRenglonDevolucion, formatNumber } from '../../utils/devoluciones'
import EstadoDevolucion from './EstadoDevolucion'

const Dato = ({ titulo, children }) => (
  <Col xs={12} sm={6} lg={4} className='mb-2'>
    <div className='small text-muted'>{titulo}</div>
    <div>{children}</div>
  </Col>
)

// Encabezado de una planilla de devolución (lo usan el local y el depósito)
export const CabeceraDevolucion = ({ planilla }) => (
  <Row>
    <Dato titulo='Planilla'>N° {planilla.DevolucionId}</Dato>
    <Dato titulo='Establecimiento'>{planilla.Establecimiento}</Dato>
    <Dato titulo='Usuario'>{planilla.Usuario}</Dato>
    <Dato titulo='Enviada'>{formatDateTime(planilla.Fecha)}</Dato>
    <Dato titulo='Recibida por el deposito'>{planilla.FechaRecepcion ? formatDateTime(planilla.FechaRecepcion) : '-'}</Dato>
    <Dato titulo='Estado'><EstadoDevolucion planilla={planilla} /></Dato>
    {planilla.Observaciones && <Dato titulo='Observaciones'>{planilla.Observaciones}</Dato>}
  </Row>
)

const EstadoRenglon = ({ renglon }) => {
  const estado = estadoRenglonDevolucion(renglon)
  return <Badge bg={estado.variant}>{estado.texto}</Badge>
}

/**
 * Renglones de la planilla. renderRespuesta permite reemplazar la columna Respuesta
 * (en recepción, el campo de texto y los botones para aprobar o rechazar).
 */
export const TablaDetalleDevolucion = ({ items, renderRespuesta }) => (
  <div className='table-responsive'>
    <table className='table table-striped align-middle'>
      <thead>
        <tr>
          <th>Producto</th>
          <th className='text-end xs-hide'>Unidades</th>
          <th className='text-end xs-hide'>Kilos</th>
          <th className='xs-hide'>Vencimiento</th>
          <th className='xs-hide'>Lote</th>
          <th className='xs-hide'>Causa</th>
          <th className='xs-hide'>Estado</th>
          <th className='xs-hide' style={{ minWidth: renderRespuesta ? '260px' : undefined }}>Respuesta</th>
        </tr>
      </thead>
      <tbody>
        {items.length === 0 ? (
          <tr>
            <td colSpan='8' className='text-center text-muted'>La planilla no tiene productos.</td>
          </tr>
        ) : (
          items.map((item) => (
            <tr key={item.DevolucionDetalleId}>
              <td>
                {item.ProductoId}{item.Descripcion ? ` - ${item.Descripcion}` : ''}
                <div className='xs-show'>
                  <div className='item-inventario'><span>Unidades / Kilos:</span> {formatNumber(item.Unidades) || '-'} / {formatNumber(item.Kilos) || '-'}</div>
                  {item.Vencimiento && <div className='item-inventario'><span>Vencimiento:</span> {formatDate(item.Vencimiento)}</div>}
                  {item.Lote && <div className='item-inventario'><span>Lote:</span> {item.Lote}</div>}
                  {item.Causa && <div className='item-inventario'><span>Causa:</span> {item.Causa}</div>}
                  <div className='mt-1'><EstadoRenglon renglon={item} /></div>
                  {/* En el celular la respuesta va debajo del producto */}
                  {renderRespuesta
                    ? <div className='mt-2'>{renderRespuesta(item)}</div>
                    : item.Respuesta && <div className='item-inventario mt-1'><span>Respuesta:</span> {item.Respuesta}</div>}
                </div>
              </td>
              <td className='text-end xs-hide'>{formatNumber(item.Unidades)}</td>
              <td className='text-end xs-hide'>{formatNumber(item.Kilos)}</td>
              <td className='xs-hide'>{formatDate(item.Vencimiento)}</td>
              <td className='xs-hide'>{item.Lote}</td>
              <td className='xs-hide'>{item.Causa}</td>
              <td className='xs-hide'><EstadoRenglon renglon={item} /></td>
              <td className='xs-hide'>{renderRespuesta ? renderRespuesta(item) : item.Respuesta}</td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
)
