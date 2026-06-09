import {FaTrash } from 'react-icons/fa'
import Sidebar from '../../components/Sidebar/Sidebar'
import './stock.css'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Button, Row, Col, Form, ProgressBar, Tabs, Tab, Nav, NavDropdown } from 'react-bootstrap'
import { Typeahead } from 'react-bootstrap-typeahead'
import { useState, useEffect, useRef } from 'react'
import { apiFetch, downloadFile } from '../../config/api'
import Loader from '../../components/Loader/Loader'
import ShowError from '../../components/ShowError/ShowError'
import { useDeposito } from '../../contexts/DepositoContext'
import { useModal } from '../../contexts/ModalContext'
import { API_URLS } from '../../config/api'
import { useAuth } from '../../contexts/AuthContext'
import Cookies from 'js-cookie'


const frmMermas = () => {
    const [singleSelections, setSingleSelections] = useState([]);
    const [options, setOptions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [items, setItems] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [showError, setShowError] = useState(false);
    const [progress, setProgress] = useState(0);
    const [messageLoader, setMessageLoader] = useState("Cargando, por favor espere...");
    const [lastSavedTime, setLastSavedTime] = useState(null);
    const inputRefStock = useRef(null);
    const inputRefCantidad = useRef(null);
    const inputRefCodigo = useRef(null);
    const { DepositoId } = useDeposito();
    const { openModal } = useModal();
    const {user} = useAuth();
    const navigate = useNavigate();
    const [currentConcepto, setCurrentConcepto] = useState(5);
    const [conceptos, setConceptos] = useState([]);
    
    const handleSelectConceptos = (eventKey) =>{
            //alert(`selected ${eventKey}`);
            setCurrentConcepto(eventKey);
            };
    
    let dateStart = new Date();

    useEffect(() => {
        // Restaurar items desde cookie si existen (asociados al DepositoId actual)
        if (DepositoId) {
            const cookieKey = `planillaItems_${DepositoId}`;
            const savedItems = Cookies.get(cookieKey);
            if (savedItems) {
                try {
                    const parsedItems = JSON.parse(savedItems);
                    setItems(parsedItems);
                    const savedTime = Cookies.get(`planillaItemsTime_${DepositoId}`);
                    if (savedTime) {
                        setLastSavedTime(new Date(savedTime));
                    }
                } catch (error) {
                    console.error('Error restaurando items desde cookie:', error);
                }
            }
        }
    }, [DepositoId]);

    // Guardar items en cookie cada vez que cambien (asociados al DepositoId actual)
    useEffect(() => {
        if (items.length > 0 && DepositoId) {
            const now = new Date();
            const cookieKey = `planillaItems_${DepositoId}`;
            Cookies.set(cookieKey, JSON.stringify(items), { expires: 1 });
            Cookies.set(`planillaItemsTime_${DepositoId}`, now.toISOString(), { expires: 1 });
            setLastSavedTime(now);
        }
    }, [items, DepositoId]);

    useEffect(() => {
        const fetchProductos = async () => {
            setIsLoading(true);
            setMessageLoader("Cargando todos los productos de simple tempo...");
            setProgress(0);
            try {
                const data = { Activo: true, TipoProducto: 0, DeVentas: true, DeCompras: false , ResultadosPorPagina : import.meta.env.VITE_ST_RESULTADOS_POR_PAGINA, Pagina: 1 };
                const productos = await apiFetch( API_URLS.GetAllProductos, { method: 'POST', body: JSON.stringify(data) });
                const formattedProductos = productos.map(producto => ({
                    ProductoId: producto.ProductoId,
                    Descripcion: producto.Descripcion,
                    StockActual: 0,
                    Cantidades: [],
                    CantidadContada: 0
                }));

                //luego de obtener los productos, obtenemos el stock actual de cada producto
                setOptions(formattedProductos);
            } catch (error) {
                showErrorAlert(`Error cargando productos: ${getErrorMessage(error)}`);
            } finally {
                setIsLoading(false);
                setProgress(100);
            }
        };

        const fetchConceptos = async () => {
            setIsLoading(true);
            setMessageLoader("Cargando todos los Conceptos...");
            setProgress(0);
            try {
                const conceptos = await apiFetch( API_URLS.GetConceptosMermas, { method: 'GET'});
                setConceptos(conceptos);
            } catch (error) {
                showErrorAlert(`Error cargando conceptos: ${getErrorMessage(error)}`);
            } finally {
                setIsLoading(false);
                setProgress(0);

                fetchProductos();
            }
        };

        /* Cargo el nav de conceptos, y luego cargo los productos con su stock actual para mostrarlos en el typeahead y poder agregarlos a la planilla de mermas */
        fetchConceptos();
    }, []);

    useEffect(() => {
        const handleBeforeUnload = (event) => {
            if (items.length > 0) {
                event.preventDefault();
                event.returnValue = '';
            }
        };

        const handleReloadShortcut = (event) => {
            const isReloadKey = event.key === 'F5' || ((event.key === 'r' || event.key === 'R') && (event.ctrlKey || event.metaKey));
            if (!isReloadKey || items.length === 0) return;

            event.preventDefault();
            openModal(
                'Confirmar recarga',
                'Hay datos cargados en la planilla. Si recarga la página, volverá a cargar todo y perderá los datos no guardados. ¿Desea continuar?',
                () => {
                    window.removeEventListener('beforeunload', handleBeforeUnload);
                    window.location.reload();
                }
            );
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        window.addEventListener('keydown', handleReloadShortcut);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            window.removeEventListener('keydown', handleReloadShortcut);
        };
    }, [items, openModal]);

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
            inputRefCodigo.current.focus();
        }
    }

    const EliminarItem = (item) => {
        const isLastQuantity = item.Cantidades.length === 1;
        const message = isLastQuantity ? 
            `¿Está seguro que desea eliminar el producto ${item.Descripcion} de la planilla?` :
            `¿Está seguro que desea eliminar la última cantidad del producto ${item.Descripcion}?`;
        openModal(
            "Eliminar",
            message,
            () => {
                if (isLastQuantity) {
                    setItems(prevItems => prevItems.filter(i => i.ProductoId !== item.ProductoId));
                } else {
                    setItems(prevItems => prevItems.map(i => {
                        if (i.ProductoId !== item.ProductoId) return i;
                        const nuevasCantidades = i.Cantidades.slice(0, -1);
                        return {
                            ...i,
                            Cantidades: nuevasCantidades,
                            CantidadContada: nuevasCantidades.reduce((total, cantidad) => total + cantidad, 0)
                        };
                    }));
                }
            });
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


    const handleGuardarPlanilla = async () => {
            openModal(
                "Guardar planilla de mermas",
                "Desea guardar la planilla de mermas? Ingrese una observación si lo desea.",
                (valor) => {
                    fetchPlanilla(valor);
                },
                true,
                "Observacion (opcional)",
                ""
            );        
    };

    const fetchPlanilla = async (observaciones) => {
        setIsLoading(true);
        setMessageLoader("Cargando planilla de mermas...");

        try {
            const EstablecimientoId = Cookies.get('EstablecimientoId');
            let dateFin = new Date();
            const data = {
                Usuario: user.NombreCompleto,
                FechaInicio: dateStart,
                FechaFin:  dateFin,
                DepositoId: DepositoId,
                EstablecimientoId: EstablecimientoId,
                Observaciones: observaciones,
            };

            const response = await apiFetch(API_URLS.NewPlanillaInventario, { method: 'POST', body: JSON.stringify(data)});
            if (response && response.bok === true) {
                const planillaId = response.id;
                const detallesData = items.map(item => ({
                    InventarioId: planillaId,
                    ProductoId: item.ProductoId,
                    Cantidades: JSON.stringify(item.Cantidades),
                    CantidadContada: item.CantidadContada,
                    Stock: item.StockActual
                }));
                const detalleResponse = await apiFetch(API_URLS.NewPlanillaInventarioDetalle , { method: 'POST', body: JSON.stringify(detallesData)});                
                if (detalleResponse && detalleResponse.bok === true) {
                    // Limpiar cookies después de guardar exitosamente (asociadas al DepositoId actual)
                    Cookies.remove(`planillaItems_${DepositoId}`);
                    Cookies.remove(`planillaItemsTime_${DepositoId}`);
                    openModal("Planilla guardada", "La planilla de mermas se ha guardado correctamente.", () => {
                        navigate("/stock/listar-planillas");
                    });
                }else{
                    showErrorAlert("No se pudieron guardar los detalles de la planilla de mermas. Intente nuevamente.");
                }
            }else{
                showErrorAlert("No se pudo guardar la planilla de mermas. Intente nuevamente.");
            }
        } catch (error) {
            showErrorAlert(`Error cargando la planilla: ${getErrorMessage(error)}`);
        } finally {
            setIsLoading(false);
        }
    }

    const filteredItems = items.filter(item => {
        const term = searchTerm.trim().toLowerCase();
        if (!term) return true;
        return item.ProductoId.toString().includes(term) || item.Descripcion.toLowerCase().includes(term);
    });

  return (    
    <>
        <Sidebar title={"Planilla de mermas"} />
        <div className='container' >
            <ShowError
                message={errorMessage}
                show={showError}
                onClose={() => setShowError(false)}
            />  
                <p className='text-muted text-end'>
                    Fecha inicio: {dateStart.getDate() }/{dateStart.getMonth() + 1}/{dateStart.getFullYear() } - {dateStart.getHours()}:{dateStart.getMinutes()}
                    {lastSavedTime && (
                        <span className='ms-3'>
                            | Autoguardado: {lastSavedTime.getDate()}/{lastSavedTime.getMonth() + 1}/{lastSavedTime.getFullYear()} - {lastSavedTime.getHours()}:{String(lastSavedTime.getMinutes()).padStart(2, '0')}
                        </span>
                    )}
                </p>
                <div className='Container-stock-form mb-3'>                
                    <Nav justify variant="tabs" activeKey={currentConcepto} onSelect={handleSelectConceptos}>
                        {conceptos.map(concepto => (
                            <Nav.Item key={concepto.ConfigId}>
                                <Nav.Link eventKey={concepto.ConfigId} >
                                    {concepto.Descripcion}
                                </Nav.Link>
                            </Nav.Item>
                        ))}
                    </Nav>
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
                        <Col xs={6} md={2} className='mb-3'>
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
                        <Col className="mb-3 d-flex d-flex align-items-center" xs={6} md={2}>
                            <Button onClick={IngresarProducto}   variant="success">Ingresar</Button>                   
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

export default frmMermas