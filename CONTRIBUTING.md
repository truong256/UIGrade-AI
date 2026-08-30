# Đóng góp cho UIGrade AI

Cảm ơn bạn muốn cải thiện dự án. Mọi thay đổi nên nhỏ, có mục tiêu rõ và đi qua
pull request.

## Quy trình

1. Fork repository và clone fork.
2. Tạo branch từ `main`, ví dụ `feat/student-calendar` hoặc `fix/login-state`.
3. Dùng JDK 17, Android SDK 35 và sync Gradle.
4. Không commit secret, `local.properties`, keystore, APK hoặc token.
5. Viết commit theo dạng `type(scope): mô tả`, ví dụ `fix(auth): clear protected back stack`.
6. Chạy:

   ```bash
   ./gradlew clean assembleDebug
   ./gradlew testDebugUnitTest
   ./gradlew lintDebug
   ./gradlew assembleDebugAndroidTest
   ```

7. Push branch và mở pull request theo template.

## Yêu cầu mã nguồn

- Giữ `applicationId` và API/JSON contract nếu không có migration được thống nhất.
- UI gọi ViewModel/use case, không gọi repository hoặc DAO trực tiếp.
- Thành phần tương tác phải điều hướng, cập nhật trạng thái hoặc báo lỗi rõ ràng.
- Bổ sung loading, empty, error và chống gửi lặp cho thao tác bất đồng bộ.
- Giữ phân quyền ở UI, navigation, use case và repository/backend.
- Mã mới do dự án sở hữu phải có `SPDX-License-Identifier: MIT`.
- Không sao chép code/asset không rõ giấy phép.

## Báo lỗi và đề xuất

Dùng [GitHub Issues](https://github.com/truong256/UIGrade-AI/issues/new/choose),
chọn đúng template, xóa dữ liệu cá nhân khỏi log/ảnh và cung cấp bước tái hiện.
Lỗ hổng bảo mật phải được báo theo `SECURITY.md`, không đăng công khai trước khi
được xử lý.
