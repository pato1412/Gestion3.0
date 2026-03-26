import React from 'react';
import * as FaIcons from 'react-icons/fa';
import * as AiIcons from 'react-icons/ai';
import * as IoIcons from 'react-icons/io';
import * as RiIcons from 'react-icons/ri';

export const SidebarData = [
  {
    title: 'Inicio',
    path: '/',
    icon: <AiIcons.AiFillHome />
  },
  {
    title: 'Pedidos',
    path: '#',
    icon: <IoIcons.IoIosPaper />,
    iconClosed: <RiIcons.RiArrowDownSFill />,
    iconOpened: <RiIcons.RiArrowUpSFill />,

    subNav: [
      {
        title: 'Enviar Pedidos',
        path: '/pedidos/enviar-pedidos',
        icon: <IoIcons.IoIosPaper />,
        cName: 'sub-nav'
      }
    ]
  },
  {
    title: 'Stock',
    path: '#',
    icon: <FaIcons.FaBoxOpen />,
    iconClosed: <RiIcons.RiArrowDownSFill />,
    iconOpened: <RiIcons.RiArrowUpSFill />,

    subNav: [
      {
        title: 'Control de inventario',
        path: '/stock/control-inventario',
        icon: <IoIcons.IoIosPaper />
      },
      {
        title: 'Carga de mermas',
        path: '/stock/carga-mermas',
        icon: <IoIcons.IoIosPaper />
      },
      {
        title: 'Carga de planillas',
        path: '/stock/carga-planillas',
        icon: <IoIcons.IoIosPaper />
      }
    ]
 
  },
  {
    title: 'Configuraciones',
    path: '/configuraciones',
    icon: <IoIcons.IoMdSettings />
  }
];
