import { useState } from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';

const ModalPrompt = ({ 
  show, 
  onHide, 
  title = "Modal title", 
  body = "Modal body", 
  onConfirm,
  showInput = false,
  inputPlaceholder = "Ingrese un valor",
  inputLabel = "Valor:"
}) => {
  const [inputValue, setInputValue] = useState('');

  // El input se limpia al cerrar o confirmar, así el próximo modal arranca vacío.
  const handleHide = () => {
    setInputValue('');
    onHide();
  };

  const handleConfirm = () => {
    if (showInput) {
      onConfirm(inputValue);
    } else {
      onConfirm();
    }
    setInputValue('');
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  return (
    <Modal
      show={show}
      onHide={handleHide}
      backdrop="static"
      keyboard={false} 
      aria-labelledby="contained-modal-title-vcenter"
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div>
          {body}
        </div>
        {showInput && (
          <Form.Group className="mt-3">
            <Form.Label>{inputLabel}</Form.Label>
            <Form.Control
              type="text"
              placeholder={inputPlaceholder}
              value={inputValue}
              onChange={handleInputChange}
              autoFocus
            />
          </Form.Group>
        )}
      </Modal.Body>
      <Modal.Footer className='justify-content-between'  >
        <Button style={{ width: 'auto' }} variant="secondary" onClick={handleHide}>
          Cerrar
        </Button>
        <Button style={{ width: 'auto' }} variant="primary" onClick={handleConfirm}>
          Continuar
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ModalPrompt;