import React from 'react'
import { Link } from 'react-router-dom';


const Home = () => {
  return (
    <div className='container' >
      <div>Home</div>
      <Link to="/login">Ir a Login</Link>    
    </div>
  )
}

export default Home