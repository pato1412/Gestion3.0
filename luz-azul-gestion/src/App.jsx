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

function App() {
  const [establecimientoSelected, setEstablecimientoSelected] = useState(false);
  const [depositoSelected, setDepositoSelected] = useState();
  const navigate = useNavigate();

  useEffect(() => {
    const guid = Cookies.get('EstablecimientoGUID');
    if (guid) {
      setEstablecimientoSelected(true);
    }
  }, []);

  useEffect(() => {
    const Deposito =Cookies.get('DepositoData')
    const DepositoNombre = Deposito ? JSON.parse(Deposito).Descripcion : 'No seleccionado'; 
    if (DepositoNombre) {
      setDepositoSelected(DepositoNombre);
    }
  }, []);


  const handleEstablecimientoSelected = (establecimiento) => {
    setEstablecimientoSelected(true);
  };

  const handleDepositoSelected = (deposito) => {
    setDepositoSelected(deposito.Descripcion);
    // Handle deposito selection logic here
    navigate('/');
  };


  return (
    <AuthProvider>
      {establecimientoSelected ? (
        <>
          <div className="app-main">
            <Routes>
              <Route path='/login' element={<LoginPage />} />
              <Route path='/select-deposito' element={<DepositoProvider><SelectDeposito onDepositoSelected={handleDepositoSelected} /></DepositoProvider>} />
              <Route path='/' element={<ProtectedRoute><Home /></ProtectedRoute>} />
              <Route path='/configuraciones' element={<ProtectedRoute><ConfigPage /></ProtectedRoute>} />

              {/* Rutas protegidas que requieren autenticación y selección de depósito */}              
              <Route path='/pedidos/enviar-pedidos' element={<ProtectedRoute><DepositoProvider><NewOrder /></DepositoProvider></ProtectedRoute>} />
              <Route path='/stock/carga-mermas' element={<ProtectedRoute><DepositoProvider><StockPage /></DepositoProvider></ProtectedRoute>} />
              <Route path='/stock/control-inventario' element={<ProtectedRoute><DepositoProvider><StockPage /></DepositoProvider></ProtectedRoute>} />
              <Route path='/stock/carga-planillas' element={<ProtectedRoute><DepositoProvider><FrmSheetStock /></DepositoProvider></ProtectedRoute>} />

              <Route path='*' element={<Page404 />} />
            </Routes>
          </div>
          <Footer depositoNombre={depositoSelected} />
        </>
      ) : (
        <SelectEstablecimiento onEstablecimientoSelected={handleEstablecimientoSelected} />
      )}
    </AuthProvider>
  )
}

export default App
