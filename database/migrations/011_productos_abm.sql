/*
    011 - ABM de productos en ENSEMBLE: clasificaciones de pedidos y de precios

    Los productos se administran desde configuraciones-luz-azul (Ensemble /Productos) sobre las tablas
    que crea la 005. Cada producto lleva, opcionalmente, UNA clasificación de cada árbol:
      - tipo 2: Aplicativo de pedidos
      - tipo 3: Aplicativo de precios
    (el tipo 1, Recordatorios, no se asigna a productos).

    Cambios en dbo.ProductoClasificaciones (001), que hoy está vacía:
      - El CHECK pasa de los tipos (1, 2) a (2, 3).
      - Índice único (ProductoId, TipoClasificacion): una clasificación por tipo.
      - FK a dbo.Productos: ahora el producto está en la misma base (antes estaba en EMP001).
    Y el sinónimo dbo.ProductosEmpresa (001) pasa a apuntar a dbo.Productos de ENSEMBLE.

    Se corre en ENSEMBLE, DESPUÉS de la 005 (corta si no existe dbo.Productos).
    Se puede volver a correr: cada cambio se hace solo si falta. Si hay datos que lo impiden
    (asignaciones de tipo 1, dos del mismo tipo o productos inexistentes) corta sin cambiar nada.
*/
SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.Productos', N'U') IS NULL
    THROW 50001, N'Falta la migración 005: no existe dbo.Productos en ENSEMBLE.', 1;
GO

-- ------------------------------------------------------------------ Controles previos
IF EXISTS (SELECT 1 FROM dbo.ProductoClasificaciones WHERE TipoClasificacion NOT IN (2, 3))
    THROW 50002, N'Hay productos con clasificaciones de un tipo que no es 2 ni 3: revisarlos antes de seguir.', 1;
GO

IF EXISTS (SELECT 1 FROM dbo.ProductoClasificaciones GROUP BY ProductoId, TipoClasificacion HAVING COUNT(*) > 1)
    THROW 50003, N'Hay productos con más de una clasificación del mismo tipo: dejar una sola antes de seguir.', 1;
GO

IF EXISTS (SELECT 1 FROM dbo.ProductoClasificaciones pc WHERE NOT EXISTS (SELECT 1 FROM dbo.Productos p WHERE p.ProductoId = pc.ProductoId))
    THROW 50004, N'Hay clasificaciones de productos que no existen en dbo.Productos: borrarlas antes de seguir.', 1;
GO

-- ------------------------------------------------------------------ Tipos permitidos: 2 y 3
IF EXISTS (SELECT 1 FROM sys.check_constraints
           WHERE name = N'CK_ProductoClasificaciones_Tipo' AND parent_object_id = OBJECT_ID(N'dbo.ProductoClasificaciones')
             AND definition NOT LIKE N'%(3)%')
BEGIN
    ALTER TABLE dbo.ProductoClasificaciones DROP CONSTRAINT CK_ProductoClasificaciones_Tipo;
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints
               WHERE name = N'CK_ProductoClasificaciones_Tipo' AND parent_object_id = OBJECT_ID(N'dbo.ProductoClasificaciones'))
BEGIN
    ALTER TABLE dbo.ProductoClasificaciones
        ADD CONSTRAINT CK_ProductoClasificaciones_Tipo CHECK (TipoClasificacion IN (2, 3));
    PRINT N'ProductoClasificaciones acepta los tipos 2 (pedidos) y 3 (precios).';
END
GO

-- ------------------------------------------------------------------ Una clasificación por tipo
IF NOT EXISTS (SELECT 1 FROM sys.indexes
               WHERE name = N'UX_ProductoClasificaciones_ProductoTipo' AND object_id = OBJECT_ID(N'dbo.ProductoClasificaciones'))
BEGIN
    CREATE UNIQUE INDEX UX_ProductoClasificaciones_ProductoTipo
        ON dbo.ProductoClasificaciones (ProductoId, TipoClasificacion);
    PRINT N'Índice único (ProductoId, TipoClasificacion) creado.';
END
GO

-- ------------------------------------------------------------------ FK a dbo.Productos
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys
               WHERE name = N'FK_ProductoClasificaciones_Productos' AND parent_object_id = OBJECT_ID(N'dbo.ProductoClasificaciones'))
BEGIN
    ALTER TABLE dbo.ProductoClasificaciones
        ADD CONSTRAINT FK_ProductoClasificaciones_Productos FOREIGN KEY (ProductoId) REFERENCES dbo.Productos (ProductoId);
    PRINT N'FK de ProductoClasificaciones a Productos creada.';
END
GO

-- ------------------------------------------------------------------ Sinónimo a la tabla de ENSEMBLE
IF EXISTS (SELECT 1 FROM sys.synonyms
           WHERE name = N'ProductosEmpresa' AND SCHEMA_NAME(schema_id) = N'dbo' AND base_object_name <> N'[dbo].[Productos]')
BEGIN
    DROP SYNONYM dbo.ProductosEmpresa;
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.synonyms WHERE name = N'ProductosEmpresa' AND SCHEMA_NAME(schema_id) = N'dbo')
BEGIN
    CREATE SYNONYM dbo.ProductosEmpresa FOR dbo.Productos;
    PRINT N'El sinónimo ProductosEmpresa apunta a dbo.Productos de ENSEMBLE.';
END
GO
