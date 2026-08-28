package com.uigrade.ai.domain.model

import java.time.LocalDateTime

/**
 * Status of a grading submission.
 * Extends original PENDING/PROCESSING/COMPLETED/FAILED with classroom-grading states.
 */
enum class SubmissionStatus {
    PENDING,
    PROCESSING,
    COMPLETED,
    FAILED,
    // Classroom grading lifecycle
    SUBMITTED,
    LATE,
    GRADING,
    GRADED,
    RELEASED
}

/**
 * A student's submission of an assignment.
 * classroomId and fileName are added for classroom flow.
 * isLate indicates if the submission was after the assignment deadline.
 */
data class Submission(
    val id: String,
    val assignmentId: String,
    val studentId: String,
    val studentName: String,
    val fileUri: String?,               // Local URI or remote path to submitted file
    val submittedAt: LocalDateTime,
    val status: SubmissionStatus,
    val gradingResultId: String? = null,
    val attemptNumber: Int = 1,
    // Classroom integration
    val classroomId: String = "",
    val fileName: String = "",
    val isLate: Boolean = false,
    val needsReview: Boolean = false,
    val resubmissionRequested: Boolean = false
)
