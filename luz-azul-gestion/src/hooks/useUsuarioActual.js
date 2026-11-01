import { useAuth } from '../contexts/AuthContext'
import { useEstablecimiento } from '../contexts/EstablecimientoContext'
import { useDeposito } from '../contexts/DepositoContext'

// Primera letra de las dos primeras palabras: "Pablo Benitez" -> "PB"
const obtenerIniciales = (texto) =>
  texto
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((palabra) => palabra[0].toUpperCase())
    .join('') || '?'

// Datos del usuario para la barra superior y el menú lateral.
// detalle: establecimiento y depósito elegidos ("Local Mitre · Depósito del local"); null = no se muestra.
export const useUsuarioActual = () => {
  const { user } = useAuth()
  const { establecimiento } = useEstablecimiento()
  const { Deposito } = useDeposito()
  const nombre = user?.NombreCompleto || user?.email || 'Usuario'
  const detalle = [establecimiento?.Descripcion, Deposito?.Descripcion].filter(Boolean).join(' · ')

  return {
    nombre,
    detalle: detalle || null,
    iniciales: obtenerIniciales(nombre)
  }
}
