@echo off
setlocal EnableDelayedExpansion
title Build OpenChat V2 APK

REM ============================================================
REM  build-apk.cmd — builds OpenChat V2 as a native Android APK
REM  (Kotlin + Jetpack Compose - NO WebView - talks JSON to the
REM   OpenChat V2 server for ALL data: accounts, state, messages)
REM ============================================================

cd /d "%~dp0"
set "ROOT=%CD%"
set "ANDROID_DIR=%ROOT%\android"
set "TOOLS=%ANDROID_DIR%\.tools"
set "GRADLE_VERSION=8.9"
set "GRADLE_DIR=%TOOLS%\gradle-%GRADLE_VERSION%"
set "SDK_DIR=%TOOLS%\sdk"
set "JDK_DIR=%TOOLS%\jdk17"
set "APK_OUT=%ROOT%\openchat-v2-debug.apk"

if not exist "%TOOLS%" mkdir "%TOOLS%"

echo.
echo ============================================
echo  OpenChat V2 - Native APK builder
echo ============================================
echo.

REM ---------- 1. JDK (AGP 8.5 does not run on JDK 25 - use portable 17) ----------
echo [1/5] Checking Java...
set "JVMAJOR="
for /f "tokens=3 delims=. " %%v in ('java -version 2^>^&1 ^| findstr /i version') do set "JVRAW=%%v"
set "JVRAW=%JVRAW:"=%"
for /f "delims=. tokens=1" %%m in ("%JVRAW%") do set "JVMAJOR=%%m"
echo      Detected major version: %JVMAJOR%

if "%JVMAJOR%"=="17" goto :have_jdk
if "%JVMAJOR%"=="21" goto :have_jdk
goto :need_jdk17

:have_jdk
echo      Compatible JDK found - deriving JAVA_HOME...
for /f "delims=" %%p in ('where java') do set "JAVA_EXE=%%p"
for /f "delims=" %%h in ('powershell -NoProfile -Command "Split-Path -Parent (Split-Path -Parent ''%JAVA_EXE%'')"') do set "JAVA_HOME=%%h"
if not exist "%JAVA_HOME%\bin\java.exe" (
    echo      Could not derive JAVA_HOME - falling back to portable JDK 17
    goto :need_jdk17
)
echo      JAVA_HOME=%JAVA_HOME%
goto :jdk_done

:need_jdk17
if exist "%JDK_DIR%\bin\java.exe" (
    echo      Using portable Temurin 17 at %JDK_DIR%
    set "JAVA_HOME=%JDK_DIR%"
    set "PATH=%JDK_DIR%\bin;%PATH%"
    goto :jdk_done
)
echo      Downloading portable Temurin JDK 17...
curl.exe -L --fail -o "%TOOLS%\jdk17.zip" "https://api.adoptium.net/v3/binary/latest/17/ga/windows/x64/jdk/hotspot/normal/eclipse"
if errorlevel 1 ( echo ERROR: JDK download failed & exit /b 1 )
echo      Extracting...
powershell -NoProfile -Command "Expand-Archive -Path '%TOOLS%\jdk17.zip' -DestinationPath '%TOOLS%\jdk17-tmp' -Force"
powershell -NoProfile -Command "Get-ChildItem '%TOOLS%\jdk17-tmp' -Directory | Select-Object -First 1 | Move-Item -Destination '%JDK_DIR%' -Force"
if errorlevel 1 ( echo ERROR: JDK extraction failed & exit /b 1 )
rmdir /s /q "%TOOLS%\jdk17-tmp"
del "%TOOLS%\jdk17.zip"
set "JAVA_HOME=%JDK_DIR%"
set "PATH=%JDK_DIR%\bin;%PATH%"
echo      Portable JDK 17 ready.

:jdk_done
"%JAVA_HOME%\bin\java.exe" -version

REM ---------- 2. Android SDK ----------
echo.
echo [2/5] Checking Android SDK...
if defined ANDROID_HOME if exist "%ANDROID_HOME%" set "SDK_DIR=%ANDROID_HOME%"
if defined ANDROID_SDK_ROOT if exist "%ANDROID_SDK_ROOT%" set "SDK_DIR=%ANDROID_SDK_ROOT%"
if exist "%LOCALAPPDATA%\Android\Sdk" if not defined ANDROID_HOME if not defined ANDROID_SDK_ROOT set "SDK_DIR=%LOCALAPPDATA%\Android\Sdk"

if exist "%SDK_DIR%\platform-tools" goto :sdk_ok

echo      Android SDK not found - installing into %SDK_DIR% ...
if not exist "%SDK_DIR%" mkdir "%SDK_DIR%"
echo      Downloading command line tools...
curl.exe -L --fail -o "%TOOLS%\cmdline-tools.zip" "https://dl.google.com/android/repository/commandlinetools-win-11076708_latest.zip"
if errorlevel 1 ( echo ERROR: cmdline-tools download failed & exit /b 1 )
if exist "%SDK_DIR%\cmdline-tools" rmdir /s /q "%SDK_DIR%\cmdline-tools"
powershell -NoProfile -Command "Expand-Archive -Path '%TOOLS%\cmdline-tools.zip' -DestinationPath '%SDK_DIR%\cmdline-tools' -Force"
ren "%SDK_DIR%\cmdline-tools\cmdline-tools" latest
del "%TOOLS%\cmdline-tools.zip"

REM NOTE: sdkmanager is invoked from OUTSIDE any parenthesized block so
REM the variable is not empty at expansion time.
REM Write the known SDK license hashes (piping y does not work - more eats stdin)
set "LICDIR=%SDK_DIR%\licenses"
if not exist "%LICDIR%" mkdir "%LICDIR%"
> "%LICDIR%\android-sdk-license" echo 24333f8a63b6825ea9c5514f83c2829b004d1fee
>> "%LICDIR%\android-sdk-license" echo 8933bad161af4178b1185d1a37fbf41ea5269c55
>> "%LICDIR%\android-sdk-license" echo d56f5187479451eabf01fb78af6dfcb131a6481e
>> "%LICDIR%\android-sdk-license" echo d975f751698a77b662f1254ddbeed3901e976f5
> "%LICDIR%\android-sdk-preview-license" echo 84831b9409646a918e30573bab4c9c91346d8abd
> "%LICDIR%\android-sdk-arm-dbt-license" echo 859f317696f67ef3d7f30a50a5560e7834b43903
> "%LICDIR%\android-googletv-license" echo 601085b94cd77c0b54ff86406957099ebe79c4d6
> "%LICDIR%\android-gdk-license" echo 33b6a2b64607f11b759f320ef9dff4ae5c47d97a

set "SDKMANAGER=%SDK_DIR%\cmdline-tools\latest\bin\sdkmanager.bat"
echo      Installing platform-tools, platform 34, build-tools 34...
call "%SDKMANAGER%" --sdk_root="%SDK_DIR%" "platform-tools" "platforms;android-34" "build-tools;34.0.0"
if errorlevel 1 ( echo ERROR: sdkmanager failed & exit /b 1 )

:sdk_ok
echo      SDK OK: %SDK_DIR%
powershell -NoProfile -Command "'sdk.dir=%SDK_DIR:\=\\%' | Set-Content -Path '%ANDROID_DIR%\local.properties' -Encoding ASCII"

REM ---------- 3. Portable Gradle ----------
echo.
echo [3/5] Checking Gradle %GRADLE_VERSION%...
if not exist "%GRADLE_DIR%\bin\gradle.bat" (
    echo      Downloading Gradle %GRADLE_VERSION%...
    curl.exe -L --fail -o "%TOOLS%\gradle.zip" "https://services.gradle.org/distributions/gradle-%GRADLE_VERSION%-bin.zip"
    if errorlevel 1 ( echo ERROR: Gradle download failed & exit /b 1 )
    powershell -NoProfile -Command "Expand-Archive -Path '%TOOLS%\gradle.zip' -DestinationPath '%TOOLS%' -Force"
    del "%TOOLS%\gradle.zip"
)
set "GRADLE_BAT=%GRADLE_DIR%\bin\gradle.bat"

REM ---------- 4. Build APK ----------
echo.
echo [4/5] Building APK (first run downloads dependencies - can take 5-15 min)...
cd /d "%ANDROID_DIR%"
call "%GRADLE_BAT%" :app:assembleDebug --console=plain
if errorlevel 1 (
    echo.
    echo ============================================
    echo  BUILD FAILED
    echo  Common fixes:
    echo   - Check network access to dl.google.com / repo.maven.apache.org / services.gradle.org
    echo   - Delete the android\.tools folder and re-run to re-fetch the toolchain
    echo   - If the error mentions Java version, your system JDK was used - confirm android\.tools\jdk17 exists
    echo ============================================
    exit /b 1
)

REM ---------- 5. Copy APK ----------
echo.
echo [5/5] Copying APK...
set "BUILT_APK=%ANDROID_DIR%\app\build\outputs\apk\debug\app-debug.apk"
if not exist "%BUILT_APK%" ( echo ERROR: APK not found at %BUILT_APK% & exit /b 1 )
copy /y "%BUILT_APK%" "%APK_OUT%" >nul
for %%A in ("%APK_OUT%") do set "SIZE=%%~zA"
echo.
echo ============================================
echo  APK built: %APK_OUT%
echo  Size: %SIZE% bytes
echo.
echo  Install on your phone:
echo    1. Enable USB debugging on the phone
echo    2. Plug in via USB, then run:
echo       "%SDK_DIR%\platform-tools\adb.exe" install -r "%APK_OUT%"
echo    (or copy the APK to the phone and tap it)
echo.
echo  The app is pre-configured to talk to:
echo    https://lid-graduation-automotive-mere.trycloudflare.com
echo ============================================
start "" explorer /select,"%APK_OUT%"
exit /b 0
