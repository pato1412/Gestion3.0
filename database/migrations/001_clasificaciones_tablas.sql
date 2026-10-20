/*
    001 - Clasificaciones: tablas, índices y datos iniciales

    Árbol genérico de clasificaciones (categorías, etiquetas, rubros...) segmentado
    por TipoClasificacion, con orden definido por el usuario entre hermanos.

    Se puede volver a correr sin error: cada objeto se crea solo si no existe.
    Correr conectado a la base de destino (no incluye USE).
*/
SET NOCOUNT ON;
GO

-- Catálogo de tipos. Los IDs se cargan a mano (sin IDENTITY) para que el código
-- los pueda referenciar.
IF OBJECT_ID(N'dbo.TiposClasificacion', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.TiposClasificacion (
        TipoClasificacion INT NOT NULL CONSTRAINT PK_TiposClasificacion PRIMARY KEY,
        Descripcion       NVARCHAR(100) NOT NULL
    );
END
GO

INSERT INTO dbo.TiposClasificacion (TipoClasificacion, Descripcion)
SELECT v.TipoClasificacion, v.Descripcion
FROM (VALUES
    (1, N'Recordatorios'),
    (2, N'Aplicativo de pedidos'),
    (3, N'Aplicativo de precios')
) AS v (TipoClasificacion, Descripcion)
WHERE NOT EXISTS (SELECT 1 FROM dbo.TiposClasificacion t WHERE t.TipoClasificacion = v.TipoClasificacion);
GO

IF OBJECT_ID(N'dbo.Clasificaciones', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Clasificaciones (
        ClasificacionId      INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Clasificaciones PRIMARY KEY,
        TipoClasificacion    INT NOT NULL
            CONSTRAINT FK_Clasificaciones_Tipo REFERENCES dbo.TiposClasificacion (TipoClasificacion),
        ClasificacionPadreId INT NULL,
        Descripcion          NVARCHAR(100) NOT NULL,
        Orden                INT NOT NULL CONSTRAINT DF_Clasificaciones_Orden DEFAULT 0,
        Activo               BIT NOT NULL CONSTRAINT DF_Clasificaciones_Activo DEFAULT 1,
        FechaAlta            DATETIME2(0) NOT NULL CONSTRAINT DF_Clasificaciones_FechaAlta DEFAULT SYSDATETIME(),
        -- Necesaria para las FK compuestas (Id + Tipo)
        CONSTRAINT UQ_Clasificaciones_Id_Tipo UNIQUE (ClasificacionId, TipoClasificacion),
        CONSTRAINT CK_Clasificaciones_NoEsSuPropioPadre CHECK (ClasificacionPadreId <> ClasificacionId)
    );
END
GO

-- El padre tiene que existir y ser del mismo tipo: no se pueden mezclar árboles.
-- Las raíces (padre NULL) no se validan porque SQL Server no controla una FK
-- compuesta si alguna columna es NULL.
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_Clasificaciones_Padre')
BEGIN
    ALTER TABLE dbo.Clasificaciones
        ADD CONSTRAINT FK_Clasificaciones_Padre
        FOREIGN KEY (ClasificacionPadreId, TipoClasificacion)
        REFERENCES dbo.Clasificaciones (ClasificacionId, TipoClasificacion);
END
GO

-- Hijos de un nodo, ya ordenados, dentro de un tipo
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Clasificaciones_Tipo_Padre_Orden' AND object_id = OBJECT_ID(N'dbo.Clasificaciones'))
BEGIN
    CREATE INDEX IX_Clasificaciones_Tipo_Padre_Orden
        ON dbo.Clasificaciones (TipoClasificacion, ClasificacionPadreId, Orden)
        INCLUDE (Descripcion, Activo);
END
GO

-- Nombre único entre hermanos del mismo tipo (las raíces cuentan como hermanas entre sí)
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UX_Clasificaciones_Tipo_Padre_Descripcion' AND object_id = OBJECT_ID(N'dbo.Clasificaciones'))
BEGIN
    CREATE UNIQUE INDEX UX_Clasificaciones_Tipo_Padre_Descripcion
        ON dbo.Clasificaciones (TipoClasificacion, ClasificacionPadreId, Descripcion);
END
GO

-- Los productos están en otra base (EMP001). Se acceden por este sinónimo para que
-- el nombre de esa base quede en un solo lugar: si en otro ambiente se llama
-- distinto, se cambia solo acá (DROP SYNONYM + CREATE SYNONYM).
IF NOT EXISTS (SELECT 1 FROM sys.synonyms WHERE name = N'ProductosEmpresa' AND schema_id = SCHEMA_ID(N'dbo'))
BEGIN
    CREATE SYNONYM dbo.ProductosEmpresa FOR EMP001.dbo.Productos;
END
GO

-- Asociación productos <-> clasificaciones. Una tabla de este estilo por cada
-- concepto que se clasifique (ClienteClasificaciones, etc.).
-- ProductoId no tiene FK porque SQL Server no admite FK entre bases: la existencia
-- del producto la valida ProductoClasificaciones_Guardar contra dbo.ProductosEmpresa.
IF OBJECT_ID(N'dbo.ProductoClasificaciones', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ProductoClasificaciones (
        -- Mismo tipo exacto que EMP001.dbo.Productos.ProductoId: si difiere, SQL Server
        -- convierte en cada comparación y deja de usar los índices.
        ProductoId        VARCHAR(25) NOT NULL,
        ClasificacionId   INT NOT NULL,
        -- Repetido a propósito: permite que la base garantice qué tipos se pueden asignar a un producto
        TipoClasificacion INT NOT NULL,
        CONSTRAINT PK_ProductoClasificaciones PRIMARY KEY (ProductoId, ClasificacionId),
        CONSTRAINT FK_ProductoClasificaciones_Clasificacion
            FOREIGN KEY (ClasificacionId, TipoClasificacion)
            REFERENCES dbo.Clasificaciones (ClasificacionId, TipoClasificacion),
        CONSTRAINT CK_ProductoClasificaciones_Tipo CHECK (TipoClasificacion IN (1, 2))
    );
END
GO

-- Productos de una clasificación
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_ProductoClasificaciones_Clasificacion' AND object_id = OBJECT_ID(N'dbo.ProductoClasificaciones'))
BEGIN
    CREATE INDEX IX_ProductoClasificaciones_Clasificacion
        ON dbo.ProductoClasificaciones (ClasificacionId, ProductoId);
END
GO
