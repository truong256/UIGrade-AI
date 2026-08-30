REM SPDX-FileCopyrightText: 2026 UIGrade AI contributors
REM SPDX-License-Identifier: MIT

@echo off
chcp 65001 >nul
echo ===============================================================
echo [UIGrade AI] Khởi chạy Máy ảo Pixel 8 & Ứng dụng UIGrade AI...
echo ===============================================================

if defined ANDROID_SDK_ROOT (
    set "ANDROID_SDK=%ANDROID_SDK_ROOT%"
) else (
    set "ANDROID_SDK=%LOCALAPPDATA%\Android\Sdk"
)
set "ADB=%ANDROID_SDK%\platform-tools\adb.exe"
set "EMULATOR=%ANDROID_SDK%\emulator\emulator.exe"
set "APK=app\build\outputs\apk\debug\app-debug.apk"
set "AVD_NAME=%~1"
if not defined AVD_NAME set "AVD_NAME=Pixel_8"

if not exist "%ADB%" (
    echo Khong tim thay adb tai: %ADB%
    echo Hay dat ANDROID_SDK_ROOT hoac cai Android SDK bang Android Studio.
    exit /b 1
)

if not exist "%EMULATOR%" (
    echo Khong tim thay Android Emulator tai: %EMULATOR%
    exit /b 1
)

if not exist "%APK%" (
    echo Chua co APK debug. Dang build ung dung...
    call gradlew.bat assembleDebug || exit /b 1
)

echo 1. Khởi chạy cửa sổ máy ảo Pixel 8...
start "" "%EMULATOR%" -avd "%AVD_NAME%"

echo 2. Đang chờ máy ảo khởi động hoàn tất...
"%ADB%" wait-for-device
:wait_boot
for /f "tokens=*" %%a in ('"%ADB%" shell getprop sys.boot_completed') do set BOOTED=%%a
if not "%BOOTED%"=="1" (
    timeout /t 2 /nobreak >nul
    goto wait_boot
)

echo 3. Cài đặt bản cập nhật mới nhất vào máy ảo...
"%ADB%" install -r "%APK%"

echo 4. Khởi chạy ứng dụng UIGrade AI...
"%ADB%" shell am start -n com.uigrade.ai/.MainActivity

echo ===============================================================
echo Hoàn tất! Cửa sổ Pixel 8 đã mở trên màn hình với giao diện mới.
echo ===============================================================
timeout /t 5
