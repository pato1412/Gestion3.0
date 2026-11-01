import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { FaChevronRight } from 'react-icons/fa'

const externalLinkProps = {
  target: '_blank',
  rel: 'noopener noreferrer',
}

const claseItem = (base, activo) => `${base} ${activo ? 'is-active' : ''}`

// Un ítem del menú lateral: link simple, link externo o grupo con submenú desplegable
const SubMenu = ({ item, onNavigate }) => {
  const { pathname } = useLocation()
  const hasActiveChild = item.subNav?.some((subItem) => pathname === subItem.path || pathname.startsWith(`${subItem.path}/`)) ?? false
  // null = el usuario no lo tocó: queda abierto si alguna subruta está activa.
  const [abierto, setAbierto] = useState(null)
  const subnav = abierto ?? hasActiveChild

  if (item.subNav) {
    return (
      <div className='sidebar-grupo'>
        <button
          type='button'
          className={claseItem('sidebar-menu-item', hasActiveChild && !subnav)}
          onClick={() => setAbierto(!subnav)}
          aria-expanded={subnav}
        >
          <span className='sidebar-menu-icon'>{item.icon}</span>
          <span className='sidebar-menu-label'>{item.title}</span>
          <FaChevronRight className={`sidebar-chevron ${subnav ? 'abierto' : ''}`} />
        </button>
        {subnav && (
          <div className='sidebar-submenu'>
            {item.subNav.map((subItem) =>
              subItem.external ? (
                <a href={subItem.path} key={subItem.title} {...externalLinkProps} className='sidebar-subitem' onClick={onNavigate}>
                  {subItem.title}
                </a>
              ) : (
                <NavLink
                  to={subItem.path}
                  key={subItem.title}
                  className={({ isActive }) => claseItem('sidebar-subitem', isActive)}
                  onClick={onNavigate}
                >
                  {subItem.title}
                </NavLink>
              )
            )}
          </div>
        )}
      </div>
    )
  }

  if (item.external) {
    return (
      <a href={item.path} {...externalLinkProps} className='sidebar-menu-item' onClick={onNavigate}>
        <span className='sidebar-menu-icon'>{item.icon}</span>
        <span className='sidebar-menu-label'>{item.title}</span>
      </a>
    )
  }

  return (
    <NavLink to={item.path} end={item.path === '/'} className={({ isActive }) => claseItem('sidebar-menu-item', isActive)} onClick={onNavigate}>
      <span className='sidebar-menu-icon'>{item.icon}</span>
      <span className='sidebar-menu-label'>{item.title}</span>
    </NavLink>
  )
}

export default SubMenu
