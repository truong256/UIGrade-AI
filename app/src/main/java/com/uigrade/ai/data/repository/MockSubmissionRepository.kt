package com.uigrade.ai.data.repository

import com.uigrade.ai.data.mock.MockDataStore
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
        delay(1200) // Simulate upload
        require(dataStore.assignments.any { it.id == assignmentId }) { "Bài tập không tồn tại" }
        require(!fileUri.isNullOrBlank()) { "Vui lòng chọn file bài tập" }

        val studentName = dataStore.users.find { it.id == studentId }?.name
            ?: error("Người dùng không tồn tại")
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
            attemptNumber = submissions.count { it.studentId == studentId && it.assignmentId == assignmentId } + 1
        )
        submissions.add(newSubmission)

        // The mock app simulates the deterministic engine completing immediately so
        // the submit -> result demo flow remains meaningful without a backend worker.
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
}
