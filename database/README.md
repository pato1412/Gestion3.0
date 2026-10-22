# Scripts de base de datos

Scripts de SQL Server que necesita Gestión, organizados como migraciones
numeradas.

## Bases de datos

| Base | Qué es | Uso |
|------|--------|-----|
| **ENSEMBLE** | Base propia de Luz Azul. | Acá se desarrollan todos los proyectos: las migraciones de esta carpeta se corren en ENSEMBLE. |
| **EMP001** | Base del ERP viejo (TEMPO_ERP). | Tiene productos y algunas configuraciones. Desde ENSEMBLE se consulta, no se modifica. |

## Conexión al servidor

Los datos de conexión van en `conexion.env`, que **no se versiona** (está en
`.gitignore`). Para crearlo, copiá `conexion.env.example` como `conexion.env`
y completá servidor, usuario, clave y los nombres de las dos bases. Si algo
cambia, se edita solo ese archivo.

`sql.ps1` usa esos datos para correr consultas o scripts. La clave se le pasa
a `sqlcmd` por variable de entorno, así que no queda en la línea de comandos
ni en el historial. Las bases se indican por alias: `Ensemble` o `Tempo`
(EMP001).

```powershell
.\database\sql.ps1 -Base Tempo -Query "SELECT name FROM sys.tables ORDER BY name"
.\database\sql.ps1 -Base Ensemble -Archivo .\database\migrations\001_clasificaciones_tablas.sql
```

Si Windows no deja ejecutar el script por la política de ejecución:
`powershell -ExecutionPolicy Bypass -File .\database\sql.ps1 ...`

## Cómo correrlos

Correr los archivos de `migrations/` **en orden**, conectado a **ENSEMBLE**.
Desde SSMS, abrí cada archivo y ejecutalo. Desde la terminal:

```powershell
.\database\sql.ps1 -Base Ensemble -Archivo .\database\migrations\001_clasificaciones_tablas.sql
.\database\sql.ps1 -Base Ensemble -Archivo .\database\migrations\002_clasificaciones_procedimientos.sql
```

El script corta ante el primer error. Para crear objetos hace falta un usuario
con permisos de escritura: `claude_user` es solo de lectura.

Todos los scripts se pueden **volver a correr sin error**: si un objeto ya
existe, no se vuelve a crear. Si un script falla a la mitad, corregí el
problema y corrélo de nuevo.

## Reglas para agregar scripts

- Un cambio nuevo es un archivo nuevo con el número siguiente:
  `003_<descripcion>.sql`. **No se modifican scripts que ya se corrieron en
  producción**; los cambios van en una migración nueva.
- Tablas, índices y constraints: dentro de `IF OBJECT_ID(...) IS NULL` o
  `IF NOT EXISTS (SELECT 1 FROM sys...)`.
- Procedimientos y vistas: `CREATE OR ALTER`.
- Datos iniciales: `INSERT ... WHERE NOT EXISTS`.
- Sin `USE <base>`: el script corre sobre la base a la que te conectás.
- Separar cada objeto con `GO`.

## Migraciones

| Archivo | Contenido |
|---------|-----------|
| `001_clasificaciones_tablas.sql` | `TiposClasificacion`, `Clasificaciones` (árbol con orden por usuario, segmentado por tipo), `ProductoClasificaciones`. |
| `002_clasificaciones_procedimientos.sql` | `Clasificaciones_ObtenerArbol`, `_Insertar`, `_Reordenar`, `_Mover`, `_ObtenerProductos`; `ProductoClasificaciones_Guardar`, `_ObtenerPorProducto`. **No se corrió y no hace falta**: esa lógica está en el webservice Ensemble (`ClasificacionesController`). Además usa `OPENJSON`, que necesita compatibilidad 130 y ENSEMBLE tiene 120. |
| `003_calendario_recordatorios.sql` | `CalendarioRecordatorios`: recordatorios por establecimiento asociados a una clasificación (día, frecuencia y última fecha), con FK a `GWREstablecimientos` y `Clasificaciones`. |

## Bases externas

Los productos están en la base **EMP001** (`EMP001.dbo.Productos`). Se
acceden siempre por el sinónimo `dbo.ProductosEmpresa`, creado en `001`.

- Si en un ambiente la base de productos se llama distinto, se cambia solo el
  sinónimo:
  ```sql
  DROP SYNONYM dbo.ProductosEmpresa;
  CREATE SYNONYM dbo.ProductosEmpresa FOR <OtraBase>.dbo.Productos;
  ```
- EMP001 tiene que estar en la **misma instancia** de SQL Server. Si estuviera
  en otro servidor, el sinónimo tendría que apuntar a un linked server
  (`<Servidor>.EMP001.dbo.Productos`).
- El usuario con el que se conecta la API necesita permiso de `SELECT` sobre
  `EMP001.dbo.Productos`. El encadenamiento de permisos entre bases viene
  desactivado por defecto, así que no alcanza con tener permiso para ejecutar
  el procedimiento.
- No puede haber FK entre bases: `ProductoClasificaciones_Guardar` valida que
  el producto exista. Si un producto se borra en EMP001, sus filas en
  `ProductoClasificaciones` quedan huérfanas (no se borran solas).

## Clasificaciones

Árbol genérico para categorías, etiquetas, rubros, etc.

- Cada clasificación tiene un `TipoClasificacion` (catálogo en
  `TiposClasificacion`: 1 = Recordatorios, 2 = Aplicativo de pedidos,
  3 = Aplicativo de precios). Un árbol nunca mezcla tipos: la base exige que la madre sea del
  mismo tipo que la hija.
- Profundidad ilimitada, con `ClasificacionPadreId` (`NULL` = raíz).
- `Orden` define el orden entre hermanos; lo cambia `Clasificaciones_Reordenar`
  a partir de la lista de IDs que manda el front.
- Para mover una clasificación de lugar se usa `Clasificaciones_Mover`, que
  impide ciclos (moverla dentro de una de sus hijas).
- Baja lógica con `Activo = 0`; no se borran filas.
- Para clasificar otro concepto (clientes, proveedores...), agregar un tipo en
  `TiposClasificacion` y una tabla de asociación como `ProductoClasificaciones`.

- A un producto se le puede asignar cualquier nivel del árbol, no solo las
  hojas. `ProductoClasificaciones_Guardar` reemplaza la selección de un tipo
  sin tocar las de otros tipos.

- `ProductoId` es `VARCHAR(25)`, igual que en `EMP001.dbo.Productos`. Si
  alguna vez cambia allá, hay que cambiarlo acá también (en una migración
  nueva) y en los parámetros `@ProductoId` de los procedimientos.
- Si una consulta nueva hace `JOIN` entre `ProductoClasificaciones` y
  `dbo.ProductosEmpresa` y las dos bases tienen distinta intercalación
  (collation), va a fallar con *"Cannot resolve the collation conflict"*. En
  ese caso agregar `COLLATE DATABASE_DEFAULT` en la condición:
  `ON pe.ProductoId COLLATE DATABASE_DEFAULT = pc.ProductoId`.

## Archivos

Los `.sql` se guardan en UTF-8 **con BOM**, para que SSMS y `sqlcmd` lean bien
los acentos sin opciones extra.
