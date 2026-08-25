package com.uigrade.ai.domain.repository

import com.uigrade.ai.domain.model.Submission

interface SubmissionRepository {
    suspend fun getSubmissionsForStudent(studentId: String): List<Submission>
    suspend fun getSubmissionsForAssignment(assignmentId: String): List<Submission>
    suspend fun getAllSubmissions(): List<Submission>
    suspend fun getSubmissionById(id: String): Submission?
    suspend fun submitAssignment(
        assignmentId: String,
        studentId: String,
        fileUri: String?
    ): Submission
}
