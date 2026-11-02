// Fechas con el formato de Argentina (día/mes/año). No usar toLocaleDateString() sin locale:
// depende del idioma del navegador.

const pad = (num) => String(num).padStart(2, '0')

// "2026-10-20T14:05:00" -> "20/10 14:05" (listados)
export const formatDateTime = (value) => {
  if (!value) return ''

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

// "2026-10-20T14:05:00" o un Date -> "20/10/2026 14:05"
export const formatFullDateTime = (value) => {
  if (!value) return ''

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

// Las fechas sin hora llegan de la API como "2026-10-20T00:00:00". Se trabaja con el texto
// "AAAA-MM-DD" y no con new Date(), para que la zona horaria no corra la fecha un día.

// "2026-10-20T00:00:00" -> "2026-10-20" (valor de CampoFecha)
export const fechaParaInput = (value) => (value ? String(value).slice(0, 10) : '')

// "2026-10-20T00:00:00" -> "20/10/2026"
export const formatDate = (value) => {
  const fecha = fechaParaInput(value)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return value ?? ''
  const [anio, mes, dia] = fecha.split('-')
  return `${dia}/${mes}/${anio}`
}
