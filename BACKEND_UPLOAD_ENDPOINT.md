# Implementación del Endpoint de Carga de Imágenes para Notificaciones

## Resumen
Se requiere crear un endpoint en el backend que maneje la carga de archivos de imagen (JPG/PNG) para las notificaciones. El frontend ya está configurado y envía los archivos con un nombre único basado en GUID.

## Especificaciones del Endpoint

### URL y Método
- **Ruta:** `/Ensemble/UploadNotificationImage`
- **Método HTTP:** `POST`
- **Content-Type:** `multipart/form-data`

### Parámetros Recibidos (FormData)
```
- file: (IFormFile) El archivo de imagen a subir
- fileName: (string) El nombre del archivo con extensión (ej: "550e8400-e29b-41d4-a716-446655440000.jpg")
```

### Headers Esperados
```
- EstablecimientoGUID: (string) El GUID del establecimiento que sube la imagen
```

### Respuesta Exitosa (HTTP 200)
```json
{
  "success": true,
  "imageUrl": "https://webservices.luz-azul.com.ar/Uploads/Notifications/550e8400-e29b-41d4-a716-446655440000.jpg",
  "message": "Imagen subida correctamente"
}
```

### Respuesta con Error (HTTP 400 o 500)
```json
{
  "success": false,
  "message": "Descripción del error"
}
```

## Ejemplo de Implementación en C# (.NET)

```csharp
[ApiController]
[Route("api/[controller]")]
public class UploadController : ControllerBase
{
    private readonly ILogger<UploadController> _logger;
    private readonly IConfiguration _configuration;
    
    // La ruta base para guardar los archivos
    private readonly string _uploadPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "Uploads", "Notifications");

    public UploadController(ILogger<UploadController> logger, IConfiguration configuration)
    {
        _logger = logger;
        _configuration = configuration;
    }

    [HttpPost("NotificationImage")]
    public async Task<IActionResult> UploadNotificationImage(
        [FromForm] IFormFile file,
        [FromForm] string fileName,
        [FromHeader(Name = "EstablecimientoGUID")] string establecimientoGUID)
    {
        try
        {
            // Validar que el archivo no sea nulo
            if (file == null || file.Length == 0)
            {
                return BadRequest(new
                {
                    success = false,
                    message = "No se proporcionó ningún archivo"
                });
            }

            // Validar el tipo de archivo
            var allowedMimeTypes = new[] { "image/jpeg", "image/png" };
            if (!allowedMimeTypes.Contains(file.ContentType.ToLower()))
            {
                return BadRequest(new
                {
                    success = false,
                    message = "Solo se permiten archivos JPG y PNG"
                });
            }

            // Validar el tamaño máximo (5MB)
            const long maxFileSize = 5 * 1024 * 1024; // 5MB
            if (file.Length > maxFileSize)
            {
                return BadRequest(new
                {
                    success = false,
                    message = "El archivo excede el tamaño máximo permitido (5MB)"
                });
            }

            // Validar que el nombre de archivo contiene un GUID
            if (string.IsNullOrWhiteSpace(fileName) || 
                (!fileName.EndsWith(".jpg", StringComparison.OrdinalIgnoreCase) && 
                 !fileName.EndsWith(".png", StringComparison.OrdinalIgnoreCase)))
            {
                return BadRequest(new
                {
                    success = false,
                    message = "Nombre de archivo inválido"
                });
            }

            // Crear la carpeta si no existe
            if (!Directory.Exists(_uploadPath))
            {
                Directory.CreateDirectory(_uploadPath);
            }

            // Guardar el archivo
            var filePath = Path.Combine(_uploadPath, fileName);
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // Construir la URL pública del archivo
            var baseUrl = $"{Request.Scheme}://{Request.Host}";
            var relativeUrl = $"/Uploads/Notifications/{fileName}";
            var imageUrl = baseUrl + relativeUrl;

            _logger.LogInformation($"Imagen subida correctamente: {fileName} por establecimiento {establecimientoGUID}");

            return Ok(new
            {
                success = true,
                imageUrl = imageUrl,
                message = "Imagen subida correctamente"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error al subir la imagen: {ex.Message}");
            return StatusCode(500, new
            {
                success = false,
                message = $"Error al subir la imagen: {ex.Message}"
            });
        }
    }
}
```

## Configuración en Startup/Program.cs

Asegúrate de que el endpoint esté registrado en tus rutas:

```csharp
// En Program.cs (para .NET 6+)
builder.Services.AddControllers();

app.MapControllers();

// O en Startup.cs (para versiones anteriores)
app.UseRouting();
app.UseEndpoints(endpoints =>
{
    endpoints.MapControllers();
});
```

## Configuración de wwwroot

1. Asegúrate de que la carpeta `wwwroot` esté configurada en tu proyecto .NET
2. La carpeta `wwwroot/Uploads/Notifications` se creará automáticamente si no existe

## Consideraciones Adicionales

### 1. Seguridad
- Validar el EstablecimientoGUID contra la base de datos si es necesario
- Implementar control de acceso para asegurar que solo los usuarios autenticados puedan subir
- Considerar usar un servicio de almacenamiento en la nube (Azure Blob Storage, AWS S3, etc.)

### 2. Limpieza de Archivos
- Implementar una política de eliminación de archivos si es necesario
- Considerar limpiar archivos huérfanos si se elimina una notificación

### 3. Compresión de Imágenes
- Considerar comprimir las imágenes antes de guardarlas
- Generar thumbnails si es necesario

### 4. Base de Datos
- Opcionalmente, registrar en la base de datos:
  - El nombre del archivo subido
  - La fecha/hora de carga
  - El establecimiento que lo subió
  - La URL pública del archivo

## Testing

Para probar el endpoint con cURL:

```bash
curl -X POST "https://webservices.luz-azul.com.ar/Ensemble/UploadNotificationImage" \
  -H "EstablecimientoGUID: your-guid-here" \
  -F "file=@/ruta/a/imagen.jpg" \
  -F "fileName=550e8400-e29b-41d4-a716-446655440000.jpg"
```

## Variables de Entorno (Opcional)

Si deseas hacer configurable la ruta de almacenamiento, agrega a tu `appsettings.json`:

```json
{
  "UploadSettings": {
    "NotificationsFolder": "Uploads/Notifications",
    "MaxFileSize": 5242880,
    "AllowedExtensions": [".jpg", ".jpeg", ".png"]
  }
}
```

Y úsalo en el controlador:

```csharp
private readonly string _notificationsFolder = 
    configuration.GetValue<string>("UploadSettings:NotificationsFolder");
```
