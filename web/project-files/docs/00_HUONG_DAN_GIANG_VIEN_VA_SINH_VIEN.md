# Hướng dẫn UIGrade AI

## Sản phẩm

Web app quản lý rubric, nhận metadata/ảnh bài làm, tính điểm metric minh bạch, cho
giảng viên duyệt và sinh phản hồi từ lỗi rubric. Repo Next.js có sẵn là nền tham
khảo; sinh viên không được quảng bá AI là người chấm cuối cùng.

## Lộ trình 8 tuần

1. Chạy baseline, hiểu MAE, bias và within-1-point.
2. Chuẩn hóa rubric 10 điểm và 3 bài tập mẫu.
3. Xây nhập case, validation và xem ảnh cạnh nhau.
4. Tính layout similarity/contrast và ánh xạ sang rubric có giải thích.
5. Thu ít nhất 30 bài đã được giảng viên chấm độc lập; tách tập hiệu chỉnh/test.
6. So sánh điểm tự động với giảng viên theo bài và kích thước màn hình.
7. Thêm phản hồi AI nhưng khóa điểm; giảng viên duyệt/sửa phản hồi.
8. Nộp web demo, rubric, dữ liệu ẩn danh, báo cáo agreement và ca sai.

Không dùng tên/mã sinh viên trong dữ liệu công khai. Không huấn luyện/chỉnh ngưỡng
trên tập test. Phản hồi phải chỉ ra tiêu chí, bằng chứng và cách sửa.
