-- ====================================================================
-- Seed: seed.sql
-- Description: Seed initial mock/demo data for UIGrade AI
-- ====================================================================

-- 1. Insert System Configs
INSERT INTO public.system_configs (key, value, description)
VALUES 
    ('app_name', '"UIGrade AI"'::jsonb, 'Tên hệ thống hiển thị trên giao diện'),
    ('system_status', '"active"'::jsonb, 'Trạng thái hoạt động hệ thống'),
    ('gemini_model', '"gemini-2.5-flash"'::jsonb, 'Mô hình AI Gemini dùng cho phân tích UI'),
    ('max_upload_size_mb', '50'::jsonb, 'Dung lượng tải lên tối đa (MB)'),
    ('email_notifications_enabled', 'true'::jsonb, 'Bật thông báo email tự động'),
    ('auto_grading_enabled', 'true'::jsonb, 'Bật chế độ AI gợi ý điểm tự động')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 2. Create Demo Profiles in public.profiles
-- Using predictable UUIDs for development seed
INSERT INTO public.profiles (id, full_name, email, avatar_url, role, status, phone, student_code, department)
VALUES
    ('a0000000-0000-0000-0000-000000000001', 'Quản trị viên Hệ thống', 'admin@uigrade.edu.vn', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', 'admin', 'active', '0901234567', 'ADM001', 'Phòng CNTT'),
    ('b0000000-0000-0000-0000-000000000002', 'TS. Nguyễn Văn Giảng', 'teacher@uigrade.edu.vn', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', 'lecturer', 'active', '0912345678', 'GV001', 'Khoa Công nghệ Thông tin'),
    ('b0000000-0000-0000-0000-000000000003', 'ThS. Trần Thị Bình', 'tran.thi.b@uigrade.edu.vn', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150', 'lecturer', 'active', '0923456789', 'GV002', 'Khoa Công nghệ Phần mềm'),
    ('c0000000-0000-0000-0000-000000000004', 'Lê Văn Học', 'student@uigrade.edu.vn', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150', 'student', 'active', '0934567890', 'SV2026001', 'KTPM2022'),
    ('c0000000-0000-0000-0000-000000000005', 'Phạm Thị Mai', 'sv002@uigrade.edu.vn', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', 'student', 'active', '0945678901', 'SV2026002', 'KTPM2022'),
    ('c0000000-0000-0000-0000-000000000006', 'Hoàng Quốc Bảo', 'sv003@uigrade.edu.vn', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', 'student', 'active', '0956789012', 'SV2026003', 'HTTT2022')
ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, role = EXCLUDED.role;

-- 3. Insert Classes
INSERT INTO public.classes (id, name, description, class_code, lecturer_id, semester, academic_year, subject_code, status, cover_color)
VALUES
    ('d0000000-0000-0000-0000-000000000001', 'Lập trình Android Nâng cao - L01', 'Môn học chuyên sâu về phát triển ứng dụng Android, kiến trúc Clean Architecture, Jetpack Compose và tự động hóa kiểm thử UI.', 'ANDR2026-L01', 'b0000000-0000-0000-0000-000000000002', 'HK1', '2025-2026', 'ITEC3402', 'active', '#0284C7'),
    ('d0000000-0000-0000-0000-000000000002', 'Thiết kế Giao diện Mobile UI/UX', 'Khóa học thực hành thiết kế và triển khai giao diện chuẩn Material Design 3 trên Android và Flutter.', 'UIUX2026-L02', 'b0000000-0000-0000-0000-000000000002', 'HK1', '2025-2026', 'ITEC2205', 'active', '#0EA5E9'),
    ('d0000000-0000-0000-0000-000000000003', 'Kiểm thử Phần mềm Tự động - L02', 'Phương pháp kiểm thử đơn vị, kiểm thử tích hợp và kiểm thử giao diện tự động bằng AI trên thiết bị giả lập.', 'TEST2026-L03', 'b0000000-0000-0000-0000-000000000003', 'HK1', '2025-2026', 'ITEC4201', 'active', '#38BDF8')
ON CONFLICT (id) DO NOTHING;

-- 4. Insert Class Members
INSERT INTO public.class_members (class_id, student_id, status)
VALUES
    ('d0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000004', 'active'),
    ('d0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000005', 'active'),
    ('d0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000006', 'active'),
    ('d0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000004', 'active'),
    ('d0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000005', 'active')
ON CONFLICT (class_id, student_id) DO NOTHING;

-- 5. Insert Assignments
INSERT INTO public.assignments (id, class_id, lecturer_id, title, description, instructions, due_at, max_score, weight, status, is_active, allow_late_submission, rubric, test_scenarios)
VALUES
    (
        'e0000000-0000-0000-0000-000000000001',
        'd0000000-0000-0000-0000-000000000001',
        'b0000000-0000-0000-0000-000000000002',
        'Bài tập 1: Màn hình Đăng nhập & Đăng ký Material Design 3',
        'Xây dựng 2 màn hình Login và Register hoàn chỉnh với validation form, animation chuyển đổi trạng thái và bố cục chuẩn Material You.',
        '### Hướng dẫn nộp bài:\n1. Xuất file APK từ Android Studio (release hoặc debug build).\n2. Nén toàn bộ mã nguồn thành file zip.\n3. Tải file APK lên hệ thống UIGrade AI để chạy kiểm thử giao diện tự động.',
        NOW() + INTERVAL '7 days',
        10.0,
        1.0,
        'published',
        true,
        true,
        '[
            {"name": "Độ chính xác bố cục UI (Pixel Match & Bounding Box)", "maxScore": 4.0, "description": "Kiểm tra vị trí nút bấm, trường nhập liệu và căn chỉnh lề theo bản thiết kế"},
            {"name": "Xử lý Form Validation & Thông báo lỗi", "maxScore": 3.0, "description": "Kiểm tra email, độ mạnh mật khẩu và hiển thị lỗi inline khi sai dữ liệu"},
            {"name": "Phản hồi tương tác & Trạng thái Loading", "maxScore": 2.0, "description": "Hiệu ứng khi click, loading spinner khi submit form và vô hiệu hóa nút bấm"},
            {"name": "Hỗ trợ Responsive & Chế độ Tối (Dark Mode)", "maxScore": 1.0, "description": "Giao diện hiển thị tốt trên các kích thước màn hình và theme sáng/tối"}
        ]'::jsonb,
        '[
            {"name": "Kiểm tra mở ứng dụng", "action": "launch", "expected": "Màn hình Login hiển thị trong vòng 1.5s"},
            {"name": "Nhập form để trống", "action": "click_submit", "expected": "Hiển thị thông báo yêu cầu nhập email và mật khẩu"},
            {"name": "Nhập form hợp lệ", "action": "input_valid_credentials", "expected": "Chuyển sang màn hình Dashboard chính"}
        ]'::jsonb
    ),
    (
        'e0000000-0000-0000-0000-000000000002',
        'd0000000-0000-0000-0000-000000000001',
        'b0000000-0000-0000-0000-000000000002',
        'Bài tập 2: Ứng dụng Danh mục Sản phẩm & Giỏ hàng Jetpack Compose',
        'Triển khai danh sách sản phẩm dạng LazyColumn/Grid, hỗ trợ tìm kiếm, lọc theo phân loại và xem chi tiết sản phẩm.',
        '### Hướng dẫn nộp bài:\n- Nộp file APK có chứa mock data ít nhất 10 sản phẩm.\n- Đảm bảo hình ảnh tải mượt mà với Coil hoặc Glide.',
        NOW() + INTERVAL '14 days',
        10.0,
        1.5,
        'published',
        true,
        true,
        '[
            {"name": "Danh sách sản phẩm & Bố cục Grid", "maxScore": 4.0, "description": "Hiển thị card sản phẩm đều đặn, ảnh bo góc, giá tiền định dạng VNĐ"},
            {"name": "Chức năng Tìm kiếm & Bộ lọc", "maxScore": 3.0, "description": "Tìm kiếm tức thì theo tên và lọc theo danh mục không bị giật lag"},
            {"name": "Màn hình Chi tiết Sản phẩm", "maxScore": 3.0, "description": "Xem chi tiết, chọn số lượng và nút Thêm vào giỏ hàng có hiệu ứng phản hồi"}
        ]'::jsonb,
        '[]'::jsonb
    ),
    (
        'e0000000-0000-0000-0000-000000000003',
        'd0000000-0000-0000-0000-000000000002',
        'b0000000-0000-0000-0000-000000000002',
        'Bài tập 1: Dashboard Thống kê & Biểu đồ UI/UX',
        'Thiết kế dashboard quản lý chi tiêu cá nhân với biểu đồ tròn phân loại chi phí và biểu đồ cột theo tháng.',
        'Đảm bảo độ tương phản màu sắc đạt chuẩn WCAG AA và có tooltip khi chạm vào các điểm biểu đồ.',
        NOW() + INTERVAL '10 days',
        10.0,
        1.0,
        'published',
        true,
        true,
        '[
            {"name": "Thiết kế Card Thống kê Tổng quan", "maxScore": 3.0, "description": "Hiển thị số dư, thu nhập, chi tiêu rõ ràng và trực quan"},
            {"name": "Hiển thị Biểu đồ (Charts)", "maxScore": 4.0, "description": "Biểu đồ tròn và cột hiển thị đúng tỷ lệ, có chú thích màu sắc"},
            {"name": "Trải nghiệm Tương tác & Micro-animation", "maxScore": 3.0, "description": "Hiệu ứng khi chuyển tab và load số liệu mượt mà"}
        ]'::jsonb,
        '[]'::jsonb
    )
ON CONFLICT (id) DO NOTHING;

-- 6. Insert Submissions
INSERT INTO public.submissions (
    id, assignment_id, student_id, content, status, is_late, score, ai_suggested_score,
    ai_feedback, teacher_feedback, graded_at, graded_by, breakdown, submitted_at
)
VALUES
    (
        'f0000000-0000-0000-0000-000000000001',
        'e0000000-0000-0000-0000-000000000001',
        'c0000000-0000-0000-0000-000000000004',
        'Em đã hoàn thành màn hình Đăng nhập và Đăng ký theo chuẩn Material Design 3. Đã bổ sung validation Regex cho email và password strength indicator.',
        'graded',
        false,
        9.0,
        8.8,
        '### Đánh giá tự động bởi UIGrade AI:\n- **Bố cục UI**: 3.8/4.0 điểm. Căn lề các thành phần chuẩn xác (95% similarity so với baseline).\n- **Form Validation**: 2.8/3.0 điểm. Xử lý tốt các trường hợp trống và định dạng sai.\n- **Tương tác**: 1.8/2.0 điểm. Nút bấm có trạng thái loading rõ ràng.\n- **Responsive/Dark Mode**: 0.9/1.0 điểm. Theme dark dịu mắt.',
        'Bài làm rất tốt, giao diện sạch sẽ, xử lý tương tác mượt mà. Tiếp tục phát huy ở bài tập tiếp theo!',
        NOW() - INTERVAL '1 day',
        'b0000000-0000-0000-0000-000000000002',
        '[
            {"criterion": "Độ chính xác bố cục UI (Pixel Match & Bounding Box)", "score": 3.8, "maxScore": 4.0},
            {"criterion": "Xử lý Form Validation & Thông báo lỗi", "score": 2.8, "maxScore": 3.0},
            {"criterion": "Phản hồi tương tác & Trạng thái Loading", "score": 1.8, "maxScore": 2.0},
            {"criterion": "Hỗ trợ Responsive & Chế độ Tối (Dark Mode)", "score": 0.6, "maxScore": 1.0}
        ]'::jsonb,
        NOW() - INTERVAL '2 days'
    ),
    (
        'f0000000-0000-0000-0000-000000000002',
        'e0000000-0000-0000-0000-000000000001',
        'c0000000-0000-0000-0000-000000000005',
        'Bài làm đăng nhập bằng Jetpack Compose của nhóm em.',
        'pending',
        false,
        NULL,
        7.5,
        '### Nhận xét AI sơ bộ:\n- Giao diện đáp ứng yêu cầu cơ bản nhưng khoảng cách padding giữa các input hơi nhỏ so với thiết kế.',
        NULL,
        NULL,
        NULL,
        '[]'::jsonb,
        NOW() - INTERVAL '5 hours'
    )
ON CONFLICT (id) DO NOTHING;

-- 7. Insert Notifications
INSERT INTO public.notifications (user_id, title, message, type, is_read, link)
VALUES
    ('c0000000-0000-0000-0000-000000000004', 'Đã có kết quả chấm bài', 'Bài tập 1: Màn hình Đăng nhập & Đăng ký đã được giảng viên chấm 9.0/10.', 'grade', false, '/ui/my_results'),
    ('c0000000-0000-0000-0000-000000000004', 'Bài tập mới được giao', 'Giảng viên đã giao Bài tập 2: Ứng dụng Danh mục Sản phẩm & Giỏ hàng.', 'assignment', false, '/ui/assignment_list'),
    ('b0000000-0000-0000-0000-000000000002', 'Sinh viên nộp bài mới', 'Sinh viên Phạm Thị Mai vừa nộp bài cho Bài tập 1.', 'assignment', false, '/ui/grading_detail')
ON CONFLICT DO NOTHING;
