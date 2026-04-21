import {FaTrash } from 'react-icons/fa'
import Sidebar from '../../components/Sidebar/Sidebar'
import './stock.css'
import { Link } from 'react-router-dom'
import { Button, Row, Col, Form, ProgressBar } from 'react-bootstrap'
import { Typeahead } from 'react-bootstrap-typeahead'
import { useState, useEffect, useRef } from 'react'
import { apiFetch, downloadFile } from '../../config/api'
import Loader from '../../components/Loader/Loader'
import ShowError from '../../components/ShowError/ShowError'
import { useDeposito } from '../../contexts/DepositoContext'
import { useModal } from '../../contexts/ModalContext'
import { API_URLS } from '../../config/api'

const FrmSheetStock = () => {

    const [singleSelections, setSingleSelections] = useState([]);
    const [options, setOptions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [items, setItems] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [showError, setShowError] = useState(false);
    const [progress, setProgress] = useState(0);
    const [messageLoader, setMessageLoader] = useState("Cargando, por favor espere...");
    const inputRefStock = useRef(null);
    const inputRefCantidad = useRef(null);
    const { DepositoId } = useDeposito();
    const { openModal } = useModal();
    let dateStart = new Date();

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
                        showErrorAlert(`Error cargando stock de producto en la página ${paginaActual}: ${getErrorMessage(error)}`);
                    }
                    setProgress((paginaActual / paginas) * 100);
                }

                //luego de obtener los productos, obtenemos el stock actual de cada producto
                setOptions(formattedProductos);
            } catch (error) {
                showErrorAlert(`Error cargando productos: ${getErrorMessage(error)}`);
            } finally {
                setIsLoading(false);
                setProgress(100);
                dateStart = Date.now();
            }
        };

        fetchProductos();
    }, []);


    const IngresarProducto = () => {
        if (singleSelections.length > 0) {
            const productoSeleccionado = singleSelections[0];
            const cantidad = Number(inputRefCantidad.current.value);

            if( cantidad <= 0) {
                showErrorAlert("La cantidad ingresada debe ser mayor a cero.");
                return;
            }

            if (items.some(item => item.ProductoId === productoSeleccionado.ProductoId)) {
                // Si el producto ya existe, actualizamos las cantidades sin mutar el objeto original
                setItems(prevItems => prevItems.map(item => {
                    if (item.ProductoId !== productoSeleccionado.ProductoId) return item;
                    const nuevasCantidades = [...item.Cantidades, cantidad];
                    return {
                        ...item,
                        Cantidades: nuevasCantidades,
                        CantidadContada: nuevasCantidades.reduce((total, cantidad) => total + cantidad, 0)
                    };
                }));
            } else {
                // Si el producto no existe, lo agregamos como una copia independiente
                const nuevoItem = {
                    ...productoSeleccionado,
                    Cantidades: [cantidad],
                    CantidadContada: cantidad
                };
                setItems(prevItems => [...prevItems, nuevoItem]);
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

    const getErrorMessage = (error) => {
        if (!error) return 'Error inesperado';
        if (typeof error === 'string') return error;
        if (error.message) return error.message;
        try {
            return JSON.stringify(error);
        } catch {
            return 'Error inesperado';
        }
    }

    const showErrorAlert = (error) => {
        setErrorMessage(getErrorMessage(error));
        setShowError(true);
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
            showErrorAlert(`Error descargando el archivo: ${getErrorMessage(error)}`);
        }
    }

    const handleGuardarPlanilla = async () => {
        console.log("Guardando planilla con los siguientes datos");

        try {
            const data = items.map(item => ({
                Usuario: item.ProductoId,
                FechaInicio: dateStart,
                FechaFin: Date.now(),
                DepositoId: DepositoId,
                EstablecimientoId: item.CantidadContada
            }));
            
            openModal(
                "Planilla Guardada",
                "La planilla de stock ha sido guardada exitosamente",
                () => {
                    console.log("Confirmado");
                }
            );

        }  catch (error) {
            showErrorAlert(`Error guardando la planilla: ${getErrorMessage(error)}`);
        } finally {            
            setIsLoading(false);
        }   
    };

    const filteredItems = items.filter(item => {
        const term = searchTerm.trim().toLowerCase();
        if (!term) return true;
        return item.ProductoId.toString().includes(term) || item.Descripcion.toLowerCase().includes(term);
    });

  return (    
    <>
        <Sidebar title={"Planilla de stock"} />
        <div className='container' >
            <ShowError
                message={errorMessage}
                show={showError}
                onClose={() => setShowError(false)}
            />  
                <p className='text-muted text-end'>Fecha inicio: {dateStart.getDate() }/{dateStart.getMonth() + 1}/{dateStart.getFullYear() } - {dateStart.getHours()}:{dateStart.getMinutes()}</p>
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
                                <th className='w-10' >Stock</th>
                                <th className='w-15'>Cantidad Contada</th>
                                <th className='w-5' ></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredItems.map((item, index) => (
                                <tr key={index}>
                                    <td className='' >
                                        <Form.Label htmlFor="txtCodigo">{item.ProductoId} - {item.Descripcion}</Form.Label>
                                    </td>
                                    <td className='text-end w-10' >{item.StockActual}</td>
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
                    <Button onClick={handleGuardarPlanilla} variant="primary">Guardar planilla</Button>                   
                </Col>
            </Row>
        </div>
        <Loader visible={isLoading} message={messageLoader} ShowProgress={true} progress={progress} />
    </>
  )
}

export default FrmSheetStock
