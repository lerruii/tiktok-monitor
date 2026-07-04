<#
  Elimina la tarea programada instalada por install-task.ps1
#>
$taskName = "TikTokMonitorAgent"
schtasks /Delete /TN $taskName /F
Write-Host "Tarea '$taskName' eliminada." -ForegroundColor Yellow
