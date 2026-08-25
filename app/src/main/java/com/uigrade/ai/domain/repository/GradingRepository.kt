package com.uigrade.ai.domain.repository

import com.uigrade.ai.domain.model.GradingResult

interface GradingRepository {
    suspend fun getGradingResultForSubmission(submissionId: String): GradingResult?
    suspend fun getGradingResultsForStudent(studentId: String): List<GradingResult>
    suspend fun getGradingResultsForAssignment(assignmentId: String): List<GradingResult>
    suspend fun getAllGradingResults(): List<GradingResult>
}
