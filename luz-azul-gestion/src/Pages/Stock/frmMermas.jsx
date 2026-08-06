import {FaTrash } from 'react-icons/fa'
import Sidebar from '../../components/Sidebar/Sidebar'
import './stock.css'
import { Button, Row, Col, Form } from 'react-bootstrap'
import { Typeahead } from 'react-bootstrap-typeahead'
import Loader from '../../components/Loader/Loader'
import ShowError from '../../components/ShowError/ShowError'
import { useFrmMermas } from '../../hooks/useFrmMermas'


const FrmMermas = () => {
    const {
        dateStart,
        singleSelections,
        setSingleSelections,
        options,
        isLoading,
        searchTerm,
        setSearchTerm,
        errorMessage,
        showError,
        closeError,
        progress,
        messageLoader,
        lastSavedTime,
        inputRefCantidad,
        inputRefCodigo,
        inputRefConcepto,
        conceptos,
        handleSelectConceptos,
        ingresarProducto,
        eliminarItem,
        handleGuardarPlanilla,
        filteredItems
    } = useFrmMermas()

  return (    
    <>
        <Sidebar title={"Planilla de mermas"} />
        <div className='container' >
                <p className='text-muted text-end'>
                    Fecha inicio: {dateStart.getDate() }/{dateStart.getMonth() + 1}/{dateStart.getFullYear() } - {dateStart.getHours()}:{dateStart.getMinutes()}
                    {lastSavedTime && (
                        <span className='ms-3'>
                            | Autoguardado: {lastSavedTime.getDate()}/{lastSavedTime.getMonth() + 1}/{lastSavedTime.getFullYear()} - {lastSavedTime.getHours()}:{String(lastSavedTime.getMinutes()).padStart(2, '0')}
                        </span>
                    )}
                </p>
                <div className='Container-stock-form mb-3'>                
                    <div className='Container-mermas-header'>
                        <h5>Seleccion de concepto</h5>
                    </div>
                    <div className='Container-stock-content'>
                        <Row>
                            <Col xs={12} md={6} className='mb-3'  >
                                <Form.Select
                                    ref={inputRefConcepto}
                                    id='txtConcepto'
                                    placeholder="Seleccione un concepto"
                                    onChange={handleSelectConceptos}
                                      >
                                    <option key="0" value="0">
                                        Seleccione un concepto
                                    </option>
                                    {conceptos.map((concepto) => (
                                        <option key={concepto.ConfigId} value={concepto.ConfigId}>
                                            {concepto.Descripcion}
                                        </option>
                                    ))}
                                </Form.Select>
                            </Col>
                        </Row>
                    </div>
                </div>
                <div className='Container-stock-form mb-3'>                
                    <div className='Container-mermas-header'>
                        <h5>Seleccion de producto</h5>
                    </div>
                    <div className='Container-stock-content'>
                    <Row >
                        <Col xs={12} md={6} className='mb-3'  >
                            <Form.Label htmlFor="txtCodigo">Codigo</Form.Label>
                            <Typeahead
                                ref={inputRefCodigo}
                                id='txtCodigo' 
                                defaultInputValue=''  
                                onChange={(singleSelections) => {
                                    setSingleSelections(singleSelections);
                                }}
                                options={options} 
                                selected={singleSelections} 
                                labelKey={(option) => `${option.ProductoId} ${option.Descripcion}`}
                                placeholder="Ingrese el codigo del producto"
                            />
                            <Form.Text id="txtCodigoHelpBlock" muted>
                                Por favor, ingrese el código del producto con el scanner o el teclado.
                            </Form.Text>
                        </Col>
                        <Col xs={6} md={3} className='mb-3'>
                            <Form.Label htmlFor="txtCantidadContada">Cantidad</Form.Label>
                            <Form.Control
                                ref={inputRefCantidad}
                                id='txtCantidadContada'
                                placeholder="Cantidad"
                                aria-label="Cantidad"
                                type='number'
                                maxLength={15}                    
                            />
                        </Col>
                        <Col className="mb-3 d-flex d-flex align-items-center" xs={6} md={3}>
                            <Button onClick={ingresarProducto}   variant="success">Ingresar</Button>                   
                        </Col>
                    </Row>
                </div>
            </div>
            <div className='Container-mermas-form mb-3'>
                <div className='Container-mermas-header'>
                    <h5>Planilla de mermas</h5>
                </div>
                <div className='Container-stock-content'>
                    <Row className='mb-3'>
                        <Col xs={12} md={6}>
                            <Form.Control
                                id="txtBuscar"
                                type="text"
                                placeholder="Buscar por código o descripción"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </Col>
                    </Row>
                    <table className="table table-striped">
                        <thead>
                            <tr>    
                                <th className=''>Producto</th>
                                <th className='w-15 text-end'>Cantidad</th>
                                <th className='w-5' ></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredItems.map((item, index) => (
                                <tr key={index}>
                                    <td className='' >
                                        <Form.Label htmlFor="txtCodigo">{item.ProductoId} - {item.Descripcion}</Form.Label>
                                    </td>
                                    <td className='text-end w-15' >
                                        <div className='cantidades-container'>
                                            {item.Cantidades.length > 1 && (
                                            <div className='cantidades-item'>
                                                {item.Cantidades.map((cantidad, i) => (
                                                    <div key={i} >
                                                        {cantidad}
                                                    </div>
                                                ))}
                                            </div>
                                            )}
                                            <div className='cantidades-total'>
                                                {item.CantidadContada}
                                            </div> 
                                        </div>
                                    </td>
                                    <td className='w-5' >
                                        <Button variant="outline-danger" size="sm" onClick={() => eliminarItem(item)}>
                                            <FaTrash />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            <Row >
                <Col className="mb-3 d-flex d-flex align-items-center justify-content-end" xs={12} md={12}>
                    <Button onClick={handleGuardarPlanilla} variant="primary">Guardar planilla</Button>                   
                </Col>
            </Row>
            <ShowError
                message={errorMessage}
                show={showError}
                onClose={closeError}
            />  
        </div>
        <Loader visible={isLoading} message={messageLoader} ShowProgress={true} progress={progress} />
    </>
    )
}

export default FrmMermas