/*
    010 - Permisos de recepción de devoluciones y de administrador

    PermisosGestion tiene una fila por usuario (Email) y una columna BIT por permiso.
    Se agregan:
      - RecepcionDevoluciones: puede recibir las planillas de devolución de los locales y aprobar o
        rechazar cada producto (Stock > Recepción de devoluciones).
      - EsAdministrador: tiene todos los permisos del sistema, aunque las demás columnas estén en 0.

    Van NOT NULL con valor por defecto 0: la app de escritorio da de alta los usuarios con
    INSERT ... (Email) sin completar los permisos, y Ensemble los lee en un DTO con bool (un NULL
    hace que GetPermisosUsuarios devuelva vacío). Todos los usuarios existentes quedan en 0.

    Se corre en ENSEMBLE. Se puede volver a correr: cada columna se agrega solo si no existe.
    Después hay que publicar Ensemble (GetPermisosUsuarios devuelve los dos campos nuevos):
    si se publica antes de correr esta migración, la consulta falla y el endpoint devuelve vacío.

    Para dar los permisos (ejemplo):
        UPDATE dbo.PermisosGestion SET EsAdministrador = 1 WHERE Email = N'usuario@luz-azul.com.ar';
        UPDATE dbo.PermisosGestion SET RecepcionDevoluciones = 1 WHERE Email = N'deposito@luz-azul.com.ar';
*/
SET NOCOUNT ON;
GO

IF COL_LENGTH(N'dbo.PermisosGestion', N'RecepcionDevoluciones') IS NULL
BEGIN
    ALTER TABLE dbo.PermisosGestion ADD RecepcionDevoluciones BIT NOT NULL
        CONSTRAINT DF_PermisosGestion_RecepcionDevoluciones DEFAULT (0);
    PRINT N'Columna RecepcionDevoluciones agregada.';
END
GO

IF COL_LENGTH(N'dbo.PermisosGestion', N'EsAdministrador') IS NULL
BEGIN
    ALTER TABLE dbo.PermisosGestion ADD EsAdministrador BIT NOT NULL
        CONSTRAINT DF_PermisosGestion_EsAdministrador DEFAULT (0);
    PRINT N'Columna EsAdministrador agregada.';
END
GO
