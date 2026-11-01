import { FaTrash } from 'react-icons/fa'
import Sidebar from '../../components/Sidebar/Sidebar'
import './stock.css'
import { Button, Row, Col, Form } from 'react-bootstrap'
import { Typeahead } from 'react-bootstrap-typeahead'
import Loader from '../../components/Loader/Loader'
import ShowError from '../../components/ShowError/ShowError'
import { useFrmDevoluciones } from '../../hooks/useFrmDevoluciones'
import { formatDate, formatNumber } from '../../utils/devoluciones'
import { formatDateTime } from '../../utils/dateTime'

const FrmDevoluciones = () => {
  const {
    dateStart,
    singleSelections,
    options,
    isLoading,
    searchTerm,
    setSearchTerm,
    errorMessage,
    showError,
    closeError,
    messageLoader,
    lastSavedTime,
    inputRefCodigo,
    inputRefUnidades,
    inputRefKilos,
    inputRefVencimiento,
    inputRefLote,
    inputRefCausa,
    handleProductSelection,
    ingresarProducto,
    eliminarItem,
    handleGuardarPlanilla,
    items,
    filteredItems
  } = useFrmDevoluciones()

  return (
    <>
      <Sidebar title={'Planilla de devoluciones'} />
      <div className='container'>
        <ShowError message={errorMessage} show={showError} onClose={closeError} />
        <p className='text-muted text-end'>
          Fecha inicio: {formatDateTime(dateStart)}
          {lastSavedTime && <span className='ms-3'>| Autoguardado: {formatDateTime(lastSavedTime)}</span>}
        </p>

        <div className='Container-form mb-3'>
          <div className='Container-header header-orange'>
            <h5>Producto a devolver</h5>
          </div>
          <div className='Container-content'>
            <Row>
              <Col xs={12} md={6} className='mb-3'>
                <Form.Label htmlFor='txtCodigo'>Producto</Form.Label>
                <Typeahead
                  ref={inputRefCodigo}
                  id='txtCodigo'
                  onChange={handleProductSelection}
                  options={options}
                  selected={singleSelections}
                  labelKey={(option) => `${option.ProductoId} ${option.Descripcion}`}
                  placeholder='Ingrese el codigo o la descripcion del producto'
                />
              </Col>
              <Col xs={6} md={3} className='mb-3'>
                <Form.Label htmlFor='txtUnidades'>Unidades</Form.Label>
                <Form.Control ref={inputRefUnidades} id='txtUnidades' placeholder='Unidades' type='number' min={0} step={1} />
              </Col>
              <Col xs={6} md={3} className='mb-3'>
                <Form.Label htmlFor='txtKilos'>Kilos</Form.Label>
                <Form.Control ref={inputRefKilos} id='txtKilos' placeholder='Kilos' type='number' min={0} step='0.001' />
              </Col>
            </Row>
            <Row>
              <Col xs={12} md={6} className='mb-3'>
                <Form.Label htmlFor='txtCausa'>Causa</Form.Label>
                <Form.Control ref={inputRefCausa} id='txtCausa' placeholder='Motivo de la devolucion' type='text' maxLength={255} />
              </Col>
              <Col xs={6} md={3} className='mb-3'>
                <Form.Label htmlFor='txtLote'>Lote</Form.Label>
                <Form.Control ref={inputRefLote} id='txtLote' placeholder='Lote' type='text' maxLength={255} />
              </Col>
              <Col xs={6} md={3} className='mb-3'>
                <Form.Label htmlFor='txtVencimiento'>Vencimiento</Form.Label>
                <Form.Control ref={inputRefVencimiento} id='txtVencimiento' type='date' />
              </Col>
            </Row>
            <Row>
              <Col className='mb-1 d-flex align-items-center justify-content-end' xs={12}>
                <Button onClick={ingresarProducto} variant='success'>Agregar a la planilla</Button>
              </Col>
            </Row>
          </div>
        </div>

        <div className='Container-form mb-3'>
          <div className='Container-header header-orange d-flex align-items-center justify-content-between'>
            <h5 className='mb-0'>Productos de la planilla</h5>
            <span className='text-muted'>{items.length} {items.length === 1 ? 'producto' : 'productos'}</span>
          </div>
          <div className='Container-content'>
            <Row className='mb-3'>
              <Col xs={12} md={6}>
                <Form.Control
                  id='txtBuscar'
                  type='text'
                  placeholder='Buscar por codigo, descripcion, lote o causa'
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </Col>
            </Row>
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
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan='7' className='text-center text-muted'>
                        {items.length === 0 ? 'Todavia no agrego productos.' : 'Ningun producto coincide con la busqueda.'}
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item) => (
                      <tr key={item.Id}>
                        <td>
                          {item.ProductoId} - {item.Descripcion}
                          <div className='xs-show'>
                            <div className='item-inventario'><span>Unidades / Kilos:</span> {formatNumber(item.Unidades) || '-'} / {formatNumber(item.Kilos) || '-'}</div>
                            {item.Vencimiento && <div className='item-inventario'><span>Vencimiento:</span> {formatDate(`${item.Vencimiento}T00:00:00`)}</div>}
                            {item.Lote && <div className='item-inventario'><span>Lote:</span> {item.Lote}</div>}
                            {item.Causa && <div className='item-inventario'><span>Causa:</span> {item.Causa}</div>}
                          </div>
                        </td>
                        <td className='text-end xs-hide'>{formatNumber(item.Unidades)}</td>
                        <td className='text-end xs-hide'>{formatNumber(item.Kilos)}</td>
                        <td className='xs-hide'>{item.Vencimiento ? formatDate(`${item.Vencimiento}T00:00:00`) : ''}</td>
                        <td className='xs-hide'>{item.Lote}</td>
                        <td className='xs-hide'>{item.Causa}</td>
                        <td className='text-end'>
                          <Button title='Quitar' variant='outline-danger' size='sm' onClick={() => eliminarItem(item)}>
                            <FaTrash />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <Row>
          <Col className='mb-3 d-flex align-items-center justify-content-end' xs={12}>
            <Button onClick={handleGuardarPlanilla} variant='primary' disabled={items.length === 0}>
              Enviar planilla
            </Button>
          </Col>
        </Row>
      </div>
      <Loader visible={isLoading} message={messageLoader} />
    </>
  )
}

export default FrmDevoluciones
