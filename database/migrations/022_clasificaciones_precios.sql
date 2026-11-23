/*
    022 - Árbol del Aplicativo de precios (tipo 3) desde "Z Lista precios" (EMP001, 511)

    En el Tempo ERP, las hijas de "Z Lista precios" (511) agrupan los productos para el aplicativo de precios
    (Luz Azul Propios > 60 %, Otros Terceros > 50 %, Almacen, Papelera...). En ENSEMBLE ese árbol es el tipo 3
    de Clasificaciones, que estaba vacío.

    Qué hace, en una transacción:
      - Copia el árbol debajo de 511 al tipo 3: las hijas de 511 quedan como raíces y se mantiene la jerarquía.
        El orden entre hermanas es el de creación en EMP001 (id). La raíz 511 no se copia.
      - Copia a ProductoClasificaciones (tipo 3) la clasificación de cada producto. Un producto tiene una sola:
        si en EMP001 está en varias, queda la más específica (la de nivel más profundo; por ejemplo "Almacen >
        50 %" y no "Almacen"). Si quedan dos del mismo nivel, corta sin cambiar nada.
      - Los productos que en EMP001 están solo en la raíz 511 no tienen dónde ir y se informan.

    Desde el corte del Tempo ERP, este árbol y la clasificación de precios de cada producto se editan en el
    configurador (Clasificaciones y ABM de productos).

    Se corre en ENSEMBLE, después de la 020. Necesita EMP001. Se puede volver a correr: si el tipo 3 ya tiene
    clasificaciones no hace nada, para no pisar lo editado en el configurador.
*/
SET NOCOUNT ON;
SET XACT_ABORT ON;
GO

IF OBJECT_ID(N'dbo.Clasificaciones', N'U') IS NULL OR OBJECT_ID(N'dbo.ProductoClasificaciones', N'U') IS NULL
    THROW 50001, N'Faltan las migraciones 001 y 011: no existen las tablas de clasificaciones.', 1;

IF NOT EXISTS (SELECT 1 FROM dbo.TiposClasificacion WHERE TipoClasificacion = 3)
    THROW 50001, N'No existe el tipo de clasificación 3 (Aplicativo de precios).', 1;

IF EXISTS (SELECT 1 FROM dbo.Clasificaciones WHERE TipoClasificacion = 3)
BEGIN
    PRINT N'El tipo 3 (Aplicativo de precios) ya tiene clasificaciones: no se cambió nada.';
    RETURN;
END

IF DB_ID(N'EMP001') IS NULL
    THROW 50002, N'No se encuentra la base EMP001: hace falta para copiar "Z Lista precios".', 1;

DECLARE @Raiz INT = 511;

IF NOT EXISTS (SELECT 1 FROM EMP001.dbo.ClasificacionesProductos WHERE ClasificacionProdId = @Raiz)
    THROW 50003, N'No se encontró "Z Lista precios" (511) en EMP001: no se cambió nada.', 1;

-- Árbol debajo de 511 (nivel 1 = raíces del tipo 3)
CREATE TABLE #Arbol (IdEmp001 INT NOT NULL, PadreEmp001 INT NOT NULL, Nivel INT NOT NULL, Descripcion NVARCHAR(100) NOT NULL, ClasificacionId INT NULL);

WITH t AS (
    SELECT ra.ClasifProdIdHijo AS Id, ra.ClasifProdIdPadre AS Padre, 1 AS Nivel
    FROM EMP001.dbo.RelArbolClasifProductos ra WHERE ra.ClasifProdIdPadre = @Raiz
    UNION ALL
    SELECT ra.ClasifProdIdHijo, ra.ClasifProdIdPadre, t.Nivel + 1
    FROM EMP001.dbo.RelArbolClasifProductos ra JOIN t ON ra.ClasifProdIdPadre = t.Id
    WHERE t.Nivel < 20)
INSERT INTO #Arbol (IdEmp001, PadreEmp001, Nivel, Descripcion)
SELECT t.Id, t.Padre, t.Nivel, LTRIM(RTRIM(c.Descripcion))
FROM t JOIN EMP001.dbo.ClasificacionesProductos c ON c.ClasificacionProdId = t.Id;

IF NOT EXISTS (SELECT 1 FROM #Arbol)
    THROW 50003, N'"Z Lista precios" (511) no tiene clasificaciones debajo: no se cambió nada.', 1;

IF EXISTS (SELECT IdEmp001 FROM #Arbol GROUP BY IdEmp001 HAVING COUNT(*) > 1)
    THROW 50004, N'Alguna clasificación de "Z Lista precios" tiene dos madres en EMP001: en ENSEMBLE va una sola, revisarlo antes de correr la migración.', 1;

IF EXISTS (SELECT PadreEmp001, Descripcion FROM #Arbol GROUP BY PadreEmp001, Descripcion HAVING COUNT(*) > 1)
    THROW 50004, N'Hay dos clasificaciones hermanas con el mismo nombre en "Z Lista precios": revisarlo antes de correr la migración.', 1;

-- Clasificación de cada producto: la más específica (nivel más profundo)
SELECT r.ProductoId, a.IdEmp001, a.Nivel,
       ROW_NUMBER() OVER (PARTITION BY r.ProductoId ORDER BY a.Nivel DESC, a.IdEmp001) AS Nro,
       COUNT(*) OVER (PARTITION BY r.ProductoId, a.Nivel) AS MismoNivel,
       MAX(a.Nivel) OVER (PARTITION BY r.ProductoId) AS NivelMaximo
INTO #Asign
FROM EMP001.dbo.RelProductosClasificacionesProductos r
JOIN #Arbol a ON a.IdEmp001 = r.ClasificacionProdId;

IF EXISTS (SELECT 1 FROM #Asign WHERE Nivel = NivelMaximo AND MismoNivel > 1)
    THROW 50005, N'Algún producto está en dos clasificaciones del mismo nivel de "Z Lista precios": ENSEMBLE admite una sola, revisarlo antes de correr la migración.', 1;

IF EXISTS (SELECT 1 FROM #Asign a WHERE a.Nro = 1 AND NOT EXISTS (SELECT 1 FROM dbo.Productos p WHERE p.ProductoId = a.ProductoId))
    THROW 50006, N'Algún producto con clasificación de precios en EMP001 no existe en ENSEMBLE: correr la sincronización de productos y volver a intentar.', 1;

DECLARE @SoloRaiz INT = (SELECT COUNT(DISTINCT r.ProductoId) FROM EMP001.dbo.RelProductosClasificacionesProductos r
                         WHERE r.ClasificacionProdId = @Raiz AND NOT EXISTS (SELECT 1 FROM #Asign a WHERE a.ProductoId = r.ProductoId));

BEGIN TRANSACTION;

-- Nivel por nivel, para que cada clasificación encuentre el id nuevo de su madre
DECLARE @Nivel INT = 1, @NivelMaximo INT = (SELECT MAX(Nivel) FROM #Arbol);
DECLARE @Ids TABLE (ClasificacionId INT NOT NULL, IdEmp001 INT NOT NULL);
WHILE @Nivel <= @NivelMaximo
BEGIN
    DELETE FROM @Ids;

    MERGE dbo.Clasificaciones AS d
    USING (SELECT a.IdEmp001, a.Descripcion, m.ClasificacionId AS PadreId,
                  ROW_NUMBER() OVER (PARTITION BY a.PadreEmp001 ORDER BY a.IdEmp001) AS Orden
           FROM #Arbol a LEFT JOIN #Arbol m ON m.IdEmp001 = a.PadreEmp001
           WHERE a.Nivel = @Nivel) AS o
    ON 1 = 0
    WHEN NOT MATCHED THEN
        INSERT (TipoClasificacion, ClasificacionPadreId, Descripcion, Orden)
        VALUES (3, o.PadreId, o.Descripcion, o.Orden)
    OUTPUT inserted.ClasificacionId, o.IdEmp001 INTO @Ids (ClasificacionId, IdEmp001);

    UPDATE a SET a.ClasificacionId = i.ClasificacionId FROM #Arbol a JOIN @Ids i ON i.IdEmp001 = a.IdEmp001;
    SET @Nivel += 1;
END

INSERT INTO dbo.ProductoClasificaciones (ProductoId, ClasificacionId, TipoClasificacion)
SELECT s.ProductoId, a.ClasificacionId, 3
FROM #Asign s JOIN #Arbol a ON a.IdEmp001 = s.IdEmp001
WHERE s.Nro = 1;
DECLARE @Productos INT = @@ROWCOUNT;

COMMIT TRANSACTION;

DECLARE @Clasificaciones INT = (SELECT COUNT(*) FROM #Arbol);
DECLARE @Raices INT = (SELECT COUNT(*) FROM #Arbol WHERE Nivel = 1);
DECLARE @Descartadas INT = (SELECT COUNT(*) FROM #Asign WHERE Nro > 1);
PRINT CONCAT(N'Aplicativo de precios (tipo 3): ', @Clasificaciones, N' clasificaciones (', @Raices, N' raíces), ',
             @Productos, N' productos clasificados (', @Descartadas, N' asignaciones menos específicas descartadas, ',
             @SoloRaiz, N' productos solo en la raíz 511 sin clasificar).');
GO
