package com.uigrade.ai.domain.usecase

import com.uigrade.ai.domain.model.GradingResult
import com.uigrade.ai.domain.repository.GradingRepository
import javax.inject.Inject

class GetGradingResultForSubmissionUseCase @Inject constructor(
    private val repository: GradingRepository
) {
    suspend operator fun invoke(submissionId: String): GradingResult? =
        repository.getGradingResultForSubmission(submissionId)
}

class GetGradingResultsForStudentUseCase @Inject constructor(
    private val repository: GradingRepository
) {
    suspend operator fun invoke(studentId: String): List<GradingResult> =
        repository.getGradingResultsForStudent(studentId)
}

class GetGradingResultsForAssignmentUseCase @Inject constructor(
    private val repository: GradingRepository
) {
    suspend operator fun invoke(assignmentId: String): List<GradingResult> =
        repository.getGradingResultsForAssignment(assignmentId)
}

class GetAllGradingResultsUseCase @Inject constructor(
    private val repository: GradingRepository
) {
    suspend operator fun invoke(): List<GradingResult> = repository.getAllGradingResults()
}
