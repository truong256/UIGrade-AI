# Roadmap

## 1.0 — Android demo ổn định

- [x] Ba role và navigation guard.
- [x] Lớp, assignment, submission, rubric, grading, feedback và Admin audit.
- [x] Unit test, Compose smoke test và CI.
- [x] Tài liệu build, nguồn mở, bảo mật và release.
- [ ] Chạy instrumentation test runtime trên emulator CI.
- [ ] Chụp screenshot/video từ app thật.

## 1.1 — Dữ liệu bền và backend

- [ ] REST/Supabase backend với auth/token refresh.
- [ ] RLS/ownership test và API error mapping.
- [ ] Room cache/offline queue có migration.
- [ ] Upload object storage an toàn.

## 1.2 — AI và đánh giá chất lượng

- [ ] Backend AI server-side, schema validation và rate limit.
- [ ] Metric extraction pipeline có bộ dữ liệu benchmark.
- [ ] Lecturer review/audit cho mọi thay đổi điểm.
- [ ] Đo hallucination, fairness và chất lượng phản hồi.

## 2.0 — Production readiness

- [ ] Privacy policy/retention theo tổ chức triển khai.
- [ ] Pentest, threat model và monitoring.
- [ ] Signed AAB, Play testing tracks và crash reporting có đồng ý người dùng.
- [ ] Accessibility/screenshot/performance regression suite.

Mỗi mục chỉ chuyển sang hoàn thành khi có code, test và bằng chứng chạy thực tế.
