package com.uigrade.ai.data.repository

import com.uigrade.ai.data.mock.MockDataStore
import com.uigrade.ai.domain.model.GradingResult
import com.uigrade.ai.domain.model.SubmissionStatus
import com.uigrade.ai.domain.repository.GradingRepository
import kotlinx.coroutines.delay
import java.time.LocalDateTime
import java.util.UUID
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class MockGradingRepository @Inject constructor(
    private val dataStore: MockDataStore
) : GradingRepository {

    private val results get() = dataStore.gradingResults

    override suspend fun getGradingResultForSubmission(submissionId: String): GradingResult? {
        delay(400)
        // Students can only see released results; return null if draft
        return results.find { it.submissionId == submissionId && !it.isDraft }
    }

    /**
     * Lecturer-only view — returns the result regardless of release status.
     */
    suspend fun getGradingResultForSubmissionLecturer(submissionId: String): GradingResult? {
        delay(400)
        return results.find { it.submissionId == submissionId }
    }

    override suspend fun getGradingResultsForStudent(studentId: String): List<GradingResult> {
        delay(500)
        // Only released results visible to student
        return results.filter { it.studentId == studentId && it.isReleased }
    }

    override suspend fun getGradingResultsForAssignment(assignmentId: String): List<GradingResult> {
        delay(500)
        return results.filter { it.assignmentId == assignmentId }
    }

    override suspend fun getAllGradingResults(): List<GradingResult> {
        delay(500)
        return results
    }

    override suspend fun saveGradingDraft(result: GradingResult): Result<GradingResult> {
        delay(700)
        return try {
            val draftResult = result.copy(isDraft = true, isReleased = false)
            val existingIndex = results.indexOfFirst { it.submissionId == result.submissionId }
            if (existingIndex >= 0) {
                results[existingIndex] = draftResult.copy(id = results[existingIndex].id)
            } else {
                val newId = if (result.id.isBlank()) UUID.randomUUID().toString() else result.id
                results.add(draftResult.copy(id = newId))
            }
            // Update submission status to GRADING
            updateSubmissionStatus(result.submissionId, SubmissionStatus.GRADING)
            Result.success(draftResult)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun finalizeGrading(resultId: String): Result<GradingResult> {
        delay(600)
        val index = results.indexOfFirst { it.id == resultId }
        return if (index >= 0) {
            val updated = results[index].copy(
                isDraft = false,
                isReleased = false,
                gradedAt = LocalDateTime.now()
            )
            results[index] = updated
            updateSubmissionStatus(updated.submissionId, SubmissionStatus.GRADED)
            Result.success(updated)
        } else {
            Result.failure(IllegalArgumentException("Không tìm thấy kết quả chấm điểm"))
        }
    }

    override suspend fun releaseGrading(resultId: String): Result<GradingResult> {
        delay(600)
        val index = results.indexOfFirst { it.id == resultId }
        return if (index >= 0) {
            val updated = results[index].copy(isReleased = true, isDraft = false)
            results[index] = updated
            updateSubmissionStatus(updated.submissionId, SubmissionStatus.RELEASED)
            Result.success(updated)
        } else {
            Result.failure(IllegalArgumentException("Không tìm thấy kết quả chấm điểm"))
        }
    }

    private fun updateSubmissionStatus(submissionId: String, status: SubmissionStatus) {
        val subIndex = dataStore.submissions.indexOfFirst { it.id == submissionId }
        if (subIndex >= 0) {
            dataStore.submissions[subIndex] = dataStore.submissions[subIndex].copy(status = status)
        }
    }
}
