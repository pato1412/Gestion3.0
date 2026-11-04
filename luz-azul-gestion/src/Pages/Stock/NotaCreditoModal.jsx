import { useRef, useState } from 'react'
import { Alert, Button, Form, Modal } from 'react-bootstrap'
import { LARGO_NOTA_CREDITO } from '../../utils/devoluciones'

/**
 * Carga (o corrige) el número de nota de crédito de una planilla de devolución.
 * onGuardar(numero) devuelve { ok, message }: si falla, el popup queda abierto con el error.
 * Se monta con key por planilla, así cada apertura arranca con el número guardado.
 */
const NotaCreditoModal = ({ planilla, onGuardar, onCerrar }) => {
  const [numero, setNumero] = useState(planilla.NotaCredito ?? '')
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)
  const campo = useRef(null)

  const guardar = async (e) => {
    e.preventDefault()
    const valor = numero.trim()
    if (!valor) {
      setError('Ingresá el número de la nota de crédito.')
      return
    }
    setGuardando(true)
    setError('')
    const resultado = await onGuardar(valor)
    setGuardando(false)
    if (!resultado.ok) setError(resultado.message)
  }

  return (
    // El foco va al campo cuando termina de abrirse (el Modal toma el foco al abrir y pisa autoFocus)
    <Modal show onHide={onCerrar} onEntered={() => campo.current?.focus()} centered>
      <Form onSubmit={guardar}>
        <Modal.Header closeButton>
          <Modal.Title as='h5'>Nota de credito - Planilla N° {planilla.DevolucionId}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className='small text-muted'>
            {planilla.Establecimiento}. Con la nota de credito cargada la planilla pasa a estado <strong>Generada</strong>.
          </p>
          <Form.Group controlId='txtNotaCredito'>
            <Form.Label>Numero de nota de credito</Form.Label>
            <Form.Control
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
              maxLength={LARGO_NOTA_CREDITO}
              placeholder='Ej.: 0001-00012345'
              ref={campo}
              isInvalid={!!error}
              disabled={guardando}
            />
          </Form.Group>
          {error && <Alert variant='danger' className='mt-3 mb-0'>{error}</Alert>}
        </Modal.Body>
        <Modal.Footer>
          <Button variant='secondary' onClick={onCerrar} disabled={guardando}>Cancelar</Button>
          <Button variant='primary' type='submit' disabled={guardando}>{guardando ? 'Guardando...' : 'Guardar'}</Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}

export default NotaCreditoModal
