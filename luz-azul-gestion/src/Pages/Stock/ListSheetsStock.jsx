import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Sidebar from '../../components/Sidebar/Sidebar'
import Loader from '../../components/Loader/Loader'
import { apiFetch, API_URLS, GetDepositosUsuario, downloadFile } from '../../config/api'
import './stock.css'
import { Button, Nav, NavItem } from 'react-bootstrap'
import {FaTrash, FaDownload } from 'react-icons/fa'
import { useModal } from '../../contexts/ModalContext'

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

  return `${day}/${month} ${hours}:${minutes}`
}

const ListSheetsStock = () => {
  const [planillas, setPlanillas] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [MessageLoading, setMessageLoading] = useState('')
  const [error, setError] = useState(null)
  const { openModal } = useModal();

  useEffect(() => {
    const fetchPlanillas = async () => {
      setMessageLoading('Cargando planillas...')
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
        setMessageLoading('')
      }
    }

    fetchPlanillas()
  }, [])

  const handleDeletePlanilla = async (planillaId) => {
    openModal(
      'Eliminar Planilla',
      '¿Está seguro que desea eliminar esta planilla de inventario? Esta acción no se puede deshacer.',
       async (value) => {
        // Lógica para eliminar la planilla
        const data = { InventarioId: planillaId};
        const response = await apiFetch( API_URLS.DeletePlanillaInventario, { method: 'POST', body: JSON.stringify(data) });
        if (response && response.bok === true) {
          setPlanillas(prev => prev.filter(p => p.InventarioId !== planillaId));          
        } else {
          console.error('Error al eliminar la planilla:', planillaId);
          setError('No se pudo eliminar la planilla. Intente nuevamente más tarde.');
        }
      }
    );
  }

  const handleDescargar = async (planillaId) => {
    try {            
      setMessageLoading('Generando archivo excel...')
      setIsLoading(true)

      const config = {id: planillaId, NombreArchivo: `planilla_stock_${planillaId}.xlsx`};
      const excelfile = await downloadFile(API_URLS.DownloadPlanillaInventario, config.NombreArchivo, { method: 'POST', body: JSON.stringify(config) });

    } catch (error) {
      setError(`Error descargando el archivo: ${error.message}`);
    } finally {
      setIsLoading(false);
      setMessageLoading("");
    }
  }


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
                    <th className='xs-hide' >Usuario</th>
                    <th ><span className='xs-hide' >Fecha</span><span className='xs-show' >Planilla</span></th>
                    <th className='xs-hide' >Deposito</th>
                    <th style={{maxWidth:'200px'}} >Observaciones</th>
                    <th></th>
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
                        <td className='xs-hide' >{planilla.Usuario ?? ''}</td>
                        <td>
                          <div className='xs-show'>
                            <div className='item-inventario' ><span>Usuario:</span> {planilla.Usuario ?? ''}</div>
                            <div className='item-inventario' ><span>Deposito:</span> {planilla.DepositoNombre ?? ''}</div>
                            <div className='item-inventario' ><span>Inicio:</span> {formatDateTime(planilla.FechaInicio)}</div>
                            <div className='item-inventario' ><span>Fin:</span> {formatDateTime(planilla.FechaFin)}</div>
                            <div className='item-inventario' ><span>Observaciones:</span> {planilla.Observaciones ?? ''}</div>
                          </div>
                          <div className='xs-hide'>
                            Inicio: {formatDateTime(planilla.FechaInicio)}
                            <br />
                            Fin: {formatDateTime(planilla.FechaFin)}
                          </div>
                        </td>
                        <td className='xs-hide' >{planilla.DepositoNombre ?? ''}</td>
                        <td style={{maxWidth:'200px'}} className='xs-hide' >{planilla.Observaciones ?? ''}</td>
                        <td>
                          <Nav className="justify-content-center" style={{ gap: '10px', minWidth: '80px' }}>
                            <NavItem>
                              <Button variant="outline-success" size="sm" onClick={() => handleDescargar(planilla.InventarioId)}>
                                <FaDownload />
                              </Button>
                            </NavItem>  
                            <NavItem>
                              <Button variant="outline-danger" size="sm" onClick={() => handleDeletePlanilla(planilla.InventarioId)}>
                                <FaTrash />
                              </Button>
                           </NavItem>  
                          </Nav> 
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      <Loader visible={isLoading} message={MessageLoading} ShowProgress={false} />
    </>
  )
}

export default ListSheetsStock