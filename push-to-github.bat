@echo off
setlocal enabledelayedexpansion
title Push PDFCompress Pro to GitHub

echo ======================================================================
echo          PDFCOMPRESS PRO - PUSH CHANGES TO GITHUB
echo ======================================================================
echo.

REM Detect Git in standard locations if not in PATH yet
where git >nul 2>nul
if %errorlevel% neq 0 (
    if exist "C:\Program Files\Git\cmd\git.exe" (
        set "PATH=C:\Program Files\Git\cmd;!PATH!"
    ) else if exist "C:\Program Files (x86)\Git\cmd\git.exe" (
        set "PATH=C:\Program Files (x86)\Git\cmd;!PATH!"
    ) else if exist "%LOCALAPPDATA%\Programs\Git\cmd\git.exe" (
        set "PATH=%LOCALAPPDATA%\Programs\Git\cmd;!PATH!"
    ) else (
        echo [!] Git is not detected on your system.
        echo.
        echo Please double-click the installer already in your Downloads folder:
        echo   C:\Users\nitin\Downloads\Git-2.55.0.5-64-bit.exe
        echo.
        echo After installing Git, run this script again.
        echo.
        pause
        exit /b 1
    )
)

echo [*] Git detected:
git --version
echo.

echo [1/5] Initializing local repository...
if not exist ".git" (
    git init
)

echo [2/5] Configuring remote origin:
echo       https://github.com/nitinskydata-commits/pdf-compress-pro.git
git remote remove origin >nul 2>nul
git remote add origin https://github.com/nitinskydata-commits/pdf-compress-pro.git

echo [3/5] Setting main branch...
git branch -M main

echo [4/5] Staging modified files...
git add .

echo [*] Creating commit...
git commit -m "Optimize PDF compression engine, fix mobile downloads, improve estimation and security"

echo [5/5] Pushing to GitHub (origin main)...
git push -u origin main --force

if %errorlevel% equ 0 (
    echo.
    echo ======================================================================
    echo [SUCCESS] Your improvements have been pushed to GitHub!
    echo Your GitHub repository has been updated successfully!
    echo ======================================================================
) else (
    echo.
    echo [!] Push encountered an issue. If prompted for GitHub login, please sign in.
)

echo.
pause
