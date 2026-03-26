import { useState, useEffect } from 'react'
import { Route, Routes } from 'react-router-dom'
import Home from './Pages/Home/Home'
import Login from './Pages/Login/Login'
import Page404 from './Pages/404/404'
import SelectEstablecimiento from './Pages/SelectEstablecimiento/SelectEstablecimiento'
import Cookies from 'js-cookie'

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
    <>
      {establecimientoSelected ? (
        <>
          <Routes>
            <Route path='/' element={<Home />} />
            <Route path='/pedidos/enviar-pedidos' element={<Home />} />
            <Route path='/stock/carga-mermas' element={<Home />} />
            <Route path='/stock/control-inventario' element={<Home />} />
            <Route path='/stock/carga-planillas' element={<Home />} />
            <Route path='/configuraciones' element={<Home />} />
            <Route path='/login' element={<Login />} />
            <Route path='*' element={<Page404 />} />
          </Routes>
        </>
      ) : (
        <SelectEstablecimiento onEstablecimientoSelected={handleEstablecimientoSelected} />
      )}
    </>
  )
}

export default App
