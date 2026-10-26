/*
    005 - Productos, precios y unidades de medida en ENSEMBLE (copia desde EMP001)

    El ERP (TEMPO_ERP, base EMP001) se discontinúa: los productos pasan a administrarse en
    ENSEMBLE. Se copian con la MISMA estructura y los MISMOS IDs, porque hay IDs escritos en el
    código de los webservices (listas de precios en Db.cs, ProductoId 'INS5027', etc.).

    Tablas:
      TipoUnidadesMedida, UnidadesMedida, ListasPrecios, Productos, RelProductosListasPrecios
      y la vista RelProductosListasPreciosView (mismo filtro de listas que en EMP001).

    No se copian (quedan en EMP001):
      - Clasificaciones del ERP: se reemplazan por Clasificaciones / ProductoClasificaciones (001).
      - Stock, documentos, movimientos y el resto del histórico.
      - Proveedores y fórmulas: en Productos quedan CoddelProveedor y FormulaCostoId como
        valores, sin FK.
      - Cuentas contables: CuentaIdVtas, SubCuentaIdVtas, CuentaIdCpras y SubCuentaIdCpras
        no se pasan a ENSEMBLE (quedan obsoletas).

    Se corre en ENSEMBLE, con un usuario que pueda leer EMP001 (misma instancia).
    Se puede volver a correr: crea solo lo que falta y copia solo los registros que todavía no
    están (por clave). NO actualiza en ENSEMBLE los cambios que se hagan en EMP001 a registros
    ya copiados: al final informa cuántos difieren. Conviene correrla en el momento del corte.

    Después del corte: apuntar el sinónimo ProductosEmpresa (001) a dbo.Productos de ENSEMBLE.
*/
SET NOCOUNT ON;
GO

IF DB_ID(N'EMP001') IS NULL
    THROW 50001, N'No se encuentra la base EMP001 en esta instancia.', 1;
GO

-- ------------------------------------------------------------------ Tablas
IF OBJECT_ID(N'dbo.TipoUnidadesMedida', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.TipoUnidadesMedida (
        TipoUnidadMedidaId INT         NOT NULL CONSTRAINT PK_TipoUnidadesMedida PRIMARY KEY,
        Descripcion        VARCHAR(50) NOT NULL,
        RefTipoUnidad      VARCHAR(50) NOT NULL,
        RefSubTipoUnidad   VARCHAR(50) NOT NULL
    );
END
GO

IF OBJECT_ID(N'dbo.UnidadesMedida', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.UnidadesMedida (
        TipoUnidadMedidaId     INT            NOT NULL
            CONSTRAINT FK_UnidadesMedida_TipoUnidadesMedida REFERENCES dbo.TipoUnidadesMedida (TipoUnidadMedidaId),
        UnidadMedidaId         INT            NOT NULL,
        Descripcion            VARCHAR(50)    NOT NULL,
        Base                   BIT            NOT NULL,
        RelBaseSubUnidadMedida DECIMAL(18, 5) NOT NULL,
        CodARBA                VARCHAR(5)     NULL,
        CONSTRAINT PK_UnidadesMedida PRIMARY KEY (TipoUnidadMedidaId, UnidadMedidaId)
    );
END
GO

IF OBJECT_ID(N'dbo.ListasPrecios', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ListasPrecios (
        ListaPrecioId INT         NOT NULL CONSTRAINT PK_ListasPrecios PRIMARY KEY,
        Descripcion   VARCHAR(25) NOT NULL,
        MonedaId      INT         NOT NULL CONSTRAINT DF_ListasPrecios_MonedaId DEFAULT (0)
    );
END
GO

IF OBJECT_ID(N'dbo.Productos', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Productos (
        ProductoId          VARCHAR(25)    NOT NULL CONSTRAINT PK_Productos PRIMARY KEY,
        Descripcion         VARCHAR(50)    NOT NULL,
        PrecioCompra        MONEY          NULL,
        StockCritico        DECIMAL(18, 5) NULL,
        CoddelProveedor     VARCHAR(25)    NULL,   -- EMP001..Proveedores (sin FK)
        IVA                 NUMERIC(18, 2) NOT NULL,
        IVACpras            DECIMAL(18, 2) NOT NULL CONSTRAINT DF_Productos_IVACpras DEFAULT (21),
        CodEnProveedor      VARCHAR(25)    NULL,
        TipoProductoId      INT            NOT NULL CONSTRAINT DF_Productos_TipoProductoId DEFAULT (0),
        Packing             DECIMAL(18, 5) NOT NULL CONSTRAINT DF_Productos_Packing DEFAULT (1),
        MonedaId            INT            NOT NULL CONSTRAINT DF_Productos_MonedaId DEFAULT (0),
        Observaciones       VARCHAR(1500)  NULL,
        FormulaCostoId      INT            NULL,   -- EMP001..Formulas (sin FK)
        TipoUnidadMedidaId1 INT            NOT NULL CONSTRAINT DF_Productos_TipoUnidadMedidaId1 DEFAULT (0),
        UnidadMedidaId1     INT            NOT NULL CONSTRAINT DF_Productos_UnidadMedidaId1 DEFAULT (0),
        CantUnidadMedida1   DECIMAL(18, 5) NOT NULL CONSTRAINT DF_Productos_CantUnidadMedida1 DEFAULT (0),
        TipoUnidadMedidaId2 INT            NOT NULL CONSTRAINT DF_Productos_TipoUnidadMedidaId2 DEFAULT (0),
        UnidadMedidaId2     INT            NOT NULL CONSTRAINT DF_Productos_UnidadMedidaId2 DEFAULT (0),
        CantUnidadMedida2   DECIMAL(18, 5) NOT NULL CONSTRAINT DF_Productos_CantUnidadMedida2 DEFAULT (0),
        DeVenta             BIT            NOT NULL CONSTRAINT DF_Productos_DeVenta DEFAULT (1),
        DeCompra            BIT            NOT NULL CONSTRAINT DF_Productos_DeCompra DEFAULT (1),
        Exento              BIT            NOT NULL CONSTRAINT DF_Productos_Exento DEFAULT (0),
        CodBarra            VARCHAR(25)    NOT NULL CONSTRAINT DF_Productos_CodBarra DEFAULT (''),
        Inactivo            BIT            NOT NULL CONSTRAINT DF_Productos_Inactivo DEFAULT (0),
        CodARBA             VARCHAR(25)    NULL,
        CONSTRAINT FK_Productos_UnidadesMedida1 FOREIGN KEY (TipoUnidadMedidaId1, UnidadMedidaId1)
            REFERENCES dbo.UnidadesMedida (TipoUnidadMedidaId, UnidadMedidaId),
        CONSTRAINT FK_Productos_UnidadesMedida2 FOREIGN KEY (TipoUnidadMedidaId2, UnidadMedidaId2)
            REFERENCES dbo.UnidadesMedida (TipoUnidadMedidaId, UnidadMedidaId)
    );
END
GO

IF OBJECT_ID(N'dbo.RelProductosListasPrecios', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.RelProductosListasPrecios (
        ProductoId    VARCHAR(25) NOT NULL
            CONSTRAINT FK_RelProductosListasPrecios_Productos REFERENCES dbo.Productos (ProductoId),
        ListaPrecioId INT         NOT NULL
            CONSTRAINT FK_RelProductosListasPrecios_ListasPrecios REFERENCES dbo.ListasPrecios (ListaPrecioId),
        Precio        MONEY       NOT NULL,
        CONSTRAINT PK_RelProductosListasPrecios PRIMARY KEY (ProductoId, ListaPrecioId)
    );
END
GO

-- Precios de una lista (para listar o actualizar una lista completa)
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_RelProductosListasPrecios_Lista' AND object_id = OBJECT_ID(N'dbo.RelProductosListasPrecios'))
BEGIN
    CREATE INDEX IX_RelProductosListasPrecios_Lista ON dbo.RelProductosListasPrecios (ListaPrecioId) INCLUDE (Precio);
END
GO

-- Igual que en EMP001: solo las listas que usan los webservices
CREATE OR ALTER VIEW dbo.RelProductosListasPreciosView
AS
SELECT ProductoId, ListaPrecioId, Precio
FROM dbo.RelProductosListasPrecios
WHERE ListaPrecioId IN (1, 2, 5, 7, 8, 11, 12, 13, 14, 23);
GO

-- ------------------------------------------------------------------ Datos
SET XACT_ABORT ON;
BEGIN TRANSACTION;

INSERT INTO dbo.TipoUnidadesMedida (TipoUnidadMedidaId, Descripcion, RefTipoUnidad, RefSubTipoUnidad)
SELECT o.TipoUnidadMedidaId, o.Descripcion, o.RefTipoUnidad, o.RefSubTipoUnidad
FROM EMP001.dbo.TipoUnidadesMedida o
WHERE NOT EXISTS (SELECT 1 FROM dbo.TipoUnidadesMedida d WHERE d.TipoUnidadMedidaId = o.TipoUnidadMedidaId);
PRINT CONCAT('TipoUnidadesMedida copiados: ', @@ROWCOUNT);

INSERT INTO dbo.UnidadesMedida (TipoUnidadMedidaId, UnidadMedidaId, Descripcion, Base, RelBaseSubUnidadMedida, CodARBA)
SELECT o.TipoUnidadMedidaId, o.UnidadMedidaId, o.Descripcion, o.Base, o.RelBaseSubUnidadMedida, o.CodARBA
FROM EMP001.dbo.UnidadesMedida o
WHERE NOT EXISTS (SELECT 1 FROM dbo.UnidadesMedida d WHERE d.TipoUnidadMedidaId = o.TipoUnidadMedidaId AND d.UnidadMedidaId = o.UnidadMedidaId);
PRINT CONCAT('UnidadesMedida copiadas: ', @@ROWCOUNT);

INSERT INTO dbo.ListasPrecios (ListaPrecioId, Descripcion, MonedaId)
SELECT o.ListaPrecioId, o.Descripcion, o.MonedaId
FROM EMP001.dbo.ListasPrecios o
WHERE NOT EXISTS (SELECT 1 FROM dbo.ListasPrecios d WHERE d.ListaPrecioId = o.ListaPrecioId);
PRINT CONCAT('ListasPrecios copiadas: ', @@ROWCOUNT);

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
PRINT CONCAT('Productos copiados: ', @@ROWCOUNT);

INSERT INTO dbo.RelProductosListasPrecios (ProductoId, ListaPrecioId, Precio)
SELECT o.ProductoId, o.ListaPrecioId, o.Precio
FROM EMP001.dbo.RelProductosListasPrecios o
WHERE NOT EXISTS (SELECT 1 FROM dbo.RelProductosListasPrecios d WHERE d.ProductoId = o.ProductoId AND d.ListaPrecioId = o.ListaPrecioId);
PRINT CONCAT('Precios copiados: ', @@ROWCOUNT);

-- Verificación: después de copiar no puede faltar ningún registro de EMP001
DECLARE @Faltan INT =
      (SELECT COUNT(*) FROM EMP001.dbo.TipoUnidadesMedida o WHERE NOT EXISTS (SELECT 1 FROM dbo.TipoUnidadesMedida d WHERE d.TipoUnidadMedidaId = o.TipoUnidadMedidaId))
    + (SELECT COUNT(*) FROM EMP001.dbo.UnidadesMedida o WHERE NOT EXISTS (SELECT 1 FROM dbo.UnidadesMedida d WHERE d.TipoUnidadMedidaId = o.TipoUnidadMedidaId AND d.UnidadMedidaId = o.UnidadMedidaId))
    + (SELECT COUNT(*) FROM EMP001.dbo.ListasPrecios o WHERE NOT EXISTS (SELECT 1 FROM dbo.ListasPrecios d WHERE d.ListaPrecioId = o.ListaPrecioId))
    + (SELECT COUNT(*) FROM EMP001.dbo.Productos o WHERE NOT EXISTS (SELECT 1 FROM dbo.Productos d WHERE d.ProductoId = o.ProductoId))
    + (SELECT COUNT(*) FROM EMP001.dbo.RelProductosListasPrecios o WHERE NOT EXISTS (SELECT 1 FROM dbo.RelProductosListasPrecios d WHERE d.ProductoId = o.ProductoId AND d.ListaPrecioId = o.ListaPrecioId));
IF @Faltan > 0
    THROW 50002, N'Quedaron registros de EMP001 sin copiar. No se guardó nada.', 1;

COMMIT TRANSACTION;
GO

-- Aviso (no cambia nada): registros que ya estaban en ENSEMBLE y hoy difieren de EMP001
DECLARE @ProductosDistintos INT = (
    SELECT COUNT(*) FROM (
        SELECT ProductoId, Descripcion, PrecioCompra, StockCritico, CoddelProveedor, IVA, IVACpras, CodEnProveedor, TipoProductoId,
               Packing, MonedaId, Observaciones, FormulaCostoId,
               TipoUnidadMedidaId1, UnidadMedidaId1, CantUnidadMedida1, TipoUnidadMedidaId2, UnidadMedidaId2, CantUnidadMedida2,
               DeVenta, DeCompra, Exento, CodBarra, Inactivo, CodARBA
        FROM EMP001.dbo.Productos
        EXCEPT
        SELECT ProductoId, Descripcion, PrecioCompra, StockCritico, CoddelProveedor, IVA, IVACpras, CodEnProveedor, TipoProductoId,
               Packing, MonedaId, Observaciones, FormulaCostoId,
               TipoUnidadMedidaId1, UnidadMedidaId1, CantUnidadMedida1, TipoUnidadMedidaId2, UnidadMedidaId2, CantUnidadMedida2,
               DeVenta, DeCompra, Exento, CodBarra, Inactivo, CodARBA
        FROM dbo.Productos) x);
DECLARE @PreciosDistintos INT = (
    SELECT COUNT(*) FROM (
        SELECT ProductoId, ListaPrecioId, Precio FROM EMP001.dbo.RelProductosListasPrecios
        EXCEPT
        SELECT ProductoId, ListaPrecioId, Precio FROM dbo.RelProductosListasPrecios) x);
PRINT CONCAT('Productos con datos distintos a EMP001: ', @ProductosDistintos, '. Precios distintos: ', @PreciosDistintos,
             '. (0 y 0 = ENSEMBLE igual a EMP001. Si no: cambió EMP001 después de una copia anterior o se editó en ENSEMBLE.)');
GO
