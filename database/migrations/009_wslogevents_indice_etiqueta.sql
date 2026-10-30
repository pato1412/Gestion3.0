/*
    009 - Índice de WSlogEvents por establecimiento y etiqueta

    Los webservices buscan los logs por EstablecimientoId + Etiqueta:
      - Ensemble SetLogEventProcesado / SetLogEventMovimientoRealizado (UPDATE, después de cada
        comprobante que Hasar reenvía),
      - EliminarLogEvent (DELETE) y CheckLogEvent (SELECT), que además filtran por TipoError,
      - GetLogEventsPendingbyGUID (SELECT por establecimiento, TipoError y Procesado = 0).
    La tabla solo tenía la clave primaria (ErrorId), así que cada uno recorría la tabla entera y, en
    los UPDATE y DELETE, bloqueaba todas las páginas que leía. Con este índice van directo a las filas.
    TipoError y Procesado van como columnas incluidas para filtrar sin leer la fila completa.

    Se corre en ENSEMBLE. Se puede volver a correr: el índice se crea solo si no existe.
    En Enterprise/Developer se crea ONLINE (no frena las escrituras mientras se arma). Si otra sesión
    tiene la tabla bloqueada, corta a los 30 segundos con el error 1222 en lugar de quedar esperando
    y trabar a todos los que vienen detrás: en ese caso, revisar quién la bloquea y volver a correrla.
*/
SET NOCOUNT ON;
SET LOCK_TIMEOUT 30000;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes
               WHERE object_id = OBJECT_ID(N'dbo.WSlogEvents') AND name = N'IX_WSlogEvents_Establecimiento_Etiqueta')
BEGIN
    DECLARE @sql NVARCHAR(MAX) = N'CREATE NONCLUSTERED INDEX IX_WSlogEvents_Establecimiento_Etiqueta
        ON dbo.WSlogEvents (EstablecimientoId, Etiqueta)
        INCLUDE (TipoError, Procesado)';

    -- EngineEdition 3 = Enterprise o Developer: las únicas que permiten crear índices ONLINE
    IF CAST(SERVERPROPERTY('EngineEdition') AS INT) = 3
        SET @sql += N' WITH (ONLINE = ON)';

    EXEC sys.sp_executesql @sql;
    PRINT N'Índice IX_WSlogEvents_Establecimiento_Etiqueta creado.';
END
ELSE
    PRINT N'El índice IX_WSlogEvents_Establecimiento_Etiqueta ya existía.';
GO
