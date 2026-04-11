import { useState, useEffect } from 'react'
import { useNavigate, Route, Routes } from 'react-router-dom'
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
import { DepositoProvider } from './contexts/DepositoContext'
import SelectDeposito from './Pages/SelectDeposito/SelectDeposito'
import ProtectedDeposito from './components/ProtectedDeposito'

function App() {
  const [establecimientoSelected, setEstablecimientoSelected] = useState(false);
  const navigate = useNavigate();

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
          <DepositoProvider >
            <div className="app-main">
              <Routes>
                <Route path='/login' element={<LoginPage />} />
                <Route path='/select-deposito' element={<SelectDeposito />} />
                <Route path='/' element={<ProtectedRoute><Home /></ProtectedRoute>} />
                <Route path='/configuraciones' element={<ProtectedRoute><ConfigPage /></ProtectedRoute>} />

                {/* Rutas protegidas que requieren autenticación y selección de depósito */}              
                <Route path='/pedidos/enviar-pedidos' element={<ProtectedRoute><ProtectedDeposito><NewOrder /></ProtectedDeposito></ProtectedRoute>} />
                <Route path='/stock/carga-mermas' element={<ProtectedRoute><ProtectedDeposito><StockPage /></ProtectedDeposito></ProtectedRoute>} />
                <Route path='/stock/control-inventario' element={<ProtectedRoute><ProtectedDeposito><StockPage /></ProtectedDeposito></ProtectedRoute>} />
                <Route path='/stock/carga-planillas' element={<ProtectedRoute><ProtectedDeposito><FrmSheetStock /></ProtectedDeposito></ProtectedRoute>} />

                <Route path='*' element={<Page404 />} />
              </Routes>
            </div>
            <Footer />
          </DepositoProvider>   
        </>
      ) : (
        <SelectEstablecimiento onEstablecimientoSelected={handleEstablecimientoSelected} />
      )}
    </AuthProvider>
  )
}

export default App
