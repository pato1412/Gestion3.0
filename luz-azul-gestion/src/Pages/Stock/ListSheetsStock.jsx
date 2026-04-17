import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Sidebar from '../../components/Sidebar/Sidebar'
import Loader from '../../components/Loader/Loader'
import { apiFetch, API_URLS, GetDepositosUsuario } from '../../config/api'
import './stock.css'

const formatDateTime = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  const pad = (num) => String(num).padStart(2, '0')
  const day = pad(date.getDate())
  const month = pad(date.getMonth() + 1)
  const year = date.getFullYear()
  const hours = pad(date.getHours())
  const minutes = pad(date.getMinutes())

  return `${day}/${month}/${year} ${hours}:${minutes}`
}

const ListSheetsStock = () => {
  const [planillas, setPlanillas] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchPlanillas = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const data = await apiFetch(API_URLS.GetPlanillasInventario)

        /* COnsultamos los depósitos del usuario para mostrar el nombre del depósito en la tabla de planillas */
        const Depositos = await GetDepositosUsuario();

        if (Depositos && Array.isArray(Depositos) && Depositos.length > 0) {

          for (var n = 0; n < data.length; n++) {
            const planilla = data[n];
            const deposito = Depositos.find(d => d.DepositoId === planilla.DepositoId);
            if (deposito) {
              planilla.DepositoNombre = deposito.Descripcion;
            }
          }
        }

        setPlanillas(Array.isArray(data) ? data : [])
      } catch (err) {
        console.error('Error al cargar planillas de inventario:', err)
        setError('No se pudieron cargar las planillas. Intente nuevamente más tarde.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchPlanillas()
  }, [])

  return (
    <>
      <Sidebar title={'Planillas de inventario'} />
      <div className='container'>
        <div className='Container-stock-form mb-3'>
          <div className='Container-stock-header d-flex align-items-center justify-content-between'>
            <h5>Planillas de inventario</h5>
            <Link to='/stock/nueva-planilla' className='btn btn-primary'>
              Nueva Planilla
            </Link>
          </div>
          <div className='Container-stock-content'>
            {error && <div className='alert alert-danger'>{error}</div>}
            <div className='table-responsive'>
              <table className='table table-striped'>
                <thead>
                  <tr>
                    <th>Usuario</th>
                    <th>FechaInicio</th>
                    <th>FechaFin</th>
                    <th>Deposito</th>
                    <th>Observaciones</th>
                  </tr>
                </thead>
                <tbody>
                  {planillas.length === 0 ? (
                    <tr>
                      <td colSpan='5' className='text-center'>
                        No hay planillas disponibles.
                      </td>
                    </tr>
                  ) : (
                    planillas.map((planilla) => (
                      <tr key={planilla.InventarioId} >
                        <td>{planilla.Usuario ?? ''}</td>
                        <td>{formatDateTime(planilla.FechaInicio)}</td>
                        <td>{formatDateTime(planilla.FechaFin)}</td>
                        <td>{planilla.DepositoNombre ?? ''}</td>
                        <td>{planilla.Observaciones ?? ''}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      <Loader visible={isLoading} message='Cargando planillas de inventario...' ShowProgress={false} />
    </>
  )
}

export default ListSheetsStock