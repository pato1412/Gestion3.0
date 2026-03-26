import React from 'react'
import { Link } from 'react-router-dom';
import Sidebar from '../../components/Sidebar/Sidebar';

const Home = () => {
  return (    
    <>
      <Sidebar />
      <div className='container' >    
      <h2>Home</h2>
      <Link to="/login">Ir a Login</Link>    
    </div>
    </>
  )
}

export default Home