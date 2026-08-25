package com.uigrade.ai.domain.model

import java.time.LocalDateTime

/**
 * Status of a grading submission.
 */
enum class SubmissionStatus {
    PENDING,
    PROCESSING,
    COMPLETED,
    FAILED
}

/**
 * A student's submission of an assignment.
 */
data class Submission(
    val id: String,
    val assignmentId: String,
    val studentId: String,
    val studentName: String,
    val fileUri: String?,          // Local URI or remote path to submitted file
    val submittedAt: LocalDateTime,
    val status: SubmissionStatus,
    val gradingResultId: String? = null,
    val attemptNumber: Int = 1
)
