package com.uigrade.ai.domain.usecase

import com.uigrade.ai.domain.model.Assignment
import com.uigrade.ai.domain.model.AssignmentPublishStatus
import com.uigrade.ai.domain.model.AssignmentWithStatus
import com.uigrade.ai.domain.repository.AssignmentRepository
import com.uigrade.ai.domain.repository.AuthRepository
import java.time.LocalDateTime
import java.util.UUID
import javax.inject.Inject

class GetAssignmentsForStudentUseCase @Inject constructor(
    private val repository: AssignmentRepository
) {
    suspend operator fun invoke(studentId: String): List<AssignmentWithStatus> =
        repository.getAssignmentsForStudent(studentId)
}

class GetAssignmentsForLecturerUseCase @Inject constructor(
    private val repository: AssignmentRepository
) {
    suspend operator fun invoke(lecturerId: String): List<Assignment> =
        repository.getAssignmentsForLecturer(lecturerId)
}

class GetAssignmentByIdUseCase @Inject constructor(
    private val repository: AssignmentRepository
) {
    suspend operator fun invoke(id: String): Assignment? =
        repository.getAssignmentById(id)
}

class GetAllAssignmentsUseCase @Inject constructor(
    private val repository: AssignmentRepository
) {
    suspend operator fun invoke(): List<Assignment> =
        repository.getAllAssignments()
}

class GetPublishedAssignmentsForClassroomUseCase @Inject constructor(
    private val repository: AssignmentRepository
) {
    suspend operator fun invoke(classroomId: String): List<Assignment> =
        repository.getPublishedAssignmentsForClassroom(classroomId)
}

class GetAllAssignmentsForClassroomUseCase @Inject constructor(
    private val repository: AssignmentRepository
) {
    suspend operator fun invoke(classroomId: String): List<Assignment> =
        repository.getAllAssignmentsForClassroom(classroomId)
}

class GetAssignmentsForStudentInClassroomUseCase @Inject constructor(
    private val repository: AssignmentRepository
) {
    suspend operator fun invoke(studentId: String, classroomId: String): List<AssignmentWithStatus> =
        repository.getAssignmentsForStudentInClassroom(studentId, classroomId)
}

class CreateAssignmentUseCase @Inject constructor(
    private val repository: AssignmentRepository,
    private val authRepository: AuthRepository
) {
    suspend operator fun invoke(
        title: String,
        description: String,
        classroomId: String,
        deadline: LocalDateTime,
        startAt: LocalDateTime?,
        rubricId: String,
        courseId: String,
        courseName: String,
        totalMaxScore: Int,
        allowLateSubmission: Boolean,
        allowResubmission: Boolean,
        maxAttempts: Int,
        allowedFileTypes: List<String>,
        publish: Boolean
    ): Result<Assignment> {
        if (title.isBlank()) return Result.failure(IllegalArgumentException("Tên bài tập không được trống"))
        if (description.isBlank()) return Result.failure(IllegalArgumentException("Mô tả không được trống"))
        if (totalMaxScore <= 0) return Result.failure(IllegalArgumentException("Điểm tối đa phải lớn hơn 0"))
        if (maxAttempts < 1) return Result.failure(IllegalArgumentException("Số lần nộp tối đa phải ít nhất là 1"))
        if (startAt != null && !deadline.isAfter(startAt))
            return Result.failure(IllegalArgumentException("Hạn nộp phải sau ngày bắt đầu"))

        val user = authRepository.getCurrentUser()
            ?: return Result.failure(IllegalArgumentException("Bạn chưa đăng nhập"))

        val status = if (publish) AssignmentPublishStatus.PUBLISHED else AssignmentPublishStatus.DRAFT
        val now = LocalDateTime.now()
        val assignment = Assignment(
            id = UUID.randomUUID().toString(),
            title = title.trim(),
            description = description.trim(),
            deadline = deadline,
            rubricId = rubricId,
            lecturerId = user.id,
            courseId = courseId,
            courseName = courseName,
            createdAt = now,
            totalMaxScore = totalMaxScore,
            classroomId = classroomId,
            publishStatus = status,
            startAt = startAt,
            allowLateSubmission = allowLateSubmission,
            allowResubmission = allowResubmission,
            maxAttempts = maxAttempts,
            publishedAt = if (publish) now else null,
            allowedFileTypes = allowedFileTypes
        )
        return runCatching { repository.createAssignment(assignment) }
    }
}

class UpdateAssignmentUseCase @Inject constructor(
    private val repository: AssignmentRepository,
    private val authRepository: AuthRepository
) {
    suspend operator fun invoke(assignment: Assignment): Result<Assignment> {
        if (assignment.title.isBlank()) return Result.failure(IllegalArgumentException("Tên bài tập không được trống"))
        val user = authRepository.getCurrentUser()
            ?: return Result.failure(IllegalArgumentException("Bạn chưa đăng nhập"))
        if (assignment.lecturerId != user.id)
            return Result.failure(IllegalArgumentException("Bạn không có quyền chỉnh sửa bài tập này"))
        return runCatching { repository.updateAssignment(assignment) }
    }
}

class PublishAssignmentUseCase @Inject constructor(
    private val repository: AssignmentRepository,
    private val authRepository: AuthRepository
) {
    suspend operator fun invoke(assignmentId: String): Result<Assignment> {
        val user = authRepository.getCurrentUser()
            ?: return Result.failure(IllegalArgumentException("Bạn chưa đăng nhập"))
        val assignment = repository.getAssignmentById(assignmentId)
            ?: return Result.failure(IllegalArgumentException("Không tìm thấy bài tập"))
        if (assignment.lecturerId != user.id)
            return Result.failure(IllegalArgumentException("Bạn không có quyền xuất bản bài tập này"))
        val updated = assignment.copy(
            publishStatus = AssignmentPublishStatus.PUBLISHED,
            publishedAt = LocalDateTime.now()
        )
        return runCatching { repository.updateAssignment(updated) }
    }
}

class CloseAssignmentUseCase @Inject constructor(
    private val repository: AssignmentRepository,
    private val authRepository: AuthRepository
) {
    suspend operator fun invoke(assignmentId: String): Result<Assignment> {
        val user = authRepository.getCurrentUser()
            ?: return Result.failure(IllegalArgumentException("Bạn chưa đăng nhập"))
        val assignment = repository.getAssignmentById(assignmentId)
            ?: return Result.failure(IllegalArgumentException("Không tìm thấy bài tập"))
        if (assignment.lecturerId != user.id)
            return Result.failure(IllegalArgumentException("Bạn không có quyền đóng bài tập này"))
        val updated = assignment.copy(publishStatus = AssignmentPublishStatus.CLOSED)
        return runCatching { repository.updateAssignment(updated) }
    }
}
