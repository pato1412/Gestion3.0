<#
.SYNOPSIS
    Ejecuta una consulta o un archivo .sql en el servidor, con los datos de conexion.env.

.DESCRIPTION
    La clave se pasa a sqlcmd por la variable de entorno SQLCMDPASSWORD y se borra al
    terminar: no queda en la línea de comandos ni en el historial.

.PARAMETER Base
    Ensemble = base propia de Luz Azul (todos los proyectos).
    Tempo    = EMP001, base del ERP viejo (TEMPO_ERP).

.EXAMPLE
    .\database\sql.ps1 -Base Tempo -Query "SELECT name FROM sys.tables ORDER BY name"

.EXAMPLE
    .\database\sql.ps1 -Base Ensemble -Archivo .\database\migrations\001_clasificaciones_tablas.sql
#>
param(
    [Parameter(Mandatory = $true)]
    [ValidateSet('Ensemble', 'Tempo')]
    [string]$Base,

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

foreach ($clave in 'SQL_SERVER', 'SQL_USER', 'SQL_PASSWORD', 'SQL_DB_ENSEMBLE', 'SQL_DB_TEMPO') {
    if ([string]::IsNullOrWhiteSpace($cfg[$clave])) {
        throw "Falta completar $clave en conexion.env."
    }
}

$baseDatos = if ($Base -eq 'Ensemble') { $cfg['SQL_DB_ENSEMBLE'] } else { $cfg['SQL_DB_TEMPO'] }

# -b: corta ante el primer error; -l: segundos de espera para conectar; -f 65001: archivos en UTF-8
$sqlcmdArgs = @('-S', $cfg['SQL_SERVER'], '-U', $cfg['SQL_USER'], '-d', $baseDatos, '-b', '-l', '15', '-f', '65001')
if ($cfg['SQL_TRUST_CERT'] -eq '1') { $sqlcmdArgs += '-C' }

if ($Query) {
    $sqlcmdArgs += @('-Q', $Query)
} else {
    $sqlcmdArgs += @('-i', (Resolve-Path $Archivo).Path)
}

$env:SQLCMDPASSWORD = $cfg['SQL_PASSWORD']
try {
    & sqlcmd @sqlcmdArgs
    exit $LASTEXITCODE
} finally {
    Remove-Item Env:SQLCMDPASSWORD -ErrorAction SilentlyContinue
}
