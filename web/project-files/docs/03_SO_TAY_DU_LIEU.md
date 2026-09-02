# Sổ tay dữ liệu UIGrade

`sample_ui_grading_cases.jsonl` mô tả đường dẫn ảnh/rubric;
`student_practice_grades.jsonl` là dữ liệu synthetic để kiểm tra agreement. Schema
tại `data/ui_grade.schema.json`. Mỗi case có mã ẩn danh, assignment, device, điểm
giảng viên, điểm tự động, tổng rubric và metric ảnh.

Ảnh baseline và submission phải cùng kích thước/theme/trạng thái. Không coi pixel
difference là điểm cuối vì nội dung động, font và anti-aliasing. Ground truth do
giảng viên chấm trước khi xem auto score. Không đưa source/APK có thông tin cá nhân
hoặc khóa bí mật vào repo.
