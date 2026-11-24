<#
.SYNOPSIS
    Ejecuta una consulta o un archivo .sql en el servidor, con los datos de conexion.env.

.DESCRIPTION
    La clave se pasa a sqlcmd por la variable de entorno SQLCMDPASSWORD y se borra al
    terminar: no queda en la línea de comandos ni en el historial.

.PARAMETER Base
    Ensemble = base propia (ENSEMBLE).
    Tempo    = base del ERP viejo (EMP001, TEMPO_ERP).

.PARAMETER Instancia
    LuzAzul    = nuestra instancia (por defecto). Claves SQL_* de conexion.env.
    Propionico = instancia del franquiciado Propionico. Claves PROPIONICO_SQL_* de conexion.env.

.EXAMPLE
    .\database\sql.ps1 -Base Tempo -Query "SELECT name FROM sys.tables ORDER BY name"

.EXAMPLE
    .\database\sql.ps1 -Base Ensemble -Archivo .\database\migrations\001_clasificaciones_tablas.sql

.EXAMPLE
    .\database\sql.ps1 -Instancia Propionico -Base Ensemble -Archivo .\database\diagnostico_ensemble.sql
#>
param(
    [Parameter(Mandatory = $true)]
    [ValidateSet('Ensemble', 'Tempo')]
    [string]$Base,

    [ValidateSet('LuzAzul', 'Propionico')]
    [string]$Instancia = 'LuzAzul',

    [string]$Query,

    [string]$Archivo
)

$ErrorActionPreference = 'Stop'

if ([string]::IsNullOrWhiteSpace($Query) -eq [string]::IsNullOrWhiteSpace($Archivo)) {
    throw 'Indicá -Query o -Archivo (uno de los dos).'
}

$conexionPath = Join-Path $PSScriptRoot 'conexion.env'
if (-not (Test-Path $conexionPath)) {
    throw "No existe $conexionPath. Copiá conexion.env.example como conexion.env y completalo."
}

$cfg = @{}
foreach ($linea in Get-Content $conexionPath -Encoding UTF8) {
    $linea = $linea.Trim()
    if ($linea -and -not $linea.StartsWith('#') -and $linea.Contains('=')) {
        $partes = $linea.Split('=', 2)
        $cfg[$partes[0].Trim()] = $partes[1].Trim()
    }
}

# Cada instancia tiene sus claves: SQL_* (LuzAzul) o PROPIONICO_SQL_* (Propionico)
$prefijo = if ($Instancia -eq 'LuzAzul') { '' } else { $Instancia.ToUpper() + '_' }

foreach ($clave in 'SQL_SERVER', 'SQL_USER', 'SQL_PASSWORD', 'SQL_DB_ENSEMBLE', 'SQL_DB_TEMPO') {
    if ([string]::IsNullOrWhiteSpace($cfg[$prefijo + $clave])) {
        throw "Falta completar $prefijo$clave en conexion.env."
    }
}

$baseDatos = if ($Base -eq 'Ensemble') { $cfg[$prefijo + 'SQL_DB_ENSEMBLE'] } else { $cfg[$prefijo + 'SQL_DB_TEMPO'] }

# -b: corta ante el primer error; -l: segundos de espera para conectar; -f 65001: archivos en UTF-8
$sqlcmdArgs = @('-S', $cfg[$prefijo + 'SQL_SERVER'], '-U', $cfg[$prefijo + 'SQL_USER'], '-d', $baseDatos, '-b', '-l', '15', '-f', '65001')
if ($cfg[$prefijo + 'SQL_TRUST_CERT'] -eq '1') { $sqlcmdArgs += '-C' }

if ($Query) {
    $sqlcmdArgs += @('-Q', $Query)
} else {
    $sqlcmdArgs += @('-i', (Resolve-Path $Archivo).Path)
}

$env:SQLCMDPASSWORD = $cfg[$prefijo + 'SQL_PASSWORD']
try {
    & sqlcmd @sqlcmdArgs
    exit $LASTEXITCODE
} finally {
    Remove-Item Env:SQLCMDPASSWORD -ErrorAction SilentlyContinue
}
