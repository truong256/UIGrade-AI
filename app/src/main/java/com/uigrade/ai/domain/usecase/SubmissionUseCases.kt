/*
 * SPDX-FileCopyrightText: 2026 UIGrade AI contributors
 * SPDX-License-Identifier: MIT
 */

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

class GetSubmissionByIdUseCase @Inject constructor(
    private val repository: SubmissionRepository
) {
    suspend operator fun invoke(id: String): Submission? = repository.getSubmissionById(id)
}

class SubmitAssignmentUseCase @Inject constructor(
    private val repository: SubmissionRepository
) {
    suspend operator fun invoke(
        assignmentId: String,
        studentId: String,
        fileUri: String?
    ): Result<Submission> = runCatching {
        require(!fileUri.isNullOrBlank()) { "Vui lòng chọn file bài tập" }
        repository.submitAssignment(assignmentId, studentId, fileUri)
    }
}
