param(
  [string]$BackendEnvPath = "backend\.env.local"
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$backendEnv = Join-Path $root $BackendEnvPath

function Import-EnvFile {
  param([string]$Path)

  if (-not (Test-Path -LiteralPath $Path)) {
    return
  }

  Get-Content -LiteralPath $Path | ForEach-Object {
    $line = $_.Trim()

    if (-not $line -or $line.StartsWith("#") -or -not $line.Contains("=")) {
      return
    }

    $key, $value = $line.Split("=", 2)
    [Environment]::SetEnvironmentVariable($key.Trim(), $value.Trim(), "Process")
  }
}

Import-EnvFile -Path $backendEnv

$backend = Start-Process `
  -FilePath "npm.cmd" `
  -ArgumentList @("run", "dev:backend") `
  -WorkingDirectory $root `
  -WindowStyle Hidden `
  -PassThru

try {
  npm.cmd run dev:frontend
}
finally {
  if ($backend -and -not $backend.HasExited) {
    Stop-Process -Id $backend.Id
  }
}
