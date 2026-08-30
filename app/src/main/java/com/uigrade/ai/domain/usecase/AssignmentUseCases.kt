/*
 * SPDX-FileCopyrightText: 2026 UIGrade AI contributors
 * SPDX-License-Identifier: MIT
 */

package com.uigrade.ai.domain.usecase

import com.uigrade.ai.domain.model.Assignment
import com.uigrade.ai.domain.model.AssignmentPublishStatus
import com.uigrade.ai.domain.model.AssignmentWithStatus
import com.uigrade.ai.domain.model.UserRole
import com.uigrade.ai.domain.repository.AssignmentRepository
import com.uigrade.ai.domain.repository.AuthRepository
import com.uigrade.ai.domain.repository.SubmissionRepository
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
        publish: Boolean,
        instructions: String = "",
        closeAt: LocalDateTime? = null,
        assignmentType: String = "Bài tập",
        attachmentUri: String? = null,
        resourceUrl: String = "",
        latePenaltyPercent: Int = 0
    ): Result<Assignment> {
        if (title.isBlank()) return Result.failure(IllegalArgumentException("Vui lòng nhập tiêu đề bài tập."))
        if (description.isBlank()) return Result.failure(IllegalArgumentException("Vui lòng nhập mô tả bài tập."))
        if (classroomId.isBlank()) return Result.failure(IllegalArgumentException("Vui lòng chọn lớp học."))
        if (rubricId.isBlank()) return Result.failure(IllegalArgumentException("Vui lòng chọn rubric chấm điểm."))
        if (totalMaxScore <= 0) return Result.failure(IllegalArgumentException("Điểm tối đa phải lớn hơn 0"))
        if (maxAttempts < 1) return Result.failure(IllegalArgumentException("Số lần nộp tối đa phải ít nhất là 1"))
        if (latePenaltyPercent !in 0..100) return Result.failure(IllegalArgumentException("Mức phạt nộp muộn phải từ 0 đến 100%"))
        if (allowedFileTypes.isEmpty()) return Result.failure(IllegalArgumentException("Vui lòng chọn ít nhất một định dạng tệp"))
        if (startAt != null && !deadline.isAfter(startAt))
            return Result.failure(IllegalArgumentException("Hạn nộp phải sau ngày bắt đầu"))
        if (closeAt != null && closeAt.isBefore(deadline))
            return Result.failure(IllegalArgumentException("Thời gian đóng bài không được trước hạn nộp"))

        val user = authRepository.getCurrentUser()
            ?: return Result.failure(IllegalArgumentException("Bạn chưa đăng nhập"))
        if (user.role != UserRole.LECTURER) {
            return Result.failure(IllegalArgumentException("Chỉ giảng viên mới có thể tạo bài tập"))
        }

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
            allowedFileTypes = allowedFileTypes,
            instructions = instructions.trim(),
            closeAt = closeAt,
            assignmentType = assignmentType.trim().ifBlank { "Bài tập" },
            attachmentUri = attachmentUri,
            resourceUrl = resourceUrl.trim(),
            latePenaltyPercent = latePenaltyPercent
        )
        return runCatching { repository.createAssignment(assignment) }
    }
}

class UpdateAssignmentUseCase @Inject constructor(
    private val repository: AssignmentRepository,
    private val authRepository: AuthRepository
) {
    suspend operator fun invoke(assignment: Assignment): Result<Assignment> {
        validateAssignment(assignment).exceptionOrNull()?.let { return Result.failure(it) }
        val user = authRepository.getCurrentUser()
            ?: return Result.failure(IllegalArgumentException("Bạn chưa đăng nhập"))
        val existing = repository.getAssignmentById(assignment.id)
            ?: return Result.failure(IllegalArgumentException("Không tìm thấy bài tập"))
        if (user.role != UserRole.LECTURER || existing.lecturerId != user.id)
            return Result.failure(IllegalArgumentException("Bạn không có quyền chỉnh sửa bài tập này"))
        return runCatching {
            repository.updateAssignment(
                assignment.copy(lecturerId = existing.lecturerId, createdAt = existing.createdAt)
            )
        }
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

class ReopenAssignmentUseCase @Inject constructor(
    private val repository: AssignmentRepository,
    private val authRepository: AuthRepository
) {
    suspend operator fun invoke(assignmentId: String): Result<Assignment> =
        requireAssignmentOwner(assignmentId, repository, authRepository).mapCatching { assignment ->
            repository.updateAssignment(
                assignment.copy(
                    publishStatus = AssignmentPublishStatus.PUBLISHED,
                    publishedAt = assignment.publishedAt ?: LocalDateTime.now()
                )
            )
        }
}

class ArchiveAssignmentUseCase @Inject constructor(
    private val repository: AssignmentRepository,
    private val authRepository: AuthRepository
) {
    suspend operator fun invoke(assignmentId: String, archived: Boolean = true): Result<Assignment> =
        requireAssignmentOwner(assignmentId, repository, authRepository).mapCatching { assignment ->
            repository.updateAssignment(assignment.copy(isArchived = archived))
        }
}

class DuplicateAssignmentUseCase @Inject constructor(
    private val repository: AssignmentRepository,
    private val authRepository: AuthRepository
) {
    suspend operator fun invoke(assignmentId: String): Result<Assignment> =
        requireAssignmentOwner(assignmentId, repository, authRepository).mapCatching { assignment ->
            repository.createAssignment(
                assignment.copy(
                    id = UUID.randomUUID().toString(),
                    title = "${assignment.title} (Bản sao)",
                    createdAt = LocalDateTime.now(),
                    publishStatus = AssignmentPublishStatus.DRAFT,
                    publishedAt = null,
                    isArchived = false
                )
            )
        }
}

class DeleteAssignmentUseCase @Inject constructor(
    private val repository: AssignmentRepository,
    private val submissionRepository: SubmissionRepository,
    private val authRepository: AuthRepository
) {
    suspend operator fun invoke(assignmentId: String): Result<Unit> {
        val ownerCheck = requireAssignmentOwner(assignmentId, repository, authRepository)
        ownerCheck.exceptionOrNull()?.let { return Result.failure(it) }
        if (submissionRepository.getSubmissionsForAssignment(assignmentId).isNotEmpty()) {
            return Result.failure(
                IllegalStateException("Bài tập đã có bài nộp. Hãy lưu trữ thay vì xóa.")
            )
        }
        return if (repository.deleteAssignment(assignmentId)) Result.success(Unit)
        else Result.failure(IllegalArgumentException("Không tìm thấy bài tập"))
    }
}

private fun validateAssignment(assignment: Assignment): Result<Unit> {
    if (assignment.title.isBlank()) return Result.failure(IllegalArgumentException("Vui lòng nhập tiêu đề bài tập."))
    if (assignment.classroomId.isBlank()) return Result.failure(IllegalArgumentException("Vui lòng chọn lớp học."))
    if (assignment.rubricId.isBlank()) return Result.failure(IllegalArgumentException("Vui lòng chọn rubric chấm điểm."))
    if (assignment.totalMaxScore <= 0) return Result.failure(IllegalArgumentException("Điểm tối đa phải lớn hơn 0"))
    if (assignment.maxAttempts < 1) return Result.failure(IllegalArgumentException("Số lần nộp tối đa phải ít nhất là 1"))
    if (assignment.latePenaltyPercent !in 0..100) return Result.failure(IllegalArgumentException("Mức phạt nộp muộn phải từ 0 đến 100%"))
    if (assignment.startAt != null && !assignment.deadline.isAfter(assignment.startAt)) {
        return Result.failure(IllegalArgumentException("Hạn nộp phải sau ngày bắt đầu"))
    }
    if (assignment.closeAt != null && assignment.closeAt.isBefore(assignment.deadline)) {
        return Result.failure(IllegalArgumentException("Thời gian đóng bài không được trước hạn nộp"))
    }
    return Result.success(Unit)
}

private suspend fun requireAssignmentOwner(
    assignmentId: String,
    repository: AssignmentRepository,
    authRepository: AuthRepository
): Result<Assignment> {
    val user = authRepository.getCurrentUser()
        ?: return Result.failure(IllegalArgumentException("Bạn chưa đăng nhập"))
    if (user.role != UserRole.LECTURER) {
        return Result.failure(IllegalArgumentException("Chỉ giảng viên mới có quyền thực hiện thao tác này"))
    }
    val assignment = repository.getAssignmentById(assignmentId)
        ?: return Result.failure(IllegalArgumentException("Không tìm thấy bài tập"))
    if (assignment.lecturerId != user.id) {
        return Result.failure(IllegalArgumentException("Bạn không có quyền thay đổi bài tập này"))
    }
    return Result.success(assignment)
}
