import { useState, useEffect } from 'react'
import { Button, Form, Row, Col } from 'react-bootstrap'
import { FaTrash } from 'react-icons/fa'
import Sidebar from '../../components/Sidebar/Sidebar'
import Loader from '../../components/Loader/Loader'
import { apiFetch, API_URLS } from '../../config/api'
import ShowError from '../../components/ShowError/ShowError'
import './stock.css'
import { useModal } from '../../contexts/ModalContext'
import { useParams, useNavigate } from 'react-router-dom'

const ViewMermas = () => {
    const navigate = useNavigate();
    const [items, setItems] = useState([]);
    const [options, setOptions] = useState([]);
    const [conceptos, setConceptos] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [showError, setShowError] = useState(false);
    const [messageLoader, setMessageLoader] = useState("Cargando, por favor espere...");
    const {id} = useParams(); 

    useEffect(() => {
        const fetchProductos = async (detalle) => {
            setIsLoading(true);
            setMessageLoader("Cargando los productos de simple tempo...");
            try {
                let flattenedProductos;
                const data = detalle.map(item => item.ProductoId);

                // Si la cantidad de productos es mayor a 50, hago las consultas en chunks para evitar problemas de rendimiento o límites en el backend    
                if (data.length > import.meta.env.VITE_ST_RESULTADOS_POR_PAGINA_STOCK) {
                    const chunks = [];
                    for (let i = 0; i < data.length; i += import.meta.env.VITE_ST_RESULTADOS_POR_PAGINA_STOCK) {
                        chunks.push(data.slice(i, i + import.meta.env.VITE_ST_RESULTADOS_POR_PAGINA_STOCK));
                    }
                    const productos = await Promise.all(
                        chunks.map(chunk => apiFetch(API_URLS.GetProductosByIds, { method: 'POST', body: JSON.stringify(chunk) }))
                    );
                    flattenedProductos = productos.flat();
                }else {
                    flattenedProductos = await apiFetch(API_URLS.GetProductosByIds, { method: 'POST', body: JSON.stringify(data) });
                }
                
                detalle.forEach(item => {
                    const producto = flattenedProductos.find(p => p.ProductoId === item.ProductoId);
                    if (producto) {
                        item.Descripcion = producto.Descripcion;
                    }
                });
                // Esto es necesario para que React detecte el cambio en los items y vuelva a renderizar la tabla con las descripciones actualizadas
                setItems([...detalle]);

            } catch (error) {
                showErrorAlert(`Error cargando productos: ${getErrorMessage(error)}`);
            } finally {
                setIsLoading(false);
                setMessageLoader("");
            }
        };

        const fetchConceptos = async () => {
            setIsLoading(true);
            setMessageLoader("Cargando todos los Conceptos...");
            try {
                const conceptos = await apiFetch( API_URLS.GetConceptosMermas, { method: 'GET'});
                setConceptos(conceptos);
            } catch (error) {
                showErrorAlert(`Error cargando conceptos: ${getErrorMessage(error)}`);
            } finally {
                setIsLoading(false);
                fetchDetalle();
            }
        };

        const fetchDetalle = async () => {
            setIsLoading(true);
            setMessageLoader("Cargando detalle de mermas...");
            try {
              if (!id) {
                showErrorAlert("ID de planilla de mermas no proporcionado.");
                return;
              }
              const detalle = await apiFetch( API_URLS.GetPlanillaInventarioDetalle, { method: 'POST', body: JSON.stringify(id) });

              detalle.forEach(item => {
                if (item.Cantidades && item.Cantidades.length > 0) {
                  item.Cantidades = JSON.parse(item.Cantidades);
                } else {
                  item.Cantidades = [];
                } 
              });
              setItems(detalle);
              fetchProductos(detalle);
            } catch (error) {
                showErrorAlert(`Error cargando detalle: ${getErrorMessage(error)}`);
            } finally {
                setIsLoading(false);
            }
        };

        /* Cargo el nav de conceptos, y luego cargo los productos con su stock actual para mostrarlos en el typeahead y poder agregarlos a la planilla de mermas */
        fetchConceptos();
    }, []);

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

    const handleVolverALista = () => {
        navigate("/stock/listar-mermas");
    };

  return (
    <>
        <Sidebar title={"Planilla de mermas"} />
        <div className='container' >
             <div className='Container-mermas-form mb-3'>
                <div className='Container-mermas-header'>
                    <h5>Detalle de planilla de mermas</h5>
                </div>
                <div className='Container-stock-content'>
                    <table className="table table-striped">
                        <thead>
                            <tr>    
                                <th className=''>Producto</th>
                                <th className='w-15 text-end'>Cantidad</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item, index) => (
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
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <Row >
                    <Col className="mb-3 d-flex d-flex align-items-center justify-content-end" xs={12} md={12}>
                        <Button onClick={handleVolverALista} variant="primary">Volver a la lista</Button>                   
                    </Col>
                </Row>

               <ShowError
                message={errorMessage}
                show={showError}
                onClose={() => setShowError(false)}
              />  
            </div>
        <Loader visible={isLoading} message={messageLoader} />
       </div>
    </>
  )
}

export default ViewMermas