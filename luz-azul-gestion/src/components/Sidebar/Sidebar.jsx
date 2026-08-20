import React, { useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import * as FaIcons from 'react-icons/fa';
import * as AiIcons from 'react-icons/ai';
import Offcanvas from 'react-bootstrap/Offcanvas';
import { SidebarData } from './SidebarData';
import { IconContext } from 'react-icons/lib';
import SubMenu from './SubMenu';
import { useAuth } from '../../contexts/AuthContext';
import SidebarTitle from './SidebarTitle';
import './Sidebar.css';

const Nav = styled.div`
  background: var(--accent);
  height: 90px;
  display: flex;
  justify-content: flex-start;
  align-items: center;
`;

const MenuButton = styled.button`
  background: none;
  border: none;
  margin-left: 1.5rem;
  font-size: 1.5rem;
  height: 80px;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  color: #fff;
  cursor: pointer;
`;

const Sidebar = ({title}) => {
  const [sidebar, setSidebar] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const showSidebar = () => setSidebar(true);
  const closeSidebar = () => setSidebar(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const SidebarItems = SidebarData();

  return (
    <>
      <IconContext.Provider value={{ color: '#fff' }}>
        <Nav>
          <MenuButton type='button' onClick={showSidebar} aria-label='Abrir menú'>
            <FaIcons.FaBars />
          </MenuButton>
          <SidebarTitle title={title} />
        </Nav>
        <Offcanvas show={sidebar} onHide={closeSidebar} placement='start' className='sidebar-offcanvas'>
          <Offcanvas.Header className='sidebar-offcanvas-header'>
            <button
              type='button'
              className='sidebar-close-btn'
              onClick={closeSidebar}
              aria-label='Cerrar menú'
            >
              <AiIcons.AiOutlineClose />
            </button>
          </Offcanvas.Header>
          <Offcanvas.Body className='sidebar-offcanvas-body'>
            <div className='sidebar-menu-scroll'>
              {SidebarItems.map((item, index) => {
                return <SubMenu item={item} key={index} onNavigate={closeSidebar} />;
              })}
            </div>
            <div className='sidebar-logout-wrap'>
              <button type='button' onClick={handleLogout} className='sidebar-logout-btn'>
                <AiIcons.AiOutlineLogout /> Cerrar Sesión
              </button>
            </div>
          </Offcanvas.Body>
        </Offcanvas>
      </IconContext.Provider>
    </>
  );
};

export default Sidebar;
