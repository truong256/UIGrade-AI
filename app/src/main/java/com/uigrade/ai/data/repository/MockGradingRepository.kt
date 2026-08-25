package com.uigrade.ai.data.repository

import com.uigrade.ai.data.mock.MockData
import com.uigrade.ai.domain.model.GradingResult
import com.uigrade.ai.domain.repository.GradingRepository
import kotlinx.coroutines.delay
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class MockGradingRepository @Inject constructor() : GradingRepository {

    private val results = MockData.allGradingResults

    override suspend fun getGradingResultForSubmission(submissionId: String): GradingResult? {
        delay(400)
        return results.find { it.submissionId == submissionId }
    }

    override suspend fun getGradingResultsForStudent(studentId: String): List<GradingResult> {
        delay(500)
        return results.filter { it.studentId == studentId }
    }

    override suspend fun getGradingResultsForAssignment(assignmentId: String): List<GradingResult> {
        delay(500)
        return results.filter { it.assignmentId == assignmentId }
    }

    override suspend fun getAllGradingResults(): List<GradingResult> {
        delay(500)
        return results
    }
}
