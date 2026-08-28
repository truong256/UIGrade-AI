package com.uigrade.ai.data.repository

import com.uigrade.ai.data.mock.MockDataStore
import com.uigrade.ai.domain.model.AssignmentPublishStatus
import com.uigrade.ai.domain.model.Submission
import com.uigrade.ai.domain.model.SubmissionStatus
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
        val gradingResultId = "grade-$submissionId"
        val feedbackId = "feedback-$submissionId"
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
            isLate = isLate
        )
        submissions.add(newSubmission)
        return newSubmission
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
        return submissions[index]
    }
}
