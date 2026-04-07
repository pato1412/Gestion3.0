import { FaSearch } from 'react-icons/fa'
import Sidebar from '../../components/Sidebar/Sidebar'
import './stock.css'
import { Link } from 'react-router-dom'
import { InputGroup, Button, Row, Col, Form } from 'react-bootstrap'

const FrmSheetStock = () => {
  return (    
    <>
        <Sidebar title={"Planilla de stock"} />
        <div className='container' >
            <div className='Container-stock-form'>
                <div className='Container-stock-header'>
                    <h2>Seleccion de producto</h2>
                </div>
                <div className='Container-stock-content'>
                    <Row>
                        <Col xs={6} md={6}>
                            <Form.Label htmlFor="inputPassword5">Codigo</Form.Label>
                            <InputGroup className="mb-3">
                                <Form.Control
                                placeholder="Codigo de producto"
                                aria-label="Codigo de producto"
                                aria-describedby="basic-addon2"
                                />
                                <Button variant="outline-secondary" id="button-addon2">
                                <FaSearch /> Buscar
                                </Button>
                            </InputGroup>
                            <Form.Text id="passwordHelpBlock" muted>
                                Por favor, ingrese el código del producto con el scanner o el teclado.
                            </Form.Text>
                        </Col>
                        <Col xs={6} md={2}>
                            <Form.Label htmlFor="inputPassword5">Stock</Form.Label>
                            <Form.Control
                                placeholder="Stock actual"
                                aria-label="Stock actual"
                                aria-describedby="basic-addon2"
                                value={127.00}
                            />
                        </Col>
                        <Col xs={6} md={2}>
                            <Form.Label htmlFor="inputPassword5">Cantidad contada</Form.Label>
                            <Form.Control
                                placeholder="Stock actual"
                                aria-label="Stock actual"
                                aria-describedby="basic-addon2"
                                value={127.00}
                            />
                        </Col>
                        <Col xs={6} md={2}>
                        <Button  variant="success">Ingresar</Button>                   
                        </Col>
                    </Row>
                </div>
            </div>    
        </div>
    </>
  )
}

export default FrmSheetStock