/*
    008 - Fecha de recepción de las planillas de devolución

    El depósito recibe la planilla que envió el local y después aprueba o rechaza cada renglón
    (DevolucionesPlanillasDetalle.Aprobado / Respuesta). FechaRecepcion queda NULL mientras la planilla
    está pendiente de recibir; cuando el depósito la recibe se completa con la fecha y hora del servidor.
    Una planilla recibida ya no la puede modificar ni borrar el local que la envió.

    Se corre en ENSEMBLE. Se puede volver a correr: la columna se agrega solo si no existe.
*/
SET NOCOUNT ON;
GO

IF COL_LENGTH(N'dbo.DevolucionesPlanillas', N'FechaRecepcion') IS NULL
BEGIN
    ALTER TABLE dbo.DevolucionesPlanillas ADD FechaRecepcion DATETIME NULL;
END
GO
