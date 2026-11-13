/*
    Job del Agente de SQL Server: corre dbo.SincronizarProductosDesdeEMP001 (migración 016) cada 15 minutos.

    Temporal: mientras dure la migración a Ayres, los precios se siguen calculando en EMP001 y este job los
    trae a ENSEMBLE, de donde leen los webservices. Cuando se apague EMP001, borrarlo:
        EXEC msdb.dbo.sp_delete_job @job_name = N'Luz Azul - Sincronizar productos desde EMP001';

    Requisitos:
      - Correr DESPUÉS de la 016, con un usuario que pueda crear jobs (sysadmin o SQLAgentOperatorRole en msdb).
      - El servicio "Agente SQL Server" de la instancia tiene que estar iniciado y en inicio automático.
    Todo o nada: si falla algún paso no queda un job a medias. Si el job ya existe no hace nada.

    Ver cómo viene: historial del job en SSMS (Agente SQL Server > Trabajos > Ver historial): cada corrida
    guarda la línea "Productos: ... Pendientes para la próxima corrida: N".
    Correrlo a mano: EXEC msdb.dbo.sp_start_job @job_name = N'Luz Azul - Sincronizar productos desde EMP001';
*/
USE msdb;
GO

SET NOCOUNT ON;
SET XACT_ABORT ON;

IF OBJECT_ID(N'ENSEMBLE.dbo.SincronizarProductosDesdeEMP001', N'P') IS NULL
    THROW 50001, N'Falta la migración 016: no existe ENSEMBLE.dbo.SincronizarProductosDesdeEMP001.', 1;

IF EXISTS (SELECT 1 FROM msdb.dbo.sysjobs WHERE name = N'Luz Azul - Sincronizar productos desde EMP001')
BEGIN
    PRINT N'El job ya existía: no se cambió nada.';
    RETURN;
END

DECLARE @JobId UNIQUEIDENTIFIER, @rc INT;
BEGIN TRANSACTION;

EXEC @rc = msdb.dbo.sp_add_job
    @job_name = N'Luz Azul - Sincronizar productos desde EMP001',
    @description = N'Trae a ENSEMBLE los productos y precios de EMP001 (temporal hasta la migración a Ayres). Migración 016 de Gestion3.0.',
    @enabled = 1,
    @job_id = @JobId OUTPUT;
IF @rc <> 0 GOTO Error;

EXEC @rc = msdb.dbo.sp_add_jobstep
    @job_id = @JobId,
    @step_name = N'Sincronizar',
    @subsystem = N'TSQL',
    @database_name = N'ENSEMBLE',
    @command = N'EXEC dbo.SincronizarProductosDesdeEMP001;',
    @retry_attempts = 1,
    @retry_interval = 2;
IF @rc <> 0 GOTO Error;

EXEC @rc = msdb.dbo.sp_add_jobschedule
    @job_id = @JobId,
    @name = N'Cada 15 minutos',
    @freq_type = 4,             -- todos los días
    @freq_interval = 1,
    @freq_subday_type = 4,      -- en minutos
    @freq_subday_interval = 15,
    @active_start_time = 0;
IF @rc <> 0 GOTO Error;

EXEC @rc = msdb.dbo.sp_add_jobserver @job_id = @JobId, @server_name = N'(local)';
IF @rc <> 0 GOTO Error;

COMMIT TRANSACTION;
PRINT N'Job "Luz Azul - Sincronizar productos desde EMP001" creado: corre cada 15 minutos.';
RETURN;

Error:
IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
THROW 50002, N'No se pudo crear el job: no quedó nada a medias. Revisar el error anterior.', 1;
GO
