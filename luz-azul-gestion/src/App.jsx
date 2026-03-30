import { useState, useEffect } from 'react'
import { Route, Routes } from 'react-router-dom'
import Home from './Pages/Home/Home'
import LoginPage from './Pages/Login/Login'
import Page404 from './Pages/404/404'
import SelectEstablecimiento from './Pages/SelectEstablecimiento/SelectEstablecimiento'
import Cookies from 'js-cookie'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import NuevoPedido from './Pages/Pedidos/NuevoPedido'

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
          <Routes>
            <Route path='/login' element={<LoginPage />} />
            <Route path='/' element={<ProtectedRoute><Home /></ProtectedRoute>} />
            <Route path='/pedidos/enviar-pedidos' element={<ProtectedRoute><NuevoPedido /></ProtectedRoute>} />
            <Route path='/stock/carga-mermas' element={<ProtectedRoute><Home /></ProtectedRoute>} />
            <Route path='/stock/control-inventario' element={<ProtectedRoute><Home /></ProtectedRoute>} />
            <Route path='/stock/carga-planillas' element={<ProtectedRoute><Home /></ProtectedRoute>} />
            <Route path='/configuraciones' element={<ProtectedRoute><Home /></ProtectedRoute>} />
            <Route path='*' element={<Page404 />} />
          </Routes>
        </>
      ) : (
        <SelectEstablecimiento onEstablecimientoSelected={handleEstablecimientoSelected} />
      )}
    </AuthProvider>
  )
}

export default App
