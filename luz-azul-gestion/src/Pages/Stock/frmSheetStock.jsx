import { FaSearch } from 'react-icons/fa'
import Sidebar from '../../components/Sidebar/Sidebar'
import './stock.css'
import { Link } from 'react-router-dom'
import { InputGroup, Button, Row, Col, Form } from 'react-bootstrap'
import { Typeahead } from 'react-bootstrap-typeahead'
import { useState, useEffect } from 'react'
import { apiFetch } from '../../config/api'
import Loader from '../../components/Loader/Loader'

const FrmSheetStock = () => {

    const [singleSelections, setSingleSelections] = useState([]);
    const [options, setOptions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchProductos = async () => {
            setIsLoading(true);
            try {
                const data = { Activo: true, TipoProducto: 0, DeVentas: true, DeCompras: true , ResultadosPorPagina : import.meta.env.VITE_ST_RESULTADOS_POR_PAGINA, Pagina: 1 };
                const productos = await apiFetch(import.meta.env.VITE_API_GET_ALL_PRODUCTOS_URL, { method: 'POST', body: JSON.stringify(data) });
                setOptions(productos);
            } catch (error) {
                console.error('Error fetching productos:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchProductos();
    }, []);

    const MockGrid = [
        { ProductoId: '001', Descripcion: 'Cremoso Luz Azul x Kg', StockActual: 100, CantidadContada: 95 },
        { ProductoId: '002', Descripcion: 'Por Salut Luz Azul x Kg', StockActual: 50, CantidadContada: 50 },
        { ProductoId: '003', Descripcion: 'Por Salut Sin Sal Descrem Luz Azul x Kg', StockActual: 200, CantidadContada: 190 },
    ]

  return (    
    <>
        <Sidebar title={"Planilla de stock"} />
        <div className='container' >
            <div className='Container-stock-form mb-3'>
                <div className='Container-stock-header'>
                    <h4>Seleccion de producto</h4>
                </div>
                <div className='Container-stock-content'>
                    <Row >
                        <Col xs={12} md={6} className='mb-3'  >
                            <Form.Label htmlFor="inputPassword5">Codigo</Form.Label>
                            <Typeahead 
                                defaultInputValue=''  
                                onChange={(singleSelections) => {
                                    setSingleSelections(singleSelections);
                                    console.log('selected: ', singleSelections);
                                }}
                                options={options} 
                                selected={singleSelections} 
                                labelKey={(option) => `${option.ProductoId} ${option.Descripcion}`}
                                placeholder="Ingrese el codigo del producto"
                            />
                            <Form.Text id="passwordHelpBlock" muted>
                                Por favor, ingrese el código del producto con el scanner o el teclado.
                            </Form.Text>
                        </Col>
                        <Col xs={6} md={2} className='mb-3' >
                            <Form.Label htmlFor="inputPassword5">Stock</Form.Label>
                            <Form.Control
                                placeholder="Stock actual"
                                aria-label="Stock actual"
                                aria-describedby="basic-addon2"
                            />
                        </Col>
                        <Col xs={6} md={2} className='mb-3'>
                            <Form.Label htmlFor="inputPassword5">Cantidad contada</Form.Label>
                            <Form.Control
                                placeholder="Stock actual"
                                aria-label="Stock actual"
                                aria-describedby="basic-addon2"
                            />
                        </Col>
                        <Col className="mb-3 d-flex d-flex align-items-center" xs={6} md={2}>
                            <Button   variant="success">Ingresar</Button>                   
                        </Col>
                    </Row>
                </div>
            </div>
            <div className='Container-stock-form mb-3'>
                <div className='Container-stock-header'>
                    <h4>Planilla de stock</h4>
                </div>
                <div className='Container-stock-content'>
                    <table className="table table-striped">
                        <thead>
                            <tr>    
                                <th>Código</th>
                                <th>Descripción</th>
                                <th>Stock Actual</th>
                                <th>Cantidad Contada</th>
                            </tr>
                        </thead>
                        <tbody>
                            {MockGrid.map((item, index) => (
                                <tr key={index}>
                                    <td>{item.ProductoId}</td>
                                    <td>{item.Descripcion}</td>
                                    <td className='text-end' >{item.StockActual}</td>
                                    <td className='text-end' >{item.CantidadContada}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>    
        </div>
        <Loader visible={isLoading} message='Cargando todos los productos de simple tempo' />
    </>
  )
}

export default FrmSheetStock