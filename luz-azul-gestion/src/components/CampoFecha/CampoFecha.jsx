import DatePicker, { registerLocale } from 'react-datepicker'
import { es } from 'date-fns/locale'
import 'react-datepicker/dist/react-datepicker.css'
import './CampoFecha.css'

// Campos de fecha con el formato de Argentina (dd/mm/aaaa) en cualquier navegador.
// No usar <input type="date">: muestra la fecha según el idioma del navegador (mm/dd/yyyy en inglés).
registerLocale('es', es)

const pad = (num) => String(num).padStart(2, '0')

// "2026-11-15" -> fecha local (sin pasar por UTC, así la zona horaria no la corre un día)
const textoAFecha = (texto) => {
  if (!/^\d{4}-\d{2}-\d{2}/.test(texto ?? '')) return null
  const [anio, mes, dia] = texto.slice(0, 10).split('-').map(Number)
  return new Date(anio, mes - 1, dia)
}

const fechaATexto = (fecha) => (fecha ? `${fecha.getFullYear()}-${pad(fecha.getMonth() + 1)}-${pad(fecha.getDate())}` : '')

const clases = (isInvalid, className) => ['form-control', isInvalid && 'is-invalid', className].filter(Boolean).join(' ')

/**
 * Fecha sin hora. value y onChange usan el texto "AAAA-MM-DD" (como <input type="date">), así el
 * estado y la API no cambian; '' = sin fecha. Se puede escribir (15/11/2026) o elegir en el calendario.
 */
export const CampoFecha = ({ id, value, onChange, isInvalid = false, className, placeholder = 'dd/mm/aaaa', ...props }) => (
  <DatePicker
    id={id}
    selected={textoAFecha(value)}
    onChange={(fecha) => onChange(fechaATexto(fecha))}
    dateFormat='dd/MM/yyyy'
    locale='es'
    placeholderText={placeholder}
    className={clases(isInvalid, className)}
    wrapperClassName='campo-fecha'
    popperClassName='campo-fecha-popper'
    autoComplete='off'
    {...props}
  />
)

/** Fecha y hora (dd/mm/aaaa hh:mm). value y onChange usan un Date (null = sin fecha). */
export const CampoFechaHora = ({ id, value, onChange, isInvalid = false, className, placeholder = 'dd/mm/aaaa hh:mm', ...props }) => (
  <DatePicker
    id={id}
    selected={value}
    onChange={onChange}
    showTimeSelect
    timeFormat='HH:mm'
    timeIntervals={30}
    timeCaption='Hora'
    dateFormat='dd/MM/yyyy HH:mm'
    locale='es'
    placeholderText={placeholder}
    className={clases(isInvalid, className)}
    wrapperClassName='campo-fecha'
    popperClassName='campo-fecha-popper'
    autoComplete='off'
    {...props}
  />
)
