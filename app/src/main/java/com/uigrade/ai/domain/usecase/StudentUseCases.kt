package com.uigrade.ai.domain.usecase

import com.uigrade.ai.domain.model.Assignment
import com.uigrade.ai.domain.model.AssignmentPublishStatus
import com.uigrade.ai.domain.model.AssignmentStatus
import com.uigrade.ai.domain.model.AssignmentWithStatus
import com.uigrade.ai.domain.model.ClassAnnouncement
import com.uigrade.ai.domain.model.Classroom
import com.uigrade.ai.domain.model.ClassroomStatus
import com.uigrade.ai.domain.model.GradingResult
import com.uigrade.ai.domain.model.JoinClassResult
import com.uigrade.ai.domain.model.JoinRequest
import com.uigrade.ai.domain.model.JoinRequestStatus
import com.uigrade.ai.domain.model.LearningMaterial
import com.uigrade.ai.domain.model.StudentClassProgress
import com.uigrade.ai.domain.model.StudentNotification
import com.uigrade.ai.domain.model.StudentProgress
import com.uigrade.ai.domain.model.Submission
import com.uigrade.ai.domain.model.SubmissionAttachment
import com.uigrade.ai.domain.model.User
import com.uigrade.ai.domain.model.UserRole
import com.uigrade.ai.domain.repository.AssignmentRepository
import com.uigrade.ai.domain.repository.AuthRepository
import com.uigrade.ai.domain.repository.ClassroomRepository
import com.uigrade.ai.domain.repository.GradingRepository
import com.uigrade.ai.domain.repository.NotificationRepository
import com.uigrade.ai.domain.repository.SubmissionRepository
import com.uigrade.ai.domain.repository.UserRepository
import java.net.URI
import javax.inject.Inject

data class StudentDashboardData(
    val user: User,
    val classrooms: List<Classroom>,
    val assignments: List<AssignmentWithStatus>,
    val submissions: List<Submission>,
    val grades: List<GradingResult>,
    val notifications: List<StudentNotification>
)

data class StudentClassroomData(
    val classroom: Classroom,
    val assignments: List<AssignmentWithStatus>,
    val announcements: List<ClassAnnouncement>,
    val materials: List<LearningMaterial>
)

data class StudentJoinRequestItem(
    val request: JoinRequest,
    val classroom: Classroom?
)

data class StudentAssignmentData(
    val item: AssignmentWithStatus,
    val classroom: Classroom,
    val history: List<Submission>,
    val releasedGrade: GradingResult?
)

class GetStudentDashboardUseCase @Inject constructor(
    private val authRepository: AuthRepository,
    private val classroomRepository: ClassroomRepository,
    private val assignmentRepository: AssignmentRepository,
    private val submissionRepository: SubmissionRepository,
    private val gradingRepository: GradingRepository,
    private val notificationRepository: NotificationRepository
) {
    suspend operator fun invoke(): Result<StudentDashboardData> {
        val student = requireStudent(authRepository).getOrElse { return Result.failure(it) }
        return runCatching {
            StudentDashboardData(
                user = student,
                classrooms = classroomRepository.getClassroomsForStudent(student.id),
                assignments = assignmentRepository.getAssignmentsForStudent(student.id),
                submissions = submissionRepository.getSubmissionsForStudent(student.id),
                grades = gradingRepository.getGradingResultsForStudent(student.id),
                notifications = notificationRepository.getForStudent(student.id)
            )
        }
    }
}

class GetSecureStudentAssignmentsUseCase @Inject constructor(
    private val authRepository: AuthRepository,
    private val assignmentRepository: AssignmentRepository
) {
    suspend operator fun invoke(): Result<List<AssignmentWithStatus>> {
        val student = requireStudent(authRepository).getOrElse { return Result.failure(it) }
        return runCatching { assignmentRepository.getAssignmentsForStudent(student.id) }
    }
}

class GetStudentAssignmentDataUseCase @Inject constructor(
    private val authRepository: AuthRepository,
    private val classroomRepository: ClassroomRepository,
    private val assignmentRepository: AssignmentRepository,
    private val submissionRepository: SubmissionRepository,
    private val gradingRepository: GradingRepository
) {
    suspend operator fun invoke(assignmentId: String): Result<StudentAssignmentData> {
        val student = requireStudent(authRepository).getOrElse { return Result.failure(it) }
        val assignment = assignmentRepository.getAssignmentById(assignmentId)
            ?: return Result.failure(IllegalArgumentException("Không tìm thấy bài tập."))
        if (assignment.publishStatus == AssignmentPublishStatus.DRAFT || assignment.isArchived) {
            return Result.failure(IllegalArgumentException("Bạn không có quyền xem bài tập này."))
        }
        if (!classroomRepository.isStudentEnrolled(assignment.classroomId, student.id)) {
            return Result.failure(IllegalArgumentException("Bạn không có quyền xem nội dung này."))
        }
        val classroom = classroomRepository.getClassroomById(assignment.classroomId)
            ?: return Result.failure(IllegalArgumentException("Không tìm thấy lớp học."))
        val item = assignmentRepository.getAssignmentsForStudentInClassroom(student.id, classroom.id)
            .firstOrNull { it.assignment.id == assignmentId }
            ?: return Result.failure(IllegalArgumentException("Bạn không có quyền xem bài tập này."))
        val history = submissionRepository.getSubmissionsForStudentAssignment(student.id, assignmentId)
        val releasedGrades = mutableListOf<GradingResult>()
        history.forEach { submission ->
            gradingRepository.getGradingResultForSubmission(submission.id)?.let(releasedGrades::add)
        }
        val grade = releasedGrades.maxByOrNull { it.gradedAt }
        return Result.success(StudentAssignmentData(item, classroom, history, grade))
    }
}

class GetStudentClassroomDataUseCase @Inject constructor(
    private val authRepository: AuthRepository,
    private val classroomRepository: ClassroomRepository,
    private val assignmentRepository: AssignmentRepository
) {
    suspend operator fun invoke(classroomId: String): Result<StudentClassroomData> {
        val student = requireStudent(authRepository).getOrElse { return Result.failure(it) }
        val classroom = classroomRepository.getClassroomById(classroomId)
            ?: return Result.failure(IllegalArgumentException("Không tìm thấy lớp học."))
        if (!classroomRepository.isStudentEnrolled(classroomId, student.id)) {
            return Result.failure(IllegalArgumentException("Bạn không có quyền xem lớp học này."))
        }
        return runCatching {
            StudentClassroomData(
                classroom = classroom,
                assignments = assignmentRepository.getAssignmentsForStudentInClassroom(student.id, classroomId),
                announcements = classroomRepository.getAnnouncements(classroomId),
                materials = classroomRepository.getLearningMaterials(classroomId)
            )
        }
    }
}

class PreviewJoinClassroomUseCase @Inject constructor(
    private val authRepository: AuthRepository,
    private val classroomRepository: ClassroomRepository
) {
    suspend operator fun invoke(joinCode: String): Result<Classroom> {
        val student = requireStudent(authRepository).getOrElse { return Result.failure(it) }
        val code = joinCode.trim().uppercase()
        if (code.isBlank()) return Result.failure(IllegalArgumentException("Vui lòng nhập mã lớp."))
        val classroom = classroomRepository.findByJoinCode(code)
            ?: return Result.failure(IllegalArgumentException("Không tìm thấy lớp học với mã này."))
        if (classroom.status == ClassroomStatus.ARCHIVED) {
            return Result.failure(IllegalArgumentException("Mã lớp đã hết hiệu lực."))
        }
        if (!classroom.joinEnabled) {
            return Result.failure(IllegalArgumentException("Lớp học hiện không nhận thêm sinh viên."))
        }
        if (classroomRepository.isStudentEnrolled(classroom.id, student.id)) {
            return Result.failure(IllegalArgumentException("Bạn đã tham gia lớp học này."))
        }
        if (classroomRepository.getJoinRequestsForStudent(student.id).any {
                it.classroomId == classroom.id && it.status == JoinRequestStatus.PENDING
            }) {
            return Result.failure(IllegalStateException("Yêu cầu tham gia của bạn đang chờ giảng viên duyệt."))
        }
        return Result.success(classroom)
    }
}

class RequestStudentJoinClassroomUseCase @Inject constructor(
    private val authRepository: AuthRepository,
    private val classroomRepository: ClassroomRepository
) {
    suspend operator fun invoke(joinCode: String): Result<JoinClassResult> {
        val student = requireStudent(authRepository).getOrElse { return Result.failure(it) }
        val code = joinCode.trim().uppercase()
        if (code.isBlank()) return Result.failure(IllegalArgumentException("Vui lòng nhập mã lớp."))
        return classroomRepository.requestJoinClassroom(code, student.id)
    }
}

class GetStudentJoinRequestsUseCase @Inject constructor(
    private val authRepository: AuthRepository,
    private val classroomRepository: ClassroomRepository
) {
    suspend operator fun invoke(): Result<List<StudentJoinRequestItem>> {
        val student = requireStudent(authRepository).getOrElse { return Result.failure(it) }
        return runCatching {
            classroomRepository.getJoinRequestsForStudent(student.id).map { request ->
                StudentJoinRequestItem(request, classroomRepository.getClassroomById(request.classroomId))
            }
        }
    }
}

class CancelStudentJoinRequestUseCase @Inject constructor(
    private val authRepository: AuthRepository,
    private val classroomRepository: ClassroomRepository
) {
    suspend operator fun invoke(requestId: String): Result<Unit> {
        val student = requireStudent(authRepository).getOrElse { return Result.failure(it) }
        return classroomRepository.cancelJoinRequest(requestId, student.id)
    }
}

class LeaveStudentClassroomUseCase @Inject constructor(
    private val authRepository: AuthRepository,
    private val classroomRepository: ClassroomRepository,
    private val submissionRepository: SubmissionRepository
) {
    suspend operator fun invoke(classroomId: String): Result<Unit> {
        val student = requireStudent(authRepository).getOrElse { return Result.failure(it) }
        if (!classroomRepository.isStudentEnrolled(classroomId, student.id)) {
            return Result.failure(IllegalArgumentException("Bạn không còn là thành viên của lớp học này."))
        }
        val hasLearningHistory = submissionRepository.getSubmissionsForStudent(student.id)
            .any { it.classroomId == classroomId && !it.isDraft }
        if (hasLearningHistory) {
            return Result.failure(
                IllegalStateException("Bạn đã có bài nộp trong lớp nên không thể tự rời lớp. Hãy liên hệ giảng viên.")
            )
        }
        return classroomRepository.leaveClassroom(classroomId, student.id)
    }
}

class SaveStudentDraftUseCase @Inject constructor(
    private val authRepository: AuthRepository,
    private val assignmentRepository: AssignmentRepository,
    private val classroomRepository: ClassroomRepository,
    private val submissionRepository: SubmissionRepository
) {
    suspend operator fun invoke(
        assignmentId: String,
        content: String,
        linkUrl: String,
        attachments: List<SubmissionAttachment>
    ): Result<Submission> {
        val student = requireStudent(authRepository).getOrElse { return Result.failure(it) }
        val assignment = assignmentRepository.getAssignmentById(assignmentId)
            ?: return Result.failure(IllegalArgumentException("Không tìm thấy bài tập."))
        if (!classroomRepository.isStudentEnrolled(assignment.classroomId, student.id)) {
            return Result.failure(IllegalArgumentException("Bạn cần tham gia lớp trước."))
        }
        validateSubmissionInput(assignment, content, linkUrl, attachments, requireContent = false)
            .exceptionOrNull()?.let { return Result.failure(it) }
        return runCatching {
            submissionRepository.saveDraft(
                assignmentId = assignment.id,
                classroomId = assignment.classroomId,
                studentId = student.id,
                content = content.trim(),
                linkUrl = linkUrl.trim(),
                attachments = attachments
            )
        }
    }
}

class SubmitStudentDraftUseCase @Inject constructor(
    private val authRepository: AuthRepository,
    private val assignmentRepository: AssignmentRepository,
    private val submissionRepository: SubmissionRepository
) {
    suspend operator fun invoke(submissionId: String): Result<Submission> {
        val student = requireStudent(authRepository).getOrElse { return Result.failure(it) }
        val draft = submissionRepository.getSubmissionById(submissionId)
            ?.takeIf { it.studentId == student.id && it.isDraft }
            ?: return Result.failure(IllegalArgumentException("Không tìm thấy bản nháp."))
        val assignment = assignmentRepository.getAssignmentById(draft.assignmentId)
            ?: return Result.failure(IllegalArgumentException("Không tìm thấy bài tập."))
        validateSubmissionInput(
            assignment,
            draft.content,
            draft.linkUrl,
            draft.attachments,
            requireContent = true
        ).exceptionOrNull()?.let { return Result.failure(it) }
        return runCatching { submissionRepository.submitDraft(submissionId, student.id) }
    }
}

class DeleteStudentDraftUseCase @Inject constructor(
    private val authRepository: AuthRepository,
    private val submissionRepository: SubmissionRepository
) {
    suspend operator fun invoke(submissionId: String): Result<Unit> {
        val student = requireStudent(authRepository).getOrElse { return Result.failure(it) }
        return submissionRepository.deleteDraft(submissionId, student.id)
    }
}

class GetOwnedStudentSubmissionUseCase @Inject constructor(
    private val authRepository: AuthRepository,
    private val submissionRepository: SubmissionRepository
) {
    suspend operator fun invoke(submissionId: String): Result<Submission> {
        val student = requireStudent(authRepository).getOrElse { return Result.failure(it) }
        val submission = submissionRepository.getSubmissionById(submissionId)
            ?.takeIf { it.studentId == student.id }
            ?: return Result.failure(IllegalArgumentException("Bạn không có quyền xem bài nộp này."))
        return Result.success(submission)
    }
}

class GetStudentSubmissionHistoryUseCase @Inject constructor(
    private val authRepository: AuthRepository,
    private val submissionRepository: SubmissionRepository
) {
    suspend operator fun invoke(assignmentId: String): Result<List<Submission>> {
        val student = requireStudent(authRepository).getOrElse { return Result.failure(it) }
        return runCatching {
            submissionRepository.getSubmissionsForStudentAssignment(student.id, assignmentId)
        }
    }
}

class GetOwnedStudentGradeUseCase @Inject constructor(
    private val authRepository: AuthRepository,
    private val submissionRepository: SubmissionRepository,
    private val gradingRepository: GradingRepository
) {
    suspend operator fun invoke(submissionId: String): Result<GradingResult?> {
        val student = requireStudent(authRepository).getOrElse { return Result.failure(it) }
        val submission = submissionRepository.getSubmissionById(submissionId)
            ?.takeIf { it.studentId == student.id }
            ?: return Result.failure(IllegalArgumentException("Bạn không có quyền xem kết quả này."))
        return Result.success(gradingRepository.getGradingResultForSubmission(submission.id))
    }
}

class GetStudentProgressUseCase @Inject constructor(
    private val authRepository: AuthRepository,
    private val classroomRepository: ClassroomRepository,
    private val assignmentRepository: AssignmentRepository,
    private val gradingRepository: GradingRepository
) {
    suspend operator fun invoke(): Result<StudentProgress> {
        val student = requireStudent(authRepository).getOrElse { return Result.failure(it) }
        return runCatching {
            val classrooms = classroomRepository.getClassroomsForStudent(student.id)
            val assignments = assignmentRepository.getAssignmentsForStudent(student.id)
            val grades = gradingRepository.getGradingResultsForStudent(student.id)
            val submittedStatuses = setOf(
                AssignmentStatus.SUBMITTED,
                AssignmentStatus.LATE,
                AssignmentStatus.GRADED,
                AssignmentStatus.RESUBMISSION_REQUIRED
            )
            val percentages = grades.mapNotNull { grade ->
                grade.maxScore.takeIf { it > 0 }?.let {
                    (grade.totalScore.coerceIn(0, it) * 100f / it).takeIf(Float::isFinite)
                }
            }
            val byClassroom = classrooms.map { classroom ->
                val classAssignments = assignments.filter { it.assignment.classroomId == classroom.id }
                val classGrades = grades.filter { grade ->
                    classAssignments.any { it.assignment.id == grade.assignmentId }
                }
                val classPercentages = classGrades.mapNotNull { grade ->
                    grade.maxScore.takeIf { it > 0 }?.let {
                        (grade.totalScore.coerceIn(0, it) * 100f / it).takeIf(Float::isFinite)
                    }
                }
                StudentClassProgress(
                    classroom = classroom,
                    assignedCount = classAssignments.size,
                    submittedCount = classAssignments.count { it.status in submittedStatuses },
                    gradedCount = classAssignments.count { it.status == AssignmentStatus.GRADED },
                    averagePercent = classPercentages.takeIf { it.isNotEmpty() }?.average()?.toFloat()
                )
            }
            StudentProgress(
                assignedCount = assignments.size,
                submittedCount = assignments.count { it.status in submittedStatuses },
                missingCount = assignments.count {
                    it.status == AssignmentStatus.NOT_SUBMITTED || it.status == AssignmentStatus.OVERDUE
                },
                lateCount = assignments.count { it.status == AssignmentStatus.LATE },
                gradedCount = assignments.count { it.status == AssignmentStatus.GRADED },
                averagePercent = percentages.takeIf { it.isNotEmpty() }?.average()?.toFloat(),
                byClassroom = byClassroom
            )
        }
    }
}

class GetStudentNotificationsUseCase @Inject constructor(
    private val authRepository: AuthRepository,
    private val notificationRepository: NotificationRepository
) {
    suspend operator fun invoke(): Result<List<StudentNotification>> {
        val student = requireStudent(authRepository).getOrElse { return Result.failure(it) }
        return runCatching { notificationRepository.getForStudent(student.id) }
    }
}

class MarkStudentNotificationReadUseCase @Inject constructor(
    private val authRepository: AuthRepository,
    private val notificationRepository: NotificationRepository
) {
    suspend operator fun invoke(notificationId: String): Result<StudentNotification> {
        val student = requireStudent(authRepository).getOrElse { return Result.failure(it) }
        return notificationRepository.markStudentRead(notificationId, student.id)
    }
}

class MarkAllStudentNotificationsReadUseCase @Inject constructor(
    private val authRepository: AuthRepository,
    private val notificationRepository: NotificationRepository
) {
    suspend operator fun invoke(): Result<Unit> {
        val student = requireStudent(authRepository).getOrElse { return Result.failure(it) }
        return notificationRepository.markAllStudentRead(student.id)
    }
}

class DeleteStudentNotificationUseCase @Inject constructor(
    private val authRepository: AuthRepository,
    private val notificationRepository: NotificationRepository
) {
    suspend operator fun invoke(notificationId: String): Result<Unit> {
        val student = requireStudent(authRepository).getOrElse { return Result.failure(it) }
        return notificationRepository.deleteStudent(notificationId, student.id)
    }
}

class UpdateStudentProfileUseCase @Inject constructor(
    private val authRepository: AuthRepository,
    private val userRepository: UserRepository
) {
    suspend operator fun invoke(
        name: String,
        studentId: String,
        phone: String,
        department: String,
        organization: String,
        bio: String,
        avatarUrl: String?
    ): Result<User> {
        val student = requireStudent(authRepository).getOrElse { return Result.failure(it) }
        if (name.trim().isBlank()) return Result.failure(IllegalArgumentException("Vui lòng nhập họ và tên."))
        if (studentId.trim().isBlank()) return Result.failure(IllegalArgumentException("Mã sinh viên không được để trống."))
        if (phone.isNotBlank() && !phone.matches("^[0-9+ ]{8,15}$".toRegex())) {
            return Result.failure(IllegalArgumentException("Số điện thoại không hợp lệ."))
        }
        return runCatching {
            userRepository.updateUser(
                student.copy(
                    name = name.trim(),
                    studentId = studentId.trim().uppercase(),
                    phone = phone.trim(),
                    department = department.trim(),
                    organization = organization.trim(),
                    bio = bio.trim(),
                    avatarUrl = avatarUrl
                )
            )
        }
    }
}

private fun validateSubmissionInput(
    assignment: Assignment,
    content: String,
    linkUrl: String,
    attachments: List<SubmissionAttachment>,
    requireContent: Boolean
): Result<Unit> {
    if (requireContent && content.isBlank() && linkUrl.isBlank() && attachments.isEmpty()) {
        return Result.failure(IllegalArgumentException("Vui lòng nhập nội dung bài làm hoặc đính kèm tệp."))
    }
    if (linkUrl.isNotBlank()) {
        val valid = runCatching { URI(linkUrl.trim()) }.getOrNull()?.let {
            it.scheme.equals("http", true) || it.scheme.equals("https", true)
        } == true
        if (!valid) return Result.failure(IllegalArgumentException("Đường dẫn không hợp lệ."))
    }
    if (attachments.size > 5) {
        return Result.failure(IllegalArgumentException("Bạn chỉ được đính kèm tối đa 5 tệp."))
    }
    val allowed = assignment.allowedFileTypes.map(String::lowercase)
    attachments.forEach { attachment ->
        if (attachment.sizeBytes != null && attachment.sizeBytes > 25L * 1024 * 1024) {
            return Result.failure(IllegalArgumentException("Tệp ${attachment.displayName} vượt quá kích thước 25 MB."))
        }
        val extension = attachment.displayName.substringAfterLast('.', "").lowercase()
        if (allowed.isNotEmpty() && extension !in allowed) {
            return Result.failure(IllegalArgumentException("Định dạng tệp không được hỗ trợ: ${attachment.displayName}."))
        }
    }
    return Result.success(Unit)
}

private suspend fun requireStudent(authRepository: AuthRepository): Result<User> {
    val user = authRepository.getCurrentUser()
        ?: return Result.failure(IllegalArgumentException("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."))
    if (user.role != UserRole.STUDENT) {
        return Result.failure(IllegalArgumentException("Bạn không có quyền truy cập chức năng Sinh viên."))
    }
    return Result.success(user)
}
