import { Button, Form, Row, Col } from 'react-bootstrap'
import Sidebar from '../../components/Sidebar/Sidebar'
import Loader from '../../components/Loader/Loader'
import ShowError from '../../components/ShowError/ShowError'
import './stock.css'
import { useParams, useNavigate } from 'react-router-dom'
import { useViewMermas } from '../../hooks/useViewMermas'

const ViewMermas = () => {
    const navigate = useNavigate();
    const {id} = useParams(); 
    const { items, isLoading, errorMessage, showError, closeError, messageLoader } = useViewMermas(id)

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
                                onClose={closeError}
              />  
            </div>
        <Loader visible={isLoading} message={messageLoader} />
       </div>
    </>
  )
}

export default ViewMermas