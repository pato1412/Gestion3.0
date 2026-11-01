import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css'
import 'react-bootstrap-typeahead/css/Typeahead.css'
// Después de Bootstrap, así los estilos de la marca ganan
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
