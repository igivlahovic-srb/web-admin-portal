@echo off
REM Water Service Web Admin - Dijagnostička skripta za Windows
REM Ova skripta pomaže da pronađete i rešite probleme sa konekcijom

echo ======================================
echo Water Service Web Admin - Dijagnostika
echo ======================================
echo.

REM 1. Provera da li je web server pokrenut
echo 1. Provera web servera...
netstat -ano | findstr :3000 | findstr LISTENING >nul 2>&1
if %errorlevel% equ 0 (
    echo    [OK] Web server RADI na portu 3000
) else (
    echo    [X] Web server NE RADI
    echo    Pokrenite ga sa: cd web-admin ^&^& bun dev
    echo.
    pause
    exit /b 1
)

echo.

REM 2. Provera IP adrese
echo 2. IP adrese ovog računara:
echo.

for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /C:"IPv4"') do (
    set IP=%%a
    setlocal enabledelayedexpansion
    set IP=!IP:~1!
    echo    http://!IP!:3000
    endlocal
)

echo.
echo    Kopirajte jednu od ovih adresa u mobilnu aplikaciju!
echo    (Obično je prva adresa prava)
echo.

REM 3. Test API endpointa
echo 3. Test API endpointa...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3000/api/health' -UseBasicParsing; if ($response.StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }" >nul 2>&1
if %errorlevel% equ 0 (
    echo    [OK] API endpoint /api/health radi
) else (
    echo    [X] API endpoint ne odgovara
)

echo.

REM 4. Provera firewall-a
echo 4. Provera firewall-a...
netsh advfirewall firewall show rule name=all | findstr /C:"3000" >nul 2>&1
if %errorlevel% equ 0 (
    echo    [OK] Port 3000 je dozvoljen u firewall-u
) else (
    echo    [!] Port 3000 mozda nije dozvoljen
    echo    Dozvolite ga iz PowerShell-a (kao Administrator):
    echo    New-NetFirewallRule -DisplayName "Water Admin" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
)

echo.

REM 5. Uputstva
echo ======================================
echo Sledeci koraci:
echo ======================================
echo.
echo 1. U mobilnoj aplikaciji:
echo    - Idite na Profil -^> Settings
echo    - Sacuvajte jednu od IP adresa iznad
echo    - Kliknite 'Testiraj konekciju'
echo.
echo 2. Ako ne radi:
echo    - Proverite da li su telefon i racunar na istoj WiFi mrezi
echo    - Iskljucite firewall privremeno za testiranje
echo    - Pokusajte drugu IP adresu sa liste
echo.
echo 3. Za pomoc:
echo    - Procitajte README.md
echo    - Procitajte web-admin\README.md
echo.

pause
