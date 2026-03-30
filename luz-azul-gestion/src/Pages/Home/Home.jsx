import React from 'react'
import { Link } from 'react-router-dom';
import Sidebar from '../../components/Sidebar/Sidebar';

const Home = () => {
  return (    
    <>
      <Sidebar title="Luz Azul Gestión" />
      <div className='container' >    
      <img src="/images/fondo.png" alt="Logo Luz Azul Gestión" style={{width: '100%', marginTop: '20px' }} />
    </div>
    </>
  )
}

export default Home