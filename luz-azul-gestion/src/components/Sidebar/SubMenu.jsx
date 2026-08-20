import React, { useEffect, useMemo, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

const externalLinkProps = {
  target: '_blank',
  rel: 'noopener noreferrer'
};

const SubMenu = ({ item, onNavigate }) => {
  const { pathname } = useLocation();
  const hasActiveChild = useMemo(
    () => item.subNav?.some((subItem) => pathname === subItem.path || pathname.startsWith(`${subItem.path}/`)) ?? false,
    [item.subNav, pathname]
  );
  const [subnav, setSubnav] = useState(false);

  useEffect(() => {
    if (hasActiveChild) {
      setSubnav(true);
    }
  }, [hasActiveChild]);

  if (item.subNav) {
    return (
      <div className='accordion accordion-flush sidebar-accordion'>
        <div className='accordion-item sidebar-accordion-item'>
          <h2 className='accordion-header'>
            <button
              className={`accordion-button sidebar-accordion-button ${subnav ? '' : 'collapsed'} ${hasActiveChild ? 'is-active' : ''}`}
              type='button'
              onClick={() => setSubnav(!subnav)}
              aria-expanded={subnav}
            >
              <span className='sidebar-menu-icon'>{item.icon}</span>
              <span className='sidebar-menu-label'>{item.title}</span>
            </button>
          </h2>
          <div className={`accordion-collapse collapse ${subnav ? 'show' : ''}`}>
            <div className='accordion-body p-0'>
              <div className='list-group list-group-flush'>
                {item.subNav.map((subItem, index) => {
                  if (subItem.external) {
                    return (
                      <a
                        href={subItem.path}
                        key={index}
                        {...externalLinkProps}
                        className='list-group-item list-group-item-action sidebar-subitem'
                        onClick={onNavigate}
                      >
                        <span className='sidebar-menu-icon'>{subItem.icon}</span>
                        <span className='sidebar-menu-label'>{subItem.title}</span>
                      </a>
                    );
                  }

                  return (
                    <NavLink
                      to={subItem.path}
                      key={index}
                      className={({ isActive }) =>
                        `list-group-item list-group-item-action sidebar-subitem ${isActive ? 'is-active' : ''}`
                      }
                      onClick={onNavigate}
                    >
                      <span className='sidebar-menu-icon'>{subItem.icon}</span>
                      <span className='sidebar-menu-label'>{subItem.title}</span>
                    </NavLink>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (item.external) {
    return (
      <a
        href={item.path}
        {...externalLinkProps}
        className='list-group-item list-group-item-action sidebar-menu-item'
        onClick={onNavigate}
      >
        <span className='sidebar-menu-icon'>{item.icon}</span>
        <span className='sidebar-menu-label'>{item.title}</span>
      </a>
    );
  }

  return (
    <NavLink
      to={item.path}
      className={({ isActive }) =>
        `list-group-item list-group-item-action sidebar-menu-item ${isActive ? 'is-active' : ''}`
      }
      onClick={onNavigate}
    >
      <span className='sidebar-menu-icon'>{item.icon}</span>
      <span className='sidebar-menu-label'>{item.title}</span>
    </NavLink>
  );
};

export default SubMenu;
