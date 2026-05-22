import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom';
import './index.css'
import App from './App.jsx'
import { EstablecimientoProvider } from './contexts/EstablecimientoContext';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <EstablecimientoProvider>          
        <App /> 
      </EstablecimientoProvider>          
    </BrowserRouter>
  </StrictMode>,
)
