param(
    [string]$Port = "COM5",
    [int]$WaitSeconds = 3
)

$ErrorActionPreference = 'Stop'

Write-Host "====================================================" -ForegroundColor Cyan
Write-Host " AgriHub hardware bridge launcher " -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "Port: $Port" -ForegroundColor Yellow

# Stop common serial-monitor apps that often keep COM ports open
$serialProcessNames = @(
    'ArduinoIDE', 'arduino', 'putty', 'teraterm', 'RealTerm', 'sscom',
    'TeraTerm', 'putty.exe', 'teraterm.exe', 'RealTerm.exe'
)

foreach ($name in $serialProcessNames) {
    try {
        Get-Process $name -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    } catch {}
}

Write-Host "Killed common serial-monitor processes." -ForegroundColor Green

# Re-enumerate the USB serial device to force COM port release if it is stuck
$device = Get-PnpDevice -PresentOnly -Class Ports -ErrorAction SilentlyContinue |
    Where-Object { $_.FriendlyName -match 'COM5|CH9102|USB-Enhanced-SERIAL|ESP32|USB Serial' -or $_.InstanceId -match 'COM5' }

if ($device) {
    Write-Host "Found matching serial device. Re-enumerating port..." -ForegroundColor Yellow
    foreach ($d in $device) {
        try {
            Disable-PnpDevice -InstanceId $d.InstanceId -Confirm:$false -ErrorAction Stop
            Start-Sleep -Seconds $WaitSeconds
            Enable-PnpDevice -InstanceId $d.InstanceId -Confirm:$false -ErrorAction Stop
        } catch {
            Write-Host "Pnp re-enable attempt failed: $($_.Exception.Message)" -ForegroundColor DarkYellow
        }
    }
} else {
    Write-Host "No matching device was found for re-enumeration. If COM5 is still blocked, unplug and reconnect the ESP32 USB cable." -ForegroundColor DarkYellow
}

Write-Host "Waiting for the port to settle..." -ForegroundColor Yellow
Start-Sleep -Seconds $WaitSeconds

# Verify COM port availability
try {
    mode $Port 2>$null
    Write-Host "COM5 is available. Continuing..." -ForegroundColor Green
} catch {
    Write-Host "COM5 is still not available. Please close Arduino Serial Monitor and unplug/replug the ESP32 USB cable, then run this script again." -ForegroundColor Red
    Write-Host "If the port still fails, restart Windows or the PC." -ForegroundColor Red
    exit 1
}

$bridgeDir = Join-Path $PSScriptRoot '.'
Set-Location $bridgeDir
Write-Host "Starting AgriHub hardware bridge..." -ForegroundColor Green
npm run dev
