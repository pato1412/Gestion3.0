import { useState, useEffect } from 'react'
import { Route, Routes } from 'react-router-dom'
import Home from './Pages/Home/Home'
import LoginPage from './Pages/Login/Login'
import Page404 from './Pages/404/404'
import SelectEstablecimiento from './Pages/SelectEstablecimiento/SelectEstablecimiento'
import Cookies from 'js-cookie'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import ConfigPage from './Pages/Config/ConfigPage'
import StockPage from './Pages/Stock/StockPage'
import NewOrder from './Pages/Orders/NewOrder'
import FrmSheetStock from './Pages/Stock/frmSheetStock'
import Footer from './components/Footer/Footer'
import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-bootstrap-typeahead/css/Typeahead.css'

function App() {
  const [establecimientoSelected, setEstablecimientoSelected] = useState(false);

  useEffect(() => {
    const guid = Cookies.get('EstablecimientoGUID');
    if (guid) {
      setEstablecimientoSelected(true);
    }
  }, []);

  const handleEstablecimientoSelected = (establecimiento) => {
    setEstablecimientoSelected(true);
  };

  return (
    <AuthProvider>
      {establecimientoSelected ? (
        <>
          <div className="app-main">
            <Routes>
              <Route path='/login' element={<LoginPage />} />
              <Route path='/' element={<ProtectedRoute><Home /></ProtectedRoute>} />
              <Route path='/pedidos/enviar-pedidos' element={<ProtectedRoute><NewOrder /></ProtectedRoute>} />
              <Route path='/stock/carga-mermas' element={<ProtectedRoute><StockPage /></ProtectedRoute>} />
              <Route path='/stock/control-inventario' element={<ProtectedRoute><StockPage /></ProtectedRoute>} />
              <Route path='/stock/carga-planillas' element={<ProtectedRoute><FrmSheetStock /></ProtectedRoute>} />
              <Route path='/configuraciones' element={<ProtectedRoute><ConfigPage /></ProtectedRoute>} />
              <Route path='*' element={<Page404 />} />
            </Routes>
          </div>
          <Footer />
        </>
      ) : (
        <SelectEstablecimiento onEstablecimientoSelected={handleEstablecimientoSelected} />
      )}
    </AuthProvider>
  )
}

export default App
