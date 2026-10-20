# Scripts de base de datos

Scripts de SQL Server que necesita Gestión, organizados como migraciones
numeradas.

## Cómo correrlos

Correr los archivos de `migrations/` **en orden**, conectado a la base de
destino. Desde SSMS, abrí cada archivo y ejecutalo. Desde la terminal:

```powershell
sqlcmd -S <servidor> -d <base> -E -b -i migrations\001_clasificaciones_tablas.sql
sqlcmd -S <servidor> -d <base> -E -b -i migrations\002_clasificaciones_procedimientos.sql
```

(`-E` usa autenticación de Windows; con usuario SQL reemplazalo por
`-U <usuario> -P <clave>`. `-b` corta ante el primer error.)

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
| `002_clasificaciones_procedimientos.sql` | `Clasificaciones_ObtenerArbol`, `_Insertar`, `_Reordenar`, `_Mover`, `_ObtenerProductos`; `ProductoClasificaciones_Guardar`, `_ObtenerPorProducto`. |

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
  `TiposClasificacion`: 1 = Categorías de productos, 2 = Etiquetas de
  productos). Un árbol nunca mezcla tipos: la base exige que la madre sea del
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
