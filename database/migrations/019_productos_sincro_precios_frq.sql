/*
    019 - Productos.SincroPreciosFRQ: los productos cuyos precios se actualizan en las franquicias

    Hasta ahora era la clasificación 2 "Sincro Precios FRQ" de EMP001. Gestión 2.0 (Configuración >
    Actualización de precios) pide a WSMaestros los precios de esa clasificación para cargarlos en la
    licencia de Simple Tempo del local. Como EMP001 se va a apagar, pasa a ser una columna del producto
    en ENSEMBLE. Es la primera de las clasificaciones que se convierten en atributos del producto.

    Qué hace:
      - Agrega Productos.SincroPreciosFRQ BIT NOT NULL, por defecto 0, y la carga con los productos que
        hoy tienen la clasificación 2 en EMP001, en una transacción.
      - Actualiza dbo.SincronizarProductosDesdeEMP001 (016) para que también la mantenga igual a EMP001:
        hasta el corte, la clasificación se sigue editando en el Tempo ERP. El día del corte se edita
        desde el ABM de productos de configuraciones.

    ORDEN: correrla ANTES de publicar WSMaestros. La versión nueva lee la columna y, sin ella, la
    actualización de precios de Gestión 2.0 no traería ningún producto. La versión actual no la usa,
    así que correrla primero no rompe nada.
    Necesita EMP001 en la instancia para la carga inicial.

    Se corre en ENSEMBLE, después de la 016. Se puede volver a correr: si la columna ya existe no la
    vuelve a cargar (la sincronización la mantiene) y el procedimiento se recrea igual.
*/
SET NOCOUNT ON;
SET XACT_ABORT ON;
GO

IF OBJECT_ID(N'dbo.Productos', N'U') IS NULL
    THROW 50001, N'Falta la migración 005: no existe dbo.Productos en ENSEMBLE.', 1;

IF OBJECT_ID(N'dbo.SincronizarProductosDesdeEMP001', N'P') IS NULL
    THROW 50001, N'Falta la migración 016: no existe dbo.SincronizarProductosDesdeEMP001.', 1;

IF DB_ID(N'EMP001') IS NULL
    THROW 50002, N'No se encuentra la base EMP001: hace falta para cargar la clasificación actual.', 1;

IF COL_LENGTH(N'dbo.Productos', N'SincroPreciosFRQ') IS NOT NULL
BEGIN
    PRINT N'Productos ya tiene la columna SincroPreciosFRQ: no se volvió a cargar.';
    RETURN;
END

BEGIN TRANSACTION;

ALTER TABLE dbo.Productos
    ADD SincroPreciosFRQ BIT NOT NULL
        CONSTRAINT DF_Productos_SincroPreciosFRQ DEFAULT (0);

-- La columna recién creada no existe al compilar el lote: la carga va por sp_executesql.
EXEC sys.sp_executesql N'
    UPDATE p SET p.SincroPreciosFRQ = 1
    FROM dbo.Productos p
    WHERE EXISTS (SELECT 1 FROM EMP001.dbo.RelProductosClasificacionesProductos r
                  WHERE r.ClasificacionProdId = 2 AND r.ProductoId = p.ProductoId);';

COMMIT TRANSACTION;

DECLARE @Cantidad INT;
EXEC sys.sp_executesql N'SELECT @Cantidad = COUNT(*) FROM dbo.Productos WHERE SincroPreciosFRQ = 1;',
                       N'@Cantidad INT OUTPUT', @Cantidad = @Cantidad OUTPUT;
PRINT CONCAT(N'Productos.SincroPreciosFRQ agregada y cargada desde EMP001: ', @Cantidad, N' productos marcados.');
GO

-- Si la columna no quedó creada (falló algo arriba), no se toca el procedimiento: NOEXEC saltea lo que sigue.
IF COL_LENGTH(N'dbo.Productos', N'SincroPreciosFRQ') IS NULL
BEGIN
    RAISERROR(N'No se creó Productos.SincroPreciosFRQ: el procedimiento de sincronización quedó como estaba.', 16, 1);
    SET NOEXEC ON;
END
GO

-- ------------------------------------------------------------------ Sincronización (016 + SincroPreciosFRQ)
CREATE OR ALTER PROCEDURE dbo.SincronizarProductosDesdeEMP001
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF DB_ID(N'EMP001') IS NULL
        THROW 50002, N'No se encuentra la base EMP001 en esta instancia.', 1;

    DECLARE @Inicio DATETIME = GETDATE();
    DECLARE @TiposAct INT = 0, @TiposAgr INT = 0, @UnidadesAct INT = 0, @UnidadesAgr INT = 0, @ListasAct INT = 0, @ListasAgr INT = 0,
            @ProductosAct INT = 0, @ProductosAgr INT = 0, @PreciosAct INT = 0, @PreciosAgr INT = 0, @PreciosQuit INT = 0,
            @SincroFRQAct INT = 0;

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

    -- Los textos se comparan en binario: la intercalación de las bases no distingue mayúsculas.
    UPDATE d SET d.Descripcion = o.Descripcion, d.RefTipoUnidad = o.RefTipoUnidad, d.RefSubTipoUnidad = o.RefSubTipoUnidad
    FROM dbo.TipoUnidadesMedida d
    JOIN EMP001.dbo.TipoUnidadesMedida o ON o.TipoUnidadMedidaId = d.TipoUnidadMedidaId
    WHERE EXISTS (SELECT o.Descripcion COLLATE Latin1_General_BIN2, o.RefTipoUnidad, o.RefSubTipoUnidad
                  EXCEPT SELECT d.Descripcion COLLATE Latin1_General_BIN2, d.RefTipoUnidad, d.RefSubTipoUnidad);
    SET @TiposAct = @@ROWCOUNT;

    INSERT INTO dbo.TipoUnidadesMedida (TipoUnidadMedidaId, Descripcion, RefTipoUnidad, RefSubTipoUnidad)
    SELECT o.TipoUnidadMedidaId, o.Descripcion, o.RefTipoUnidad, o.RefSubTipoUnidad
    FROM EMP001.dbo.TipoUnidadesMedida o
    WHERE NOT EXISTS (SELECT 1 FROM dbo.TipoUnidadesMedida d WHERE d.TipoUnidadMedidaId = o.TipoUnidadMedidaId);
    SET @TiposAgr = @@ROWCOUNT;

    UPDATE d SET d.Descripcion = o.Descripcion, d.Base = o.Base, d.RelBaseSubUnidadMedida = o.RelBaseSubUnidadMedida, d.CodARBA = o.CodARBA
    FROM dbo.UnidadesMedida d
    JOIN EMP001.dbo.UnidadesMedida o ON o.TipoUnidadMedidaId = d.TipoUnidadMedidaId AND o.UnidadMedidaId = d.UnidadMedidaId
    WHERE EXISTS (SELECT o.Descripcion COLLATE Latin1_General_BIN2, o.Base, o.RelBaseSubUnidadMedida, o.CodARBA COLLATE Latin1_General_BIN2
                  EXCEPT SELECT d.Descripcion COLLATE Latin1_General_BIN2, d.Base, d.RelBaseSubUnidadMedida, d.CodARBA COLLATE Latin1_General_BIN2);
    SET @UnidadesAct = @@ROWCOUNT;

    INSERT INTO dbo.UnidadesMedida (TipoUnidadMedidaId, UnidadMedidaId, Descripcion, Base, RelBaseSubUnidadMedida, CodARBA)
    SELECT o.TipoUnidadMedidaId, o.UnidadMedidaId, o.Descripcion, o.Base, o.RelBaseSubUnidadMedida, o.CodARBA
    FROM EMP001.dbo.UnidadesMedida o
    WHERE NOT EXISTS (SELECT 1 FROM dbo.UnidadesMedida d WHERE d.TipoUnidadMedidaId = o.TipoUnidadMedidaId AND d.UnidadMedidaId = o.UnidadMedidaId);
    SET @UnidadesAgr = @@ROWCOUNT;

    UPDATE d SET d.Descripcion = o.Descripcion, d.MonedaId = o.MonedaId
    FROM dbo.ListasPrecios d
    JOIN EMP001.dbo.ListasPrecios o ON o.ListaPrecioId = d.ListaPrecioId
    WHERE EXISTS (SELECT o.Descripcion COLLATE Latin1_General_BIN2, o.MonedaId EXCEPT SELECT d.Descripcion COLLATE Latin1_General_BIN2, d.MonedaId);
    SET @ListasAct = @@ROWCOUNT;

    INSERT INTO dbo.ListasPrecios (ListaPrecioId, Descripcion, MonedaId)
    SELECT o.ListaPrecioId, o.Descripcion, o.MonedaId
    FROM EMP001.dbo.ListasPrecios o
    WHERE NOT EXISTS (SELECT 1 FROM dbo.ListasPrecios d WHERE d.ListaPrecioId = o.ListaPrecioId);
    SET @ListasAgr = @@ROWCOUNT;

    UPDATE d SET
        d.Descripcion = o.Descripcion, d.PrecioCompra = o.PrecioCompra, d.StockCritico = o.StockCritico, d.CoddelProveedor = o.CoddelProveedor,
        d.IVA = o.IVA, d.IVACpras = o.IVACpras, d.CodEnProveedor = o.CodEnProveedor, d.TipoProductoId = o.TipoProductoId, d.Packing = o.Packing,
        d.MonedaId = o.MonedaId, d.Observaciones = o.Observaciones, d.FormulaCostoId = o.FormulaCostoId,
        d.TipoUnidadMedidaId1 = o.TipoUnidadMedidaId1, d.UnidadMedidaId1 = o.UnidadMedidaId1, d.CantUnidadMedida1 = o.CantUnidadMedida1,
        d.TipoUnidadMedidaId2 = o.TipoUnidadMedidaId2, d.UnidadMedidaId2 = o.UnidadMedidaId2, d.CantUnidadMedida2 = o.CantUnidadMedida2,
        d.DeVenta = o.DeVenta, d.DeCompra = o.DeCompra, d.Exento = o.Exento, d.CodBarra = o.CodBarra, d.Inactivo = o.Inactivo, d.CodARBA = o.CodARBA
    FROM dbo.Productos d
    JOIN EMP001.dbo.Productos o ON o.ProductoId = d.ProductoId
    WHERE EXISTS (
        SELECT o.Descripcion COLLATE Latin1_General_BIN2, o.PrecioCompra, o.StockCritico, o.CoddelProveedor COLLATE Latin1_General_BIN2, o.IVA, o.IVACpras,
               o.CodEnProveedor COLLATE Latin1_General_BIN2, o.TipoProductoId, o.Packing, o.MonedaId, o.Observaciones COLLATE Latin1_General_BIN2, o.FormulaCostoId,
               o.TipoUnidadMedidaId1, o.UnidadMedidaId1, o.CantUnidadMedida1, o.TipoUnidadMedidaId2, o.UnidadMedidaId2, o.CantUnidadMedida2,
               o.DeVenta, o.DeCompra, o.Exento, o.CodBarra COLLATE Latin1_General_BIN2, o.Inactivo, o.CodARBA COLLATE Latin1_General_BIN2
        EXCEPT
        SELECT d.Descripcion COLLATE Latin1_General_BIN2, d.PrecioCompra, d.StockCritico, d.CoddelProveedor COLLATE Latin1_General_BIN2, d.IVA, d.IVACpras,
               d.CodEnProveedor COLLATE Latin1_General_BIN2, d.TipoProductoId, d.Packing, d.MonedaId, d.Observaciones COLLATE Latin1_General_BIN2, d.FormulaCostoId,
               d.TipoUnidadMedidaId1, d.UnidadMedidaId1, d.CantUnidadMedida1, d.TipoUnidadMedidaId2, d.UnidadMedidaId2, d.CantUnidadMedida2,
               d.DeVenta, d.DeCompra, d.Exento, d.CodBarra COLLATE Latin1_General_BIN2, d.Inactivo, d.CodARBA COLLATE Latin1_General_BIN2);
    SET @ProductosAct = @@ROWCOUNT;

    INSERT INTO dbo.Productos (
        ProductoId, Descripcion, PrecioCompra, StockCritico, CoddelProveedor, IVA, IVACpras, CodEnProveedor,
        TipoProductoId, Packing, MonedaId,
        Observaciones, FormulaCostoId, TipoUnidadMedidaId1, UnidadMedidaId1, CantUnidadMedida1,
        TipoUnidadMedidaId2, UnidadMedidaId2, CantUnidadMedida2, DeVenta, DeCompra, Exento, CodBarra, Inactivo, CodARBA)
    SELECT
        o.ProductoId, o.Descripcion, o.PrecioCompra, o.StockCritico, o.CoddelProveedor, o.IVA, o.IVACpras, o.CodEnProveedor,
        o.TipoProductoId, o.Packing, o.MonedaId,
        o.Observaciones, o.FormulaCostoId, o.TipoUnidadMedidaId1, o.UnidadMedidaId1, o.CantUnidadMedida1,
        o.TipoUnidadMedidaId2, o.UnidadMedidaId2, o.CantUnidadMedida2, o.DeVenta, o.DeCompra, o.Exento, o.CodBarra, o.Inactivo, o.CodARBA
    FROM EMP001.dbo.Productos o
    WHERE NOT EXISTS (SELECT 1 FROM dbo.Productos d WHERE d.ProductoId = o.ProductoId);
    SET @ProductosAgr = @@ROWCOUNT;

    -- SincroPreciosFRQ (019) = tiene la clasificación 2 en EMP001. Solo productos que existen en EMP001.
    UPDATE d SET d.SincroPreciosFRQ = 1 - d.SincroPreciosFRQ
    FROM dbo.Productos d
    WHERE EXISTS (SELECT 1 FROM EMP001.dbo.Productos p WHERE p.ProductoId = d.ProductoId)
      AND d.SincroPreciosFRQ <> CASE WHEN EXISTS (SELECT 1 FROM EMP001.dbo.RelProductosClasificacionesProductos r
                                                  WHERE r.ClasificacionProdId = 2 AND r.ProductoId = d.ProductoId)
                                     THEN 1 ELSE 0 END;
    SET @SincroFRQAct = @@ROWCOUNT;

    UPDATE d SET d.Precio = o.Precio
    FROM dbo.RelProductosListasPrecios d
    JOIN EMP001.dbo.RelProductosListasPrecios o ON o.ProductoId = d.ProductoId AND o.ListaPrecioId = d.ListaPrecioId
    WHERE o.Precio <> d.Precio;
    SET @PreciosAct = @@ROWCOUNT;

    INSERT INTO dbo.RelProductosListasPrecios (ProductoId, ListaPrecioId, Precio)
    SELECT o.ProductoId, o.ListaPrecioId, o.Precio
    FROM EMP001.dbo.RelProductosListasPrecios o
    WHERE NOT EXISTS (SELECT 1 FROM dbo.RelProductosListasPrecios d WHERE d.ProductoId = o.ProductoId AND d.ListaPrecioId = o.ListaPrecioId);
    SET @PreciosAgr = @@ROWCOUNT;

    -- Precio que se quitó en el ERP (el producto sigue existiendo en EMP001)
    DELETE d
    FROM dbo.RelProductosListasPrecios d
    WHERE EXISTS (SELECT 1 FROM EMP001.dbo.Productos p WHERE p.ProductoId = d.ProductoId)
      AND NOT EXISTS (SELECT 1 FROM EMP001.dbo.RelProductosListasPrecios o WHERE o.ProductoId = d.ProductoId AND o.ListaPrecioId = d.ListaPrecioId);
    SET @PreciosQuit = @@ROWCOUNT;

    COMMIT TRANSACTION;

    -- Lo que quedó distinto (si EMP001 cambió mientras corría): lo trae la próxima corrida
    DECLARE @Pendientes INT =
          (SELECT COUNT(*) FROM (
                SELECT ProductoId, Descripcion COLLATE Latin1_General_BIN2 d, PrecioCompra, StockCritico, CoddelProveedor COLLATE Latin1_General_BIN2 cp, IVA, IVACpras,
                       CodEnProveedor COLLATE Latin1_General_BIN2 ce, TipoProductoId, Packing, MonedaId, Observaciones COLLATE Latin1_General_BIN2 o, FormulaCostoId,
                       TipoUnidadMedidaId1, UnidadMedidaId1, CantUnidadMedida1, TipoUnidadMedidaId2, UnidadMedidaId2, CantUnidadMedida2,
                       DeVenta, DeCompra, Exento, CodBarra COLLATE Latin1_General_BIN2 cb, Inactivo, CodARBA COLLATE Latin1_General_BIN2 ca
                FROM EMP001.dbo.Productos
                EXCEPT
                SELECT ProductoId, Descripcion COLLATE Latin1_General_BIN2, PrecioCompra, StockCritico, CoddelProveedor COLLATE Latin1_General_BIN2, IVA, IVACpras,
                       CodEnProveedor COLLATE Latin1_General_BIN2, TipoProductoId, Packing, MonedaId, Observaciones COLLATE Latin1_General_BIN2, FormulaCostoId,
                       TipoUnidadMedidaId1, UnidadMedidaId1, CantUnidadMedida1, TipoUnidadMedidaId2, UnidadMedidaId2, CantUnidadMedida2,
                       DeVenta, DeCompra, Exento, CodBarra COLLATE Latin1_General_BIN2, Inactivo, CodARBA COLLATE Latin1_General_BIN2
                FROM dbo.Productos) x)
        + (SELECT COUNT(*) FROM (
                SELECT ProductoId, ListaPrecioId, Precio FROM EMP001.dbo.RelProductosListasPrecios
                EXCEPT SELECT ProductoId, ListaPrecioId, Precio FROM dbo.RelProductosListasPrecios) x)
        + (SELECT COUNT(*) FROM dbo.RelProductosListasPrecios d
           WHERE EXISTS (SELECT 1 FROM EMP001.dbo.Productos p WHERE p.ProductoId = d.ProductoId)
             AND NOT EXISTS (SELECT 1 FROM EMP001.dbo.RelProductosListasPrecios o WHERE o.ProductoId = d.ProductoId AND o.ListaPrecioId = d.ListaPrecioId))
        + (SELECT COUNT(*) FROM dbo.Productos d
           WHERE EXISTS (SELECT 1 FROM EMP001.dbo.Productos p WHERE p.ProductoId = d.ProductoId)
             AND d.SincroPreciosFRQ <> CASE WHEN EXISTS (SELECT 1 FROM EMP001.dbo.RelProductosClasificacionesProductos r
                                                         WHERE r.ClasificacionProdId = 2 AND r.ProductoId = d.ProductoId)
                                            THEN 1 ELSE 0 END);

    SELECT CONVERT(CHAR(19), @Inicio, 120) AS Inicio,
        CONCAT(N'Productos: ', @ProductosAct, N' actualizados, ', @ProductosAgr, N' agregados. Precios: ', @PreciosAct, N' actualizados, ',
               @PreciosAgr, N' agregados, ', @PreciosQuit, N' quitados. Sincro precios FRQ: ', @SincroFRQAct, N' cambiados. Listas: ', @ListasAct, N'/', @ListasAgr,
               N'. Unidades: ', @UnidadesAct, N'/', @UnidadesAgr, N'. Tipos de unidad: ', @TiposAct, N'/', @TiposAgr,
               N'. Pendientes para la próxima corrida: ', @Pendientes, N'.') AS Resultado,
        @ProductosAct AS ProductosActualizados, @ProductosAgr AS ProductosAgregados, @PreciosAct AS PreciosActualizados,
        @PreciosAgr AS PreciosAgregados, @PreciosQuit AS PreciosQuitados, @SincroFRQAct AS SincroPreciosFRQCambiados,
        @Pendientes AS Pendientes;
END
GO

PRINT N'Procedimiento dbo.SincronizarProductosDesdeEMP001 creado o actualizado.';
GO

-- Vuelve a dejar la sesión ejecutando (por si el chequeo de arriba activó NOEXEC).
SET NOEXEC OFF;
GO
