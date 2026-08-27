package com.uigrade.ai.domain.repository

import com.uigrade.ai.domain.model.GradingResult

interface GradingRepository {
    suspend fun getGradingResultForSubmission(submissionId: String): GradingResult?
    suspend fun getGradingResultsForStudent(studentId: String): List<GradingResult>
    suspend fun getGradingResultsForAssignment(assignmentId: String): List<GradingResult>
    suspend fun getAllGradingResults(): List<GradingResult>

    /**
     * Save a grading draft. Student cannot see isDraft=true results.
     */
    suspend fun saveGradingDraft(result: GradingResult): Result<GradingResult>

    /**
     * Finalize grading (isDraft=false, isReleased=false).
     * Student still cannot see the result until release.
     */
    suspend fun finalizeGrading(resultId: String): Result<GradingResult>

    /**
     * Release grading result to student (isReleased=true).
     * Also updates submission status to RELEASED.
     */
    suspend fun releaseGrading(resultId: String): Result<GradingResult>
}
