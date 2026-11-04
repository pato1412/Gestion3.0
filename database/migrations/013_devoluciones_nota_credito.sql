/*
    013 - Nota de crédito de las planillas de devolución

    Cuando el depósito terminó de revisar la planilla (recibida y con todos los productos aprobados o
    rechazados) carga el número de la nota de crédito que se generó por la devolución. Con la nota de
    crédito cargada la planilla pasa al estado "Generada". NULL = todavía no se cargó.

    Se corre en ENSEMBLE. Se puede volver a correr: la columna se agrega solo si no existe.
    Correrla ANTES de publicar Ensemble: las consultas de las planillas leen NotaCredito y, si la
    columna no existe, fallan y los listados de devoluciones salen vacíos.
*/
SET NOCOUNT ON;
GO

IF COL_LENGTH(N'dbo.DevolucionesPlanillas', N'NotaCredito') IS NULL
BEGIN
    ALTER TABLE dbo.DevolucionesPlanillas ADD NotaCredito VARCHAR(50) NULL;
    PRINT N'Columna NotaCredito agregada.';
END
GO
