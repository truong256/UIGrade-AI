# Thông báo thành phần bên thứ ba

Tài liệu này liệt kê dependency trực tiếp được khai báo trong
`gradle/libs.versions.toml`. Dependency bắc cầu phải được kiểm tra lại từ báo cáo
Gradle trước mỗi bản phát hành.

| Thành phần | Phiên bản | Mục đích | Giấy phép đã biết | Nguồn | Trạng thái |
|---|---:|---|---|---|---|
| Android Gradle Plugin | 8.13.2 | Build Android | Apache-2.0 | Google Maven | Tương thích MIT |
| Kotlin + Compose plugin | 2.0.21 | Ngôn ngữ/biên dịch Compose | Apache-2.0 | Maven Central/Gradle Plugin Portal | Tương thích MIT |
| AndroidX Core KTX | 1.15.0 | Tiện ích Android | Apache-2.0 | Google Maven | Tương thích MIT |
| AndroidX Lifecycle | 2.8.7 | Lifecycle, ViewModel, StateFlow | Apache-2.0 | Google Maven | Tương thích MIT |
| AndroidX Activity Compose | 1.9.3 | Compose Activity | Apache-2.0 | Google Maven | Tương thích MIT |
| Compose BOM/UI/Material 3 | 2024.12.01 | Giao diện Compose | Apache-2.0 | Google Maven | Tương thích MIT |
| Material Icons Extended | Theo Compose BOM | Icon giao diện | Apache-2.0 | Google Maven | Tương thích MIT |
| Navigation Compose | 2.8.5 | Điều hướng | Apache-2.0 | Google Maven | Tương thích MIT |
| Hilt/Dagger | 2.53.1 | Dependency injection | Apache-2.0 | Google Maven/Maven Central | Tương thích MIT |
| Hilt Navigation Compose | 1.2.0 | ViewModel theo navigation | Apache-2.0 | Google Maven | Tương thích MIT |
| Kotlin Coroutines | 1.9.0 | Coroutine, Flow | Apache-2.0 | Maven Central | Tương thích MIT |
| KSP | 2.0.21-1.0.28 | Sinh mã Hilt | Apache-2.0 | Google Maven/Plugin Portal | Tương thích MIT |
| JUnit 4 | 4.13.2 | Unit test | EPL-1.0 | Maven Central | Chỉ dùng test; tương thích phân phối |
| AndroidX Test/JUnit/Espresso | 1.2.1 / 3.6.1 | Instrumentation test | Apache-2.0 | Google Maven | Chỉ dùng test |
| MockK | 1.13.13 | Mock cho unit test | Apache-2.0 | Maven Central | Chỉ dùng test |
| Turbine | 1.2.0 | Kiểm thử Flow | Apache-2.0 | Maven Central | Chỉ dùng test |
| Inter Variable Font | Bản đóng gói trong repo | Typography | SIL-OFL-1.1 | `app/src/main/res/font` | Xem `licenses/OFL-Inter.txt` |

Không có `.jar` hoặc `.aar` được vendor thủ công. Repository chỉ dùng Google
Maven, Maven Central và Gradle Plugin Portal. Khi dependency thay đổi, cập nhật
bảng này và `docs/DEPENDENCIES.md`; không được xóa copyright notice của upstream.
