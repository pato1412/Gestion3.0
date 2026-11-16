/*
    017 - Quitar de GWREstablecimientos la conexión a Tempo ERP (Server, UID, PWD, DBNAME)

    Eran los datos para conectarse directo a la base de Tempo ERP de cada local (plataforma "DSK",
    escritorio). Ningún establecimiento usa esa plataforma (son ST, AY o sin plataforma) y Tempo ERP
    está obsoleto. PWD guardaba contraseñas: no deben quedar en la tabla.

    ORDEN: correrla DESPUÉS de publicar Ensemble, WSMaestros y WSIntegraTempo sin esas columnas.
    Las versiones anteriores las piden en sus SELECT y, sin las columnas, no encuentran ningún
    establecimiento (el error queda oculto y todo deja de funcionar sin avisar).

    Se corre en ENSEMBLE. Se puede volver a correr: si las columnas ya no están no hace nada.
    Todo o nada. No se puede deshacer: los valores se pierden.
*/
SET NOCOUNT ON;
SET XACT_ABORT ON;
GO

IF OBJECT_ID(N'dbo.GWREstablecimientos', N'U') IS NULL
    THROW 50001, N'No existe dbo.GWREstablecimientos: correr la migración en ENSEMBLE.', 1;

DECLARE @Columnas TABLE (Nombre SYSNAME NOT NULL PRIMARY KEY, ColumnId INT NOT NULL);
INSERT INTO @Columnas (Nombre, ColumnId)
SELECT c.name, c.column_id
FROM sys.columns c
WHERE c.object_id = OBJECT_ID(N'dbo.GWREstablecimientos')
  AND c.name IN (N'Server', N'UID', N'PWD', N'DBNAME');

IF NOT EXISTS (SELECT 1 FROM @Columnas)
BEGIN
    PRINT N'GWREstablecimientos ya no tiene las columnas de Tempo ERP: no se cambió nada.';
    RETURN;
END

-- Un índice sobre alguna de las columnas impediría borrarla: mejor cortar y revisarlo a mano.
IF EXISTS (SELECT 1
           FROM sys.index_columns ic
           JOIN @Columnas c ON c.ColumnId = ic.column_id
           WHERE ic.object_id = OBJECT_ID(N'dbo.GWREstablecimientos'))
    THROW 50002, N'Hay un índice que usa Server, UID, PWD o DBNAME: no se cambió nada. Revisarlo antes de correr la migración.', 1;

-- Las estadísticas sueltas (automáticas o creadas a mano) se borran antes que las columnas.
DECLARE @Sql NVARCHAR(MAX) = N'', @Lista NVARCHAR(400) = NULL;

SELECT @Sql += N'DROP STATISTICS dbo.GWREstablecimientos.' + QUOTENAME(s.name) + N'; '
FROM sys.stats s
WHERE s.object_id = OBJECT_ID(N'dbo.GWREstablecimientos')
  AND (s.auto_created = 1 OR s.user_created = 1)
  AND EXISTS (SELECT 1
              FROM sys.stats_columns sc
              JOIN @Columnas c ON c.ColumnId = sc.column_id
              WHERE sc.object_id = s.object_id AND sc.stats_id = s.stats_id);

SELECT @Lista = ISNULL(@Lista + N', ', N'') + QUOTENAME(Nombre) FROM @Columnas ORDER BY ColumnId;
SET @Sql += N'ALTER TABLE dbo.GWREstablecimientos DROP COLUMN ' + @Lista + N';';

BEGIN TRANSACTION;
EXEC sys.sp_executesql @Sql;
COMMIT TRANSACTION;

PRINT N'Columnas quitadas de GWREstablecimientos: ' + @Lista + N'.';
GO
