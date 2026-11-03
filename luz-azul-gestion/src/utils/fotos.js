// Lado mayor y calidad con que se suben las fotos: una foto de celular de 4-8 MB queda en unos 300 KB
const LADO_MAXIMO = 1600
const CALIDAD_JPEG = 0.82

const cargarImagen = (file) =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('El navegador no puede abrir la imagen. Probá con una foto JPG o PNG.'))
    }
    img.src = url
  })

/**
 * Achica la foto (respeta la orientación de la cámara) y la devuelve como JPEG.
 * Si el navegador no la puede abrir (por ejemplo HEIC en una PC) lanza un error.
 */
export const reducirFoto = async (file) => {
  const img = await cargarImagen(file)
  const escala = Math.min(1, LADO_MAXIMO / Math.max(img.naturalWidth, img.naturalHeight))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(img.naturalWidth * escala)
  canvas.height = Math.round(img.naturalHeight * escala)
  const ctx = canvas.getContext('2d')
  // Fondo blanco para las PNG con transparencia (JPEG no la tiene)
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', CALIDAD_JPEG))
  if (!blob) throw new Error('No se pudo procesar la imagen.')
  return blob
}

export const formatBytes = (bytes) => {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toLocaleString('es-AR', { maximumFractionDigits: 1 })} MB`
}
