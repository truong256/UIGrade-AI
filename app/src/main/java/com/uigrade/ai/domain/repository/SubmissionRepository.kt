package com.uigrade.ai.domain.repository

import com.uigrade.ai.domain.model.Submission
import com.uigrade.ai.domain.model.SubmissionAttachment

interface SubmissionRepository {
    suspend fun getSubmissionsForStudent(studentId: String): List<Submission>
    suspend fun getSubmissionsForAssignment(assignmentId: String): List<Submission>
    suspend fun getAllSubmissions(): List<Submission>
    suspend fun getSubmissionById(id: String): Submission?
    suspend fun getSubmissionsForStudentAssignment(studentId: String, assignmentId: String): List<Submission>
    suspend fun submitAssignment(
        assignmentId: String,
        studentId: String,
        fileUri: String?
    ): Submission

    /**
     * Submit with extra metadata for classroom flow.
     * Validates classroom membership, publish status, deadline, attempt count, file type.
     */
    suspend fun submitAssignmentForClassroom(
        assignmentId: String,
        classroomId: String,
        studentId: String,
        fileUri: String?,
        fileName: String
    ): Submission

    suspend fun saveDraft(
        assignmentId: String,
        classroomId: String,
        studentId: String,
        content: String,
        linkUrl: String,
        attachments: List<SubmissionAttachment>
    ): Submission

    suspend fun deleteDraft(submissionId: String, studentId: String): Result<Unit>

    suspend fun submitDraft(submissionId: String, studentId: String): Submission

    /** Get all submissions for an assignment inside a specific classroom. */
    suspend fun getSubmissionsForClassroomAssignment(
        classroomId: String,
        assignmentId: String
    ): List<Submission>

    /** Update submission status (e.g., GRADING → GRADED → RELEASED). */
    suspend fun updateSubmissionStatus(submissionId: String, status: com.uigrade.ai.domain.model.SubmissionStatus): Submission?

    /** Lecturer workflow flags; never removes the original submission. */
    suspend fun updateSubmissionReviewState(
        submissionId: String,
        needsReview: Boolean,
        resubmissionRequested: Boolean
    ): Submission?
}
