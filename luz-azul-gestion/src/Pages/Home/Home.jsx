import React from 'react'
import { Link } from 'react-router-dom';
import Sidebar from '../../components/Sidebar/Sidebar';

const Home = () => {
  return (    
    <>
      <Sidebar title="Luz Azul Gestión" />
      <div className='container' >    
      <img className='mb-2 mt-2'  src="/images/LAGestion_web.webp" alt="Logo Luz Azul Gestión" style={{width: '100%'}} />
    </div>
    </>
  )
}

export default Home