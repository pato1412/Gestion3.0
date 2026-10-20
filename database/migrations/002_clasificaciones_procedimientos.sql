/*
    002 - Clasificaciones: procedimientos almacenados

    Requiere 001. Se puede volver a correr sin error (CREATE OR ALTER).
    Requiere SQL Server 2016 SP1 o superior (CREATE OR ALTER, OPENJSON).
*/
SET NOCOUNT ON;
GO

/*
    Devuelve el árbol de un tipo como lista plana en orden de árbol:
    cada hija aparece debajo de su madre, y los hermanos ordenados por Orden.
    Nivel sirve para indentar; ClasificacionPadreId para armar el árbol en el front.
*/
CREATE OR ALTER PROCEDURE dbo.Clasificaciones_ObtenerArbol
    @TipoClasificacion INT,
    @IncluirInactivas  BIT = 0
AS
BEGIN
    SET NOCOUNT ON;

    WITH Arbol AS (
        SELECT ClasificacionId, ClasificacionPadreId, TipoClasificacion, Descripcion, Orden, Activo,
               0 AS Nivel,
               CAST(RIGHT('000000' + CAST(Orden AS VARCHAR(10)), 6) + '-'
                    + RIGHT('0000000000' + CAST(ClasificacionId AS VARCHAR(10)), 10) AS VARCHAR(900)) AS Ruta
        FROM dbo.Clasificaciones
        WHERE TipoClasificacion = @TipoClasificacion
          AND ClasificacionPadreId IS NULL
          AND (Activo = 1 OR @IncluirInactivas = 1)

        UNION ALL

        SELECT c.ClasificacionId, c.ClasificacionPadreId, c.TipoClasificacion, c.Descripcion, c.Orden, c.Activo,
               a.Nivel + 1,
               CAST(a.Ruta + '/' + RIGHT('000000' + CAST(c.Orden AS VARCHAR(10)), 6) + '-'
                    + RIGHT('0000000000' + CAST(c.ClasificacionId AS VARCHAR(10)), 10) AS VARCHAR(900))
        FROM dbo.Clasificaciones c
        JOIN Arbol a ON c.ClasificacionPadreId = a.ClasificacionId
                    AND c.TipoClasificacion = a.TipoClasificacion   -- aprovecha el índice por tipo
        WHERE c.Activo = 1 OR @IncluirInactivas = 1
    )
    SELECT ClasificacionId, ClasificacionPadreId, TipoClasificacion, Descripcion, Orden, Activo, Nivel
    FROM Arbol
    ORDER BY Ruta;
END
GO

/*
    Alta de una clasificación. Queda última entre sus hermanos.
    Devuelve el ClasificacionId creado.
*/
CREATE OR ALTER PROCEDURE dbo.Clasificaciones_Insertar
    @TipoClasificacion    INT,
    @ClasificacionPadreId INT = NULL,
    @Descripcion          NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;

    IF @ClasificacionPadreId IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM dbo.Clasificaciones
        WHERE ClasificacionId = @ClasificacionPadreId AND TipoClasificacion = @TipoClasificacion)
        THROW 50002, N'La clasificación padre no existe o es de otro tipo.', 1;

    INSERT INTO dbo.Clasificaciones (TipoClasificacion, ClasificacionPadreId, Descripcion, Orden)
    VALUES (
        @TipoClasificacion,
        @ClasificacionPadreId,
        @Descripcion,
        ISNULL((SELECT MAX(Orden) FROM dbo.Clasificaciones
                WHERE TipoClasificacion = @TipoClasificacion
                  AND ISNULL(ClasificacionPadreId, 0) = ISNULL(@ClasificacionPadreId, 0)), 0) + 1
    );

    SELECT CAST(SCOPE_IDENTITY() AS INT) AS ClasificacionId;
END
GO

/*
    Reordena los hermanos de un nodo. El front manda los IDs en el orden deseado,
    por ejemplo después de arrastrar y soltar: '[5, 2, 9]'.
    Solo actualiza hijos de ese padre y de ese tipo, aunque el JSON traiga otros IDs.
*/
CREATE OR ALTER PROCEDURE dbo.Clasificaciones_Reordenar
    @TipoClasificacion    INT,
    @ClasificacionPadreId INT = NULL,     -- NULL = raíces de ese tipo
    @IdsJson              NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;

    IF ISJSON(@IdsJson) = 0
        THROW 50004, N'La lista de IDs no es un JSON válido.', 1;

    UPDATE c
    SET Orden = CAST(j.[key] AS INT) + 1
    FROM dbo.Clasificaciones c
    JOIN OPENJSON(@IdsJson) j ON c.ClasificacionId = CAST(j.[value] AS INT)
    WHERE c.TipoClasificacion = @TipoClasificacion
      AND ISNULL(c.ClasificacionPadreId, 0) = ISNULL(@ClasificacionPadreId, 0);
END
GO

/*
    Mueve una clasificación (con todas sus hijas) a otro padre del mismo tipo,
    o a raíz si @NuevoPadreId es NULL. Queda última entre sus nuevos hermanos.
*/
CREATE OR ALTER PROCEDURE dbo.Clasificaciones_Mover
    @ClasificacionId INT,
    @NuevoPadreId    INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @Tipo INT, @Ciclo BIT = 0;

    SELECT @Tipo = TipoClasificacion FROM dbo.Clasificaciones WHERE ClasificacionId = @ClasificacionId;

    IF @Tipo IS NULL
        THROW 50001, N'La clasificación no existe.', 1;

    -- La FK lo impediría igual, pero así el mensaje es entendible
    IF @NuevoPadreId IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM dbo.Clasificaciones
        WHERE ClasificacionId = @NuevoPadreId AND TipoClasificacion = @Tipo)
        THROW 50002, N'La clasificación destino no existe o es de otro tipo.', 1;

    WITH Descendientes AS (
        SELECT ClasificacionId FROM dbo.Clasificaciones WHERE ClasificacionId = @ClasificacionId
        UNION ALL
        SELECT c.ClasificacionId FROM dbo.Clasificaciones c
        JOIN Descendientes d ON c.ClasificacionPadreId = d.ClasificacionId
    )
    SELECT @Ciclo = 1 FROM Descendientes WHERE ClasificacionId = @NuevoPadreId;

    IF @Ciclo = 1
        THROW 50003, N'No se puede mover una clasificación dentro de sí misma o de una de sus hijas.', 1;

    UPDATE dbo.Clasificaciones
    SET ClasificacionPadreId = @NuevoPadreId,
        Orden = ISNULL((SELECT MAX(Orden) FROM dbo.Clasificaciones
                        WHERE TipoClasificacion = @Tipo
                          AND ISNULL(ClasificacionPadreId, 0) = ISNULL(@NuevoPadreId, 0)
                          AND ClasificacionId <> @ClasificacionId), 0) + 1
    WHERE ClasificacionId = @ClasificacionId;
END
GO

/*
    Productos asociados a una clasificación, incluidas todas sus hijas.
*/
CREATE OR ALTER PROCEDURE dbo.Clasificaciones_ObtenerProductos
    @ClasificacionId INT
AS
BEGIN
    SET NOCOUNT ON;

    WITH Descendientes AS (
        SELECT ClasificacionId FROM dbo.Clasificaciones WHERE ClasificacionId = @ClasificacionId
        UNION ALL
        SELECT c.ClasificacionId FROM dbo.Clasificaciones c
        JOIN Descendientes d ON c.ClasificacionPadreId = d.ClasificacionId
    )
    SELECT DISTINCT pc.ProductoId
    FROM Descendientes d
    JOIN dbo.ProductoClasificaciones pc ON pc.ClasificacionId = d.ClasificacionId;
END
GO

/*
    Guarda las clasificaciones de UN tipo para un producto, reemplazando las que
    tenía de ese tipo (las de otros tipos no se tocan). El front manda la selección
    completa: '[3, 8, 12]'. Con '[]' quita todas las de ese tipo.
    Se puede asignar cualquier nivel del árbol, no solo las hojas.
*/
CREATE OR ALTER PROCEDURE dbo.ProductoClasificaciones_Guardar
    @ProductoId           VARCHAR(25),
    @TipoClasificacion    INT,
    @ClasificacionIdsJson NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF ISJSON(@ClasificacionIdsJson) = 0
        THROW 50004, N'La lista de IDs no es un JSON válido.', 1;

    -- Sin FK posible entre bases: se valida contra EMP001 a través del sinónimo
    IF NOT EXISTS (SELECT 1 FROM dbo.ProductosEmpresa WHERE ProductoId = @ProductoId)
        THROW 50005, N'El producto no existe.', 1;

    DECLARE @Ids TABLE (ClasificacionId INT PRIMARY KEY);
    INSERT INTO @Ids (ClasificacionId)
    SELECT DISTINCT CAST([value] AS INT) FROM OPENJSON(@ClasificacionIdsJson);

    IF EXISTS (
        SELECT 1 FROM @Ids i
        LEFT JOIN dbo.Clasificaciones c
            ON c.ClasificacionId = i.ClasificacionId
           AND c.TipoClasificacion = @TipoClasificacion
           AND c.Activo = 1
        WHERE c.ClasificacionId IS NULL)
        THROW 50006, N'Alguna de las clasificaciones no existe, está inactiva o es de otro tipo.', 1;

    BEGIN TRANSACTION;

    DELETE pc
    FROM dbo.ProductoClasificaciones pc
    WHERE pc.ProductoId = @ProductoId
      AND pc.TipoClasificacion = @TipoClasificacion
      AND NOT EXISTS (SELECT 1 FROM @Ids i WHERE i.ClasificacionId = pc.ClasificacionId);

    INSERT INTO dbo.ProductoClasificaciones (ProductoId, ClasificacionId, TipoClasificacion)
    SELECT @ProductoId, i.ClasificacionId, @TipoClasificacion
    FROM @Ids i
    WHERE NOT EXISTS (
        SELECT 1 FROM dbo.ProductoClasificaciones pc
        WHERE pc.ProductoId = @ProductoId AND pc.ClasificacionId = i.ClasificacionId);

    COMMIT TRANSACTION;
END
GO

/*
    Clasificaciones de un producto, con el camino completo para mostrar
    (ej.: 'Lácteos > Quesos > Duros'). @TipoClasificacion NULL = todos los tipos.
*/
CREATE OR ALTER PROCEDURE dbo.ProductoClasificaciones_ObtenerPorProducto
    @ProductoId        VARCHAR(25),
    @TipoClasificacion INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    -- Sube desde cada clasificación asignada hasta su raíz, armando el camino
    WITH Ancestros AS (
        SELECT pc.ClasificacionId AS Origen, c.ClasificacionPadreId,
               CAST(c.Descripcion AS NVARCHAR(1000)) AS Camino
        FROM dbo.ProductoClasificaciones pc
        JOIN dbo.Clasificaciones c ON c.ClasificacionId = pc.ClasificacionId
        WHERE pc.ProductoId = @ProductoId
          AND (@TipoClasificacion IS NULL OR pc.TipoClasificacion = @TipoClasificacion)

        UNION ALL

        SELECT a.Origen, p.ClasificacionPadreId,
               CAST(p.Descripcion + N' > ' + a.Camino AS NVARCHAR(1000))
        FROM Ancestros a
        JOIN dbo.Clasificaciones p ON p.ClasificacionId = a.ClasificacionPadreId
    )
    SELECT c.ClasificacionId, c.TipoClasificacion, c.Descripcion, c.Activo, a.Camino
    FROM Ancestros a
    JOIN dbo.Clasificaciones c ON c.ClasificacionId = a.Origen
    WHERE a.ClasificacionPadreId IS NULL      -- solo la fila que ya llegó a la raíz
    ORDER BY c.TipoClasificacion, a.Camino;
END
GO
