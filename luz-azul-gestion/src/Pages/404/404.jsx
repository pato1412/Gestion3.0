import React from 'react'
import { useNavigate } from 'react-router-dom'
import { FiHome, FiArrowLeft } from 'react-icons/fi'
import { FaRegMehRollingEyes} from 'react-icons/fa'
import './404.css'

const Page404 = () => {
  const navigate = useNavigate()

  const goHome = () => {
    navigate('/')
  }

  const goBack = () => {
    navigate(-1)
  }

  return (
    <div className="container-404">
      <div className="content-404">        
        <h1 className="error-code"><FaRegMehRollingEyes /></h1>
        
        <h2 className="error-title">¡Página no encontrada!</h2>
        
        <p className="error-message-404">
          Lo sentimos, la página que buscas no existe o ha sido movida.
        </p>
        
        <div className="button-group">
          <button className="btn404 btn404-primary" onClick={goHome}>
            <FiHome />
            Ir al Inicio
          </button>
          
          <button className="btn404 btn404-secondary" onClick={goBack}>
            <FiArrowLeft />
            Volver Atrás
          </button>
        </div>
      </div>
    </div>
  )
}

export default Page404