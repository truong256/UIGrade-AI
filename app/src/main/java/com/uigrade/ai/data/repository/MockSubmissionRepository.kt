package com.uigrade.ai.data.repository

import com.uigrade.ai.data.mock.MockData
import com.uigrade.ai.domain.model.Submission
import com.uigrade.ai.domain.model.SubmissionStatus
import com.uigrade.ai.domain.repository.SubmissionRepository
import kotlinx.coroutines.delay
import java.time.LocalDateTime
import java.util.UUID
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class MockSubmissionRepository @Inject constructor() : SubmissionRepository {

    private val submissions = MockData.submissions.toMutableList()

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
        val studentName = MockData.allUsers.find { it.id == studentId }?.name ?: "Unknown"
        val newSubmission = Submission(
            id = UUID.randomUUID().toString(),
            assignmentId = assignmentId,
            studentId = studentId,
            studentName = studentName,
            fileUri = fileUri,
            submittedAt = LocalDateTime.now(),
            status = SubmissionStatus.PENDING,
            gradingResultId = null,
            attemptNumber = submissions.count { it.studentId == studentId && it.assignmentId == assignmentId } + 1
        )
        submissions.add(newSubmission)
        return newSubmission
    }
}
