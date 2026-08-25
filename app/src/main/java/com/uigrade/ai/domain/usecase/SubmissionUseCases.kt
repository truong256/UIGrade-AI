package com.uigrade.ai.domain.usecase

import com.uigrade.ai.domain.model.Submission
import com.uigrade.ai.domain.repository.SubmissionRepository
import javax.inject.Inject

class GetSubmissionsForStudentUseCase @Inject constructor(
    private val repository: SubmissionRepository
) {
    suspend operator fun invoke(studentId: String): List<Submission> =
        repository.getSubmissionsForStudent(studentId)
}

class GetSubmissionsForAssignmentUseCase @Inject constructor(
    private val repository: SubmissionRepository
) {
    suspend operator fun invoke(assignmentId: String): List<Submission> =
        repository.getSubmissionsForAssignment(assignmentId)
}

class GetAllSubmissionsUseCase @Inject constructor(
    private val repository: SubmissionRepository
) {
    suspend operator fun invoke(): List<Submission> =
        repository.getAllSubmissions()
}

class SubmitAssignmentUseCase @Inject constructor(
    private val repository: SubmissionRepository
) {
    suspend operator fun invoke(
        assignmentId: String,
        studentId: String,
        fileUri: String?
    ): Result<Submission> = runCatching {
        repository.submitAssignment(assignmentId, studentId, fileUri)
    }
}
