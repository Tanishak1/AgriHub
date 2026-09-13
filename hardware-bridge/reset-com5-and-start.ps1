param(
    [string]$Port = "COM5",
    [int]$WaitSeconds = 5
)

$ErrorActionPreference = 'Stop'

Write-Host "====================================================" -ForegroundColor Cyan
Write-Host " AgriHub COM5 reset and bridge launcher " -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "Target port: $Port" -ForegroundColor Yellow

# 1) Kill common blockers
$killList = @(
    'ArduinoIDE', 'arduino', 'putty', 'teraterm', 'RealTerm', 'sscom',
    'node', 'python', 'python3'
)

foreach ($name in $killList) {
    try {
        Get-Process $name -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
        Write-Host "Stopped $name" -ForegroundColor DarkGray
    } catch {
        # ignore missing process
    }
}

# 2) Remove COM port from Windows device state by uninstalling the USB serial device if present
$device = Get-CimInstance Win32_PnPEntity | Where-Object {
    $_.Name -match 'COM5|USB Serial|Arduino|ESP32|CH9102' -or $_.PNPDeviceID -match 'VID_1A86|VID_10C4|VID_2341'
}

if ($device) {
    Write-Host "Found matching USB serial device. Preparing reset..." -ForegroundColor Yellow
    $device | Select-Object Name, DeviceID, PNPDeviceID | Format-List

    $instanceId = $device.PNPDeviceID
    try {
        pnputil /remove-device $instanceId 2>$null | Out-Null
        Write-Host "Requested device removal for $instanceId" -ForegroundColor Yellow
    } catch {
        Write-Host "pnputil remove-device failed, continuing..." -ForegroundColor DarkYellow
    }
} else {
    Write-Host "No matching COM5 device found in current PnP list." -ForegroundColor DarkYellow
}

Write-Host "Unplugging the ESP32 USB cable now..." -ForegroundColor Yellow
Write-Host "Please wait 5 seconds..." -ForegroundColor Yellow
Start-Sleep -Seconds $WaitSeconds

Write-Host "Reconnect the ESP32 USB cable now." -ForegroundColor Yellow
Start-Sleep -Seconds $WaitSeconds

# 3) Check port status
Write-Host "Checking COM5 availability..." -ForegroundColor Yellow
$available = $false
for ($i = 1; $i -le 10; $i++) {
    try {
        mode $Port 2>$null
        $available = $true
        break
    } catch {
        Start-Sleep -Seconds 1
    }
}

if (-not $available) {
    Write-Host "COM5 is still unavailable. Please restart Windows and retry." -ForegroundColor Red
    exit 1
}

Write-Host "COM5 is available. Starting AgriHub bridge..." -ForegroundColor Green
Set-Location (Join-Path $PSScriptRoot '.')
npm run dev
