param(
  [string]$EnvPath = ".env.local"
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$sharedEnv = Join-Path $root $EnvPath
$logDir = Join-Path $root "tmp\dev-local-test"
$backendOutLog = Join-Path $logDir "backend.out.log"
$backendErrLog = Join-Path $logDir "backend.err.log"
$frontendOutLog = Join-Path $logDir "frontend.out.log"
$frontendErrLog = Join-Path $logDir "frontend.err.log"
$netstatExe = Join-Path $env:SystemRoot "System32\netstat.exe"
$taskkillExe = Join-Path $env:SystemRoot "System32\taskkill.exe"
$cmdExe = Join-Path $env:SystemRoot "System32\cmd.exe"

function Resolve-NpmCommand {
  $command = Get-Command "npm.cmd" -ErrorAction SilentlyContinue

  if ($command) {
    return $command.Source
  }

  $defaultPath = Join-Path $env:ProgramFiles "nodejs\npm.cmd"
  if (Test-Path -LiteralPath $defaultPath) {
    return $defaultPath
  }

  throw "npm.cmd was not found. Install Node.js or add npm.cmd to PATH."
}

$npmCmd = Resolve-NpmCommand

function New-NpmCmdArgument {
  param([string[]]$Arguments)

  $quotedNpm = "`"$npmCmd`""
  return "/d /c $quotedNpm $($Arguments -join ' ')"
}

function Import-EnvFile {
  param([string]$Path)

  if (-not (Test-Path -LiteralPath $Path)) {
    return
  }

  Get-Content -LiteralPath $Path -Encoding UTF8 | ForEach-Object {
    $line = $_.Trim()

    if (-not $line -or $line.StartsWith("#") -or -not $line.Contains("=")) {
      return
    }

    $key, $value = $line.Split("=", 2)
    [Environment]::SetEnvironmentVariable($key.Trim(), $value.Trim(), "Process")
  }
}

function Assert-PortAvailable {
  param(
    [int]$Port,
    [string]$Label
  )

  $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $Port)
  try {
    $listener.Start()
  }
  catch {
    $netstat = & $netstatExe -ano | Select-String ":$Port"
    $details = if ($netstat) { " Existing connections: $($netstat -join ' | ')" } else { "" }
    throw "$Label port $Port is already in use. Stop the existing server first, then run npm.cmd run dev:local-test again.$details"
  }
  finally {
    if ($listener) {
      $listener.Stop()
    }
  }
}

function Stop-ProcessTree {
  param([System.Diagnostics.Process]$Process)

  if ($Process -and -not $Process.HasExited) {
    Stop-Process -Id $Process.Id -Force -ErrorAction SilentlyContinue
    & $cmdExe /c "`"$taskkillExe`" /PID $($Process.Id) /T /F >nul 2>nul" | Out-Null
  }
}

function Get-ListeningProcessIds {
  param([int]$Port)

  $processIds = New-Object System.Collections.Generic.HashSet[int]

  foreach ($line in (& $netstatExe -ano | Select-String ":$Port")) {
    if ($line.Line -match "\sLISTENING\s+(\d+)\s*$") {
      [void]$processIds.Add([int]$Matches[1])
    }
  }

  return $processIds
}

function Stop-ProcessOnPort {
  param(
    [int]$Port,
    [string]$Label,
    [System.Collections.Generic.HashSet[int]]$BaselineProcessIds
  )

  foreach ($processId in (Get-ListeningProcessIds -Port $Port)) {
    if ($BaselineProcessIds -and $BaselineProcessIds.Contains($processId)) {
      continue
    }

    Write-Host "Stopping remaining $Label process on port $Port (PID $processId)."
    Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
    & $cmdExe /c "`"$taskkillExe`" /PID $processId /T /F >nul 2>nul" | Out-Null
  }
}

function Wait-PortListening {
  param(
    [int]$Port,
    [string]$Label,
    [string]$ErrorLog,
    [System.Collections.Generic.HashSet[int]]$BaselineProcessIds,
    [int]$TimeoutSeconds = 15
  )

  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)

  while ((Get-Date) -lt $deadline) {
    foreach ($processId in (Get-ListeningProcessIds -Port $Port)) {
      if (-not $BaselineProcessIds -or -not $BaselineProcessIds.Contains($processId)) {
        return
      }
    }

    Start-Sleep -Milliseconds 500
  }

  $logHint = if (Test-Path -LiteralPath $ErrorLog) { " Check $ErrorLog for details." } else { "" }
  throw "$Label server did not start listening on port $Port within $TimeoutSeconds seconds.$logHint"
}

Import-EnvFile -Path $sharedEnv

$backendPort = 8080
if ($env:LOCAL_BACKEND_PORT) {
  $backendPort = [int]$env:LOCAL_BACKEND_PORT
}
elseif ($env:PORT) {
  $backendPort = [int]$env:PORT
}

$frontendPort = 3000
if ($env:LOCAL_FRONTEND_PORT) {
  $frontendPort = [int]$env:LOCAL_FRONTEND_PORT
}
elseif ($env:FRONTEND_PORT) {
  $frontendPort = [int]$env:FRONTEND_PORT
}

Assert-PortAvailable -Port $backendPort -Label "Backend"
Assert-PortAvailable -Port $frontendPort -Label "Frontend"
$baselineFrontendPids = Get-ListeningProcessIds -Port $frontendPort
$baselineBackendPids = Get-ListeningProcessIds -Port $backendPort

New-Item -ItemType Directory -Force -Path $logDir | Out-Null
Remove-Item -LiteralPath $backendOutLog, $backendErrLog, $frontendOutLog, $frontendErrLog -ErrorAction SilentlyContinue

Write-Host "Building backend before local test start..."
& $cmdExe /d /c "`"$npmCmd`" --prefix backend run build"

$backend = Start-Process `
  -FilePath $cmdExe `
  -ArgumentList (New-NpmCmdArgument -Arguments @("--prefix", "backend", "run", "start")) `
  -WorkingDirectory $root `
  -WindowStyle Hidden `
  -RedirectStandardOutput $backendOutLog `
  -RedirectStandardError $backendErrLog `
  -PassThru

$frontend = Start-Process `
  -FilePath $cmdExe `
  -ArgumentList (New-NpmCmdArgument -Arguments @("run", "dev:frontend")) `
  -WorkingDirectory $root `
  -WindowStyle Hidden `
  -RedirectStandardOutput $frontendOutLog `
  -RedirectStandardError $frontendErrLog `
  -PassThru

try {
  Wait-PortListening -Port $backendPort -Label "Backend" -ErrorLog $backendErrLog -BaselineProcessIds $baselineBackendPids
  Wait-PortListening -Port $frontendPort -Label "Frontend" -ErrorLog $frontendErrLog -BaselineProcessIds $baselineFrontendPids

  Write-Host "Local test servers are running."
  Write-Host "Frontend: http://localhost:$frontendPort/login/"
  Write-Host "Backend:  http://localhost:$backendPort/api/health"
  Write-Host "Logs:     $logDir"
  Write-Host "Press Enter to stop both servers."
  Read-Host | Out-Null
}
finally {
  Stop-ProcessTree -Process $frontend
  Stop-ProcessTree -Process $backend
  Stop-ProcessOnPort -Port $frontendPort -Label "frontend" -BaselineProcessIds $baselineFrontendPids
  Stop-ProcessOnPort -Port $backendPort -Label "backend" -BaselineProcessIds $baselineBackendPids
}
