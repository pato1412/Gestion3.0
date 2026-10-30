/*
    007 - Agrandar GWREstablecimientos.TempoAPIToken

    La columna era VARCHAR(100), alcanzaba para el token de Simple Tempo (24 caracteres) pero el de
    Ayres POS tiene 242 y el UPDATE fallaba por truncamiento (el token no quedaba guardado).
    Pasa a VARCHAR(2000) para dejar margen si el token crece. Solo se agranda: los datos no cambian.

    Se corre en ENSEMBLE. Se puede volver a correr: si la columna ya tiene 2000 o más no hace nada.
*/
SET NOCOUNT ON;
GO

IF EXISTS (SELECT 1 FROM sys.columns
           WHERE object_id = OBJECT_ID(N'dbo.GWREstablecimientos') AND name = N'TempoAPIToken'
             AND max_length <> -1 AND max_length < 2000)
BEGIN
    ALTER TABLE dbo.GWREstablecimientos ALTER COLUMN TempoAPIToken VARCHAR(2000) NULL;
END
GO
