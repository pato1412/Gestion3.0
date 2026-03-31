import { FaSearch } from 'react-icons/fa'
import Sidebar from '../../components/Sidebar/Sidebar'
import './stock.css'
import { Link } from 'react-router-dom'

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
                    <div className='stock-item-codigo'>
                        <div className='stock-item-codigo-label'>Código de producto</div>
                        <div className='stock-item-codigo-value'><input type="text" value={"12345"} /></div>
                        <div className='stock-item-codigo-buscar'><Link to="#"><FaSearch />Buscar</Link></div>
                        <div className='stock-item-codigo-nombre'>Nombre del producto</div>
                    </div>
                    <div className='stock-item-stock'>
                        127.00
                    </div>
                    <div className='stock-item-cantidad'>
                        <input type="number" value={127.00} /    >
                    </div>
                    <div className='stock-item-acciones'>
                        <button>Actualizar</button>
                    </div>
                </div>
            </div>    
        </div>
    </>
  )
}

export default FrmSheetStock