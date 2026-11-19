/*
    018 - Lista de precios de cada establecimiento en GWREstablecimientos.ListaPrecioId

    Hasta ahora WSMaestros sacaba la lista de precios del local de EMP001: buscaba el cliente de Tempo ERP
    que tenía el establecimiento en un contacto tipo 6 (RelClientesContactos.Celular) y usaba su
    Clientes.ListaPrecioId. Si no encontraba cliente, usaba la 8 (Franquicias). Como EMP001 se va a apagar,
    la lista pasa a ser un dato del establecimiento en ENSEMBLE.

    Qué hace, en una transacción:
      - Agrega GWREstablecimientos.ListaPrecioId INT NOT NULL, con valor por defecto 8 (Franquicias, la
        misma que usaba el webservice cuando no encontraba cliente) y clave foránea a dbo.ListasPrecios.
      - La carga con la lista que hoy tiene cada local en EMP001, así los precios no cambian. Los locales
        sin cliente en EMP001 quedan con la 8.

    ORDEN: correrla ANTES de publicar WSMaestros y Ensemble con la columna nueva. Las versiones actuales
    no la usan, así que correrla primero no rompe nada.
    Necesita EMP001 en la instancia solo para la carga inicial: correrla antes de apagarla.

    Se corre en ENSEMBLE, después de la 005 (ListasPrecios). Se puede volver a correr: si la columna ya
    existe no hace nada, para no pisar las listas cambiadas después.
*/
SET NOCOUNT ON;
SET XACT_ABORT ON;
GO

IF OBJECT_ID(N'dbo.GWREstablecimientos', N'U') IS NULL
    THROW 50001, N'No existe dbo.GWREstablecimientos: correr la migración en ENSEMBLE.', 1;

IF OBJECT_ID(N'dbo.ListasPrecios', N'U') IS NULL
    THROW 50001, N'Falta la migración 005: no existe dbo.ListasPrecios en ENSEMBLE.', 1;

IF COL_LENGTH(N'dbo.GWREstablecimientos', N'ListaPrecioId') IS NOT NULL
BEGIN
    PRINT N'GWREstablecimientos ya tiene la columna ListaPrecioId: no se cambió nada.';
    RETURN;
END

IF DB_ID(N'EMP001') IS NULL
    THROW 50002, N'No se encuentra la base EMP001: hace falta para cargar la lista actual de cada local.', 1;

IF NOT EXISTS (SELECT 1 FROM dbo.ListasPrecios WHERE ListaPrecioId = 8)
    THROW 50003, N'No existe la lista de precios 8 (Franquicias) en ENSEMBLE: no se cambió nada.', 1;

-- Una lista que esté en EMP001 y no en ENSEMBLE haría fallar la clave foránea: mejor cortar y revisarlo.
IF EXISTS (SELECT 1
           FROM dbo.GWREstablecimientos E
           JOIN EMP001.dbo.RelClientesContactos RCC ON RCC.TipoContactoClienteId = 6
                                                   AND RCC.Celular = CAST(E.EstablecimientoId AS VARCHAR(20))
           JOIN EMP001.dbo.Clientes C ON C.ClienteId = RCC.ClienteId
           WHERE C.ListaPrecioId IS NOT NULL
             AND NOT EXISTS (SELECT 1 FROM dbo.ListasPrecios L WHERE L.ListaPrecioId = C.ListaPrecioId))
    THROW 50004, N'Algún local tiene en EMP001 una lista de precios que no existe en ENSEMBLE: correr la sincronización de productos y volver a intentar.', 1;

-- Un local con varios clientes en EMP001 con listas distintas: no se sabe cuál corresponde.
IF EXISTS (SELECT 1
           FROM dbo.GWREstablecimientos E
           JOIN EMP001.dbo.RelClientesContactos RCC ON RCC.TipoContactoClienteId = 6
                                                   AND RCC.Celular = CAST(E.EstablecimientoId AS VARCHAR(20))
           JOIN EMP001.dbo.Clientes C ON C.ClienteId = RCC.ClienteId
           WHERE C.ListaPrecioId IS NOT NULL
           GROUP BY E.EstablecimientoId
           HAVING COUNT(DISTINCT C.ListaPrecioId) > 1)
    THROW 50005, N'Algún local tiene en EMP001 varios clientes con listas de precios distintas: revisarlo antes de correr la migración.', 1;

BEGIN TRANSACTION;

ALTER TABLE dbo.GWREstablecimientos
    ADD ListaPrecioId INT NOT NULL
        CONSTRAINT DF_GWREstablecimientos_ListaPrecioId DEFAULT (8);

-- La columna recién creada no existe al compilar el lote: el resto va por sp_executesql.
EXEC sys.sp_executesql N'
    UPDATE E SET E.ListaPrecioId = X.ListaPrecioId
    FROM dbo.GWREstablecimientos E
    JOIN (SELECT CAST(RCC.Celular AS INT) AS EstablecimientoId, MAX(C.ListaPrecioId) AS ListaPrecioId
          FROM EMP001.dbo.RelClientesContactos RCC
          JOIN EMP001.dbo.Clientes C ON C.ClienteId = RCC.ClienteId
          WHERE RCC.TipoContactoClienteId = 6
            AND TRY_CAST(RCC.Celular AS INT) IS NOT NULL
            AND C.ListaPrecioId IS NOT NULL
          GROUP BY CAST(RCC.Celular AS INT)) X ON X.EstablecimientoId = E.EstablecimientoId;

    ALTER TABLE dbo.GWREstablecimientos
        ADD CONSTRAINT FK_GWREstablecimientos_ListasPrecios
            FOREIGN KEY (ListaPrecioId) REFERENCES dbo.ListasPrecios (ListaPrecioId);';

COMMIT TRANSACTION;

DECLARE @Resumen NVARCHAR(MAX) = N'';
EXEC sys.sp_executesql N'
    SELECT @Resumen += CHAR(13) + CHAR(10) + N''  '' + CAST(E.ListaPrecioId AS NVARCHAR(10)) + N'' '' + L.Descripcion
                     + N'': '' + CAST(COUNT(*) AS NVARCHAR(10)) + CASE WHEN COUNT(*) = 1 THEN N'' local'' ELSE N'' locales'' END
    FROM dbo.GWREstablecimientos E
    JOIN dbo.ListasPrecios L ON L.ListaPrecioId = E.ListaPrecioId
    GROUP BY E.ListaPrecioId, L.Descripcion
    ORDER BY COUNT(*) DESC;', N'@Resumen NVARCHAR(MAX) OUTPUT', @Resumen = @Resumen OUTPUT;

PRINT N'GWREstablecimientos.ListaPrecioId agregada y cargada desde EMP001:' + @Resumen;
GO
