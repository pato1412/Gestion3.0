/*
    Diagnóstico de una base ENSEMBLE: qué partes de las migraciones tiene (solo lectura).

    Sirve para instancias que se copiaron de la nuestra en algún momento (por ejemplo la de Propionico) y saber
    desde qué migración hay que seguir. Se corre en la ENSEMBLE a revisar; no cambia nada.
    Para cada migración muestra si está su objeto o columna característica, y al final algunas cantidades.
*/
SET NOCOUNT ON;

DECLARE @r TABLE (Migracion VARCHAR(4), Objeto NVARCHAR(200), Existe BIT);

INSERT @r SELECT '001', N'dbo.Clasificaciones', CASE WHEN OBJECT_ID(N'dbo.Clasificaciones', N'U') IS NULL THEN 0 ELSE 1 END;
INSERT @r SELECT '003', N'dbo.CalendarioRecordatorios', CASE WHEN OBJECT_ID(N'dbo.CalendarioRecordatorios', N'U') IS NULL THEN 0 ELSE 1 END;
INSERT @r SELECT '005', N'dbo.Productos', CASE WHEN OBJECT_ID(N'dbo.Productos', N'U') IS NULL THEN 0 ELSE 1 END;
INSERT @r SELECT '005', N'dbo.RelProductosListasPrecios', CASE WHEN OBJECT_ID(N'dbo.RelProductosListasPrecios', N'U') IS NULL THEN 0 ELSE 1 END;
INSERT @r SELECT '005', N'dbo.UnidadesMedida', CASE WHEN OBJECT_ID(N'dbo.UnidadesMedida', N'U') IS NULL THEN 0 ELSE 1 END;
INSERT @r SELECT '010', N'PermisosGestion.EsAdministrador', CASE WHEN COL_LENGTH(N'dbo.PermisosGestion', N'EsAdministrador') IS NULL THEN 0 ELSE 1 END;
INSERT @r SELECT '011', N'ProductoClasificaciones: índice único por producto y tipo',
    CASE WHEN EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UX_ProductoClasificaciones_ProductoTipo') THEN 1 ELSE 0 END;
INSERT @r SELECT '014', N'dbo.UsuariosGestion', CASE WHEN OBJECT_ID(N'dbo.UsuariosGestion', N'U') IS NULL THEN 0 ELSE 1 END;
INSERT @r SELECT '016', N'dbo.SincronizarProductosDesdeEMP001 (procedimiento)', CASE WHEN OBJECT_ID(N'dbo.SincronizarProductosDesdeEMP001', N'P') IS NULL THEN 0 ELSE 1 END;
INSERT @r SELECT '017', N'GWREstablecimientos sin la columna Server', CASE WHEN COL_LENGTH(N'dbo.GWREstablecimientos', N'Server') IS NULL THEN 1 ELSE 0 END;
INSERT @r SELECT '018', N'GWREstablecimientos.ListaPrecioId', CASE WHEN COL_LENGTH(N'dbo.GWREstablecimientos', N'ListaPrecioId') IS NULL THEN 0 ELSE 1 END;
INSERT @r SELECT '019', N'Productos.SincroPreciosFRQ', CASE WHEN COL_LENGTH(N'dbo.Productos', N'SincroPreciosFRQ') IS NULL THEN 0 ELSE 1 END;
INSERT @r SELECT '020', N'Productos.Balanza', CASE WHEN COL_LENGTH(N'dbo.Productos', N'Balanza') IS NULL THEN 0 ELSE 1 END;
INSERT @r SELECT '020', N'dbo.ClasificacionEmails', CASE WHEN OBJECT_ID(N'dbo.ClasificacionEmails', N'U') IS NULL THEN 0 ELSE 1 END;

SELECT Migracion, Objeto, CASE Existe WHEN 1 THEN 'sí' ELSE 'NO' END AS Existe FROM @r ORDER BY Migracion;

PRINT N'--- Cantidades';
IF OBJECT_ID(N'dbo.Productos', N'U') IS NOT NULL
    EXEC (N'SELECT ''Productos ENSEMBLE'' Tabla, COUNT(*) Filas FROM dbo.Productos');
IF DB_ID(N'EMP001') IS NOT NULL
    EXEC (N'SELECT ''Productos EMP001'' Tabla, COUNT(*) Filas FROM EMP001.dbo.Productos');
IF OBJECT_ID(N'dbo.Clasificaciones', N'U') IS NOT NULL
    EXEC (N'SELECT TipoClasificacion, COUNT(*) Clasificaciones FROM dbo.Clasificaciones GROUP BY TipoClasificacion');
SELECT COUNT(*) AS Establecimientos FROM dbo.GWREstablecimientos;
SELECT DB_NAME() AS Base, @@SERVERNAME AS Instancia, (SELECT compatibility_level FROM sys.databases WHERE name = DB_NAME()) AS Compatibilidad;
