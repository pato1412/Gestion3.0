import React from 'react'
import { Link } from 'react-router-dom';
import Sidebar from '../../components/Sidebar/Sidebar';

const Home = () => {
  return (    
    <>
      <Sidebar title="Luz Azul Gestión" />
      <div className='container' >    
      <h2>Pagina de inicio</h2>
    </div>
    </>
  )
}

export default Home