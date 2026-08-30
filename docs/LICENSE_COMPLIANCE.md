# Tuân thủ giấy phép

## Giấy phép chính

Mã nguồn do UIGrade AI contributors sở hữu được phát hành theo MIT License;
toàn văn tại `LICENSE`. README trước baseline đã tuyên bố MIT, vì vậy không đổi
sang giấy phép khác để tránh tái cấp phép không có căn cứ.

## Phạm vi

SPDX `MIT` áp dụng cho Kotlin, Gradle script, workflow/script và resource do dự
án tự tạo. Không áp dụng header MIT của dự án lên font, code/asset bên thứ ba.

Inter Variable Font giữ SIL OFL 1.1 trong `licenses/OFL-Inter.txt`. Dependency
trực tiếp và giấy phép được liệt kê trong `THIRD_PARTY_NOTICES.md` và inventory
SPDX direct. License conclusion để `NOASSERTION` trong SBOM vì chưa chạy scanner
trên artifact resolved.

## Quy trình kiểm tra

1. Review diff cho code/asset sao chép và provenance.
2. Chạy dependency report, cập nhật dependency notices/SBOM.
3. Xác minh license metadata từ upstream/Maven.
4. Không sửa/xóa copyright notice upstream.
5. Chặn dependency GPL/AGPL hoặc license chưa rõ cho tới khi review pháp lý.
6. Kiểm tra LICENSE/NOTICE/SPDX trước release.

## Rủi ro còn lại

- Chưa có scanner tự động cho dependency bắc cầu.
- Chưa có Gradle dependency verification metadata.
- Chủ repository phải xác nhận mascot/vector launcher là tác phẩm dự án hoặc có
  giấy phép cho phép phân phối.
- Tài liệu này là kiểm kê kỹ thuật, không phải tư vấn pháp lý.
