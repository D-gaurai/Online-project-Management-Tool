# Starts the backend with Java 17 (auto-detected). Run it from the project folder.
$jdk = Get-ChildItem "C:\Program Files\Eclipse Adoptium" -Directory |
       Where-Object { $_.Name -like "jdk-17*" } | Select-Object -First 1

if (-not $jdk) {
    Write-Host "JDK 17 not found in C:\Program Files\Eclipse Adoptium"
    exit
}

$env:JAVA_HOME = $jdk.FullName
$env:Path = "$env:JAVA_HOME\bin;$env:Path"
$env:DB_USERNAME = "root"
$env:DB_PASSWORD = Read-Host "Enter MySQL password"
$env:JWT_SECRET = "thisIsALongRandomSecretKeyAtLeast32CharactersLong"

Set-Location "$PSScriptRoot\backend"
java -version
mvn spring-boot:run