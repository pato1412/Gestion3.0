import { useState, useEffect } from 'react'
import { Route, Routes } from 'react-router-dom'
import Home from './Pages/Home/Home'
import Login from './Pages/Login/Login'
import SelectEstablecimiento from './Pages/SelectEstablecimiento/SelectEstablecimiento'
import Cookies from 'js-cookie'
import Sidebar from './components/Sidebar'

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
    alert(`Establecimiento seleccionado: ${establecimiento.Descripcion}`);
  };

  return (
    <>
      {establecimientoSelected ? (
        <>
          <Sidebar />
          <Routes>
            <Route path='/' element={<Home />} />
            <Route path='/login' element={<Login />} />
          </Routes>
        </>
      ) : (
        <SelectEstablecimiento onEstablecimientoSelected={handleEstablecimientoSelected} />
      )}
    </>
  )
}

export default App
