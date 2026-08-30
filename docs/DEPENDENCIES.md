# Quản lý dependency

Dependency được khóa phiên bản trong `gradle/libs.versions.toml` và lấy từ
Google Maven, Maven Central hoặc Gradle Plugin Portal. Không dùng version động,
`.jar`/`.aar` thủ công hoặc source thư viện đã sửa.

| Nhóm | Thành phần | Lý do |
|---|---|---|
| Android | Core KTX, Activity Compose | API Android và Activity host |
| UI | Compose BOM/UI/Material 3/Icons | Giao diện declarative thống nhất |
| Lifecycle | Runtime, ViewModel, Runtime Compose | State lifecycle-aware |
| Navigation | Navigation Compose | Graph theo vai trò và ID |
| DI | Hilt, KSP, Hilt Navigation | Binding repository/ViewModel |
| Async | Kotlin Coroutines | Coroutine, Flow, StateFlow |
| Test | JUnit, Coroutines Test, MockK, Turbine | Unit test và Flow |
| UI test | AndroidX JUnit, Espresso, Compose Test | Instrumentation smoke test |

Retrofit, OkHttp, Kotlin Serialization và Coil đã bị loại khỏi catalog vì code
hiện tại không dùng. Khi backend thật được triển khai, chỉ thêm lại dependency
cần thiết cùng DTO/mapper/test, không thêm chỉ để “chuẩn bị tương lai”.

Giấy phép và nguồn được ghi trong `THIRD_PARTY_NOTICES.md`. Dependabot chỉ mở PR;
mọi cập nhật vẫn phải qua build, test, lint và kiểm tra regression.

## Kiểm tra trước release

```bash
./gradlew :app:dependencies
./gradlew buildEnvironment
```

Đối chiếu dependency resolved với notice và SBOM trực tiếp. Repository chưa bật
Gradle dependency verification vì môi trường hiện tại không tải được toàn bộ
artifact để tạo checksum đáng tin cậy; không tạo metadata giả.
