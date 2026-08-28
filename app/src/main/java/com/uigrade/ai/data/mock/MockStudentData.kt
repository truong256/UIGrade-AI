package com.uigrade.ai.data.mock

import com.uigrade.ai.domain.model.ClassAnnouncement
import com.uigrade.ai.domain.model.LearningMaterial
import com.uigrade.ai.domain.model.StudentNotification
import com.uigrade.ai.domain.model.StudentNotificationType
import java.time.LocalDateTime

/** Student-only seed content kept separate from demo authentication records. */
object MockStudentData {
    val announcements = listOf(
        ClassAnnouncement(
            id = "announcement-1",
            classroomId = "cls1",
            authorId = "l1",
            authorName = "Giảng viên phụ trách",
            title = "Chuẩn bị buổi học Compose",
            content = "Cài Android Studio, đồng bộ project và đọc trước tài liệu Material 3.",
            createdAt = LocalDateTime.of(2026, 8, 27, 8, 30),
            attachmentUri = "https://developer.android.com/develop/ui/compose"
        ),
        ClassAnnouncement(
            id = "announcement-2",
            classroomId = "cls1",
            authorId = "l1",
            authorName = "Giảng viên phụ trách",
            title = "Nhắc hạn bài tập 01",
            content = "Hãy kiểm tra nội dung và tệp đính kèm trước khi gửi bài.",
            createdAt = LocalDateTime.of(2026, 8, 28, 9, 0)
        )
    )

    val materials = listOf(
        LearningMaterial(
            id = "material-1",
            classroomId = "cls1",
            title = "Tài liệu Jetpack Compose",
            description = "Hướng dẫn chính thức về Compose UI.",
            type = "Liên kết",
            uri = "https://developer.android.com/develop/ui/compose",
            createdAt = LocalDateTime.of(2026, 8, 2, 8, 0)
        ),
        LearningMaterial(
            id = "material-2",
            classroomId = "cls1",
            title = "Material Design 3",
            description = "Nguyên tắc màu sắc, typography và component.",
            type = "Liên kết",
            uri = "https://m3.material.io/",
            createdAt = LocalDateTime.of(2026, 8, 3, 8, 0)
        )
    )

    val notifications = listOf(
        StudentNotification(
            id = "student-notice-1",
            studentId = "s1",
            title = "Bài tập sắp đến hạn",
            message = "Một bài tập trong lớp của bạn sắp đến hạn.",
            type = StudentNotificationType.DEADLINE_APPROACHING,
            createdAt = LocalDateTime.of(2026, 8, 28, 8, 0),
            classroomId = "cls1",
            assignmentId = "a1"
        ),
        StudentNotification(
            id = "student-notice-2",
            studentId = "s1",
            title = "Kết quả đã được công bố",
            message = "Kết quả một bài tập của bạn đã sẵn sàng.",
            type = StudentNotificationType.GRADE_RELEASED,
            createdAt = LocalDateTime.of(2026, 8, 28, 15, 5),
            isRead = true,
            classroomId = "cls1",
            assignmentId = "a1",
            submissionId = "sub1"
        ),
        StudentNotification(
            id = "student-notice-3",
            studentId = "s1",
            title = "Thông báo mới trong lớp",
            message = "Giảng viên đã đăng tài liệu chuẩn bị buổi học.",
            type = StudentNotificationType.CLASS_ANNOUNCEMENT,
            createdAt = LocalDateTime.of(2026, 8, 27, 8, 35),
            classroomId = "cls1"
        )
    )
}
