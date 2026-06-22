# ✅ Implementación de Carga de Imágenes - RESUMEN DE CAMBIOS

## 📋 Descripción General
Se ha implementado la funcionalidad de carga de archivos de imagen para el formulario de notificaciones. El usuario puede ahora hacer clic en un botón "Subir archivo" junto al campo "Imagen URL" para cargar una imagen JPG o PNG, que será almacenada en el servidor con un identificador único (GUID) y la URL resultante se llenará automáticamente en el campo de texto.

---

## 📝 Archivos Modificados

### 1. `.env`
**Ubicación:** `luz-azul-gestion/.env`

Se agregó la siguiente variable de entorno:
```
VITE_API_UPLOAD_NOTIFICATION_IMAGE_URL=/Ensemble/UploadNotificationImage
```

---

### 2. `src/config/api.js`
**Ubicación:** `luz-azul-gestion/src/config/api.js`

Se agregó la nueva URL de API al objeto `API_URLS`:
```javascript
UploadNotificationImage: import.meta.env.VITE_API_DOMAIN + import.meta.env.VITE_API_UPLOAD_NOTIFICATION_IMAGE_URL
```

---

### 3. `src/Pages/Notifications/frmNotificacion.jsx`
**Ubicación:** `luz-azul-gestion/src/Pages/Notifications/frmNotificacion.jsx`

**Cambios realizados:**

#### a) Estados adicionales
```javascript
const [isUploadingImage, setIsUploadingImage] = useState(false);
const refFileInput = useRef(null);
```

#### b) Función generadora de GUIDs
```javascript
const generateGUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};
```

#### c) Función de carga de archivos
```javascript
const handleUploadImage = async () => {
    // Validación del archivo
    // Validación del tipo (JPG/PNG)
    // Validación del tamaño (máximo 5MB)
    // Generación de GUID único
    // Envío a servidor
    // Llenado automático del campo de URL
}
```

#### d) Interfaz de usuario
Se agregó un botón "Subir archivo" junto al campo de Imagen URL con:
- Input file oculto
- Validación en tiempo real
- Indicador de estado "Subiendo..."
- Mensaje de éxito/error

---

## ✨ Características Implementadas

### Frontend
✅ Botón "Subir archivo" junto al campo de Imagen URL
✅ Validación de tipo de archivo (solo JPG y PNG)
✅ Validación de tamaño máximo (5MB)
✅ Generación automática de GUID único para cada archivo
✅ Llenado automático del campo de URL después de subir
✅ Feedback visual (estado "Subiendo...", mensajes de error/éxito)
✅ Input file oculto que se abre al hacer clic en el botón
✅ Limpieza automática del input file después de la carga exitosa

### Validaciones
- ✅ Solo acepta archivos con MIME type: `image/jpeg`, `image/png`
- ✅ Extensiones permitidas: `.jpg`, `.jpeg`, `.png`
- ✅ Tamaño máximo: 5MB
- ✅ Identificador único: GUID (formato RFC 4122 v4)

---

## 🔧 Qué se Necesita en el Backend

Se requiere crear un endpoint en el servidor backend para:

1. **Recibir** los datos del archivo mediante FormData
2. **Validar** que el archivo sea JPG o PNG
3. **Guardar** el archivo en la carpeta `Uploads/Notifications` con el nombre GUID
4. **Retornar** la URL pública del archivo guardado

### Especificaciones técnicas del endpoint:
- **Ruta:** `/Ensemble/UploadNotificationImage`
- **Método:** POST
- **Content-Type:** multipart/form-data
- **Parámetros:** `file` (IFormFile), `fileName` (string)
- **Header:** `EstablecimientoGUID` (string)

### Respuesta esperada (exitosa):
```json
{
  "success": true,
  "imageUrl": "https://webservices.luz-azul.com.ar/Uploads/Notifications/550e8400-e29b-41d4-a716-446655440000.jpg",
  "message": "Imagen subida correctamente"
}
```

---

## 📄 Documentación Disponible

Se ha creado un archivo de documentación completa para el backend:
📁 **Archivo:** `BACKEND_UPLOAD_ENDPOINT.md` (en la raíz del proyecto)

Este archivo contiene:
- Especificaciones técnicas del endpoint
- Ejemplo completo de implementación en C# (.NET)
- Configuración necesaria
- Consideraciones de seguridad
- Ejemplos de testing con cURL

---

## 🚀 Próximos Pasos

1. **Implementar el endpoint en el backend** usando la documentación proporcionada (`BACKEND_UPLOAD_ENDPOINT.md`)
2. **Configurar la carpeta de almacenamiento** en el servidor (`Uploads/Notifications`)
3. **Probar** la funcionalidad de carga de archivos en el formulario
4. **Validar** que los archivos se guardan correctamente con el GUID
5. **Verificar** que las URLs se generan correctamente

---

## 🔒 Notas de Seguridad

- El frontend valida el tipo de archivo, pero **es importante validar también en el backend**
- Se recomienda implementar autenticación/autorización en el endpoint
- Considerar usar un servicio de almacenamiento en la nube para producción
- Implementar lógica de limpieza de archivos huérfanos si se elimina una notificación

---

## 📞 Contacto/Soporte

Si tienes preguntas sobre la implementación del endpoint o necesitas ajustar validaciones, consulta el archivo `BACKEND_UPLOAD_ENDPOINT.md` que contiene ejemplos de código y mejores prácticas.
