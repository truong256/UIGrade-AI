# Chính sách bảo mật

## Phạm vi hỗ trợ

Nhánh `main` và bản phát hành mới nhất (khi có) được ưu tiên vá bảo mật. Bản demo
hiện dùng dữ liệu in-memory, không phải dịch vụ production.

## Báo cáo lỗ hổng

Không mở issue công khai cho lỗ hổng có thể khai thác. Hãy dùng tính năng
**Security advisories → Report a vulnerability** của repository. Nếu tính năng
này chưa bật, liên hệ riêng với chủ repository qua hồ sơ GitHub
[@truong256](https://github.com/truong256).

Nội dung nên có phiên bản/commit, thiết bị, bước tái hiện, ảnh hưởng và đề xuất
khắc phục. Không gửi token, mật khẩu thật hoặc dữ liệu sinh viên thật.

## Cam kết xử lý

- Xác nhận tiếp nhận sớm nhất có thể.
- Phân loại mức ảnh hưởng trước khi công bố.
- Không hứa thời hạn vá khi chưa tái hiện được.
- Ghi nhận người báo nếu họ đồng ý.

## Nguyên tắc vận hành

Không đặt AI key, Supabase service-role key, keystore hoặc mật khẩu signing trong
Android client/repository. Backend thật phải dùng HTTPS, xác thực server-side và
kiểm tra quyền sở hữu dữ liệu; xem `docs/PRIVACY_AND_SECURITY.md`.
