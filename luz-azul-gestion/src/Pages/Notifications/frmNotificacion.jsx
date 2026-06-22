import Sidebar from '../../components/Sidebar/Sidebar'
import { Form, Row, Col, Button } from 'react-bootstrap'
import { useState, useRef, useEffect } from 'react'
import './notifications.css'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { apiFetch, API_URLS } from '../../config/api'
import ShowError from '../../components/ShowError/ShowError'
import Loader from '../../components/Loader/Loader'
import { useModal } from '../../contexts/ModalContext'
import { useNavigate } from 'react-router-dom'

const FrmNotificacion = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [MessageLoader, setMessageLoader] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showError, setShowError] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const { openModal } = useModal();
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [category, setCategory] = useState('general');
  const refTitulo = useRef(null);
  const refDescripcion = useRef(null);
  const refImageURL = useRef(null);
  const refLinkURL = useRef(null);
  const refFileInput = useRef(null);
  const [establecimientos, setEstablecimientos] = useState([]);
  const [selectedEstablecimientos, setSelectedEstablecimientos] = useState([]);
  const navigate = useNavigate();


    useEffect(() => {
        const fetchEstablecimientos = async () => {
            setIsLoading(true);
            setMessageLoader("Cargando todos los establecimientos...");
            try {
                const data = {};
                const establecimientos = await apiFetch( API_URLS.getEstablecimientos, { method: 'POST', body: JSON.stringify(data) });
                setEstablecimientos(establecimientos);
            } catch (error) {
                showErrorAlert(`Error cargando establecimientos: ${getErrorMessage(error)}`);
            } finally {
                setIsLoading(false);
                setMessageLoader('');
             }
        };

        fetchEstablecimientos();
    }, []);


    const getErrorMessage = (error) => {
        if (!error) return 'Error inesperado';
        if (typeof error === 'string') return error;
        if (error.message) return error.message;
        try {
            return JSON.stringify(error);
        } catch {
            return 'Error inesperado';
        }
    }

    const showErrorAlert = (error) => {
        setErrorMessage(getErrorMessage(error));
        setShowError(true);
    }

    const generateGUID = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    };

    const handleUploadImage = async () => {
        const file = refFileInput.current?.files?.[0];
        
        if (!file) {
            showErrorAlert('Por favor selecciona un archivo');
            return;
        }

        // Validar tipo de archivo
        const allowedTypes = ['image/jpeg', 'image/png'];
        if (!allowedTypes.includes(file.type)) {
            showErrorAlert('Solo se permiten archivos JPG y PNG');
            return;
        }

        // Validar tamaño (máximo 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            showErrorAlert('El archivo no debe superar 5MB');
            return;
        }

        setIsUploadingImage(true);
        try {
            const guid = generateGUID();
            const fileExtension = file.type === 'image/jpeg' ? '.jpg' : '.png';
            const fileName = `${guid}${fileExtension}`;

            const formData = new FormData();
            formData.append('file', file);
            formData.append('fileName', fileName);

            const response = await fetch(API_URLS.UploadNotificationImage, {
                method: 'POST',
                body: formData,
                headers: {
                    'EstablecimientoGUID': JSON.parse(localStorage.getItem('EstablecimientoData') || '{}').EstablecimientoGUID || ''
                }
            });

            if (!response.ok) {
                throw new Error(`Error al subir la imagen: ${response.statusText}`);
            }

            const result = await response.json();
            
            if (result.success && result.imageUrl) {
                refImageURL.current.value = result.imageUrl;
                openModal('Éxito', 'Imagen subida correctamente');
                // Limpiar el input file
                refFileInput.current.value = '';
            } else {
                showErrorAlert(result.message || 'No se pudo subir la imagen');
            }
        } catch (error) {
            showErrorAlert(`Error al subir la imagen: ${getErrorMessage(error)}`);
        } finally {
            setIsUploadingImage(false);
        }
    };


  const handleSelectAllEstablecimientos = () => {
    const allIds = establecimientos.map(est => est.EstablecimientoId.toString());
    setSelectedEstablecimientos(allIds);
  };

  const handleDeselectAllEstablecimientos = () => {
    setSelectedEstablecimientos([]);
  };

  const handleGuardarNotificacion = async() => {
        setIsLoading(true);
        setMessageLoader("Generando notificacion...");
        try{

          const arrayDeEstablecimientos = selectedEstablecimientos.map(numero => ({
            NotificacionId: 0,
            EstablecimientoId: Number(numero)
          }));

          const newNotification = {
            Titulo: refTitulo.current.value,
            Detalle: refDescripcion.current.value,
            Categoria: category,
            LinkUrl: refLinkURL.current.value,
            ImageURL: refImageURL.current.value,
            FechaDesde: dateStart,
            FechaHasta: dateEnd,
            Establecimientos: arrayDeEstablecimientos
          };
          const detalleResponse = await apiFetch(API_URLS.InsertNotificaciones , { method: 'POST', body: JSON.stringify(newNotification)});                
          if (detalleResponse && detalleResponse.bok === true) {
            openModal("Notificacion Generada", "La notificacion se ha generado correctamente.", () => {
              navigate("/notificaciones/listar-notificaciones");
            });
          }else{
            showErrorAlert("No se pudieron guardar los detalles de la notificacion. Intente nuevamente.");
          }
        } catch (error) {
            showErrorAlert(`Error cargando la planilla: ${getErrorMessage(error)}`);
        } finally {
            setIsLoading(false);
        }    
  };

  return (
    <>
        <Sidebar title={"Nueva notificación"} />
        <div className='container'>
            <ShowError
                message={errorMessage}
                show={showError}
                onClose={() => setShowError(false)}
            />  
          <div className='Container-notifications-form mb-3'>
            <div className='Container-notifications-header d-flex align-items-center justify-content-between'>
              <h5>Crear nueva notificación</h5>
            </div>
            <div className='Container-notifications-content'>
              <Row className='mb-3'>
                <Form.Group controlId="formCategory" className='col-md-6'>
                  <Form.Label>Categoría</Form.Label>
                  <Form.Select aria-label="Default select example" value={category} onChange={(e) => setCategory(e.target.value)} >
                    <option value="general">General</option>
                    <option value="marketing">Marketing</option>
                    <option value="sistemas">Sistemas</option>
                  </Form.Select>
                </Form.Group>
                <Form.Group controlId="formTitle" className='col-md-6'>
                  <Form.Label>Título</Form.Label>
                  <Form.Control ref={refTitulo}  type="text" placeholder="Ingrese el título de la notificación" />
                </Form.Group>
              </Row>
              <Row className='mb-3'>
                <Form.Group controlId="formDescription" className='col-md-12'>
                  <Form.Label>Descripción</Form.Label>
                  <Form.Control ref={refDescripcion} as="textarea" rows={3} placeholder="Ingrese la descripción de la notificación" />
                </Form.Group>
              </Row>
              <Row className='mb-3'>
                <Form.Group controlId="formImageURL" className='col-md-6'>
                  <Form.Label>Imagen URL</Form.Label>
                  <div className='d-flex gap-2'>
                    <Form.Control 
                      ref={refImageURL} 
                      type="text" 
                      placeholder="Ingrese la URL de la imagen" 
                      className='flex-grow-1'
                    />
                    <Button 
                      variant="outline-secondary" 
                      size="sm"
                      onClick={() => refFileInput.current?.click()}
                      disabled={isUploadingImage}
                      className='text-nowrap'
                    >
                      {isUploadingImage ? 'Subiendo...' : 'Subir archivo'}
                    </Button>
                  </div>
                  <input 
                    ref={refFileInput}
                    type="file" 
                    accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                    style={{ display: 'none' }}
                    onChange={handleUploadImage}
                  />
                  <Form.Text id="txtCodigoHelpBlock" muted>
                       El formato aceptado es: JPG y PNG. (Máximo 5MB)
                  </Form.Text>
                </Form.Group>
                <Form.Group controlId="formLinkURL" className='col-md-6'>
                  <Form.Label>Link URL</Form.Label>
                  <Form.Control ref={refLinkURL} type="text" placeholder="Ingrese la URL del enlace" />
                </Form.Group>
              </Row>
              <Row className='mb-3'>
                <Form.Group controlId="formDate" className='col-md-6'> 
                  <Form.Label>Fecha Desde</Form.Label>
                  <DatePicker 
                  showTimeSelect
                  timeFormat="HH:mm"
                  timeIntervals={30}
                  timeCaption="Hora"
                  dateFormat="d/MM/yyyy h:mm aa"
                  selected={dateStart} 
                  onChange={(date) => setDateStart(date)} 
                  className="form-control" // Uses Bootstrap input styling
                />
                </Form.Group>
                <Form.Group controlId="formDateEnd" className='col-md-6'>
                  <Form.Label>Fecha Hasta</Form.Label>
                  <DatePicker 
                  showTimeSelect
                  timeFormat="HH:mm"
                  timeIntervals={30}
                  timeCaption="Hora"
                  dateFormat="d/MM/yyyy h:mm aa"
                  selected={dateEnd} 
                  onChange={(date) => setDateEnd(date)} 
                  className="form-control" // Uses Bootstrap input styling
                />
                </Form.Group>
              </Row>
            </div>
          </div>
          <div className='Container-notifications-form mb-3'>
            <div className='Container-notifications-header d-flex align-items-center justify-content-between'>
              <h5>Establecimientos</h5>
            </div>
            <div className='Container-notifications-content'>
              {establecimientos.length === 0 ? (
                <div className='text-center'>No hay establecimientos disponibles.</div>
              ) : (
              establecimientos.length > 0 && (
                <>
                  <Row className='mb-3 ps-4'>
                    {establecimientos.map((establecimiento) => (
                      <Col key={establecimiento.EstablecimientoId} xs={6} sm={4} md={2} className="mb-2">
                        <Form.Check
                          type="checkbox"
                          id={`checkbox-${establecimiento.EstablecimientoId}`}
                          label={establecimiento.Descripcion} 
                          value={establecimiento.EstablecimientoId}
                          checked={selectedEstablecimientos.includes(establecimiento.EstablecimientoId.toString())}
                          onChange={(e) => {   
                            if (e.target.checked) {
                              setSelectedEstablecimientos([...selectedEstablecimientos, e.target.value]);
                            } else {
                              setSelectedEstablecimientos(selectedEstablecimientos.filter(id => id !== e.target.value));
                            }
                          }}
                        />
                      </Col>
                    ))}
                  </Row>
                  <Row className='mt-3 pt-2 border-top'>
                    <Col xs={12} className="d-flex gap-2">
                      <Button 
                        onClick={handleSelectAllEstablecimientos}
                        variant="outline-success"
                        size="sm"
                      >
                        Seleccionar todos
                      </Button>
                      <Button 
                        onClick={handleDeselectAllEstablecimientos}
                        variant="outline-danger"
                        size="sm"
                      >
                        Desmarcar todos
                      </Button>
                    </Col>
                  </Row>
                </>
              ))}
            </div>
          </div>
          <Row >
            <Col className="mb-3 d-flex d-flex align-items-center justify-content-end" xs={12} md={12}>
                <Button onClick={handleGuardarNotificacion} variant="primary">Guardar notificación</Button>                   
            </Col>
          </Row>
        </div>
        <Loader visible={isLoading} message={MessageLoader} />
    </>
  )
}

export default FrmNotificacion