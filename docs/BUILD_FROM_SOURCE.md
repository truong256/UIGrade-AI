# Build từ mã nguồn

## Yêu cầu

- Git.
- Android Studio tương thích AGP 8.13.2.
- OpenJDK 17.
- Android SDK Platform 35 và Build Tools 35.0.0.
- Thiết bị/emulator Android 8.0 (API 26) trở lên.

## Clone và cấu hình

```bash
git clone https://github.com/truong256/UIGrade-AI.git
cd UIGrade-AI
```

Mở thư mục bằng Android Studio, chọn Gradle JDK 17 và Sync Project. Gradle
Wrapper 8.13 được lưu trong repository; không cần cài Gradle toàn cục.

Nếu IDE không tự tạo `local.properties`, sao chép `local.properties.example`
thành `local.properties` và đặt `sdk.dir`. File này bị `.gitignore` loại trừ.

## Build và kiểm tra

macOS/Linux:

```bash
./gradlew clean assembleDebug
./gradlew testDebugUnitTest
./gradlew lintDebug
./gradlew assembleDebugAndroidTest
```

Windows PowerShell/CMD:

```bat
gradlew.bat clean assembleDebug
gradlew.bat testDebugUnitTest
gradlew.bat lintDebug
gradlew.bat assembleDebugAndroidTest
```

APK nằm tại `app/build/outputs/apk/debug/app-debug.apk`.

## Chạy

Tạo emulator (ví dụ Pixel 8, API 35), chọn cấu hình `app` và Run. Hoặc:

```bash
./gradlew installDebug
adb shell am start -n com.uigrade.ai/.MainActivity
```

Trên Windows, `run_app.bat` tự dùng `ANDROID_SDK_ROOT` hoặc SDK mặc định trong
`%LOCALAPPDATA%`; script yêu cầu AVD tên `Pixel_8`.

## Thiết bị thật

Bật Developer options và USB debugging, kết nối cáp, chấp nhận fingerprint rồi
kiểm tra bằng `adb devices`. Không cần quyền truy cập toàn bộ bộ nhớ; chọn tệp
bằng Storage Access Framework.

## Dữ liệu và backend

`BuildConfig.DATA_SOURCE_MODE` hiện là `DEMO`. Tất cả repository bind tới
implementation in-memory; không cần API key để chạy demo. Đây không phải chế độ
production. Backend/AI thật phải được triển khai theo `AI_INTEGRATION.md` và thay
binding Hilt có chủ đích.

## Lỗi thường gặp

- Sai JDK: chọn JDK 17 trong Gradle Settings.
- Thiếu SDK 35: cài bằng SDK Manager.
- Wrapper không tải được: kiểm tra proxy/firewall tới `services.gradle.org`,
  Google Maven và Maven Central.
- Giao diện cũ: Sync Gradle, chạy `clean assembleDebug`, gỡ app cũ rồi cài lại.
