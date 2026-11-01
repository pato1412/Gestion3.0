import { Link } from 'react-router-dom';
import { usePermisos } from '../contexts/PermisosContext';
import Loader from './Loader/Loader';
import Sidebar from './Sidebar/Sidebar';

// Muestra la página solo si el usuario tiene el permiso (o es administrador).
// El backend vuelve a validar el permiso: esto solo evita entrar desde la app.
const ProtectedPermiso = ({ permiso, children }) => {
  const { cargando, tienePermiso } = usePermisos();

  if (cargando) {
    return <Loader message='Verificando permisos...' />;
  }

  if (!tienePermiso(permiso)) {
    return (
      <>
        <Sidebar title='Sin permiso' />
        <div className='container'>
          <div className='Container-form'>
            <div className='Container-header header-orange'>
              <h5>No tenés permiso para entrar a esta sección</h5>
            </div>
            <div className='Container-content'>
              <p className='mb-3'>Si necesitás usarla, pedile a un administrador que te dé el permiso.</p>
              <Link to='/' className='btn btn-primary'>Ir al inicio</Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  return children;
};

export default ProtectedPermiso;
