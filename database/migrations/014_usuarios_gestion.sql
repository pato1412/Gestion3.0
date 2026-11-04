/*
    014 - Usuarios propios para los establecimientos que trabajan con Ayres

    Los establecimientos en Simple Tempo validan el login contra Simple Tempo. Ayres no tiene API de
    usuarios, así que para PlataformaTempo = 'AY' los usuarios los administramos nosotros:
      - UsuariosGestion: un usuario por Email. Se registra desde Gestión 3.0 y no puede entrar hasta que
        un administrador lo aprueba en configuraciones-luz-azul. La clave se guarda solo como hash con sal
        (ClaveHash = pbkdf2-sha256$iteraciones$sal$hash), nunca se puede recuperar.
      - UsuariosGestionEstablecimientos: en qué establecimientos puede trabajar.

    UsuarioGestionId arranca en 1000000 para no confundirlo con los UsuarioId de Simple Tempo.
    Los permisos no están acá: siguen en PermisosGestion, por Email (por eso Email tiene el mismo largo).

    Se corre en ENSEMBLE. Se puede volver a correr: cada tabla se crea solo si no existe.
*/
SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.UsuariosGestion', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.UsuariosGestion (
        UsuarioGestionId INT IDENTITY(1000000, 1) NOT NULL CONSTRAINT PK_UsuariosGestion PRIMARY KEY,
        Email NVARCHAR(50) NOT NULL CONSTRAINT UQ_UsuariosGestion_Email UNIQUE,
        NombreCompleto NVARCHAR(100) NOT NULL,
        ClaveHash VARCHAR(200) NOT NULL,
        Aprobado BIT NOT NULL CONSTRAINT DF_UsuariosGestion_Aprobado DEFAULT (0),
        Activo BIT NOT NULL CONSTRAINT DF_UsuariosGestion_Activo DEFAULT (1),
        DebeCambiarClave BIT NOT NULL CONSTRAINT DF_UsuariosGestion_DebeCambiarClave DEFAULT (0),
        IntentosFallidos INT NOT NULL CONSTRAINT DF_UsuariosGestion_IntentosFallidos DEFAULT (0),
        BloqueadoHasta DATETIME NULL,
        EstablecimientoIdRegistro INT NOT NULL
            CONSTRAINT FK_UsuariosGestion_Establecimiento REFERENCES dbo.GWREstablecimientos (EstablecimientoId),
        FechaRegistro DATETIME NOT NULL CONSTRAINT DF_UsuariosGestion_FechaRegistro DEFAULT (GETDATE()),
        FechaAprobacion DATETIME NULL,
        AprobadoPor NVARCHAR(50) NULL
    );
    PRINT N'Tabla UsuariosGestion creada.';
END
GO

IF OBJECT_ID(N'dbo.UsuariosGestionEstablecimientos', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.UsuariosGestionEstablecimientos (
        UsuarioGestionId INT NOT NULL
            CONSTRAINT FK_UsuariosGestionEstablecimientos_Usuario REFERENCES dbo.UsuariosGestion (UsuarioGestionId) ON DELETE CASCADE,
        EstablecimientoId INT NOT NULL
            CONSTRAINT FK_UsuariosGestionEstablecimientos_Establecimiento REFERENCES dbo.GWREstablecimientos (EstablecimientoId),
        CONSTRAINT PK_UsuariosGestionEstablecimientos PRIMARY KEY (UsuarioGestionId, EstablecimientoId)
    );
    PRINT N'Tabla UsuariosGestionEstablecimientos creada.';
END
GO
