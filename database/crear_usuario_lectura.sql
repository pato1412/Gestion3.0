/*
    Usuario de SQL Server de solo lectura para consultar ENSEMBLE y EMP001 de una instancia (el que usa sql.ps1).

    Lo corre un administrador (sa o equivalente) en la instancia donde se quiera dar acceso, por ejemplo
    server-luz-azul\PROPIONICO. Antes de correrlo, reemplazar <CLAVE> por una clave fuerte (y guardarla en
    conexion.env, que no se versiona). No dejar la clave escrita en este archivo.

    Qué da:
      - Login de SQL Server con política de claves.
      - En ENSEMBLE y EMP001: db_datareader (leer todas las tablas y vistas) y VIEW DEFINITION (ver la
        definición de vistas y procedimientos, para revisar estructura). Nada de escritura ni de ejecución.
    Se puede volver a correr: crea solo lo que falta (si el login ya existe, no le cambia la clave).
*/
SET NOCOUNT ON;
GO

DECLARE @Login SYSNAME = N'claude_user';
DECLARE @Clave NVARCHAR(128) = N'<CLAVE>';

IF @Clave = N'<CLAVE>' OR LEN(@Clave) < 12
    THROW 50001, N'Reemplazá <CLAVE> por una clave de al menos 12 caracteres antes de correr el script.', 1;

IF SUSER_ID(@Login) IS NULL
BEGIN
    DECLARE @sql NVARCHAR(MAX) = N'CREATE LOGIN ' + QUOTENAME(@Login) + N' WITH PASSWORD = ' + QUOTENAME(@Clave, '''')
        + N', DEFAULT_DATABASE = [ENSEMBLE], CHECK_POLICY = ON, CHECK_EXPIRATION = OFF;';
    EXEC (@sql);
    PRINT N'Login ' + @Login + N' creado.';
END
ELSE
    PRINT N'El login ' + @Login + N' ya existía: no se le cambió la clave.';

-- Usuario en cada base, con lectura y vista de definiciones
DECLARE @Base SYSNAME;
DECLARE bases CURSOR LOCAL FAST_FORWARD FOR
    SELECT name FROM sys.databases WHERE name IN (N'ENSEMBLE', N'EMP001') AND state_desc = N'ONLINE';
OPEN bases;
FETCH NEXT FROM bases INTO @Base;
WHILE @@FETCH_STATUS = 0
BEGIN
    -- EXEC (...) no admite funciones adentro: cada sentencia se arma antes en @s
    DECLARE @enBase NVARCHAR(MAX) = N'
        DECLARE @s NVARCHAR(400);
        IF DATABASE_PRINCIPAL_ID(@Login) IS NULL
        BEGIN
            SET @s = N''CREATE USER '' + QUOTENAME(@Login) + N'' FOR LOGIN '' + QUOTENAME(@Login) + N'';'';
            EXEC (@s);
        END
        IF IS_ROLEMEMBER(N''db_datareader'', @Login) = 0
        BEGIN
            SET @s = N''ALTER ROLE db_datareader ADD MEMBER '' + QUOTENAME(@Login) + N'';'';
            EXEC (@s);
        END
        SET @s = N''GRANT VIEW DEFINITION TO '' + QUOTENAME(@Login) + N'';'';
        EXEC (@s);';
    DECLARE @exec NVARCHAR(300) = QUOTENAME(@Base) + N'.sys.sp_executesql';
    BEGIN TRY
        EXEC @exec @enBase, N'@Login SYSNAME', @Login = @Login;
    END TRY
    BEGIN CATCH
        DECLARE @Error NVARCHAR(2048) = N'No se pudo dar acceso en ' + @Base + N': ' + ERROR_MESSAGE();
        THROW 50002, @Error, 1;
    END CATCH
    PRINT N'Usuario de solo lectura listo en ' + @Base + N'.';
    FETCH NEXT FROM bases INTO @Base;
END
CLOSE bases;
DEALLOCATE bases;
GO
