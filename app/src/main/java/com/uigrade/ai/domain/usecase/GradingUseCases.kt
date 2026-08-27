package com.uigrade.ai.domain.usecase

import com.uigrade.ai.domain.model.CriterionScore
import com.uigrade.ai.domain.model.GradingResult
import com.uigrade.ai.domain.repository.AuthRepository
import com.uigrade.ai.domain.repository.GradingRepository
import java.time.LocalDateTime
import java.util.UUID
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

class SaveGradingDraftUseCase @Inject constructor(
    private val repository: GradingRepository,
    private val authRepository: AuthRepository
) {
    suspend operator fun invoke(
        submissionId: String,
        assignmentId: String,
        studentId: String,
        criteriaScores: List<CriterionScore>,
        lecturerComment: String,
        maxScore: Int,
        existingResultId: String?
    ): Result<GradingResult> {
        val user = authRepository.getCurrentUser()
            ?: return Result.failure(IllegalArgumentException("Bạn chưa đăng nhập"))

        // Validate scores
        for (cs in criteriaScores) {
            if (cs.earned < 0) return Result.failure(IllegalArgumentException("Điểm không được âm: ${cs.criterionName}"))
            if (cs.earned > cs.maxScore) return Result.failure(IllegalArgumentException("Điểm vượt mức tối đa: ${cs.criterionName}"))
        }
        val totalScore = criteriaScores.sumOf { it.earned }
        if (totalScore > maxScore) return Result.failure(IllegalArgumentException("Tổng điểm vượt quá điểm tối đa"))

        val result = GradingResult(
            id = existingResultId?.takeIf { it.isNotBlank() } ?: UUID.randomUUID().toString(),
            submissionId = submissionId,
            assignmentId = assignmentId,
            studentId = studentId,
            totalScore = totalScore,
            maxScore = maxScore,
            criteriaScores = criteriaScores,
            gradedAt = LocalDateTime.now(),
            engineVersion = "manual-v1",
            isDraft = true,
            isReleased = false,
            lecturerComment = lecturerComment,
            lecturerId = user.id
        )
        return repository.saveGradingDraft(result)
    }
}

class FinalizeGradingUseCase @Inject constructor(
    private val repository: GradingRepository
) {
    suspend operator fun invoke(resultId: String): Result<GradingResult> =
        repository.finalizeGrading(resultId)
}

class ReleaseGradingUseCase @Inject constructor(
    private val repository: GradingRepository,
    private val authRepository: AuthRepository
) {
    suspend operator fun invoke(resultId: String): Result<GradingResult> {
        authRepository.getCurrentUser()
            ?: return Result.failure(IllegalArgumentException("Bạn chưa đăng nhập"))
        return repository.releaseGrading(resultId)
    }
}
