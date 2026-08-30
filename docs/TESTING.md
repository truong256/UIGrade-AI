# Chiến lược kiểm thử

## Unit test

Chạy:

```bash
./gradlew testDebugUnitTest
```

Các suite hiện có:

- `GradingEngineTest`: điểm deterministic, penalty, quan hệ dữ liệu và ranh giới AI.
- `MockRepositoryTest`: auth, state dùng chung, submission, rubric, user và stats.
- `ClassroomGradingTest`: lớp, join code, quyền, assignment, submission và grade.
- `StudentFeatureTest`: policy thời gian, membership, join, draft, file và grade visibility.
- `LecturerFeatureTest`: enrollment, join request, profile/password và notification.
- `AdminFeatureTest`: quyền Admin, account status, validation, filter và audit.
- `RegisterViewModelTest`: validation đăng ký và cấm tự đăng ký Admin.

## Compose UI test

Biên dịch test không cần emulator:

```bash
./gradlew assembleDebugAndroidTest
```

Chạy trên emulator/thiết bị:

```bash
./gradlew connectedDebugAndroidTest
```

`CriticalFlowsTest` dùng `MainActivity`, Hilt graph và navigation thật để smoke
test đăng nhập/điều hướng của ba vai trò. File picker hệ thống cần fake hoặc test
thủ công vì nằm ngoài process ứng dụng.

## Lint và kiểm tra tĩnh

```bash
./gradlew lintDebug
rg -n 'onClick\s*=\s*\{\s*\}|onValueChange\s*=\s*\{\s*\}|TODO\(|NotImplementedError|UnsupportedOperationException' app
git diff --check
```

Không tắt lint/test để CI xanh. Warning phải được phân loại trong PR. Test UI
runtime chỉ được báo thành công khi thực sự chạy trên emulator/thiết bị.

## Ma trận kiểm thử thủ công trước demo

| Luồng | Sinh viên | Giảng viên | Admin |
|---|---|---|---|
| Đăng nhập/đăng xuất/back stack | Bắt buộc | Bắt buộc | Bắt buộc |
| Loading/empty/error/retry | Bắt buộc | Bắt buộc | Bắt buộc |
| Ghi dữ liệu | Join/draft/submit | Lớp/bài/chấm | User/catalog |
| Phân quyền route/ID | Dữ liệu sở hữu | Lớp sở hữu | Admin only |
| Font scale/dark mode/màn hình nhỏ | Smoke | Smoke | Smoke |
