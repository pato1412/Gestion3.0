/*
    015 - Sincronizar productos, precios y unidades de medida desde EMP001 (hasta el corte del ERP)

    La 005 copió el catálogo a ENSEMBLE el 2026-11-01, pero hasta el corte se sigue editando en el
    Tempo ERP (EMP001): productos nuevos, precios de venta y el precio de compra que graba Gestión 2.0.
    Esta migración deja ENSEMBLE igual a EMP001 en las tablas de la 005:
      TipoUnidadesMedida, UnidadesMedida, ListasPrecios, Productos y RelProductosListasPrecios.

      - Agrega lo que falta y actualiza lo que cambió (también cambios solo de mayúsculas).
      - Borra los precios que ya no están en EMP001, solo de productos que existen en EMP001.
      - NO borra productos, listas ni unidades que estén solo en ENSEMBLE (pueden venir del ABM).
      - ATENCIÓN: pisa con lo de EMP001 cualquier cambio hecho desde el ABM de configuraciones en
        productos y precios que también existen en EMP001. Hasta el corte, el maestro es EMP001.

    Se puede correr las veces que haga falta. El día del corte se corre por última vez y desde ahí
    se edita solo en configuraciones (y ActualizarPreciosCompraNube tiene que escribir en ENSEMBLE).
    Todo o nada: si al final ENSEMBLE no quedó igual a EMP001, no se guarda nada.

    Se corre en ENSEMBLE, después de la 005, con un usuario que pueda leer EMP001 (misma instancia).
*/
SET NOCOUNT ON;
GO

IF DB_ID(N'EMP001') IS NULL
    THROW 50001, N'No se encuentra la base EMP001 en esta instancia.', 1;
IF OBJECT_ID(N'dbo.Productos', N'U') IS NULL OR OBJECT_ID(N'dbo.RelProductosListasPrecios', N'U') IS NULL
    THROW 50002, N'Falta la migración 005: no existen las tablas de productos en ENSEMBLE.', 1;
GO

SET XACT_ABORT ON;
BEGIN TRANSACTION;

-- Los textos se comparan en binario: la intercalación de las bases no distingue mayúsculas.
-- ------------------------------------------------------------------ Tipos de unidad de medida
UPDATE d SET d.Descripcion = o.Descripcion, d.RefTipoUnidad = o.RefTipoUnidad, d.RefSubTipoUnidad = o.RefSubTipoUnidad
FROM dbo.TipoUnidadesMedida d
JOIN EMP001.dbo.TipoUnidadesMedida o ON o.TipoUnidadMedidaId = d.TipoUnidadMedidaId
WHERE EXISTS (SELECT o.Descripcion COLLATE Latin1_General_BIN2, o.RefTipoUnidad, o.RefSubTipoUnidad
              EXCEPT SELECT d.Descripcion COLLATE Latin1_General_BIN2, d.RefTipoUnidad, d.RefSubTipoUnidad);
PRINT CONCAT('TipoUnidadesMedida actualizados: ', @@ROWCOUNT);

INSERT INTO dbo.TipoUnidadesMedida (TipoUnidadMedidaId, Descripcion, RefTipoUnidad, RefSubTipoUnidad)
SELECT o.TipoUnidadMedidaId, o.Descripcion, o.RefTipoUnidad, o.RefSubTipoUnidad
FROM EMP001.dbo.TipoUnidadesMedida o
WHERE NOT EXISTS (SELECT 1 FROM dbo.TipoUnidadesMedida d WHERE d.TipoUnidadMedidaId = o.TipoUnidadMedidaId);
PRINT CONCAT('TipoUnidadesMedida agregados: ', @@ROWCOUNT);

-- ------------------------------------------------------------------ Unidades de medida
UPDATE d SET d.Descripcion = o.Descripcion, d.Base = o.Base, d.RelBaseSubUnidadMedida = o.RelBaseSubUnidadMedida, d.CodARBA = o.CodARBA
FROM dbo.UnidadesMedida d
JOIN EMP001.dbo.UnidadesMedida o ON o.TipoUnidadMedidaId = d.TipoUnidadMedidaId AND o.UnidadMedidaId = d.UnidadMedidaId
WHERE EXISTS (SELECT o.Descripcion COLLATE Latin1_General_BIN2, o.Base, o.RelBaseSubUnidadMedida, o.CodARBA COLLATE Latin1_General_BIN2
              EXCEPT SELECT d.Descripcion COLLATE Latin1_General_BIN2, d.Base, d.RelBaseSubUnidadMedida, d.CodARBA COLLATE Latin1_General_BIN2);
PRINT CONCAT('UnidadesMedida actualizadas: ', @@ROWCOUNT);

INSERT INTO dbo.UnidadesMedida (TipoUnidadMedidaId, UnidadMedidaId, Descripcion, Base, RelBaseSubUnidadMedida, CodARBA)
SELECT o.TipoUnidadMedidaId, o.UnidadMedidaId, o.Descripcion, o.Base, o.RelBaseSubUnidadMedida, o.CodARBA
FROM EMP001.dbo.UnidadesMedida o
WHERE NOT EXISTS (SELECT 1 FROM dbo.UnidadesMedida d WHERE d.TipoUnidadMedidaId = o.TipoUnidadMedidaId AND d.UnidadMedidaId = o.UnidadMedidaId);
PRINT CONCAT('UnidadesMedida agregadas: ', @@ROWCOUNT);

-- ------------------------------------------------------------------ Listas de precios
UPDATE d SET d.Descripcion = o.Descripcion, d.MonedaId = o.MonedaId
FROM dbo.ListasPrecios d
JOIN EMP001.dbo.ListasPrecios o ON o.ListaPrecioId = d.ListaPrecioId
WHERE EXISTS (SELECT o.Descripcion COLLATE Latin1_General_BIN2, o.MonedaId EXCEPT SELECT d.Descripcion COLLATE Latin1_General_BIN2, d.MonedaId);
PRINT CONCAT('ListasPrecios actualizadas: ', @@ROWCOUNT);

INSERT INTO dbo.ListasPrecios (ListaPrecioId, Descripcion, MonedaId)
SELECT o.ListaPrecioId, o.Descripcion, o.MonedaId
FROM EMP001.dbo.ListasPrecios o
WHERE NOT EXISTS (SELECT 1 FROM dbo.ListasPrecios d WHERE d.ListaPrecioId = o.ListaPrecioId);
PRINT CONCAT('ListasPrecios agregadas: ', @@ROWCOUNT);

-- ------------------------------------------------------------------ Productos
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
PRINT CONCAT('Productos actualizados: ', @@ROWCOUNT);

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
PRINT CONCAT('Productos agregados: ', @@ROWCOUNT);

-- ------------------------------------------------------------------ Precios de venta
UPDATE d SET d.Precio = o.Precio
FROM dbo.RelProductosListasPrecios d
JOIN EMP001.dbo.RelProductosListasPrecios o ON o.ProductoId = d.ProductoId AND o.ListaPrecioId = d.ListaPrecioId
WHERE o.Precio <> d.Precio;
PRINT CONCAT('Precios actualizados: ', @@ROWCOUNT);

INSERT INTO dbo.RelProductosListasPrecios (ProductoId, ListaPrecioId, Precio)
SELECT o.ProductoId, o.ListaPrecioId, o.Precio
FROM EMP001.dbo.RelProductosListasPrecios o
WHERE NOT EXISTS (SELECT 1 FROM dbo.RelProductosListasPrecios d WHERE d.ProductoId = o.ProductoId AND d.ListaPrecioId = o.ListaPrecioId);
PRINT CONCAT('Precios agregados: ', @@ROWCOUNT);

-- Precio que se quitó en el ERP (el producto sigue existiendo en EMP001)
DELETE d
FROM dbo.RelProductosListasPrecios d
WHERE EXISTS (SELECT 1 FROM EMP001.dbo.Productos p WHERE p.ProductoId = d.ProductoId)
  AND NOT EXISTS (SELECT 1 FROM EMP001.dbo.RelProductosListasPrecios o WHERE o.ProductoId = d.ProductoId AND o.ListaPrecioId = d.ListaPrecioId);
PRINT CONCAT('Precios quitados (ya no están en EMP001): ', @@ROWCOUNT);

-- ------------------------------------------------------------------ Verificación: ENSEMBLE igual a EMP001
DECLARE @Diferencias INT =
      (SELECT COUNT(*) FROM (
            SELECT TipoUnidadMedidaId, Descripcion COLLATE Latin1_General_BIN2 d, RefTipoUnidad, RefSubTipoUnidad FROM EMP001.dbo.TipoUnidadesMedida
            EXCEPT SELECT TipoUnidadMedidaId, Descripcion COLLATE Latin1_General_BIN2, RefTipoUnidad, RefSubTipoUnidad FROM dbo.TipoUnidadesMedida) x)
    + (SELECT COUNT(*) FROM (
            SELECT TipoUnidadMedidaId, UnidadMedidaId, Descripcion COLLATE Latin1_General_BIN2 d, Base, RelBaseSubUnidadMedida, CodARBA COLLATE Latin1_General_BIN2 c FROM EMP001.dbo.UnidadesMedida
            EXCEPT SELECT TipoUnidadMedidaId, UnidadMedidaId, Descripcion COLLATE Latin1_General_BIN2, Base, RelBaseSubUnidadMedida, CodARBA COLLATE Latin1_General_BIN2 FROM dbo.UnidadesMedida) x)
    + (SELECT COUNT(*) FROM (
            SELECT ListaPrecioId, Descripcion COLLATE Latin1_General_BIN2 d, MonedaId FROM EMP001.dbo.ListasPrecios
            EXCEPT SELECT ListaPrecioId, Descripcion COLLATE Latin1_General_BIN2, MonedaId FROM dbo.ListasPrecios) x)
    + (SELECT COUNT(*) FROM (
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
         AND NOT EXISTS (SELECT 1 FROM EMP001.dbo.RelProductosListasPrecios o WHERE o.ProductoId = d.ProductoId AND o.ListaPrecioId = d.ListaPrecioId));
IF @Diferencias > 0
    THROW 50003, N'ENSEMBLE no quedó igual a EMP001 después de sincronizar. No se guardó nada.', 1;

COMMIT TRANSACTION;
GO

-- Aviso (no cambia nada): lo que está solo en ENSEMBLE y no se tocó
DECLARE @SoloProductos INT = (SELECT COUNT(*) FROM dbo.Productos d WHERE NOT EXISTS (SELECT 1 FROM EMP001.dbo.Productos o WHERE o.ProductoId = d.ProductoId));
DECLARE @SoloListas INT = (SELECT COUNT(*) FROM dbo.ListasPrecios d WHERE NOT EXISTS (SELECT 1 FROM EMP001.dbo.ListasPrecios o WHERE o.ListaPrecioId = d.ListaPrecioId));
DECLARE @SoloUnidades INT = (SELECT COUNT(*) FROM dbo.UnidadesMedida d WHERE NOT EXISTS (SELECT 1 FROM EMP001.dbo.UnidadesMedida o
    WHERE o.TipoUnidadMedidaId = d.TipoUnidadMedidaId AND o.UnidadMedidaId = d.UnidadMedidaId));
PRINT CONCAT('Solo en ENSEMBLE (no se tocan): productos ', @SoloProductos, ', listas ', @SoloListas, ', unidades ', @SoloUnidades, '.');
GO
