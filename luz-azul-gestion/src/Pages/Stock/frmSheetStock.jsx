import {FaTrash } from 'react-icons/fa'
import Sidebar from '../../components/Sidebar/Sidebar'
import './stock.css'
import { Link } from 'react-router-dom'
import { Button, Row, Col, Form, ProgressBar } from 'react-bootstrap'
import { Typeahead } from 'react-bootstrap-typeahead'
import { useState, useEffect, useRef } from 'react'
import { apiFetch, downloadFile } from '../../config/api'
import Loader from '../../components/Loader/Loader'
import { useDeposito } from '../../contexts/DepositoContext'
import { API_URLS } from '../../config/api'

const FrmSheetStock = () => {

    const [singleSelections, setSingleSelections] = useState([]);
    const [options, setOptions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [items, setItems] = useState([]);
    const [progress, setProgress] = useState(0);
    const [messageLoader, setMessageLoader] = useState("Cargando, por favor espere...");
    const inputRefStock = useRef(null);
    const inputRefCantidad = useRef(null);
    const { DepositoId } = useDeposito();

    useEffect(() => {
        const fetchProductos = async () => {
            setIsLoading(true);
            setMessageLoader("Cargando todos los productos de simple tempo...");
            setProgress(0);
            try {
                const data = { Activo: true, TipoProducto: 0, DeVentas: true, DeCompras: true , ResultadosPorPagina : import.meta.env.VITE_ST_RESULTADOS_POR_PAGINA, Pagina: 1 };
                const productos = await apiFetch( API_URLS.GetAllProductos, { method: 'POST', body: JSON.stringify(data) });
                const formattedProductos = productos.map(producto => ({
                    ProductoId: producto.ProductoId,
                    Descripcion: producto.Descripcion,
                    StockActual: 0,
                    Cantidades: [],
                    CantidadContada: 0
                }));


                /* Determino cuantas páginas de productos hay que consultar para obtener el stock de cada producto, y luego itero sobre cada página consultando el stock de los productos que corresponda a esa página */
                setMessageLoader("Cargando stock de simple tempo...");
                let paginas = Math.ceil(formattedProductos.length / import.meta.env.VITE_ST_RESULTADOS_POR_PAGINA_STOCK);

                for (let paginaActual = 1; paginaActual <= paginas; paginaActual++) {
                    let sliceProductos = formattedProductos.slice((paginaActual - 1) * import.meta.env.VITE_ST_RESULTADOS_POR_PAGINA_STOCK, paginaActual * import.meta.env.VITE_ST_RESULTADOS_POR_PAGINA_STOCK);
                    try {
                        const stockData = await apiFetch(API_URLS.GetStockByProductosDepositoId, { method: 'POST', body: JSON.stringify({ ProductosIds: sliceProductos.map(p => p.ProductoId), DepositoId: DepositoId, ResultadosPorPagina: import.meta.env.VITE_ST_RESULTADOS_POR_PAGINA_STOCK, Pagina: paginaActual })});
                        if (stockData && Array.isArray(stockData)) {
                            stockData.forEach(stockItem => {
                                const idx = formattedProductos.findIndex(p => p.ProductoId === stockItem.ProductoId);
                                if (idx !== -1) {
                                    formattedProductos[idx].StockActual = stockItem.Stock || 0;
                                }
                            });
                        }
                    } catch (error) {
                        console.error(`Error fetching stock for producto en la pagina ${paginaActual}:`, error);
                    }
                    setProgress((paginaActual / paginas) * 100);
                }

                //luego de obtener los productos, obtenemos el stock actual de cada producto
                setOptions(formattedProductos);
            } catch (error) {
                console.error('Error fetching productos:', error);
            } finally {
                setIsLoading(false);
                setProgress(100);
            }
        };

        fetchProductos();
    }, []);


    const IngresarProducto = () => {
        if (singleSelections.length > 0) {
            const productoSeleccionado = singleSelections[0];
            if (items.some(item => item.ProductoId === productoSeleccionado.ProductoId)) {
               // Si el producto ya existe, actualizamos las cantidades
               var itemExistente = items.find(item => item.ProductoId === productoSeleccionado.ProductoId);
               itemExistente.Cantidades.push(Number(inputRefCantidad.current.value));
               itemExistente.CantidadContada = itemExistente.Cantidades.reduce((total, cantidad) => total + cantidad, 0);
               setItems(prevItems => prevItems.map(item => item.ProductoId === itemExistente.ProductoId ? itemExistente : item));    
            }else {
                // Si el producto no existe, lo agregamos a la lista
                productoSeleccionado.Cantidades.push(Number(inputRefCantidad.current.value));
                productoSeleccionado.CantidadContada = productoSeleccionado.Cantidades.reduce((total, cantidad) => total + cantidad, 0);
                setItems(prevItems => [...prevItems, productoSeleccionado]);
            }
            // Limpiar los campos después de ingresar el producto
            setSingleSelections([]);
            inputRefStock.current.value = '';
            inputRefCantidad.current.value = '';
        }
    }

    const EliminarItem = (item) => {
        setItems(prevItems => prevItems.filter(i => i.ProductoId !== item.ProductoId));
    }

    const handleDescargar = async () => {
        try {            
            const data = items.map(item => ({
                ProductoId: item.ProductoId,
                Descripcion: item.Descripcion,
                StockActual: item.StockActual,
                Cantidades: item.Cantidades,
                CantidadContada: item.CantidadContada
            }));
            const excelfile = await downloadFile(import.meta.env.VITE_API_EXCEL_URL, "planilla_stock.xlsx", { method: 'POST', body: JSON.stringify(data) });
        } catch (error) {
            console.error('Error descargando el archivo:', error);
        }
    }

  return (    
    <>
        <Sidebar title={"Planilla de stock"} />
        <div className='container' >
                <div className='Container-stock-form mb-3'>
                    <div className='Container-stock-header'>
                        <h5>Seleccion de producto</h5>
                    </div>
                    <div className='Container-stock-content'>
                    <Row >
                        <Col xs={12} md={6} className='mb-3'  >
                            <Form.Label htmlFor="txtCodigo">Codigo</Form.Label>
                            <Typeahead
                                id='txtCodigo' 
                                defaultInputValue=''  
                                onChange={(singleSelections) => {
                                    setSingleSelections(singleSelections);
                                    inputRefStock.current.value = singleSelections[0]?.StockActual || '0';
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
                        <Col xs={6} md={2} className='mb-3' >
                            <Form.Label htmlFor="txtStock">Stock</Form.Label>
                            <Form.Control
                                ref={inputRefStock}
                                id='txtStock'
                                placeholder="Stock actual"
                                aria-label="Stock actual"
                            />
                        </Col>
                        <Col xs={6} md={2} className='mb-3'>
                            <Form.Label htmlFor="txtCantidadContada">Cantidad contada</Form.Label>
                            <Form.Control
                                ref={inputRefCantidad}
                                id='txtCantidadContada'
                                placeholder="Cantidad contada"
                                aria-label="Cantidad contada"
                                type='number'                    
                            />
                        </Col>
                        <Col className="mb-3 d-flex d-flex align-items-center" xs={6} md={2}>
                            <Button onClick={IngresarProducto}   variant="success">Ingresar</Button>                   
                        </Col>
                    </Row>
                </div>
            </div>
            <div className='Container-stock-form mb-3'>
                <div className='Container-stock-header'>
                    <h5>Planilla de stock</h5>
                </div>
                <div className='Container-stock-content'>
                    <table className="table table-striped">
                        <thead>
                            <tr>    
                                <th className=''>Producto</th>
                                <th className='w-10' >Stock</th>
                                <th className='text-end w-15'>Cantidades</th>
                                <th className='w-15'>Cantidad Contada</th>
                                <th className='w-5' ></th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item, index) => (
                                <tr key={index}>
                                    <td className='' >
                                        <Form.Label htmlFor="txtCodigo">{item.ProductoId} - {item.Descripcion}</Form.Label>
                                    </td>
                                    <td className='text-end w-10' >{item.StockActual}</td>
                                    <td className='text-end w-15' >{item.Cantidades.join(', ')}</td>
                                    <td className='text-end w-15' >{item.CantidadContada}</td>
                                    <td className='w-5' >
                                        <Button variant="outline-danger" size="sm" onClick={() => EliminarItem(item)}>
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
                    <Button onClick={handleDescargar} variant="primary">Guardar planilla</Button>                   
                </Col>
            </Row>
        </div>
        <Loader visible={isLoading} message={messageLoader} ShowProgress={true} progress={progress} />
    </>
  )
}

export default FrmSheetStock