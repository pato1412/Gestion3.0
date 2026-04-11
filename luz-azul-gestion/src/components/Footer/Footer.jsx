import Cookies from 'js-cookie'
import { useAuth } from '../../contexts/AuthContext'
import './Footer.css'
import { FaArrowsAltV } from 'react-icons/fa'
import { Link } from 'react-router-dom'
import { use } from 'react'
import { useDeposito } from '../../contexts/DepositoContext'

const Footer = ({ depositoNombre }) => {
  const { user } = useAuth()
  const { Deposito } = useDeposito()
  const establecimientoNombre = Cookies.get('EstablecimientoNombre') || 'Establecimiento no disponible'
  const usuarioNombre = user?.NombreCompleto || user?.email || 'Usuario no disponible'

  return (
    <footer className="app-footer">
      <div className="footer-content">
        <span className="footer-item">Establecimiento: {establecimientoNombre}</span>
        <span className="footer-item">Depósito: {Deposito?.Descripcion || 'No seleccionado'} <Link to="/select-deposito"><FaArrowsAltV /></Link></span>
        <span className="footer-item">Usuario: {usuarioNombre}</span>
      </div>
    </footer>
  )
}

export default Footer
