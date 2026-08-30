# Quy trình phát hành

## Chuẩn phiên bản

Dùng Semantic Versioning `MAJOR.MINOR.PATCH`. `versionCode` tăng cho mọi artifact
phát hành; `versionName` khớp tag `vX.Y.Z`.

## Chuẩn bị

1. Đảm bảo `main` sạch và CI xanh.
2. Cập nhật version trong `app/build.gradle.kts`.
3. Chuyển mục thực tế từ Unreleased trong `CHANGELOG.md`.
4. Cập nhật release notes và dependency/license notice.
5. Chạy `clean`, unit test, lint, UI-test compilation và instrumentation test nếu có thiết bị.
6. Build APK/AAB từ đúng commit.

## Tag và release

```bash
git tag -s v1.0.0 -m "UIGrade AI 1.0.0"
git push origin v1.0.0
sha256sum app/build/outputs/apk/release/app-release.apk > app-release.apk.sha256
```

Tạo GitHub Release từ tag, dán release notes, đính kèm APK/AAB và checksum. Không
đính kèm source archive thủ công vì GitHub tự tạo source archive theo tag.

Workflow `release.yml` chỉ tạo **unsigned APK** khi chưa có signing secrets. Không
gọi đó là production-signed. Production signing nên dùng GitHub Environment hạn
chế quyền và secrets/base64 keystore, không in giá trị vào log.

## SBOM và checksum

`docs/sbom-direct.spdx.json` chỉ là inventory dependency trực tiếp. Trước release
production phải sinh SBOM resolved gồm dependency bắc cầu bằng công cụ đã được
kiểm chứng, lưu cùng artifact và cập nhật notice. Checksum phải được tạo từ chính
artifact tải lên.

## Rollback

Không di chuyển tag đã công bố. Nếu lỗi, đánh dấu release bị ảnh hưởng, phát hành
PATCH mới hoặc gỡ artifact nguy hiểm; giữ changelog và advisory. Thu hồi secret
ngay nếu có rò rỉ.

## Việc thủ công của chủ repository

- Xác nhận version/tag và nội dung release.
- Cấu hình signing secret nếu phát hành production.
- Chạy UI test runtime trên emulator/device.
- Publish GitHub Release; quy trình tự động không publish nếu chưa phê duyệt.
