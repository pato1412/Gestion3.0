/*
    012 - Envío de la mercadería en el detalle de las planillas de devolución

    En la recepción, además de aprobar o rechazar cada renglón, el depósito indica qué se hace con
    la mercadería: Enviar (1) o Descartar (0). Queda NULL mientras no se decidió; los renglones que
    ya existen quedan en NULL.

    Se corre en ENSEMBLE. Se puede volver a correr: la columna se agrega solo si no existe.
    Correrla ANTES de publicar Ensemble: las consultas del detalle leen EnvioMercaderia y, si la
    columna no existe, fallan y el detalle de las planillas sale vacío.
*/
SET NOCOUNT ON;
GO

IF COL_LENGTH(N'dbo.DevolucionesPlanillasDetalle', N'EnvioMercaderia') IS NULL
BEGIN
    ALTER TABLE dbo.DevolucionesPlanillasDetalle ADD EnvioMercaderia BIT NULL;
    PRINT N'Columna EnvioMercaderia agregada.';
END
GO
