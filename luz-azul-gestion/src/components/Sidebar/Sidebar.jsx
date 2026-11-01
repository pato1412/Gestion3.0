import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { FaBars, FaStore } from 'react-icons/fa'
import { AiOutlineClose, AiOutlineLogout } from 'react-icons/ai'
import Offcanvas from 'react-bootstrap/Offcanvas'
import { SidebarData } from './SidebarData'
import SubMenu from './SubMenu'
import { useAuth } from '../../contexts/AuthContext'
import { useUsuarioActual } from '../../hooks/useUsuarioActual'
import './Sidebar.css'

// Barra superior (☰, logo, título, usuario) + menú lateral que se abre desde la izquierda
const Sidebar = ({ title }) => {
  const [sidebar, setSidebar] = useState(false)
  const { logout } = useAuth()
  const { nombre, detalle, iniciales } = useUsuarioActual()
  const navigate = useNavigate()

  const showSidebar = () => setSidebar(true)
  const closeSidebar = () => setSidebar(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // Los ítems con inferior: true van al pie del menú, junto a "Cerrar sesión"
  const SidebarItems = SidebarData()
  const itemsMenu = SidebarItems.filter((item) => !item.inferior)
  const itemsInferiores = SidebarItems.filter((item) => item.inferior)

  return (
    <>
      <header className='sidebar-nav'>
        <button type='button' className='sidebar-menu-button' onClick={showSidebar} aria-label='Abrir menú'>
          <FaBars />
        </button>
        <img src='/images/logo-small.png' alt='Luz Azul' className='sidebar-logo' />
        <h1 className='sidebar-title'>{title}</h1>
        <span className='sidebar-spacer' />
        {detalle && (
          <span className='sidebar-chip'>
            <FaStore /> {detalle}
          </span>
        )}
        <button type='button' className='sidebar-avatar' onClick={showSidebar} title={nombre} aria-label='Abrir menú'>
          {iniciales}
        </button>
      </header>
      <Offcanvas show={sidebar} onHide={closeSidebar} placement='start' className='sidebar-offcanvas'>
        <Offcanvas.Header className='sidebar-offcanvas-header'>
          <div className='sidebar-offcanvas-logo'>
            <img src='/images/logo-small.png' alt='Luz Azul' />
          </div>
          <button type='button' className='sidebar-close-btn' onClick={closeSidebar} aria-label='Cerrar menú'>
            <AiOutlineClose />
          </button>
        </Offcanvas.Header>
        <Offcanvas.Body className='sidebar-offcanvas-body'>
          <div className='sidebar-usuario'>
            <span className='sidebar-avatar'>{iniciales}</span>
            <div className='sidebar-usuario-datos'>
              <b>{nombre}</b>
              {detalle && <span>{detalle}</span>}
            </div>
          </div>
          <nav className='sidebar-menu-scroll'>
            {itemsMenu.map((item) => (
              <SubMenu item={item} key={item.title} onNavigate={closeSidebar} />
            ))}
          </nav>
          <div className='sidebar-logout-wrap'>
            {itemsInferiores.map((item) => (
              <NavLink to={item.path} key={item.title} className='sidebar-logout-btn' onClick={closeSidebar}>
                {item.icon} {item.title}
              </NavLink>
            ))}
            <button type='button' onClick={handleLogout} className='sidebar-logout-btn'>
              <AiOutlineLogout /> Cerrar sesión
            </button>
          </div>
        </Offcanvas.Body>
      </Offcanvas>
    </>
  )
}

export default Sidebar
