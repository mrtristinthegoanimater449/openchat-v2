<#
  watch-tunnel.ps1 — keeps the OpenChat V2 public URL alive 24/7.

  Runs the local HTTP server and Cloudflare quick tunnel, and updates
  cloudflared_link.json in this repo so all clients (APK / PKG / EXE / IPA)
  pick up the current URL on next launch.

  Requirements:
    - GITHUB_TOKEN env var with Contents:write on repo OpenChat-Deployment
      (or the one you point $RepoUser/$RepoName at below)
    - Python on PATH (to run server.py if it dies)
    - Internet access to Cloudflare

  Schedule:
    schtasks /Create /SC MINUTE /MO 2 /TN "OpenChatWatchTunnel" /TR "powershell -NoProfile -ExecutionPolicy Bypass -File C:\path\to\openchat-v2\watch-tunnel.ps1"
#>

$ErrorActionPreference = 'Continue'

$RepoUser = 'mrtristinthegoanimater449'
$RepoName = 'openchat-v2'
$RepoBranch = 'main'
$LinkPath = 'cloudflared_link.json'
$LocalApi = 'http://localhost:3000'
$ScriptDir = $PSScriptRoot

$cloudflaredExe = Join-Path $ScriptDir 'tools\cloudflared.exe'
$tunnelLog = Join-Path $ScriptDir 'tools\tunnel.log'
$linkFile = Join-Path $ScriptDir 'cloudflared_link.json'
$watchLog = Join-Path $ScriptDir 'watch-tunnel.log'

function Log($msg) {
  $line = "[{0:yyyy-MM-dd HH:mm:ss}] {1}" -f (Get-Date), $msg
  Write-Output $line
  Add-Content -Path $watchLog -Value $line
}

function Invoke-WithRetry($fn, $retries = 2, $delay = 2) {
  for ($i = 0; $i -le $retries; $i++) {
    try { return & $fn } catch {
      if ($i -eq $retries) { throw }
      Start-Sleep -Seconds $delay
    }
  }
}

# ---------- 1. ensure local HTTP server ----------
function Test-LocalServer {
  try { return (Invoke-RestMethod "$LocalApi/api/health" -TimeoutSec 4).ok -eq $true } catch { return $false }
}

function Start-LocalServer {
  Log 'local server down — starting python server.py'
  Start-Process -FilePath 'python' -ArgumentList 'server.py' -WorkingDirectory $ScriptDir -NoNewWindow
  Start-Sleep -Seconds 4
  for ($i = 0; $i -lt 10; $i++) { if (Test-LocalServer) { return $true }; Start-Sleep -Seconds 2 }
  return $false
}

# ---------- 2. read current tunnel URL ----------
function Get-CurrentUrl {
  try {
    $json = Get-Content $linkFile -Raw | ConvertFrom-Json
    return "$($json.url)".TrimEnd('/')
  } catch { return $null }
}

function Test-Tunnel($url) {
  if (-not $url) { return $false }
  try { (Invoke-WebRequest "$url/api/health" -UseBasicParsing -TimeoutSec 8) | Out-Null; return $true } catch { return $false }
}

# ---------- 3. (re)start cloudflared ----------
function Ensure-Cloudflared {
  if (Test-Path $cloudflaredExe) { return $true }
  $tools = Join-Path $ScriptDir 'tools'
  if (-not (Test-Path $tools)) { New-Item -ItemType Directory -Path $tools | Out-Null }
  Log 'downloading cloudflared ...'
  try {
    Invoke-WebRequest -Uri 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe' -OutFile $cloudflaredExe -UseBasicParsing
    return $true
  } catch { Log "download failed: $_"; return $false }
}

function Start-Tunnel {
  if (-not (Ensure-Cloudflared)) { return $null }

  # kill any existing cloudflared
  Get-Process -Name 'cloudflared' -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
  Start-Sleep -Seconds 2

  Remove-Item $tunnelLog -ErrorAction SilentlyContinue
  Start-Process -FilePath $cloudflaredExe -ArgumentList "tunnel --url $LocalApi" -RedirectStandardOutput $tunnelLog -RedirectStandardError "$tunnelLog.err" -NoNewWindow

  # wait up to 60s for trycloudflare.com URL
  $deadline = (Get-Date).AddSeconds(60)
  while ((Get-Date) -lt $deadline) {
    Start-Sleep -Seconds 2
    if (Test-Path $tunnelLog) {
      $content = Get-Content $tunnelLog -Raw
      if ($content -match 'https://[a-z0-9-]+\.trycloudflare\.com') {
        return ($matches[0]).TrimEnd('/')
      }
    }
    if (Test-Path "$tunnelLog.err") {
      $content = Get-Content "$tunnelLog.err" -Raw
      if ($content -match 'https://[a-z0-9-]+\.trycloudflare\.com') {
        return ($matches[0]).TrimEnd('/')
      }
    }
  }
  return $null
}

# ---------- 4. update repo file via GitHub Contents API ----------
function Update-RepoFile($url) {
  if (-not $env:GITHUB_TOKEN) { Log 'GITHUB_TOKEN not set — skipping repo update'; return $false }

  $now = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ')
  $body = @{ url = $url; updatedAt = $now; note = 'Auto-updated by watch-tunnel.ps1 on restart of the Cloudflare quick tunnel.' } | ConvertTo-Json -Compress
  $bytes = [System.Text.Encoding]::UTF8.GetBytes($body)
  $content = [Convert]::ToBase64String($bytes)

  $headers = @{
    Authorization = "Bearer $env:GITHUB_TOKEN"
    Accept = 'application/vnd.github+json'
    'X-GitHub-Api-Version' = '2022-11-28'
  }

  # get sha
  $getUrl = "https://api.github.com/repos/$RepoUser/$RepoName/contents/$LinkPath"
  try {
    $resp = Invoke-RestMethod -Uri $getUrl -Headers $headers -Method Get -ErrorAction Stop
    $sha = $resp.sha
  } catch { $sha = $null }

  $payload = @{
    message = "chore: update cloudflared_link.json -> $url"
    content = $content
    branch  = $RepoBranch
  }
  if ($sha) { $payload.sha = $sha }
  $json = $payload | ConvertTo-Json -Compress

  try {
    Invoke-RestMethod -Uri $getUrl -Headers $headers -Method Put -Body $json -ContentType 'application/json' -ErrorAction Stop | Out-Null
    Log "repo updated with $url"
    return $true
  } catch { Log "GitHub update failed: $_"; return $false }
}

# ---------- main ----------
Log 'watch-tunnel tick'

if (-not (Test-LocalServer)) {
  if (-not (Start-LocalServer)) { Log 'FATAL: local server failed to start'; exit 1 }
}

$currentUrl = Get-CurrentUrl

if (Test-Tunnel $currentUrl) {
  Log "tunnel OK: $currentUrl"
  exit 0
}

Log 'tunnel is DOWN — restarting'
$newUrl = Start-Tunnel

if (-not $newUrl) { Log 'FATAL: tunnel failed to start'; exit 1 }

# write local file
@{ url = $newUrl; updatedAt = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ') } |
  ConvertTo-Json -Compress | Set-Content $linkFile -Encoding utf8

# update GitHub (best effort)
Update-RepoFile $newUrl | Out-Null

Log "tunnel restarted: $newUrl"
