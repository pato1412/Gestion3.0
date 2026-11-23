/*
    020 - Clasificaciones de productos: todo lo que se usaba de EMP001 pasa a ENSEMBLE

    Los webservices y Gestión 2.0 dejan de leer clasificaciones de EMP001. Desde esta migración ENSEMBLE es el
    maestro: los ids de clasificaciones son los de dbo.Clasificaciones y lo que se edite en el Tempo ERP ya no
    llega a ningún lado.

    Qué hace, en una transacción:

    1. Proveedores del aplicativo de pedidos: "Aa Realizar Pedidos" (EMP001, 139) -> tipo 2 de Clasificaciones,
       que ya está cargado con los mismos proveedores sin el prefijo de letras.
         - Empareja los dos árboles por nombre sin prefijo (lo que va después del primer espacio).
         - Borra las clasificaciones del tipo 2 que no están en EMP001 y deja el nombre de EMP001 si difiere
           solo en mayúsculas o acentos.
         - Copia a ProductoClasificaciones el proveedor de cada producto (uno solo: si tiene dos y uno es
           "P Insumos (NO USAR)", queda el otro). Reemplaza la asignación de tipo 2 que ya tuviera.
         - ConfigPedidoProveedor.ClasificacionId (FK), cargada por NombreProveedor. Los proveedores que ya no
           están en el árbol quedan en NULL.

    2. Mails de los proveedores: tabla nueva dbo.ClasificacionEmails, cargada con los contactos tipo >= 90 del
       cliente 2 de EMP001 (se emparejaban por nombre con el proveedor). Con EstablecimientoId NULL valen para
       todos los locales; si un local tiene mails propios para un proveedor, se usan esos en lugar de los
       generales. Así queda en la base el reemplazo que Gestión 2.0 tenía fijo en el código: en Sucre (16) y
       Bahía Blanca (17) el mail del depósito de Olavarría se cambia por otros dos.

    3. Productos combinables: "Ab Combina Pedidos" (EMP001, 354) -> tipo de clasificación nuevo 4
       "Producto combinable". Cada grupo es una raíz del árbol y cada producto queda en su grupo.

    4. Atributos de Productos (BIT NOT NULL, por defecto 0, y DiasVencimiento INT NULL), cargados desde EMP001:
         Almacen           42  Almacen                  precios de almacén de los locales propios
         PreciosWeb        580 Productos precios WEB     ecommerce y página web
         Balanza           "Balanza"                    productos que se exportan a las balanzas
         DiasVencimiento   hijas de "Balanza" ("3 Días Vto" -> 3)
         ProductoOpcional  "AC Productos Opcionales"    aplicativo de pedidos
         PromoChauIVA      "AD Productos en promo"      aplicativo de pedidos
         EsPrueba          regla de sincronización 6    facturación (productos en prueba)
         ElaboradoEnLocal  120 Promos, 121 Pizzas y 122 Picadas: los que el local elabora con órdenes de producción

    5. SincronizarProductosDesdeEMP001 deja de sincronizar Productos.SincroPreciosFRQ (019): sigue trayendo
       productos y precios, pero ninguna clasificación.

    ORDEN: correrla ANTES de publicar WSMaestros, WSHasar, WebsiteWebApp y la versión nueva de Gestión 2.0.
    Las versiones actuales no usan nada de esto, salvo SincroPreciosFRQ, que queda como está.
    Necesita EMP001 en la instancia.

    Se corre en ENSEMBLE, después de la 019. Corta sin cambiar nada si algo no empareja. Se puede volver a
    correr: si ya existe dbo.ClasificacionEmails no vuelve a cargar nada (solo recrea el procedimiento).

    ATENCIÓN: no volver a correrla después de la 021 (corte del Tempo ERP): recrearía el procedimiento completo
    y volvería a pisar con EMP001 los productos editados en el configurador.
*/
SET NOCOUNT ON;
SET XACT_ABORT ON;
GO

IF OBJECT_ID(N'dbo.Clasificaciones', N'U') IS NULL OR OBJECT_ID(N'dbo.ProductoClasificaciones', N'U') IS NULL
   OR OBJECT_ID(N'dbo.TiposClasificacion', N'U') IS NULL
    THROW 50001, N'Faltan las migraciones 001 y 011: no existen las tablas de clasificaciones.', 1;

IF OBJECT_ID(N'dbo.ConfigPedidoProveedor', N'U') IS NULL OR OBJECT_ID(N'dbo.GWRRelReglasSincronizacionEntidades', N'U') IS NULL
    THROW 50001, N'No existen ConfigPedidoProveedor o GWRRelReglasSincronizacionEntidades: correr la migración en ENSEMBLE.', 1;

IF COL_LENGTH(N'dbo.Productos', N'SincroPreciosFRQ') IS NULL
    THROW 50001, N'Falta la migración 019 (Productos.SincroPreciosFRQ).', 1;

IF OBJECT_ID(N'dbo.ClasificacionEmails', N'U') IS NOT NULL
BEGIN
    PRINT N'Ya existe dbo.ClasificacionEmails: las clasificaciones ya se pasaron a ENSEMBLE, no se volvió a cargar nada.';
    RETURN;
END

IF DB_ID(N'EMP001') IS NULL
    THROW 50002, N'No se encuentra la base EMP001: hace falta para copiar las clasificaciones.', 1;

IF EXISTS (SELECT 1 FROM dbo.TiposClasificacion WHERE TipoClasificacion = 4)
    THROW 50003, N'Ya existe el tipo de clasificación 4: revisarlo antes de correr la migración.', 1;

DECLARE @RaizPedidos INT = 139, @Insumos INT = 541, @RaizCombina INT = 354;
DECLARE @MailOlavarria NVARCHAR(100) = N'depositoolavarria@luz-azul.com.ar';
DECLARE @MailReemplazo1 NVARCHAR(100) = N'expedicionbarracas@luz-azul.com.ar';
DECLARE @MailReemplazo2 NVARCHAR(100) = N'pedidosbarracas@luz-azul.com.ar';

-- ------------------------------------------------------------------ 1. Proveedores de pedidos
CREATE TABLE #Arbol (IdEmp001 INT PRIMARY KEY, Descripcion VARCHAR(100), SinPrefijo NVARCHAR(100), ClasificacionId INT NULL);

WITH t AS (
    SELECT ra.ClasifProdIdHijo AS Id FROM EMP001.dbo.RelArbolClasifProductos ra WHERE ra.ClasifProdIdPadre = @RaizPedidos
    UNION ALL
    SELECT ra.ClasifProdIdHijo FROM EMP001.dbo.RelArbolClasifProductos ra JOIN t ON ra.ClasifProdIdPadre = t.Id)
INSERT INTO #Arbol (IdEmp001, Descripcion, SinPrefijo)
SELECT DISTINCT c.ClasificacionProdId, c.Descripcion, LTRIM(SUBSTRING(c.Descripcion, CHARINDEX(' ', c.Descripcion) + 1, 100))
FROM t JOIN EMP001.dbo.ClasificacionesProductos c ON c.ClasificacionProdId = t.Id;

IF NOT EXISTS (SELECT 1 FROM #Arbol)
    THROW 50004, N'No se encontró el árbol de "Aa Realizar Pedidos" (139) en EMP001: no se cambió nada.', 1;

IF EXISTS (SELECT 1 FROM #Arbol a
           WHERE (SELECT COUNT(*) FROM dbo.Clasificaciones c
                  WHERE c.TipoClasificacion = 2 AND c.Descripcion COLLATE Latin1_General_CI_AI = a.SinPrefijo COLLATE Latin1_General_CI_AI) <> 1)
    THROW 50005, N'Alguna clasificación de "Aa Realizar Pedidos" no tiene exactamente una con el mismo nombre en el tipo 2 de ENSEMBLE: revisarlo antes de correr la migración.', 1;

UPDATE a SET a.ClasificacionId = c.ClasificacionId
FROM #Arbol a
JOIN dbo.Clasificaciones c ON c.TipoClasificacion = 2 AND c.Descripcion COLLATE Latin1_General_CI_AI = a.SinPrefijo COLLATE Latin1_General_CI_AI;

CREATE TABLE #Borrar (ClasificacionId INT PRIMARY KEY);
INSERT INTO #Borrar (ClasificacionId)
SELECT c.ClasificacionId FROM dbo.Clasificaciones c
WHERE c.TipoClasificacion = 2 AND NOT EXISTS (SELECT 1 FROM #Arbol a WHERE a.ClasificacionId = c.ClasificacionId);

IF EXISTS (SELECT 1 FROM #Borrar b WHERE EXISTS (SELECT 1 FROM dbo.ProductoClasificaciones pc WHERE pc.ClasificacionId = b.ClasificacionId)
                                      OR EXISTS (SELECT 1 FROM dbo.Clasificaciones h WHERE h.ClasificacionPadreId = b.ClasificacionId)
                                      OR EXISTS (SELECT 1 FROM dbo.CalendarioRecordatorios r WHERE r.ClasificacionId = b.ClasificacionId))
    THROW 50006, N'Alguna clasificación del tipo 2 que no está en EMP001 tiene productos, hijas o recordatorios: no se borra, revisarla antes de correr la migración.', 1;

SELECT r.ProductoId, a.ClasificacionId,
       ROW_NUMBER() OVER (PARTITION BY r.ProductoId ORDER BY CASE WHEN a.IdEmp001 = @Insumos THEN 1 ELSE 0 END) AS Nro,
       SUM(CASE WHEN a.IdEmp001 = @Insumos THEN 0 ELSE 1 END) OVER (PARTITION BY r.ProductoId) AS NoInsumos
INTO #Asign
FROM EMP001.dbo.RelProductosClasificacionesProductos r
JOIN #Arbol a ON a.IdEmp001 = r.ClasificacionProdId;

IF EXISTS (SELECT 1 FROM #Asign WHERE NoInsumos > 1)
    THROW 50007, N'Algún producto tiene en EMP001 más de un proveedor de pedidos (sin contar Insumos): ENSEMBLE admite uno solo, revisarlo antes de correr la migración.', 1;

CREATE TABLE #Proveedores (ProductoId VARCHAR(25) PRIMARY KEY, ClasificacionId INT NOT NULL);
INSERT INTO #Proveedores (ProductoId, ClasificacionId)
SELECT ProductoId, ClasificacionId FROM #Asign WHERE Nro = 1;

-- ------------------------------------------------------------------ 2. Mails de los proveedores
CREATE TABLE #Mails (ClasificacionId INT NOT NULL, Email NVARCHAR(100) NOT NULL, PRIMARY KEY (ClasificacionId, Email));
INSERT INTO #Mails (ClasificacionId, Email)
SELECT DISTINCT a.ClasificacionId, LTRIM(RTRIM(rcc.Email))
FROM EMP001.dbo.RelClientesContactos rcc
JOIN EMP001.dbo.TiposContactosClientes tcc ON tcc.TipoContactoClienteId = rcc.TipoContactoClienteId
JOIN #Arbol a ON a.SinPrefijo COLLATE Latin1_General_CI_AI
               = LTRIM(SUBSTRING(tcc.Descripcion, CHARINDEX(' ', tcc.Descripcion) + 1, 100)) COLLATE Latin1_General_CI_AI
WHERE rcc.ClienteId = '2' AND rcc.TipoContactoClienteId >= 90 AND LTRIM(RTRIM(ISNULL(rcc.Email, ''))) <> '';

-- ------------------------------------------------------------------ 3. Productos combinables
CREATE TABLE #Combina (IdEmp001 INT PRIMARY KEY, Descripcion NVARCHAR(100) NOT NULL, ClasificacionId INT NULL);
INSERT INTO #Combina (IdEmp001, Descripcion)
SELECT c.ClasificacionProdId, c.Descripcion
FROM EMP001.dbo.RelArbolClasifProductos ra JOIN EMP001.dbo.ClasificacionesProductos c ON c.ClasificacionProdId = ra.ClasifProdIdHijo
WHERE ra.ClasifProdIdPadre = @RaizCombina;

IF NOT EXISTS (SELECT 1 FROM #Combina)
    THROW 50004, N'No se encontraron los grupos de "Ab Combina Pedidos" (354) en EMP001: no se cambió nada.', 1;

IF EXISTS (SELECT 1 FROM #Combina GROUP BY Descripcion HAVING COUNT(*) > 1)
    THROW 50008, N'Hay dos grupos de "Ab Combina Pedidos" con el mismo nombre: revisarlo antes de correr la migración.', 1;

SELECT r.ProductoId, r.ClasificacionProdId AS IdEmp001
INTO #ProdCombina
FROM EMP001.dbo.RelProductosClasificacionesProductos r JOIN #Combina c ON c.IdEmp001 = r.ClasificacionProdId;

IF EXISTS (SELECT 1 FROM #ProdCombina GROUP BY ProductoId HAVING COUNT(*) > 1)
    THROW 50008, N'Algún producto está en más de un grupo de "Ab Combina Pedidos": ENSEMBLE admite uno solo, revisarlo antes de correr la migración.', 1;

-- ------------------------------------------------------------------ 4. Atributos
CREATE TABLE #Atributos (Atributo VARCHAR(30) NOT NULL, ClasificacionProdId INT NOT NULL, PRIMARY KEY (Atributo, ClasificacionProdId));
INSERT INTO #Atributos (Atributo, ClasificacionProdId) VALUES
    ('Almacen', 42), ('PreciosWeb', 580), ('ElaboradoEnLocal', 120), ('ElaboradoEnLocal', 121), ('ElaboradoEnLocal', 122);
-- Las que los webservices buscaban por nombre
INSERT INTO #Atributos (Atributo, ClasificacionProdId)
SELECT v.Atributo, c.ClasificacionProdId
FROM (VALUES ('Balanza', 'Balanza'), ('ProductoOpcional', 'AC Productos Opcionales'), ('PromoChauIVA', 'AD Productos en promo')) v (Atributo, Nombre)
JOIN EMP001.dbo.ClasificacionesProductos c ON c.Descripcion = v.Nombre;
INSERT INTO #Atributos (Atributo, ClasificacionProdId)
SELECT DISTINCT 'EsPrueba', TRY_CAST(EntidadId AS INT) FROM dbo.GWRRelReglasSincronizacionEntidades
WHERE ReglaSincroId = 6 AND TRY_CAST(EntidadId AS INT) IS NOT NULL;

IF (SELECT COUNT(DISTINCT Atributo) FROM #Atributos) <> 7
    THROW 50009, N'No se encontraron en EMP001 todas las clasificaciones de los atributos (Balanza, AC Productos Opcionales, AD Productos en promo o la regla 6): no se cambió nada.', 1;

-- Días de vencimiento: primera palabra de las hijas de Balanza ("3 Días Vto" -> 3)
SELECT r.ProductoId, MAX(TRY_CAST(LEFT(c.Descripcion, CHARINDEX(' ', c.Descripcion + ' ') - 1) AS INT)) AS Dias
INTO #Vencimientos
FROM EMP001.dbo.RelArbolClasifProductos ra
JOIN #Atributos b ON b.Atributo = 'Balanza' AND b.ClasificacionProdId = ra.ClasifProdIdPadre
JOIN EMP001.dbo.ClasificacionesProductos c ON c.ClasificacionProdId = ra.ClasifProdIdHijo
JOIN EMP001.dbo.RelProductosClasificacionesProductos r ON r.ClasificacionProdId = ra.ClasifProdIdHijo
WHERE TRY_CAST(LEFT(c.Descripcion, CHARINDEX(' ', c.Descripcion + ' ') - 1) AS INT) IS NOT NULL
GROUP BY r.ProductoId;

IF EXISTS (SELECT ProductoId FROM #Proveedores UNION SELECT ProductoId FROM #ProdCombina
           EXCEPT SELECT ProductoId FROM dbo.Productos)
    THROW 50010, N'Algún producto clasificado en EMP001 no existe en ENSEMBLE: correr la sincronización de productos y volver a intentar.', 1;

-- ------------------------------------------------------------------ Cambios
BEGIN TRANSACTION;

-- 1. Proveedores de pedidos
DELETE c FROM dbo.Clasificaciones c JOIN #Borrar b ON b.ClasificacionId = c.ClasificacionId;
DECLARE @Borradas INT = @@ROWCOUNT;

UPDATE c SET c.Descripcion = a.SinPrefijo
FROM dbo.Clasificaciones c JOIN #Arbol a ON a.ClasificacionId = c.ClasificacionId
WHERE c.Descripcion COLLATE Latin1_General_BIN2 <> a.SinPrefijo COLLATE Latin1_General_BIN2;
DECLARE @Renombradas INT = @@ROWCOUNT;

DELETE pc FROM dbo.ProductoClasificaciones pc
WHERE pc.TipoClasificacion = 2 AND EXISTS (SELECT 1 FROM #Proveedores p WHERE p.ProductoId = pc.ProductoId);
DECLARE @Reemplazadas INT = @@ROWCOUNT;

INSERT INTO dbo.ProductoClasificaciones (ProductoId, ClasificacionId, TipoClasificacion)
SELECT ProductoId, ClasificacionId, 2 FROM #Proveedores;
DECLARE @ConProveedor INT = @@ROWCOUNT;

ALTER TABLE dbo.ConfigPedidoProveedor ADD ClasificacionId INT NULL;

-- 2. Mails
CREATE TABLE dbo.ClasificacionEmails (
    ClasificacionEmailId INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_ClasificacionEmails PRIMARY KEY,
    ClasificacionId      INT NOT NULL CONSTRAINT FK_ClasificacionEmails_Clasificaciones REFERENCES dbo.Clasificaciones (ClasificacionId),
    -- NULL: vale para todos los locales. Si un local tiene mails propios para el proveedor, se usan esos.
    EstablecimientoId    INT NULL CONSTRAINT FK_ClasificacionEmails_GWREstablecimientos REFERENCES dbo.GWREstablecimientos (EstablecimientoId),
    Email                NVARCHAR(100) NOT NULL
);
CREATE UNIQUE INDEX UX_ClasificacionEmails ON dbo.ClasificacionEmails (ClasificacionId, EstablecimientoId, Email);

-- 3. Productos combinables
INSERT INTO dbo.TiposClasificacion (TipoClasificacion, Descripcion) VALUES (4, N'Producto combinable');

ALTER TABLE dbo.ProductoClasificaciones DROP CONSTRAINT CK_ProductoClasificaciones_Tipo;
ALTER TABLE dbo.ProductoClasificaciones ADD CONSTRAINT CK_ProductoClasificaciones_Tipo CHECK (TipoClasificacion IN (2, 3, 4));

INSERT INTO dbo.Clasificaciones (TipoClasificacion, ClasificacionPadreId, Descripcion, Orden)
SELECT 4, NULL, Descripcion, ROW_NUMBER() OVER (ORDER BY Descripcion) FROM #Combina;

UPDATE g SET g.ClasificacionId = c.ClasificacionId
FROM #Combina g JOIN dbo.Clasificaciones c ON c.TipoClasificacion = 4 AND c.ClasificacionPadreId IS NULL AND c.Descripcion = g.Descripcion;

INSERT INTO dbo.ProductoClasificaciones (ProductoId, ClasificacionId, TipoClasificacion)
SELECT p.ProductoId, g.ClasificacionId, 4 FROM #ProdCombina p JOIN #Combina g ON g.IdEmp001 = p.IdEmp001;
DECLARE @Combinables INT = @@ROWCOUNT;

-- 4. Atributos
ALTER TABLE dbo.Productos ADD
    Almacen          BIT NOT NULL CONSTRAINT DF_Productos_Almacen DEFAULT (0),
    PreciosWeb       BIT NOT NULL CONSTRAINT DF_Productos_PreciosWeb DEFAULT (0),
    Balanza          BIT NOT NULL CONSTRAINT DF_Productos_Balanza DEFAULT (0),
    DiasVencimiento  INT NULL,
    ProductoOpcional BIT NOT NULL CONSTRAINT DF_Productos_ProductoOpcional DEFAULT (0),
    PromoChauIVA     BIT NOT NULL CONSTRAINT DF_Productos_PromoChauIVA DEFAULT (0),
    EsPrueba         BIT NOT NULL CONSTRAINT DF_Productos_EsPrueba DEFAULT (0),
    ElaboradoEnLocal BIT NOT NULL CONSTRAINT DF_Productos_ElaboradoEnLocal DEFAULT (0);

-- Las columnas recién creadas no existen al compilar el lote: lo que las usa va por sp_executesql.
DECLARE @Configs INT, @MailsGenerales INT, @MailsLocales INT;
EXEC sys.sp_executesql N'
    UPDATE cpp SET cpp.ClasificacionId = a.ClasificacionId
    FROM dbo.ConfigPedidoProveedor cpp JOIN #Arbol a ON a.Descripcion = cpp.NombreProveedor;
    SET @Configs = @@ROWCOUNT;

    ALTER TABLE dbo.ConfigPedidoProveedor
        ADD CONSTRAINT FK_ConfigPedidoProveedor_Clasificaciones FOREIGN KEY (ClasificacionId) REFERENCES dbo.Clasificaciones (ClasificacionId);

    INSERT INTO dbo.ClasificacionEmails (ClasificacionId, EstablecimientoId, Email)
    SELECT ClasificacionId, NULL, Email FROM #Mails;
    SET @MailsGenerales = @@ROWCOUNT;

    -- Sucre (16) y Bahía Blanca (17): el mail del depósito de Olavarría se reemplaza por otros dos
    INSERT INTO dbo.ClasificacionEmails (ClasificacionId, EstablecimientoId, Email)
    SELECT DISTINCT x.ClasificacionId, e.EstablecimientoId, x.Email
    FROM (SELECT m.ClasificacionId, m.Email FROM #Mails m
          WHERE m.Email <> @MailOlavarria AND EXISTS (SELECT 1 FROM #Mails o WHERE o.ClasificacionId = m.ClasificacionId AND o.Email = @MailOlavarria)
          UNION
          SELECT o.ClasificacionId, r.Email FROM #Mails o CROSS JOIN (VALUES (@MailReemplazo1), (@MailReemplazo2)) r (Email)
          WHERE o.Email = @MailOlavarria) x
    CROSS JOIN dbo.GWREstablecimientos e
    WHERE e.EstablecimientoId IN (16, 17);
    SET @MailsLocales = @@ROWCOUNT;

    UPDATE p SET p.Almacen = 1 FROM dbo.Productos p
    WHERE EXISTS (SELECT 1 FROM EMP001.dbo.RelProductosClasificacionesProductos r JOIN #Atributos a ON a.ClasificacionProdId = r.ClasificacionProdId
                  WHERE a.Atributo = ''Almacen'' AND r.ProductoId = p.ProductoId);
    UPDATE p SET p.PreciosWeb = 1 FROM dbo.Productos p
    WHERE EXISTS (SELECT 1 FROM EMP001.dbo.RelProductosClasificacionesProductos r JOIN #Atributos a ON a.ClasificacionProdId = r.ClasificacionProdId
                  WHERE a.Atributo = ''PreciosWeb'' AND r.ProductoId = p.ProductoId);
    UPDATE p SET p.Balanza = 1 FROM dbo.Productos p
    WHERE EXISTS (SELECT 1 FROM EMP001.dbo.RelProductosClasificacionesProductos r JOIN #Atributos a ON a.ClasificacionProdId = r.ClasificacionProdId
                  WHERE a.Atributo = ''Balanza'' AND r.ProductoId = p.ProductoId);
    UPDATE p SET p.ProductoOpcional = 1 FROM dbo.Productos p
    WHERE EXISTS (SELECT 1 FROM EMP001.dbo.RelProductosClasificacionesProductos r JOIN #Atributos a ON a.ClasificacionProdId = r.ClasificacionProdId
                  WHERE a.Atributo = ''ProductoOpcional'' AND r.ProductoId = p.ProductoId);
    UPDATE p SET p.PromoChauIVA = 1 FROM dbo.Productos p
    WHERE EXISTS (SELECT 1 FROM EMP001.dbo.RelProductosClasificacionesProductos r JOIN #Atributos a ON a.ClasificacionProdId = r.ClasificacionProdId
                  WHERE a.Atributo = ''PromoChauIVA'' AND r.ProductoId = p.ProductoId);
    UPDATE p SET p.EsPrueba = 1 FROM dbo.Productos p
    WHERE EXISTS (SELECT 1 FROM EMP001.dbo.RelProductosClasificacionesProductos r JOIN #Atributos a ON a.ClasificacionProdId = r.ClasificacionProdId
                  WHERE a.Atributo = ''EsPrueba'' AND r.ProductoId = p.ProductoId);
    UPDATE p SET p.ElaboradoEnLocal = 1 FROM dbo.Productos p
    WHERE EXISTS (SELECT 1 FROM EMP001.dbo.RelProductosClasificacionesProductos r JOIN #Atributos a ON a.ClasificacionProdId = r.ClasificacionProdId
                  WHERE a.Atributo = ''ElaboradoEnLocal'' AND r.ProductoId = p.ProductoId);
    UPDATE p SET p.DiasVencimiento = v.Dias FROM dbo.Productos p JOIN #Vencimientos v ON v.ProductoId = p.ProductoId;',
    N'@MailOlavarria NVARCHAR(100), @MailReemplazo1 NVARCHAR(100), @MailReemplazo2 NVARCHAR(100), @Configs INT OUTPUT, @MailsGenerales INT OUTPUT, @MailsLocales INT OUTPUT',
    @MailOlavarria = @MailOlavarria, @MailReemplazo1 = @MailReemplazo1, @MailReemplazo2 = @MailReemplazo2,
    @Configs = @Configs OUTPUT, @MailsGenerales = @MailsGenerales OUTPUT, @MailsLocales = @MailsLocales OUTPUT;

COMMIT TRANSACTION;

DECLARE @Resumen NVARCHAR(MAX);
EXEC sys.sp_executesql N'
    SELECT @Resumen = CONCAT(N''Atributos de Productos: Almacen '', SUM(CAST(Almacen AS INT)), N'', PreciosWeb '', SUM(CAST(PreciosWeb AS INT)),
        N'', Balanza '', SUM(CAST(Balanza AS INT)), N'' (con días de vencimiento '', SUM(CASE WHEN DiasVencimiento IS NULL THEN 0 ELSE 1 END), N''), ProductoOpcional '', SUM(CAST(ProductoOpcional AS INT)),
        N'', PromoChauIVA '', SUM(CAST(PromoChauIVA AS INT)), N'', EsPrueba '', SUM(CAST(EsPrueba AS INT)), N'', ElaboradoEnLocal '', SUM(CAST(ElaboradoEnLocal AS INT)), N''.'')
    FROM dbo.Productos;', N'@Resumen NVARCHAR(MAX) OUTPUT', @Resumen = @Resumen OUTPUT;

DECLARE @Emparejadas INT = (SELECT COUNT(*) FROM #Arbol);
DECLARE @Descartadas INT = (SELECT COUNT(*) FROM #Asign) - @ConProveedor;
DECLARE @Grupos INT = (SELECT COUNT(*) FROM #Combina);
PRINT CONCAT(N'Proveedores de pedidos (tipo 2): ', @Emparejadas, N' emparejados, ', @Borradas, N' borrados, ', @Renombradas, N' renombrados. ',
             @ConProveedor, N' productos con proveedor (', @Reemplazadas, N' asignaciones anteriores reemplazadas, ', @Descartadas, N' descartadas por Insumos). ',
             @Configs, N' filas de ConfigPedidoProveedor con ClasificacionId.');
PRINT CONCAT(N'Mails de proveedores: ', @MailsGenerales, N' generales y ', @MailsLocales, N' propios de Sucre y Bahía Blanca.');
PRINT CONCAT(N'Productos combinables (tipo 4): ', @Grupos, N' grupos, ', @Combinables, N' productos.');
PRINT @Resumen;
GO

-- Si no se crearon las tablas nuevas (falló algo arriba), no se toca el procedimiento: NOEXEC saltea lo que sigue.
IF OBJECT_ID(N'dbo.ClasificacionEmails', N'U') IS NULL
BEGIN
    RAISERROR(N'No se pasaron las clasificaciones a ENSEMBLE: el procedimiento de sincronización quedó como estaba.', 16, 1);
    SET NOEXEC ON;
END
GO

-- ------------------------------------------------------------------ 5. Sincronización: productos y precios, sin clasificaciones
CREATE OR ALTER PROCEDURE dbo.SincronizarProductosDesdeEMP001
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF DB_ID(N'EMP001') IS NULL
        THROW 50002, N'No se encuentra la base EMP001 en esta instancia.', 1;

    DECLARE @Inicio DATETIME = GETDATE();
    DECLARE @TiposAct INT = 0, @TiposAgr INT = 0, @UnidadesAct INT = 0, @UnidadesAgr INT = 0, @ListasAct INT = 0, @ListasAgr INT = 0,
            @ProductosAct INT = 0, @ProductosAgr INT = 0, @PreciosAct INT = 0, @PreciosAgr INT = 0, @PreciosQuit INT = 0;

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
             AND NOT EXISTS (SELECT 1 FROM EMP001.dbo.RelProductosListasPrecios o WHERE o.ProductoId = d.ProductoId AND o.ListaPrecioId = d.ListaPrecioId));

    SELECT CONVERT(CHAR(19), @Inicio, 120) AS Inicio,
        CONCAT(N'Productos: ', @ProductosAct, N' actualizados, ', @ProductosAgr, N' agregados. Precios: ', @PreciosAct, N' actualizados, ',
               @PreciosAgr, N' agregados, ', @PreciosQuit, N' quitados. Listas: ', @ListasAct, N'/', @ListasAgr,
               N'. Unidades: ', @UnidadesAct, N'/', @UnidadesAgr, N'. Tipos de unidad: ', @TiposAct, N'/', @TiposAgr,
               N'. Pendientes para la próxima corrida: ', @Pendientes, N'.') AS Resultado,
        @ProductosAct AS ProductosActualizados, @ProductosAgr AS ProductosAgregados, @PreciosAct AS PreciosActualizados,
        @PreciosAgr AS PreciosAgregados, @PreciosQuit AS PreciosQuitados, @Pendientes AS Pendientes;
END
GO

PRINT N'Procedimiento dbo.SincronizarProductosDesdeEMP001 creado o actualizado.';
GO

-- Vuelve a dejar la sesión ejecutando (por si el chequeo de arriba activó NOEXEC).
SET NOEXEC OFF;
GO
