<#
  Instala una tarea programada de Windows que corre el agente de TikTok
  una vez al dia (por defecto a las 09:00) mientras tu usuario este logueado.

  Uso:
    powershell -ExecutionPolicy Bypass -File .\scripts\install-task.ps1
    powershell -ExecutionPolicy Bypass -File .\scripts\install-task.ps1 -Time "08:30"
#>
param(
  [string]$Time = "09:00"
)

$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$runner = Join-Path $scriptDir "run-agent.cmd"
$taskName = "TikTokMonitorAgent"

if (-not (Test-Path $runner)) {
  throw "No se encontro $runner"
}

schtasks /Create /TN $taskName /TR "`"$runner`"" /SC DAILY /ST $Time /F

Write-Host ""
Write-Host "Tarea '$taskName' programada diariamente a las $Time." -ForegroundColor Green
Write-Host "Correra solo mientras tu usuario de Windows este logueado en esta PC."
Write-Host "Para quitarla mas adelante: powershell -File .\scripts\uninstall-task.ps1"
