@echo off
setlocal EnableDelayedExpansion
title Build OpenChat V2 IPA via GitHub Actions

REM ============================================================
REM  build-ipa.cmd — pushes the project to GitHub; GitHub Actions
REM  (macos-14 runner) builds an UNSIGNED .ipa you can sideload.
REM
REM  Usage:
REM    build-ipa.cmd           (creates PRIVATE repo "openchat-v2")
REM    build-ipa.cmd public    (creates PUBLIC repo)
REM    build-ipa.cmd <name>    (custom repo name)
REM
REM  Auth: set GITHUB_TOKEN in the environment first, or paste it
REM  when prompted (it is never written to disk by this script).
REM ============================================================

cd /d "%~dp0"

REM ---------- Token ----------
if not defined GITHUB_TOKEN (
    echo Paste your GitHub token ^(input is visible, it is NOT saved to disk^):
    set /p GITHUB_TOKEN=
)
if not defined GITHUB_TOKEN ( echo ERROR: no token provided & exit /b 1 )

REM ---------- Repo name / visibility ----------
set "REPO_NAME=%~1"
if "%REPO_NAME%"=="" set "REPO_NAME=openchat-v2"
if /i "%REPO_NAME%"=="public" ( set "REPO_PUBLIC=true" & set "REPO_NAME=openchat-v2" ) else set "REPO_PUBLIC=false"
if /i "%REPO_NAME%"=="private" set "REPO_PUBLIC=false"

REM ---------- Verify token / get login ----------
echo Checking token...
for /f "delims=" %%u in ('curl.exe -s -H "Authorization: Bearer %GITHUB_TOKEN%" https://api.github.com/user ^| powershell -NoProfile -Command "$j=[Console]::In.ReadToEnd()|ConvertFrom-Json; $j.login"') do set "GH_USER=%%u"
if not defined GH_USER ( echo ERROR: token invalid or github.com unreachable & exit /b 1 )
echo Authenticated as: %GH_USER%

REM ---------- Create repo (ignore "already exists") ----------
echo Creating repo "%REPO_NAME%" (public=%REPO_PUBLIC%) ...
curl.exe -s -X POST -H "Authorization: Bearer %GITHUB_TOKEN%" -H "Accept: application/vnd.github+json" -d "{\"name\":\"%REPO_NAME%\",\"private\":%REPO_PUBLIC%,\"description\":\"OpenChat V2 - native + web client\"}" https://api.github.com/user/repos > "%TEMP%\gh_repo.json"
findstr /c:"\"name\": \"%REPO_NAME%\"" "%TEMP%\gh_repo.json" >nul && (echo Repo ready.) || (echo Repo may already exist - continuing with push.)

REM ---------- git init / commit / push ----------
if not exist ".git" (
    git init
    git branch -M main
)
git config user.email >nul 2>&1 || git config user.email "openchat@example.com"
git config user.name  >nul 2>&1 || git config user.name  "OpenChat Build"

git add -A
git commit -m "OpenChat V2: web app + native Android + native iOS + IPA workflow" >nul 2>&1
if errorlevel 1 echo Nothing new to commit.

git remote remove origin >nul 2>&1
git remote add origin "https://github.com/%GH_USER%/%REPO_NAME%.git"

echo Pushing...
git push "https://x-access-token:%GITHUB_TOKEN%@github.com/%GH_USER%/%REPO_NAME%.git" main
if errorlevel 1 (
    echo.
    echo PUSH FAILED - possible causes:
    echo   1. github.com blocked by your VPN/firewall - try again with VPN off
    echo   2. Token lacks Contents:Write ^(fine-grained PAT needs repository Contents: Read and Write^)
    echo   3. Repo does not exist - create it at https://github.com/new?name=%REPO_NAME% then re-run
    exit /b 1
)
git push -u origin main

echo.
echo ============================================
echo  Pushed to: https://github.com/%GH_USER%/%REPO_NAME%
echo  The "Build iOS IPA" workflow now runs.
echo  Watch it:  https://github.com/%GH_USER%/%REPO_NAME%/actions
echo  Download the IPA from the workflow run's "Artifacts".
echo.
echo  Install on iPhone: AltStore / Sideloadly (unsigned IPA).
echo ============================================
exit /b 0
