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
    icon: <FaIcons.FaDolly />,
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
