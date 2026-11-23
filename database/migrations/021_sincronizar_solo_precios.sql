/*
    021 - SincronizarProductosDesdeEMP001 trae solo los precios de las listas (corte del Tempo ERP)

    Desde el corte, los productos, las unidades de medida y las listas de precios se editan solo en el
    configurador (ENSEMBLE). Hasta migrar a Ayres, el software externo de actualización de precios sigue
    calculando los precios de venta en EMP001, así que el job sigue trayendo esos precios.

    El procedimiento ahora:
      - Actualiza en ENSEMBLE los precios que cambiaron en EMP001.
      - Agrega los precios que faltan, solo de productos y listas que existen en ENSEMBLE.
      - NO toca productos, unidades ni listas, y NO borra precios: lo que se cargue en el configurador
        solo se pisa si el software externo le calcula otro precio a ese producto en esa lista.
    El precio de compra lo sigue grabando WSMaestros en las dos bases (ActualizarPreciosCompra).

    ORDEN: correrla en el corte, cuando ya no se edite nada en el Tempo ERP. Antes conviene correr una última
    vez el procedimiento actual (EXEC dbo.SincronizarProductosDesdeEMP001) para traer lo último que se cargó ahí.
    El job (database/jobs/sincronizar_productos_emp001.sql) no cambia: llama al procedimiento por nombre.
    Cuando se migre a Ayres: deshabilitar el job y borrar el procedimiento.

    Se corre en ENSEMBLE, después de la 020. Se puede volver a correr (CREATE OR ALTER).
*/
SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.RelProductosListasPrecios', N'U') IS NULL OR OBJECT_ID(N'dbo.Productos', N'U') IS NULL
    THROW 50001, N'Falta la migración 005: no existen las tablas de productos en ENSEMBLE.', 1;
GO

CREATE OR ALTER PROCEDURE dbo.SincronizarProductosDesdeEMP001
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF DB_ID(N'EMP001') IS NULL
        THROW 50002, N'No se encuentra la base EMP001 en esta instancia.', 1;

    DECLARE @Inicio DATETIME = GETDATE();
    DECLARE @PreciosAct INT = 0, @PreciosAgr INT = 0;

    BEGIN TRANSACTION;

    -- Una corrida a la vez (el job y una corrida a mano, por ejemplo)
    DECLARE @Bloqueo INT;
    EXEC @Bloqueo = sp_getapplock @Resource = N'SincronizarProductosDesdeEMP001', @LockMode = N'Exclusive',
                                  @LockOwner = N'Transaction', @LockTimeout = 0;
    IF @Bloqueo < 0
    BEGIN
        ROLLBACK TRANSACTION;
        SELECT CONVERT(CHAR(19), @Inicio, 120) AS Inicio, N'Ya había otra sincronización en curso: no se hizo nada.' AS Resultado;
        RETURN;
    END

    UPDATE d SET d.Precio = o.Precio
    FROM dbo.RelProductosListasPrecios d
    JOIN EMP001.dbo.RelProductosListasPrecios o ON o.ProductoId = d.ProductoId AND o.ListaPrecioId = d.ListaPrecioId
    WHERE o.Precio <> d.Precio;
    SET @PreciosAct = @@ROWCOUNT;

    INSERT INTO dbo.RelProductosListasPrecios (ProductoId, ListaPrecioId, Precio)
    SELECT o.ProductoId, o.ListaPrecioId, o.Precio
    FROM EMP001.dbo.RelProductosListasPrecios o
    WHERE EXISTS (SELECT 1 FROM dbo.Productos p WHERE p.ProductoId = o.ProductoId)
      AND EXISTS (SELECT 1 FROM dbo.ListasPrecios l WHERE l.ListaPrecioId = o.ListaPrecioId)
      AND NOT EXISTS (SELECT 1 FROM dbo.RelProductosListasPrecios d WHERE d.ProductoId = o.ProductoId AND d.ListaPrecioId = o.ListaPrecioId);
    SET @PreciosAgr = @@ROWCOUNT;

    COMMIT TRANSACTION;

    -- Lo que quedó distinto (si EMP001 cambió mientras corría): lo trae la próxima corrida
    DECLARE @Pendientes INT =
          (SELECT COUNT(*) FROM dbo.RelProductosListasPrecios d
           JOIN EMP001.dbo.RelProductosListasPrecios o ON o.ProductoId = d.ProductoId AND o.ListaPrecioId = d.ListaPrecioId
           WHERE o.Precio <> d.Precio)
        + (SELECT COUNT(*) FROM EMP001.dbo.RelProductosListasPrecios o
           WHERE EXISTS (SELECT 1 FROM dbo.Productos p WHERE p.ProductoId = o.ProductoId)
             AND EXISTS (SELECT 1 FROM dbo.ListasPrecios l WHERE l.ListaPrecioId = o.ListaPrecioId)
             AND NOT EXISTS (SELECT 1 FROM dbo.RelProductosListasPrecios d WHERE d.ProductoId = o.ProductoId AND d.ListaPrecioId = o.ListaPrecioId));

    SELECT CONVERT(CHAR(19), @Inicio, 120) AS Inicio,
        CONCAT(N'Precios: ', @PreciosAct, N' actualizados, ', @PreciosAgr, N' agregados. Pendientes para la próxima corrida: ', @Pendientes, N'.') AS Resultado,
        @PreciosAct AS PreciosActualizados, @PreciosAgr AS PreciosAgregados, @Pendientes AS Pendientes;
END
GO

PRINT N'Procedimiento dbo.SincronizarProductosDesdeEMP001 actualizado: desde ahora trae solo los precios de las listas.';
GO
