# GeForce Project Management - Auto Launcher
$projectDir = $PSScriptRoot
if (!(Test-Path "$projectDir\backend")) {
    $projectDir = "$PSScriptRoot\ProjectManagement"
}

Clear-Host
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "   GeForce Project Management - Auto Launcher" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""

# 1. Clean up any existing process on port 8080
Write-Host "[1/4] Checking port 8080..." -ForegroundColor Yellow
$port8080 = Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue
if ($port8080) {
    Write-Host "Freeing stuck process on port 8080 (PID: $($port8080.OwningProcess[0]))..." -ForegroundColor Yellow
    Stop-Process -Id $port8080.OwningProcess[0] -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}
Write-Host "Port 8080 is ready." -ForegroundColor Green

# 2. Check MySQL Service
Write-Host "[2/4] Checking MySQL Service..." -ForegroundColor Yellow
$mysqlService = Get-Service -Name MySQL80 -ErrorAction SilentlyContinue
if ($mysqlService -and $mysqlService.Status -ne 'Running') {
    Write-Host "Starting MySQL Service (MySQL80)..." -ForegroundColor Yellow
    Start-Service -Name MySQL80 -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}
Write-Host "MySQL Service is active." -ForegroundColor Green

# 3. Read or prompt for MySQL password
$configFile = "$projectDir\db_config.env"
$dbPassword = ""
if (Test-Path $configFile) {
    Get-Content $configFile | ForEach-Object {
        if ($_ -match "^\s*DB_PASSWORD\s*=\s*(.*)$") {
            $dbPassword = $matches[1].Trim()
        }
    }
}

if ([string]::IsNullOrWhiteSpace($dbPassword)) {
    Write-Host ""
    Write-Host "Please enter your MySQL root password." -ForegroundColor Magenta
    Write-Host "(This will be saved to db_config.env so you NEVER have to type it again):" -ForegroundColor Magenta
    $dbPassword = Read-Host "MySQL Password"
    "DB_PASSWORD=$dbPassword" | Set-Content $configFile -Encoding UTF8
    Write-Host "Password saved successfully!" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "Using saved MySQL credentials from db_config.env." -ForegroundColor Green
}

# 4. Start Spring Boot backend
Write-Host "[3/4] Launching GeForce Backend Server..." -ForegroundColor Yellow
$backendDir = "$projectDir\backend"
$jwtSecret = "thisIsALongRandomSecretKeyAtLeast32CharactersLong"

$cmdArgs = "/k title GeForce Backend Server && cd /d `"$backendDir`" && set DB_USERNAME=root && set DB_PASSWORD=$dbPassword && set JWT_SECRET=$jwtSecret && mvn spring-boot:run"
Start-Process "cmd.exe" -ArgumentList $cmdArgs

# 5. Dynamically poll until server is ready
Write-Host "[4/4] Waiting for backend server to initialize..." -ForegroundColor Yellow
$maxAttempts = 35
$attempt = 0
$serverReady = $false

while ($attempt -lt $maxAttempts) {
    Start-Sleep -Seconds 2
    $attempt++
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8080/index.html" -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            $serverReady = $true
            break
        }
    } catch {
        Write-Host "Starting Spring Boot... ($($attempt * 2)s)" -ForegroundColor DarkGray
    }
}

Write-Host ""
if ($serverReady) {
    Write-Host "==========================================================" -ForegroundColor Green
    Write-Host " SUCCESS: GeForce is running at http://localhost:8080" -ForegroundColor Green
    Write-Host " Opening GeForce in your browser..." -ForegroundColor Green
    Write-Host "==========================================================" -ForegroundColor Green
    Start-Process "http://localhost:8080/index.html"
} else {
    Write-Host "==========================================================" -ForegroundColor Red
    Write-Host " NOTICE: The server is taking longer than usual." -ForegroundColor Yellow
    Write-Host " Please check the 'GeForce Backend Server' window." -ForegroundColor Yellow
    Write-Host " If it shows 'Access denied for user root', your MySQL password" -ForegroundColor Yellow
    Write-Host " in db_config.env may be incorrect." -ForegroundColor Yellow
    Write-Host "==========================================================" -ForegroundColor Red
}
