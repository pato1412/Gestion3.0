import React from 'react';
import * as FaIcons from 'react-icons/fa';
import * as AiIcons from 'react-icons/ai';
import * as IoIcons from 'react-icons/io';
import * as RiIcons from 'react-icons/ri';
import { useEstablecimiento } from '../../contexts/EstablecimientoContext';

export const SidebarData = () =>{
  const { establecimiento } = useEstablecimiento();

  const Items = [];
    Items.push(
    {
      title: 'Inicio',
      path: '/',
      icon: <AiIcons.AiFillHome />
    });

    Items.push({
      title: 'Stock',
      path: '#',
      icon: <FaIcons.FaBoxOpen />,
      iconClosed: <RiIcons.RiArrowDownSFill />,
      iconOpened: <RiIcons.RiArrowUpSFill />,

      subNav: [
        {
          title: 'Carga de inventario',
          path: '/stock/listar-planillas',
          icon: <IoIcons.IoIosPaper />
        },
        {
          title: 'Carga de mermas',
          path: '/stock/listar-mermas',
          icon: <IoIcons.IoIosPaper />
        },
        {
          title: 'Orden de producción',
          path: 'https://app.simpletempo.com/inventory/ProductionOrders/ProductionOrders/Create',
          icon: <IoIcons.IoIosPaper />,
          external: true
        }
      ]  
    });
     
    Items.push({
      title: 'Configuraciones',
      path: '#',
      icon: <FaIcons.FaTools />,
      iconClosed: <RiIcons.RiArrowDownSFill />,
      iconOpened: <RiIcons.RiArrowUpSFill />,

      subNav: [
        {
          title: 'Administrar Flyers',
          path: 'https://flyers.luz-azul.com.ar/?EstablecimientoGUID=' + establecimiento.EstablecimientoGUID,
          external: true,
          icon: <FaIcons.FaImage />
        }
      ]  
    });


    if (establecimiento && establecimiento.EstablecimientoId === parseInt(import.meta.env.VITE_ST_ESTABLECIMIENTO_ID_EZEIZA)) 
    {
      Items.push(
        {
          title: 'Notificaciones',
          path: '/notificaciones/listar-notificaciones',
          icon: <IoIcons.IoMdNotifications />
        }
      );
    }   

    return Items;
} 

