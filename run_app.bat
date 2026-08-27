@echo off
chcp 65001 >nul
echo ===============================================================
echo [UIGrade AI] Khởi chạy Máy ảo Pixel 8 & Ứng dụng UIGrade AI...
echo ===============================================================

set ADB="C:\Users\ASUS\AppData\Local\Android\Sdk\platform-tools\adb.exe"
set EMULATOR="C:\Users\ASUS\AppData\Local\Android\Sdk\emulator\emulator.exe"
set APK="app\build\outputs\apk\debug\app-debug.apk"

echo 1. Khởi chạy cửa sổ máy ảo Pixel 8...
start "" %EMULATOR% -avd Pixel_8

echo 2. Đang chờ máy ảo khởi động hoàn tất...
%ADB% wait-for-device
:wait_boot
for /f "tokens=*" %%a in ('%ADB% shell getprop sys.boot_completed') do set BOOTED=%%a
if not "%BOOTED%"=="1" (
    timeout /t 2 /nobreak >nul
    goto wait_boot
)

echo 3. Cài đặt bản cập nhật mới nhất vào máy ảo...
%ADB% install -r %APK%

echo 4. Khởi chạy ứng dụng UIGrade AI...
%ADB% shell am start -n com.uigrade.ai/.MainActivity

echo ===============================================================
echo Hoàn tất! Cửa sổ Pixel 8 đã mở trên màn hình với giao diện mới.
echo ===============================================================
timeout /t 5
