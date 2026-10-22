/*
    003 - CalendarioRecordatorios

    Recordatorios por establecimiento, asociados a una clasificación (en general del tipo
    1 = Recordatorios), con el día, la frecuencia y la última fecha en que se generó.

    Requiere 001 (tabla Clasificaciones). Se corre en ENSEMBLE.
    Se puede volver a correr sin error: cada objeto se crea solo si no existe.
*/
SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.CalendarioRecordatorios', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.CalendarioRecordatorios (
        RecordatorioId    INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_CalendarioRecordatorios PRIMARY KEY,
        EstablecimientoId INT NOT NULL
            CONSTRAINT FK_CalendarioRecordatorios_Establecimiento REFERENCES dbo.GWREstablecimientos (EstablecimientoId),
        ClasificacionId   INT NOT NULL
            CONSTRAINT FK_CalendarioRecordatorios_Clasificacion REFERENCES dbo.Clasificaciones (ClasificacionId),
        Dia               VARCHAR(50) NULL,
        Frecuencia        INT NULL,
        UltimaFecha       DATE NULL
    );
END
GO

-- Recordatorios de un establecimiento
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_CalendarioRecordatorios_Establecimiento' AND object_id = OBJECT_ID(N'dbo.CalendarioRecordatorios'))
BEGIN
    CREATE INDEX IX_CalendarioRecordatorios_Establecimiento
        ON dbo.CalendarioRecordatorios (EstablecimientoId)
        INCLUDE (ClasificacionId, Dia, Frecuencia, UltimaFecha);
END
GO

-- Recordatorios de una clasificación (y para validar la FK al borrar clasificaciones)
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_CalendarioRecordatorios_Clasificacion' AND object_id = OBJECT_ID(N'dbo.CalendarioRecordatorios'))
BEGIN
    CREATE INDEX IX_CalendarioRecordatorios_Clasificacion
        ON dbo.CalendarioRecordatorios (ClasificacionId);
END
GO
