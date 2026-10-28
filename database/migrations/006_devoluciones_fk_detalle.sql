/*
    006 - FK entre el detalle y el encabezado de las planillas de devolución

    DevolucionesPlanillasDetalle no tenía FK a DevolucionesPlanillas: al borrar una planilla podían quedar
    renglones huérfanos. Se agrega la FK con ON DELETE CASCADE (borrar la planilla borra su detalle)
    y un índice por DevolucionId (todas las consultas del detalle filtran por ahí).

    Se corre en ENSEMBLE. Si hay renglones huérfanos corta sin cambiar nada y avisa cuántos son:
    revisarlos y borrarlos antes de volver a correrla.
    Se puede volver a correr: cada objeto se crea solo si no existe.
*/
SET NOCOUNT ON;
GO

DECLARE @Huerfanos INT = (
    SELECT COUNT(*) FROM dbo.DevolucionesPlanillasDetalle d
    WHERE NOT EXISTS (SELECT 1 FROM dbo.DevolucionesPlanillas p WHERE p.DevolucionId = d.DevolucionId));
IF @Huerfanos > 0
BEGIN
    DECLARE @Mensaje NVARCHAR(400) = CONCAT(N'Hay ', @Huerfanos, N' renglones de DevolucionesPlanillasDetalle sin planilla. ',
        N'Revisalos con: SELECT * FROM dbo.DevolucionesPlanillasDetalle d WHERE NOT EXISTS (SELECT 1 FROM dbo.DevolucionesPlanillas p WHERE p.DevolucionId = d.DevolucionId)');
    THROW 50001, @Mensaje, 1;
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_DevolucionesPlanillasDetalle_DevolucionesPlanillas' AND parent_object_id = OBJECT_ID(N'dbo.DevolucionesPlanillasDetalle'))
BEGIN
    ALTER TABLE dbo.DevolucionesPlanillasDetalle
        ADD CONSTRAINT FK_DevolucionesPlanillasDetalle_DevolucionesPlanillas
        FOREIGN KEY (DevolucionId) REFERENCES dbo.DevolucionesPlanillas (DevolucionId) ON DELETE CASCADE;
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_DevolucionesPlanillasDetalle_DevolucionId' AND object_id = OBJECT_ID(N'dbo.DevolucionesPlanillasDetalle'))
BEGIN
    CREATE INDEX IX_DevolucionesPlanillasDetalle_DevolucionId ON dbo.DevolucionesPlanillasDetalle (DevolucionId);
END
GO
