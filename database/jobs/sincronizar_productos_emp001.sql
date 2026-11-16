/*
    Job del Agente de SQL Server: corre dbo.SincronizarProductosDesdeEMP001 (migración 016) cada 6 horas
    (00:00, 06:00, 12:00 y 18:00). Los cambios de productos y precios en EMP001 son muy eventuales.

    Temporal: mientras dure la migración a Ayres, los precios se siguen calculando en EMP001 y este job los
    trae a ENSEMBLE, de donde leen los webservices. Cuando se apague EMP001, borrarlo:
        EXEC msdb.dbo.sp_delete_job @job_name = N'Luz Azul - Sincronizar productos desde EMP001';

    Requisitos:
      - Correr DESPUÉS de la 016, con un usuario que pueda crear jobs (sysadmin o SQLAgentOperatorRole en msdb).
      - El servicio "Agente SQL Server" de la instancia tiene que estar iniciado y en inicio automático.
    Se puede correr más de una vez: si el job no existe lo crea; si ya existe solo le deja la frecuencia en
    cada 6 horas. Todo o nada: si falla algún paso no queda nada a medias.

    Ver cómo viene: historial del job en SSMS (Agente SQL Server > Trabajos > Ver historial): cada corrida
    guarda la línea "Productos: ... Pendientes para la próxima corrida: N".
    Si se cambió algo en EMP001 y se necesita ya en ENSEMBLE, correrlo a mano:
        EXEC msdb.dbo.sp_start_job @job_name = N'Luz Azul - Sincronizar productos desde EMP001';
*/
USE msdb;
GO

SET NOCOUNT ON;
SET XACT_ABORT ON;

IF OBJECT_ID(N'ENSEMBLE.dbo.SincronizarProductosDesdeEMP001', N'P') IS NULL
    THROW 50001, N'Falta la migración 016: no existe ENSEMBLE.dbo.SincronizarProductosDesdeEMP001.', 1;

DECLARE @JobId UNIQUEIDENTIFIER, @ScheduleId INT, @rc INT;

SELECT @JobId = job_id FROM msdb.dbo.sysjobs WHERE name = N'Luz Azul - Sincronizar productos desde EMP001';

BEGIN TRANSACTION;

IF @JobId IS NULL
BEGIN
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

    EXEC @rc = msdb.dbo.sp_add_jobserver @job_id = @JobId, @server_name = N'(local)';
    IF @rc <> 0 GOTO Error;
END

-- La programación que ya tenga el job (la versión anterior de este script creaba "Cada 15 minutos").
SELECT TOP (1) @ScheduleId = schedule_id
FROM msdb.dbo.sysjobschedules
WHERE job_id = @JobId
ORDER BY schedule_id;

IF @ScheduleId IS NULL
BEGIN
    EXEC @rc = msdb.dbo.sp_add_jobschedule
        @job_id = @JobId,
        @name = N'Cada 6 horas',
        @freq_type = 4,             -- todos los días
        @freq_interval = 1,
        @freq_subday_type = 8,      -- en horas
        @freq_subday_interval = 6,
        @active_start_time = 0;     -- desde las 00:00
    IF @rc <> 0 GOTO Error;
END
ELSE
BEGIN
    EXEC @rc = msdb.dbo.sp_update_schedule
        @schedule_id = @ScheduleId,
        @new_name = N'Cada 6 horas',
        @enabled = 1,
        @freq_type = 4,
        @freq_interval = 1,
        @freq_subday_type = 8,
        @freq_subday_interval = 6,
        @active_start_time = 0;
    IF @rc <> 0 GOTO Error;
END

COMMIT TRANSACTION;
PRINT N'Job "Luz Azul - Sincronizar productos desde EMP001" listo: corre cada 6 horas (00:00, 06:00, 12:00 y 18:00).';
RETURN;

Error:
IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
THROW 50002, N'No se pudo crear o actualizar el job: no quedó nada a medias. Revisar el error anterior.', 1;
GO
