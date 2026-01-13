@echo off
setlocal enabledelayedexpansion

pushd o:\capstone\paranaledge-main\src

for /r . %%f in (*.js) do (
    powershell -Command "(Get-Content '%%f') -replace 'http://localhost:5050', 'https://paranaledge-y7z1.onrender.com' | Set-Content '%%f'" 2>nul
    if !ERRORLEVEL! EQU 0 (
        echo Updated: %%f
    )
)

popd
echo All files updated!
