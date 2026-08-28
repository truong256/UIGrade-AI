package com.uigrade.ai.data.repository

import com.uigrade.ai.data.mock.MockDataStore
import com.uigrade.ai.domain.model.AssignmentPublishStatus
import com.uigrade.ai.domain.model.Submission
import com.uigrade.ai.domain.model.SubmissionAttachment
import com.uigrade.ai.domain.model.SubmissionStatus
import com.uigrade.ai.domain.model.StudentNotification
import com.uigrade.ai.domain.model.StudentNotificationType
import com.uigrade.ai.domain.repository.SubmissionRepository
import kotlinx.coroutines.delay
import java.time.LocalDateTime
import java.util.UUID
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class MockSubmissionRepository @Inject constructor(
    private val dataStore: MockDataStore
) : SubmissionRepository {

    private val submissions get() = dataStore.submissions

    override suspend fun getSubmissionsForStudent(studentId: String): List<Submission> {
        delay(500)
        return submissions.filter { it.studentId == studentId }
    }

    override suspend fun getSubmissionsForAssignment(assignmentId: String): List<Submission> {
        delay(500)
        return submissions.filter { it.assignmentId == assignmentId }
    }

    override suspend fun getAllSubmissions(): List<Submission> {
        delay(500)
        return submissions.toList()
    }

    override suspend fun getSubmissionById(id: String): Submission? {
        delay(300)
        return submissions.find { it.id == id }
    }

    override suspend fun getSubmissionsForStudentAssignment(
        studentId: String,
        assignmentId: String
    ): List<Submission> {
        delay(350)
        return submissions
            .filter { it.studentId == studentId && it.assignmentId == assignmentId }
            .sortedWith(compareByDescending<Submission> { it.attemptNumber }.thenByDescending { it.savedAt })
    }

    override suspend fun submitAssignment(
        assignmentId: String,
        studentId: String,
        fileUri: String?
    ): Submission {
        delay(1200)
        require(dataStore.assignments.any { it.id == assignmentId }) { "Bài tập không tồn tại" }
        require(!fileUri.isNullOrBlank()) { "Vui lòng chọn file bài tập" }

        val studentName = dataStore.users.find { it.id == studentId }?.name
            ?: error("Người dùng không tồn tại")
        val assignment = dataStore.assignments.first { it.id == assignmentId }
        val isLate = LocalDateTime.now().isAfter(assignment.deadline)
        val submissionId = UUID.randomUUID().toString()
        val gradingResultId = "grade-$submissionId"
        val feedbackId = "feedback-$submissionId"
        val newSubmission = Submission(
            id = submissionId,
            assignmentId = assignmentId,
            studentId = studentId,
            studentName = studentName,
            fileUri = fileUri,
            submittedAt = LocalDateTime.now(),
            status = SubmissionStatus.COMPLETED,
            gradingResultId = gradingResultId,
            attemptNumber = submissions.count { it.studentId == studentId && it.assignmentId == assignmentId } + 1,
            classroomId = assignment.classroomId,
            fileName = fileUri.substringAfterLast("/").substringAfterLast("\\").ifBlank { "file" },
            isLate = isLate
        )
        submissions.add(newSubmission)

        val templateResult = dataStore.gradingResults.firstOrNull { it.assignmentId == assignmentId }
            ?: dataStore.gradingResults.first()
        val newResult = templateResult.copy(
            id = gradingResultId,
            submissionId = submissionId,
            assignmentId = assignmentId,
            studentId = studentId,
            gradedAt = LocalDateTime.now(),
            feedbackId = feedbackId
        )
        dataStore.gradingResults.add(newResult)

        val templateFeedback = dataStore.feedbacks.firstOrNull {
            it.gradingResultId == templateResult.id
        } ?: dataStore.feedbacks.first()
        dataStore.feedbacks.add(
            templateFeedback.copy(
                id = feedbackId,
                gradingResultId = gradingResultId,
                generatedAt = LocalDateTime.now().toString()
            )
        )
        return newSubmission
    }

    override suspend fun submitAssignmentForClassroom(
        assignmentId: String,
        classroomId: String,
        studentId: String,
        fileUri: String?,
        fileName: String
    ): Submission {
        delay(1200)
        require(!fileUri.isNullOrBlank()) { "Vui lòng chọn file bài tập" }

        val assignment = dataStore.assignments.find { it.id == assignmentId }
            ?: throw IllegalArgumentException("Bài tập không tồn tại")

        require(assignment.publishStatus == AssignmentPublishStatus.PUBLISHED) {
            "Bài tập chưa được xuất bản"
        }
        require(assignment.classroomId == classroomId) {
            "Bài tập không thuộc lớp học này"
        }

        val isMember = dataStore.memberships.any {
            it.classroomId == classroomId && it.studentId == studentId
        }
        require(isMember) { "Bạn chưa tham gia lớp học này" }

        val now = LocalDateTime.now()
        val isLate = now.isAfter(assignment.deadline)

        if (isLate && !assignment.allowLateSubmission) {
            throw IllegalArgumentException("Bài tập đã hết hạn")
        }

        val attemptCount = submissions.count {
            it.studentId == studentId && it.assignmentId == assignmentId
        }
        if (assignment.allowResubmission.not() && attemptCount >= 1) {
            throw IllegalArgumentException("Bạn đã nộp bài cho bài tập này")
        }
        if (assignment.allowResubmission && attemptCount >= assignment.maxAttempts) {
            throw IllegalArgumentException("Bạn đã sử dụng hết số lần nộp")
        }

        val allowedTypes = assignment.allowedFileTypes
        val ext = fileName.substringAfterLast(".").lowercase()
        if (allowedTypes.isNotEmpty() && ext !in allowedTypes) {
            throw IllegalArgumentException("Loại tệp không được hỗ trợ. Cho phép: ${allowedTypes.joinToString(", ")}")
        }

        val studentName = dataStore.users.find { it.id == studentId }?.name
            ?: throw IllegalArgumentException("Người dùng không tồn tại")

        val submissionId = UUID.randomUUID().toString()
        val newSubmission = Submission(
            id = submissionId,
            assignmentId = assignmentId,
            studentId = studentId,
            studentName = studentName,
            fileUri = fileUri,
            submittedAt = now,
            status = if (isLate) SubmissionStatus.LATE else SubmissionStatus.SUBMITTED,
            gradingResultId = null, // Not auto-graded in classroom flow; graded manually
            attemptNumber = attemptCount + 1,
            classroomId = classroomId,
            fileName = fileName,
            isLate = isLate,
            attachments = listOf(
                SubmissionAttachment(
                    id = UUID.randomUUID().toString(),
                    uri = fileUri,
                    displayName = fileName
                )
            )
        )
        submissions.add(newSubmission)
        addSubmissionNotification(newSubmission)
        return newSubmission
    }

    override suspend fun saveDraft(
        assignmentId: String,
        classroomId: String,
        studentId: String,
        content: String,
        linkUrl: String,
        attachments: List<SubmissionAttachment>
    ): Submission {
        delay(550)
        val assignment = dataStore.assignments.find { it.id == assignmentId }
            ?: throw IllegalArgumentException("Không tìm thấy bài tập.")
        require(assignment.classroomId == classroomId) { "Bài tập không thuộc lớp học này." }
        require(dataStore.memberships.any { it.classroomId == classroomId && it.studentId == studentId }) {
            "Bạn cần tham gia lớp trước."
        }
        val student = dataStore.users.find { it.id == studentId }
            ?: throw IllegalArgumentException("Không tìm thấy thông tin sinh viên.")
        val now = LocalDateTime.now()
        val existingIndex = submissions.indexOfFirst {
            it.assignmentId == assignmentId && it.studentId == studentId && it.isDraft
        }
        val draft = Submission(
            id = if (existingIndex >= 0) submissions[existingIndex].id else UUID.randomUUID().toString(),
            assignmentId = assignmentId,
            studentId = studentId,
            studentName = student.name,
            fileUri = attachments.firstOrNull()?.uri,
            submittedAt = if (existingIndex >= 0) submissions[existingIndex].submittedAt else now,
            status = SubmissionStatus.PENDING,
            attemptNumber = submissions.count {
                it.assignmentId == assignmentId && it.studentId == studentId && !it.isDraft
            } + 1,
            classroomId = classroomId,
            fileName = attachments.firstOrNull()?.displayName.orEmpty(),
            content = content,
            linkUrl = linkUrl,
            attachments = attachments,
            isDraft = true,
            savedAt = now
        )
        if (existingIndex >= 0) submissions[existingIndex] = draft else submissions.add(draft)
        return draft
    }

    override suspend fun deleteDraft(submissionId: String, studentId: String): Result<Unit> {
        delay(350)
        val removed = submissions.removeAll {
            it.id == submissionId && it.studentId == studentId && it.isDraft
        }
        return if (removed) Result.success(Unit)
        else Result.failure(IllegalArgumentException("Không tìm thấy bản nháp."))
    }

    override suspend fun submitDraft(submissionId: String, studentId: String): Submission {
        delay(900)
        val index = submissions.indexOfFirst {
            it.id == submissionId && it.studentId == studentId && it.isDraft
        }
        if (index < 0) throw IllegalArgumentException("Không tìm thấy bản nháp.")
        val draft = submissions[index]
        val assignment = dataStore.assignments.find { it.id == draft.assignmentId }
            ?: throw IllegalArgumentException("Bài tập không tồn tại.")
        validateSubmissionWindow(assignment, studentId)
        validateAttemptLimit(assignment, studentId)
        validateAttachments(assignment.allowedFileTypes, draft.attachments)
        if (draft.content.isBlank() && draft.linkUrl.isBlank() && draft.attachments.isEmpty()) {
            throw IllegalArgumentException("Vui lòng nhập nội dung bài làm hoặc đính kèm tệp.")
        }
        val now = LocalDateTime.now()
        val isLate = now.isAfter(assignment.deadline)
        val submitted = draft.copy(
            submittedAt = now,
            savedAt = now,
            isDraft = false,
            isLate = isLate,
            status = if (isLate) SubmissionStatus.LATE else SubmissionStatus.SUBMITTED,
            attachments = draft.attachments.map {
                it.copy(uploadState = com.uigrade.ai.domain.model.AttachmentUploadState.UPLOADED)
            }
        )
        submissions[index] = submitted
        addSubmissionNotification(submitted)
        return submitted
    }

    override suspend fun getSubmissionsForClassroomAssignment(
        classroomId: String,
        assignmentId: String
    ): List<Submission> {
        delay(400)
        return submissions.filter {
            it.classroomId == classroomId && it.assignmentId == assignmentId
        }
    }

    override suspend fun updateSubmissionStatus(
        submissionId: String,
        status: SubmissionStatus
    ): Submission? {
        delay(300)
        val index = submissions.indexOfFirst { it.id == submissionId }
        if (index < 0) return null
        submissions[index] = submissions[index].copy(status = status)
        return submissions[index]
    }

    override suspend fun updateSubmissionReviewState(
        submissionId: String,
        needsReview: Boolean,
        resubmissionRequested: Boolean
    ): Submission? {
        delay(300)
        val index = submissions.indexOfFirst { it.id == submissionId }
        if (index < 0) return null
        submissions[index] = submissions[index].copy(
            needsReview = needsReview,
            resubmissionRequested = resubmissionRequested
        )
        if (resubmissionRequested && dataStore.studentNotifications.none {
                it.type == StudentNotificationType.RESUBMISSION_REQUESTED && it.submissionId == submissionId
            }) {
            val submission = submissions[index]
            dataStore.studentNotifications.add(
                StudentNotification(
                    id = UUID.randomUUID().toString(),
                    studentId = submission.studentId,
                    title = "Giảng viên yêu cầu nộp lại",
                    message = "Bài làm cần được cập nhật theo phản hồi của giảng viên.",
                    type = StudentNotificationType.RESUBMISSION_REQUESTED,
                    createdAt = LocalDateTime.now(),
                    classroomId = submission.classroomId,
                    assignmentId = submission.assignmentId,
                    submissionId = submission.id
                )
            )
        }
        return submissions[index]
    }

    private fun validateSubmissionWindow(assignment: com.uigrade.ai.domain.model.Assignment, studentId: String) {
        require(assignment.publishStatus == AssignmentPublishStatus.PUBLISHED) { "Bài tập chưa được xuất bản." }
        require(!assignment.isArchived) { "Bài tập đã được lưu trữ." }
        require(dataStore.memberships.any {
            it.classroomId == assignment.classroomId && it.studentId == studentId
        }) { "Bạn cần tham gia lớp trước." }
        val now = LocalDateTime.now()
        if (assignment.startAt?.let(now::isBefore) == true) {
            throw IllegalArgumentException("Bài tập chưa mở.")
        }
        if (assignment.closeAt?.let { !now.isBefore(it) } == true) {
            throw IllegalArgumentException("Bài tập đã đóng.")
        }
        if (now.isAfter(assignment.deadline) && !assignment.allowLateSubmission) {
            throw IllegalArgumentException("Hạn nộp đã kết thúc.")
        }
    }

    private fun validateAttemptLimit(assignment: com.uigrade.ai.domain.model.Assignment, studentId: String) {
        val history = submissions.filter {
            it.assignmentId == assignment.id && it.studentId == studentId && !it.isDraft
        }
        val requested = history.maxByOrNull { it.attemptNumber }?.resubmissionRequested == true
        if (history.isNotEmpty() && !assignment.allowResubmission && !requested) {
            throw IllegalArgumentException("Bài tập này không cho phép nộp lại.")
        }
        if (history.size >= assignment.maxAttempts && !requested) {
            throw IllegalArgumentException("Bạn đã sử dụng hết số lần nộp.")
        }
    }

    private fun validateAttachments(
        allowedTypes: List<String>,
        attachments: List<SubmissionAttachment>
    ) {
        if (attachments.size > 5) throw IllegalArgumentException("Bạn chỉ được đính kèm tối đa 5 tệp.")
        attachments.forEach { attachment ->
            if (attachment.sizeBytes != null && attachment.sizeBytes > 25L * 1024 * 1024) {
                throw IllegalArgumentException("Tệp ${attachment.displayName} vượt quá kích thước 25 MB.")
            }
            val extension = attachment.displayName.substringAfterLast('.', "").lowercase()
            if (allowedTypes.isNotEmpty() && extension !in allowedTypes.map(String::lowercase)) {
                throw IllegalArgumentException("Định dạng tệp không được hỗ trợ: ${attachment.displayName}.")
            }
        }
    }

    private fun addSubmissionNotification(submission: Submission) {
        dataStore.studentNotifications.add(
            StudentNotification(
                id = UUID.randomUUID().toString(),
                studentId = submission.studentId,
                title = "Đã nhận bài nộp",
                message = if (submission.isLate) {
                    "Bài làm đã được ghi nhận ở trạng thái nộp muộn."
                } else {
                    "Bài làm đã được ghi nhận thành công."
                },
                type = StudentNotificationType.SUBMISSION_RECEIVED,
                createdAt = LocalDateTime.now(),
                classroomId = submission.classroomId,
                assignmentId = submission.assignmentId,
                submissionId = submission.id
            )
        )
    }
}
